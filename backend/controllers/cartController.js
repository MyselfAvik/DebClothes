import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Helper to get cart with fully populated product details
const getPopulatedCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate({
    path: 'items.product',
    select: 'title price discountPrice images category sizes isActive'
  });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @desc    Get logged in user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res, next) => {
  try {
    const cart = await getPopulatedCart(req.user._id);
    res.json(cart);
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res, next) => {
  try {
    const { productId, size, qty } = req.body;
    const quantity = parseInt(qty) || 1;

    if (!productId || !size) {
      res.status(400);
      throw new Error('Product ID and size are required');
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404);
      throw new Error('Product not found or unavailable');
    }

    // Verify stock availability
    const sizeConfig = product.sizes.find((s) => s.size === size);
    if (!sizeConfig || sizeConfig.stock < quantity) {
      res.status(400);
      throw new Error(`Insufficient stock. Only ${sizeConfig ? sizeConfig.stock : 0} items available.`);
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if combo already exists in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );

    if (itemIndex > -1) {
      // Combo exists, verify added total stock limit
      const newQty = cart.items[itemIndex].qty + quantity;
      if (sizeConfig.stock < newQty) {
        res.status(400);
        throw new Error(`Insufficient stock. Cannot add requested quantity to existing cart item.`);
      }
      cart.items[itemIndex].qty = newQty;
    } else {
      // Add new item
      cart.items.push({ product: productId, size, qty: quantity });
    }

    await cart.save();
    
    // Return fully populated updated cart
    const populated = await getPopulatedCart(req.user._id);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
export const updateCartItemQty = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const quantity = parseInt(qty);

    if (isNaN(quantity) || quantity < 1) {
      res.status(400);
      throw new Error('Valid item quantity is required');
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    // Verify stock levels on target product
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error('Associated product not found');
    }

    const sizeConfig = product.sizes.find((s) => s.size === item.size);
    if (!sizeConfig || sizeConfig.stock < quantity) {
      res.status(400);
      throw new Error(`Insufficient stock. Only ${sizeConfig ? sizeConfig.stock : 0} items available.`);
    }

    item.qty = quantity;
    await cart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      res.status(404);
      throw new Error('Cart not found');
    }

    const item = cart.items.id(req.params.itemId);
    if (!item) {
      res.status(404);
      throw new Error('Item not found in cart');
    }

    cart.items.pull(req.params.itemId);
    await cart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all items in user's cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully', items: [] });
  } catch (error) {
    next(error);
  }
};
