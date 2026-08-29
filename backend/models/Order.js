import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  priceAtPurchase: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
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
    ],
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingAddress: {
    line1: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  paymentMethod: {
    type: String,
    default: 'COD', // Cash on Delivery
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: {
    type: String,
  },
  orderStatus: {
    type: String,
    enum: [
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
    ],
    default: 'placed',
  },
  deliveredAt: {
    type: Date
  },
  returnDetails: {
    type: {
      reason: { type: String },
      photos: [{ type: String }],
      requestedAt: { type: Date },
      adminComment: { type: String, default: '' },
      refundMethod: { type: String, enum: ['upi', 'bank_transfer'], default: 'upi' },
      upiId: { type: String, default: '' },
      bankDetails: {
        accountHolderName: { type: String, default: '' },
        accountNumber: { type: String, default: '' },
        ifscCode: { type: String, default: '' },
        bankName: { type: String, default: '' },
      },
    },
    default: undefined,
  },
  expectedDeliveryDate: {
    type: Date,
  },
  statusHistory: [statusHistorySchema],
  shippingNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
