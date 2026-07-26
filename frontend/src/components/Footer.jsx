import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, RotateCcw, ShieldCheck, CreditCard, Mail, ArrowRight, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 transition-colors">
      {/* Trust Badges Banner */}
      <div className="border-b border-slate-200/60 dark:border-slate-800/60 bg-blue-500/5 dark:bg-[#0f172a]/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">EKart Express</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450">Fast 2-4 Day Delivery</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">7-Day Returns</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450">Hassle-Free Door Pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">100% Authentic</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450">Verified Quality Guaranteed</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Secure Payment</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-450">COD, UPI, Netbanking & Cards</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-500/30">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className="text-xl font-extrabold tracking-wider text-slate-900 dark:text-white">
                DEB<span className="text-blue-500">CLOTHES</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              Discover high-performance fashion engineered for modern lifestyles. Tailored cuts, premium fabrics, and seamless customer service.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Mail className="h-4 w-4 text-blue-500" />
              <span>Contact: <a href="mailto:Debclothes.officail@gmail.com" className="hover:underline">Debclothes.officail@gmail.com</a></span>
            </div>

            {/* Newsletter */}
            <div className="pt-2 max-w-sm">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
                Subscribe for Special Offers & 15% Off
              </span>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Shop Categories
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Men's Collection</Link></li>
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Women's Fashion</Link></li>
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Kids Wear</Link></li>
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Accessories & Caps</Link></li>
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Trending Special Offers</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Customer Desk
            </h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li><Link to="/orders" className="hover:text-blue-500 transition-colors">Track Your Order</Link></li>
              <li><Link to="/orders" className="hover:text-blue-500 transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/profile" className="hover:text-blue-500 transition-colors">Account Profile</Link></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">Shipping Policy</a></li>
              <li><a href="#" className="hover:text-blue-500 transition-colors">Privacy & Terms</a></li>
            </ul>
          </div>

          {/* Logistics Partner */}
          <div>
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Logistics Partner
            </h4>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">
                EKart Logistics Official
              </span>
              <p className="text-[11px] text-slate-500">
                Pincode serviceability & express shipment tracking across 25,000+ Indian pincodes.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-slate-200/60 dark:border-slate-800/60 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-450">
          <p>© {new Date().getFullYear()} DEBCLOTHES. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-500">
            <span>Crafted with</span>
            <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
            <span>for fashion enthusiasts</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
