import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { CreditCard, Check, AlertCircle, ShoppingBag, MapPin, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form Fields
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');

  // Selected saved address ID (if any)
  const [selectedSavedAddrId, setSelectedSavedAddrId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const items = cart?.items || [];

  // Redirect to cart if empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      navigate('/cart');
    }
  }, [items, navigate, loading]);

  // Apply saved address fields automatically
  const handleSelectSavedAddress = (addr) => {
    setSelectedSavedAddrId(addr._id);
    setLine1(addr.line1);
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setPhone(addr.phone);
  };

  // Helper to compute prices
  const getItemPrice = (item) => {
    const p = item.product;
    return p.discountPrice && p.discountPrice < p.price ? p.discountPrice : p.price;
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      if (!item.product) return acc;
      return acc + getItemPrice(item) * item.qty;
    }, 0);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!line1 || !city || !state || !pincode || !phone) {
      const msg = 'Please fill in all shipping details';
      setError(msg);
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (paymentMethod === 'RAZORPAY') {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const msg = 'Failed to load Razorpay SDK. Please check your internet connection.';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      let createdOrderResponse;
      try {
        const response = await API.post('/api/orders', {
          shippingAddress: { line1, city, state, pincode, phone },
          paymentMethod: 'RAZORPAY',
        });
        createdOrderResponse = response.data;
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to initialize payment.';
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const { order, razorpayOrder } = createdOrderResponse;

      let keyId = 'rzp_test_stubkey';
      try {
        const configResponse = await API.get('/api/config/razorpay-key');
        keyId = configResponse.data.keyId;
      } catch (err) {
        console.warn('Failed to load Razorpay public key ID, using fallback.', err);
      }

      const options = {
        key: keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'DebClothes',
        description: `Order #${order._id}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          try {
            setLoading(true);
            const verificationResponse = await API.post('/api/orders/verify', {
              orderId: order._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verificationResponse.data.success) {
              toast.success('Payment verified! Order placed successfully.');
              await clearCart();
              setLoading(false);
              navigate('/orders');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err) {
            const msg = err.response?.data?.message || 'Payment verification failed';
            setError(msg);
            toast.error(msg);
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: phone,
        },
        theme: {
          color: '#2563eb',
        },
        modal: {
          ondismiss: async function () {
            try {
              await API.post(`/api/orders/${order._id}/payment-failed`);
              const msg = 'Payment cancelled by user.';
              setError(msg);
              toast.error(msg);
            } catch (err) {
              console.error('Failed to notify backend of cancelled payment:', err);
            }
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', async function (response) {
        console.error('Razorpay payment failure:', response.error);
        try {
          await API.post(`/api/orders/${order._id}/payment-failed`);
          const msg = response.error.description || 'Payment failed.';
          setError(msg);
          toast.error(msg);
        } catch (err) {
          console.error('Failed to notify backend of failed payment:', err);
        }
        setLoading(false);
      });

      paymentObject.open();
    } else {
      try {
        await API.post('/api/orders', {
          shippingAddress: { line1, city, state, pincode, phone },
          paymentMethod: 'COD',
        });
        
        await clearCart();
        toast.success('Order placed successfully via Cash on Delivery!');
        setLoading(false);
        navigate('/orders');
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to place order';
        setError(msg);
        toast.error(msg);
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Checkout</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure shipping parameters and place your order</p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Shipping details and address selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Saved Addresses Fast-Select */}
          {user?.addresses && user.addresses.length > 0 && (
            <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850">
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">Saved Shipping Locations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr) => {
                  const isSelected = selectedSavedAddrId === addr._id;
                  return (
                    <div
                      key={addr._id}
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`cursor-pointer flex flex-col justify-between border rounded-xl p-4 bg-slate-100/10 hover:border-slate-350 dark:hover:border-slate-700 transition-all ${
                        isSelected
                          ? 'border-blue-500 dark:border-blue-500 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5 text-slate-750 dark:text-slate-300">
                        <div className="flex items-start gap-2">
                          <MapPin className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${isSelected ? 'text-blue-500' : 'text-slate-400'}`} />
                          <span className="text-sm font-semibold">{addr.line1}</span>
                        </div>
                        <p className="text-xs text-slate-550 dark:text-slate-455 pl-6.5">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-xs text-slate-500 pl-6.5">
                          Phone: {addr.phone}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Checkout Address Input Form */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">Shipping Destination</h2>
            
            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={line1}
                  onChange={(e) => {
                    setLine1(e.target.value);
                    setSelectedSavedAddrId('');
                  }}
                  placeholder="Flat No, Building, Street Name"
                  className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setSelectedSavedAddrId('');
                    }}
                    placeholder="Mumbai"
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setSelectedSavedAddrId('');
                    }}
                    placeholder="Maharashtra"
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                    Pin Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      setSelectedSavedAddrId('');
                    }}
                    placeholder="400001"
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-355">
                    Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setSelectedSavedAddrId('');
                    }}
                    placeholder="9876543210"
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Payment Options (COD vs Razorpay Online) */}
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-4">Payment Method</h2>
            <div className="space-y-4">
              {/* Cash on Delivery */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-transparent hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${paymentMethod === 'COD' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cash on Delivery (COD)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-455">Pay with cash upon receipt of shipping package</p>
                  </div>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="rounded-full bg-blue-600 p-1 text-white">
                    <Check className="h-3.5 w-3.5 font-extrabold" />
                  </div>
                )}
              </div>

              {/* Pay Online (Razorpay) */}
              <div
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`cursor-pointer rounded-xl border p-4 flex items-center justify-between transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-transparent hover:border-slate-350 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${paymentMethod === 'RAZORPAY' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pay Online (Razorpay)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-455">Secure instant payments with cards, UPI, or NetBanking</p>
                  </div>
                </div>
                {paymentMethod === 'RAZORPAY' && (
                  <div className="rounded-full bg-blue-600 p-1 text-white">
                    <Check className="h-3.5 w-3.5 font-extrabold" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Item list breakdown */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
            <h2 className="text-md font-bold text-slate-900 dark:text-white">Order Breakdown</h2>

            <div className="max-h-60 overflow-y-auto pr-1 space-y-3.5">
              {items.map((item) => {
                const product = item.product;
                if (!product) return null;
                return (
                  <div key={item._id} className="flex gap-3 text-xs">
                    <div className="h-12 w-10 overflow-hidden rounded bg-slate-100 dark:bg-slate-900 shrink-0">
                      <img
                        src={product.images?.[0]?.startsWith('http') ? product.images[0] : `http://localhost:5000/${product.images?.[0]}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{product.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Size: {item.size} • Qty: {item.qty}</p>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-right shrink-0">
                      ₹{getItemPrice(item) * item.qty}
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-650 dark:text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">₹{calculateSubtotal()}</span>
              </div>
              <div className="flex justify-between text-slate-650 dark:text-slate-400">
                <span>Shipping Fees</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase text-xs">FREE</span>
              </div>
              <hr className="border-slate-200 dark:border-slate-800" />
              <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span>₹{calculateSubtotal()}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="h-4.5 w-4.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4.5 w-4.5" />
                  <span>Confirm & Place Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
