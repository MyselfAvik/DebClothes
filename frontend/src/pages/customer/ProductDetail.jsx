import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import RatingStars from '../../components/RatingStars';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingCart, Heart, ArrowLeft, ShieldCheck, RefreshCw, Truck, Check, Star, Camera, X, AlertCircle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState('');

  // Pincode Checker States
  const [pincodeInput, setPincodeInput] = useState(localStorage.getItem('user_pincode') || '');
  const [pincodeChecking, setPincodeChecking] = useState(false);
  const [pincodeResult, setPincodeResult] = useState(null);
  const [pincodeError, setPincodeError] = useState('');

  const handleCheckPincode = async (e) => {
    e?.preventDefault();
    if (!pincodeInput || pincodeInput.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit Pincode');
      return;
    }
    setPincodeChecking(true);
    setPincodeError('');
    try {
      const { data } = await API.post('/api/shipping/check-pincode', { pincode: pincodeInput });
      setPincodeResult(data);
      localStorage.setItem('user_pincode', pincodeInput);
      toast.success(`Deliverable by ${data.estimatedDeliveryDate}`);
    } catch (err) {
      setPincodeError(err.response?.data?.message || 'Failed to check pincode');
      toast.error(err.response?.data?.message || 'Failed to check pincode');
    } finally {
      setPincodeChecking(false);
    }
  };

  // Reviews States
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [selectedReviewImage, setSelectedReviewImage] = useState(null);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewLoading(true);
    setReviewError('');

    if (!comment.trim()) {
      toast.error('Please enter a review comment');
      setReviewLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('rating', rating);
    formData.append('comment', comment);
    
    for (let i = 0; i < reviewImages.length; i++) {
      formData.append('images', reviewImages[i]);
    }

    try {
      const { data } = await API.post(`/api/products/${id}/reviews`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(data.message || 'Review submitted successfully!');
      
      const res = await API.get(`/api/products/${id}`);
      setProduct(res.data);

      setComment('');
      setReviewImages([]);
      setRating(5);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await API.get(`/api/products/${id}`);
        setProduct(data);
        // Pre-select first available size
        const firstAvailable = data.sizes?.find((s) => s.isAvailable);
        if (firstAvailable) {
          setSelectedSize(firstAvailable.size);
        }
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }

    if (!selectedSize) {
      toast.error('Please select a size first');
      return;
    }

    setAddingToCart(true);
    setCartSuccess('');
    try {
      await addToCart(product._id, selectedSize, 1);
      setCartSuccess('Product added to cart successfully!');
      toast.success('Product added to cart!');
      setTimeout(() => setCartSuccess(''), 3000);
    } catch (err) {
      toast.error(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-400 mb-6">
          {error}
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to shop</span>
        </Link>
      </div>
    );
  }

  if (!product) return null;

  // Compute image URL: handles local uploads prefixing or Cloudinary or placeholder
  const getImageUrl = (imagePath) => {
    if (imagePath) {
      if (imagePath.startsWith('http')) {
        return imagePath;
      }
      return `http://localhost:5000/${imagePath}`;
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600';
  };

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb / Back Link */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 transition-colors hover:text-slate-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Collection</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Images Column */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <img
              src={getImageUrl(product.images?.[activeImage])}
              alt={product.title}
              className="h-full w-full object-cover object-top"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600';
              }}
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 border transition-all ${
                    activeImage === idx
                      ? 'border-blue-550 dark:border-blue-500 scale-102 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt=""
                    className="h-full w-full object-cover object-top"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Column */}
        <div className="flex flex-col">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {product.category} &middot; {product.subCategory}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {product.title}
            </h1>

            {/* Ratings & Reviews */}
            <div className="mt-4 flex items-center gap-4 border-b border-slate-200 dark:border-slate-850 pb-6">
              <RatingStars rating={product.ratingAverage} count={product.ratingCount} size={18} />
              <span className="text-sm text-slate-400 dark:text-slate-500">|</span>
              <a href="#reviews" className="text-sm font-semibold text-blue-600 dark:text-blue-550 hover:underline">
                View Customer Reviews
              </a>
            </div>
          </div>

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-4">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">₹{product.discountPrice}</span>
                <span className="text-lg text-slate-500 dark:text-slate-400 line-through">₹{product.price}</span>
                <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-650 dark:text-red-400 border border-red-500/20">
                  {discountPercent}% OFF
                </span>
              </>
            ) : (
              <span className="text-3xl font-bold text-slate-900 dark:text-white">₹{product.price}</span>
            )}
          </div>

          {/* Description */}
          <div className="mt-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              Description
            </h3>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">{product.description}</p>
          </div>

          {/* Sizing Select */}
          <div className="mt-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-505 dark:text-slate-450 mb-4">
              Select Size
            </h3>
            <div className="flex flex-wrap gap-3">
              {product.sizes?.map((s, idx) => (
                <button
                  key={idx}
                  disabled={!s.isAvailable}
                  onClick={() => setSelectedSize(s.size)}
                  className={`flex h-12 w-16 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
                    !s.isAvailable
                      ? 'border-slate-200 dark:border-slate-800 bg-[#0f172a]/5 dark:bg-[#0f172a]/20 text-slate-400 dark:text-slate-600 line-through cursor-not-allowed'
                      : selectedSize === s.size
                      ? 'border-blue-550 dark:border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                      : 'border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="mt-10 flex flex-col gap-4">
            {cartSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-650 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="h-4 w-4" />
                <span>{cartSuccess}</span>
              </div>
            )}
            <div className="flex gap-4">
              <button
                disabled={addingToCart || !product.sizes?.some((s) => s.isAvailable)}
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white transition-all hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>
                  {addingToCart
                    ? 'Adding...'
                    : product.sizes?.some((s) => s.isAvailable)
                    ? 'Add to Cart'
                    : 'Out of Stock'}
                </span>
              </button>
              <button className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-755 hover:text-slate-900 dark:hover:text-white transition-colors">
                <Heart className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Flipkart Style EKart Delivery & Pincode Checker */}
          <div className="mt-6 rounded-2xl bg-white dark:bg-[#0f172a]/80 border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>Delivery & Pincode Check</span>
              </div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                EKart Express
              </span>
            </div>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600 font-bold tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={pincodeChecking}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {pincodeChecking ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Check'}
              </button>
            </form>

            {pincodeResult && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    <span>Deliverable to {pincodeResult.pincode} by {pincodeResult.estimatedDeliveryDate}</span>
                  </span>
                  <span className="text-[10px] font-black text-slate-500">{pincodeResult.courier}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1 border-t border-emerald-500/15">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Check className="h-3.5 w-3.5" />
                    <span>Cash on Delivery Available</span>
                  </span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>7 Days Return Guarantee</span>
                  </span>
                </div>
              </div>
            )}

            {!pincodeResult && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Enter pincode to check EKart delivery dates & COD serviceability.</span>
              </div>
            )}
          </div>

          {/* Value Props */}
          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-slate-200 dark:border-slate-850 pt-8 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <Truck className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Free Shipping</p>
                <p className="text-slate-500 dark:text-slate-450">On orders over ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Easy Returns</p>
                <p className="text-slate-500 dark:text-slate-450">14-day hassle-free returns</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Secure Payments</p>
                <p className="text-slate-500 dark:text-slate-450">SSL Encrypted Checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div id="reviews" className="mt-16 border-t border-slate-200 dark:border-slate-850 pt-16 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Reviews</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <RatingStars rating={product.ratingAverage} count={product.ratingCount} size={18} />
              <span className="text-xs text-slate-550 dark:text-slate-400">Based on {product.ratingCount || 0} customer reviews</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((r, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</h3>
                      <p className="text-[10px] text-slate-550 dark:text-slate-455 mt-0.5">
                        Reviewed on {new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <RatingStars rating={r.rating} showCount={false} size={14} />
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{r.comment}</p>
                  
                  {r.images && r.images.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {r.images.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setSelectedReviewImage(imgUrl)}
                          className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-zoom-in shrink-0 hover:opacity-85 transition-opacity"
                        >
                          <img
                            src={getImageUrl(imgUrl)}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-805 bg-[#0f172a]/5 dark:bg-[#0f172a]/20 p-8 text-center text-slate-500 dark:text-slate-400">
                <p className="font-medium text-slate-700 dark:text-slate-300">No reviews yet for this product.</p>
                <p className="text-xs mt-1">Be the first to review this product once you have completed your purchase!</p>
              </div>
            )}
          </div>

          {/* Leave a Review Section */}
          <div className="lg:col-span-1">
            {product.hasPurchased ? (
              <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
                <div>
                  <h3 className="text-md font-bold text-slate-900 dark:text-white">Leave a Review</h3>
                  <p className="text-xs text-slate-550 mt-1">Share your experience with this product</p>
                </div>

                {reviewError && (
                  <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                    {reviewError}
                  </div>
                )}

                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                      Your Rating
                    </label>
                    <div className="flex gap-1.5 items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="text-slate-300 transition-colors hover:text-yellow-400 focus:outline-none"
                        >
                          <Star
                            size={26}
                            className={
                              star <= rating
                                ? 'fill-yellow-400 text-yellow-400 transition-all scale-105'
                                : 'text-slate-400 dark:text-slate-700'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                      Review Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What did you like or dislike? How was the fit and quality?"
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-650 dark:text-slate-355 mb-2">
                      Upload Photos (Optional, max 3)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 3) {
                          toast.error('You can upload up to 3 photos only');
                          setReviewImages(files.slice(0, 3));
                        } else {
                          setReviewImages(files);
                        }
                      }}
                      className="block w-full text-xs text-slate-550 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600/10 file:text-blue-550 hover:file:bg-blue-600/20 file:cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 bg-slate-100/10 dark:bg-[#0f172a]/5 text-center text-slate-550 dark:text-slate-450 text-xs">
                <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2.5 animate-pulse" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Only customers who have purchased this product can leave a review.</p>
                <p className="text-slate-500 mt-1">If you have already purchased this item, please complete checkout and wait for payment confirmation/delivery before writing your review.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {selectedReviewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <button
            onClick={() => setSelectedReviewImage(null)}
            className="absolute right-4 top-4 rounded-full bg-slate-900/60 p-2 text-white hover:bg-slate-900"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl">
            <img
              src={getImageUrl(selectedReviewImage)}
              alt="Fullscreen Review"
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
