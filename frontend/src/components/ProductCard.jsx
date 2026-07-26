import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, ShieldCheck, Star, Truck, Zap } from 'lucide-react';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { _id, title, price, discountPrice, ratingAverage = 4.2, ratingCount = 128, images, sizes, category } = product;

  const getProductImage = (index = 0) => {
    if (images && images.length > index) {
      const img = images[index];
      if (img.startsWith('http')) return img;
      return `http://localhost:5000/${img}`;
    }
    return images && images.length > 0
      ? getProductImage(0)
      : 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600';
  };

  const hasDiscount = discountPrice && discountPrice < price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const primaryImg = getProductImage(0);
  const secondaryImg = images && images.length > 1 ? getProductImage(1) : primaryImg;
  const totalStock = sizes ? sizes.reduce((acc, s) => acc + (s.stock || 0), 0) : 0;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0f172a]/90 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Top Overlay Badges (Wishlist & Assured) */}
      <div className="absolute right-3 top-3 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
          className={`rounded-full p-2 backdrop-blur-md transition-all shadow-md ${
            isWishlisted
              ? 'bg-rose-500 text-white scale-110'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-400 hover:text-rose-500 hover:bg-white'
          }`}
          title={isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Flipkart Deal Tag */}
      <div className="absolute left-3 top-3 z-20 flex flex-col gap-1 pointer-events-none">
        {hasDiscount && discountPercent >= 20 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white shadow-sm tracking-wide">
            <Zap className="h-3 w-3 fill-current" />
            <span>Special Deal</span>
          </span>
        )}
        {totalStock > 0 && totalStock <= 5 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-black shadow-sm">
            Low Stock
          </span>
        )}
      </div>

      {/* Product Image Container */}
      <Link to={`/product/${_id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 group">
        <img
          src={primaryImg}
          alt={title}
          className={`h-full w-full object-cover object-top transition-all duration-500 ${
            isHovered && secondaryImg !== primaryImg ? 'opacity-0 scale-105' : 'opacity-100 group-hover:scale-105'
          }`}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=600';
          }}
        />
        {secondaryImg !== primaryImg && (
          <img
            src={secondaryImg}
            alt={title}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-all duration-500 ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0'
            }`}
          />
        )}

        {/* Quick View Button */}
        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
          <span className="w-full py-2 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-center text-xs font-bold text-slate-900 dark:text-white shadow-lg flex items-center justify-center gap-1.5 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
            <Eye className="h-4 w-4 text-blue-600" />
            <span>View Details</span>
          </span>
        </div>
      </Link>

      {/* Flipkart Style Product Details */}
      <div className="flex flex-grow flex-col p-4 space-y-2">
        {/* Brand Category & Assured Badge */}
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider">
          <span>{category || 'Clothing'}</span>
          <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-extrabold normal-case bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            <ShieldCheck className="h-3 w-3 fill-current text-blue-500" />
            <span>Assured</span>
          </span>
        </div>

        {/* Title */}
        <Link to={`/product/${_id}`} className="block">
          <h3 className="line-clamp-1 text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors">
            {title}
          </h3>
        </Link>

        {/* Flipkart Rating Pill & Review Count */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded bg-emerald-600 text-white font-extrabold text-[11px] px-1.5 py-0.5 shadow-sm">
            <span>{ratingAverage.toFixed(1)}</span>
            <Star className="h-3 w-3 fill-current" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            ({ratingCount})
          </span>
        </div>

        {/* Sizes Pills */}
        <div className="flex flex-wrap gap-1 pt-1">
          {sizes &&
            sizes.map((s, idx) => (
              <span
                key={idx}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  s.isAvailable && s.stock > 0
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 line-through border border-slate-200/50'
                }`}
              >
                {s.size}
              </span>
            ))}
        </div>

        {/* Flipkart Price Section */}
        <div className="mt-auto pt-2 border-t border-slate-150 dark:border-slate-800/60 space-y-1">
          <div className="flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-lg font-black text-slate-900 dark:text-white">₹{discountPrice}</span>
                <span className="text-xs text-slate-400 line-through font-medium">₹{price}</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {discountPercent}% off
                </span>
              </>
            ) : (
              <span className="text-lg font-black text-slate-900 dark:text-white">₹{price}</span>
            )}
          </div>

          {/* Flipkart Free Delivery Tag */}
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Truck className="h-3 w-3" />
            <span>Free Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
