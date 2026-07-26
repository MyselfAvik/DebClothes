import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const { cart, cartLoading, cartError, updateCartItemQty, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = async (itemId, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    try {
      await updateCartItemQty(itemId, newQty);
      toast.success('Cart updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remove this item from your cart?')) return;
    try {
      await removeFromCart(itemId);
      toast.success('Item removed from cart');
    } catch (err) {
      toast.error(err.message || 'Failed to remove item');
    }
  };

  // Helper to compute prices
  const getItemPrice = (item) => {
    const p = item.product;
    return p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
  };

  const calculateSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc, item) => {
      if (!item.product) return acc;
      return acc + getItemPrice(item) * item.qty;
    }, 0);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/150';
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  if (cartLoading && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Shopping Cart</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review your selections before placing your order</p>
      </div>

      {cartError && (
        <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          {cartError}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <ShoppingCart className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Your cart is empty</h2>
          <p className="text-slate-500 dark:text-slate-405 mb-6 max-w-xs mx-auto">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/" className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items list */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.product;
              if (!product) return null;
              
              const isDiscounted = product.discountPrice && product.discountPrice < product.price;

              return (
                <div
                  key={item._id}
                  className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0f172a]/20"
                >
                  {/* Thumbnail image */}
                  <div className="h-24 w-20 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                    <img
                      src={getImageUrl(product.images?.[0])}
                      alt={product.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Title / details */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-455 dark:text-slate-450 uppercase tracking-wider font-semibold mt-1">
                      Category: {product.category}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Size: {item.size}
                    </div>
                  </div>

                  {/* Qty Adjustment */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleQtyChange(item._id, item.qty, -1)}
                      className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-sm font-bold text-slate-800 dark:text-white w-6 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => handleQtyChange(item._id, item.qty, 1)}
                      className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Prices */}
                  <div className="text-center sm:text-right shrink-0 min-w-[80px]">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      ₹{getItemPrice(item) * item.qty}
                    </div>
                    {isDiscounted && (
                      <div className="text-[10px] text-slate-450 line-through">
                        ₹{product.price * item.qty}
                      </div>
                    )}
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => handleRemoveItem(item._id)}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Checkout summary card */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xl">
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  {items.reduce((sum, i) => sum + i.qty, 0)} Items
                </span>
              </h2>

              {/* EKart Express Delivery Badge */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="text-base">🚚</span>
                <div>
                  <span>EKart Express Delivery</span>
                  <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">Guaranteed 2-4 Day Delivery to your doorstep</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">₹{calculateSubtotal()}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Delivery Charges</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase text-xs">FREE</span>
                </div>
                <hr className="border-slate-200 dark:border-slate-800" />
                <div className="flex justify-between text-lg font-black text-slate-900 dark:text-white">
                  <span>Total Amount</span>
                  <span className="text-blue-600 dark:text-blue-400">₹{calculateSubtotal()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-extrabold text-white transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/30"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-5 w-5" />
              </button>

              <div className="text-center pt-2">
                <Link to="/" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  &larr; Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
