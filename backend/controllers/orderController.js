import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { sendStatusUpdateEmail } from '../config/mailer.js';
import razorpayInstance from '../config/razorpay.js';
import crypto from 'crypto';

// @desc    Create new order (Checkout)
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode || !shippingAddress.phone) {
      res.status(400);
      throw new Error('Please fill in all shipping address fields');
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      res.status(400);
      throw new Error('Your shopping cart is empty');
    }

    // Step 1: Validate stock levels for all items first
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        res.status(404);
        throw new Error(`Product ${product ? product.title : 'Unknown'} is no longer available`);
      }

      const sizeConfig = product.sizes.find((s) => s.size === item.size);
      if (!sizeConfig || sizeConfig.stock < item.qty) {
        res.status(400);
        throw new Error(
          `Insufficient stock for "${product.title}" in size ${item.size}. Only ${sizeConfig ? sizeConfig.stock : 0} items remaining.`
        );
      }
    }

    // Step 2: Calculate pricing and map order items
    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
      const price = item.product.discountPrice && item.product.discountPrice < item.product.price
        ? item.product.discountPrice
        : item.product.price;
      
      totalAmount += price * item.qty;

      return {
        product: item.product._id,
        size: item.size,
        qty: item.qty,
        priceAtPurchase: price
      };
    });

    // Step 3: Initialize Razorpay order if selected
    let razorpayOrder = null;
    let paymentId = '';

    if (paymentMethod === 'RAZORPAY') {
      try {
        const options = {
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          receipt: `receipt_${Date.now()}`
        };
        razorpayOrder = await razorpayInstance.orders.create(options);
        paymentId = razorpayOrder.id; // Store the razorpay order ID as reference
      } catch (err) {
        res.status(500);
        throw new Error(`Razorpay Order creation failed: ${err.message}`);
      }
    }

    // Step 4: Create local Order document
    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 4); // 4 days delivery window

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'pending', 
      paymentId: paymentId,
      orderStatus: 'placed',
      expectedDeliveryDate: expectedDelivery,
      statusHistory: [{
        status: 'placed',
        message: paymentMethod === 'RAZORPAY'
          ? 'Online payment initialized, pending customer transaction.'
          : 'Order has been placed successfully.'
      }]
    });

    const createdOrder = await order.save();

    // Step 5: Decrement size stock values on Product documents (Reserve Stock)
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      const sizeIndex = product.sizes.findIndex((s) => s.size === item.size);
      if (sizeIndex > -1) {
        product.sizes[sizeIndex].stock -= item.qty;
        await product.save();
      }
    }

    // Step 6: Flush shopping cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      order: createdOrder,
      razorpayOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's orders
// @route   GET /api/orders/my
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'title images category');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('items.product', 'title images');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, shippingNotes } = req.body;
    const validStatuses = [
      'placed',
      'confirmed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'return_requested',
      'return_approved',
      'out_for_pickup',
      'returning_to_seller',
      'returned',
      'return_rejected'
    ];

    if (!status || !validStatuses.includes(status)) {
      res.status(400);
      throw new Error('Please provide a valid status: placed, confirmed, shipped, out_for_delivery, delivered, cancelled, return_requested, return_approved, out_for_pickup, returned, or return_rejected');
    }

    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // If order was already cancelled or completed returned, prevent editing status
    if (order.orderStatus === 'cancelled') {
      res.status(400);
      throw new Error('Order is already cancelled and cannot be updated');
    }
    if (order.orderStatus === 'returned') {
      res.status(400);
      throw new Error('Order has already been returned and refunded and cannot be modified');
    }

    // If status transitions to cancelled, restore sizes stock values on Product documents
    if (status === 'cancelled' && order.orderStatus !== 'cancelled') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const sizeIndex = product.sizes.findIndex((s) => s.size === item.size);
          if (sizeIndex > -1) {
            product.sizes[sizeIndex].stock += item.qty;
            await product.save();
          }
        }
      }
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
        if (order.paymentId && order.paymentId.startsWith('pay_')) {
          try {
            await razorpayInstance.payments.refund(order.paymentId, {
              amount: Math.round(order.totalAmount * 100)
            });
          } catch (err) {
            console.log('Razorpay Refund failed during admin cancel:', err.message);
          }
        }
      } else {
        order.paymentStatus = 'failed';
      }
    }

    // If status becomes delivered, record delivery timestamp & set payment status to paid
    if (status === 'delivered') {
      order.paymentStatus = 'paid';
      if (!order.deliveredAt) {
        order.deliveredAt = new Date();
      }
    }

    // If status becomes returned (product arrives back), refund payment & restore stock
    if (status === 'returned' && order.orderStatus !== 'returned') {
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const sizeIndex = product.sizes.findIndex((s) => s.size === item.size);
          if (sizeIndex > -1) {
            product.sizes[sizeIndex].stock += item.qty;
            await product.save();
          }
        }
      }
      order.paymentStatus = 'refunded';
    }

    if (order.returnDetails && shippingNotes) {
      order.returnDetails.adminComment = shippingNotes;
    }

    order.orderStatus = status;
    order.shippingNotes = shippingNotes || '';

    // Push new status to history
    order.statusHistory.push({
      status,
      message: shippingNotes || `Status updated to ${status.replace(/_/g, ' ')}`
    });

    const updatedOrder = await order.save();

    // Trigger update email alert
    if (order.user && order.user.email) {
      await sendStatusUpdateEmail(
        order.user.email,
        order.user.name,
        order._id,
        status,
        shippingNotes
      );
    }

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Request a return for an order (within 7 days of delivery)
// @route   POST /api/orders/:id/return
// @access  Private (Customer)
export const requestReturnOrder = async (req, res, next) => {
  try {
    const {
      reason,
      refundMethod = 'upi',
      upiId,
      accountHolderName,
      accountNumber,
      ifscCode,
      bankName,
    } = req.body;

    if (!reason || !reason.trim()) {
      res.status(400);
      throw new Error('Please provide a reason for the return');
    }

    if (refundMethod === 'upi') {
      if (!upiId || !upiId.trim() || !upiId.includes('@')) {
        res.status(400);
        throw new Error('Please provide a valid UPI ID (e.g. yourname@oksbi / user@upi) for refund credit');
      }
    } else if (refundMethod === 'bank_transfer') {
      if (!accountHolderName || !accountHolderName.trim()) {
        res.status(400);
        throw new Error('Please provide Account Holder Name for bank refund');
      }
      if (!accountNumber || !accountNumber.trim() || accountNumber.trim().length < 6) {
        res.status(400);
        throw new Error('Please provide a valid Bank Account Number for refund');
      }
      if (!ifscCode || !ifscCode.trim() || ifscCode.trim().length < 6) {
        res.status(400);
        throw new Error('Please provide a valid IFSC Code for refund');
      }
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Verify ownership
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to return this order');
    }

    // Must be delivered
    if (order.orderStatus !== 'delivered') {
      res.status(400);
      throw new Error('Only delivered orders can be requested for return');
    }

    // Verify 7-day return window from delivery date
    const deliveryDate = order.deliveredAt || 
      order.statusHistory.find(s => s.status === 'delivered')?.updatedAt || 
      order.updatedAt;
      
    const diffInMs = Date.now() - new Date(deliveryDate).getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInDays > 7) {
      res.status(400);
      throw new Error(`The 7-day return window has expired (${Math.floor(diffInDays)} days since delivery)`);
    }

    // Extract photos uploaded via multer
    const photoUrls = req.files ? req.files.map(file => file.path || file.filename) : [];
    if (photoUrls.length === 0) {
      res.status(400);
      throw new Error('Please upload at least one photo of the product as proof for return');
    }

    order.orderStatus = 'return_requested';
    order.returnDetails = {
      reason,
      photos: photoUrls,
      requestedAt: new Date(),
      adminComment: '',
      refundMethod: refundMethod === 'bank_transfer' ? 'bank_transfer' : 'upi',
      upiId: refundMethod === 'upi' ? upiId.trim() : '',
      bankDetails: refundMethod === 'bank_transfer' ? {
        accountHolderName: (accountHolderName || '').trim(),
        accountNumber: (accountNumber || '').trim(),
        ifscCode: (ifscCode || '').trim().toUpperCase(),
        bankName: (bankName || '').trim(),
      } : {
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
      },
    };

    const refundDestinationSummary = refundMethod === 'upi' 
      ? `UPI: ${upiId.trim()}`
      : `Bank: ${bankName ? bankName.trim() + ' ' : ''}A/C ****${(accountNumber || '').trim().slice(-4)}`;

    order.statusHistory.push({
      status: 'return_requested',
      message: `Customer initiated return & refund request to ${refundDestinationSummary}. Reason: ${reason}`
    });

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Razorpay online payment signature
// @route   POST /api/orders/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!orderId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Verification parameters are missing');
    }

    const order = await Order.findById(orderId).populate('user', 'name email');
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Generate expected signature using HMAC-SHA256
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_stubsecret';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Payment Successful
      order.paymentStatus = 'paid';
      order.paymentId = razorpay_payment_id;
      order.orderStatus = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        message: 'Razorpay payment verified successfully.'
      });

      await order.save();

      // Dispatch confirmation email
      if (order.user && order.user.email) {
        await sendStatusUpdateEmail(
          order.user.email,
          order.user.name,
          order._id,
          'confirmed',
          'Online payment verified.'
        );
      }

      res.status(200).json({ success: true, message: 'Payment verified successfully', order });
    } else {
      // Signature mismatch - Fraud/Failure
      order.paymentStatus = 'failed';
      order.orderStatus = 'cancelled';
      order.statusHistory.push({
        status: 'cancelled',
        message: 'Online payment signature verification failed.'
      });

      // Restore sizes stock inventory
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (product) {
          const sizeIdx = product.sizes.findIndex((s) => s.size === item.size);
          if (sizeIdx > -1) {
            product.sizes[sizeIdx].stock += item.qty;
            await product.save();
          }
        }
      }

      await order.save();

      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Process failed online payments and release inventory
// @route   POST /api/orders/:id/payment-failed
// @access  Private
export const handlePaymentFailure = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(200).json({ success: true, message: 'Order was already cancelled' });
    }

    // Rollback stock levels
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeIdx = product.sizes.findIndex((s) => s.size === item.size);
        if (sizeIdx > -1) {
          product.sizes[sizeIdx].stock += item.qty;
          await product.save();
        }
      }
    }

    // Restore cart items since checkout failed
    const cart = await Cart.findOne({ user: order.user });
    if (cart) {
      for (const item of order.items) {
        const itemExistsIdx = cart.items.findIndex(
          i => i.product.toString() === item.product.toString() && i.size === item.size
        );
        if (itemExistsIdx > -1) {
          cart.items[itemExistsIdx].qty += item.qty;
        } else {
          cart.items.push({
            product: item.product,
            size: item.size,
            qty: item.qty
          });
        }
      }
      await cart.save();
    }

    order.paymentStatus = 'failed';
    order.orderStatus = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      message: 'Online checkout payment failed or was aborted.'
    });

    await order.save();

    res.status(200).json({ success: true, message: 'Payment failed, order cancelled, and inventory restored.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order before it is shipped
// @route   PUT /api/orders/:id/cancel
// @access  Private (Customer)
export const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    // Verify order ownership
    if (order.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to cancel this order');
    }

    // Check if order is already cancelled
    if (order.orderStatus === 'cancelled') {
      res.status(400);
      throw new Error('Order is already cancelled');
    }

    // Strictly check if order is before shipping (only 'placed' or 'confirmed' allowed)
    if (['shipped', 'out_for_delivery', 'delivered', 'return_requested', 'return_approved', 'out_for_pickup', 'returning_to_seller', 'returned'].includes(order.orderStatus)) {
      res.status(400);
      throw new Error(`Order has already been ${order.orderStatus.replace(/_/g, ' ')} and cannot be cancelled.`);
    }

    // Restore stock levels for each item
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const sizeIdx = product.sizes.findIndex((s) => s.size === item.size);
        if (sizeIdx > -1) {
          product.sizes[sizeIdx].stock += item.qty;
          await product.save();
        }
      }
    }

    order.orderStatus = 'cancelled';
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
      if (order.paymentId && order.paymentId.startsWith('pay_')) {
        try {
          await razorpayInstance.payments.refund(order.paymentId, {
            amount: Math.round(order.totalAmount * 100)
          });
        } catch (err) {
          console.log('Razorpay Refund failed during customer cancel:', err.message);
        }
      }
    } else {
      order.paymentStatus = 'failed';
    }

    order.statusHistory.push({
      status: 'cancelled',
      message: 'Order cancelled by customer before shipment.'
    });

    const updatedOrder = await order.save();
    res.json({ message: 'Order cancelled successfully and stock restored', order: updatedOrder });
  } catch (error) {
    next(error);
  }
};
