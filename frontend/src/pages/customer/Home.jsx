import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../../api/axios';
import ProductCard from '../../components/ProductCard';
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight, X, Crown, Sparkles, ShieldCheck, Award, Zap, Star, CheckCircle2 } from 'lucide-react';

const SUBCATEGORY_OPTIONS = {
  men: ['Shirt', 'T-Shirt', 'Pant', 'Track Pant', 'Jeans', 'Hoodie', 'Jacket', 'Shorts'],
  women: ['Dress', 'Top', 'T-Shirt', 'Pant', 'Track Pant', 'Jeans', 'Skirt', 'Saree', 'Kurtis', 'Hoodie', 'Jacket'],
  kids: ['T-Shirt', 'Shirt', 'Pant', 'Track Pant', 'Shorts', 'Frock', 'Jacket'],
  accessories: ['Socks', 'Belt', 'Sunglasses', 'Hat/Cap', 'Watch', 'Bag/Wallet']
};

const ALL_SUBCATEGORIES = Array.from(
  new Set(Object.values(SUBCATEGORY_OPTIONS).flat())
).sort();

const Home = () => {
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [size, setSize] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Search suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const getSuggestions = async () => {
      if (!search.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const { data } = await API.get('/api/products', {
          params: { search: search, limit: 5 }
        });
        setSuggestions(data.products || []);
      } catch (err) {
        // Ignore
      }
    };

    const delayDebounceFn = setTimeout(() => {
      getSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Toggle mobile filter modal
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 8,
      };

      if (search) params.search = search;
      if (category) params.category = category;
      if (subCategory) params.subCategory = subCategory;
      if (size) params.size = size;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const { data } = await API.get('/api/products', { params });
      setProducts(data.products);
      setPages(data.pages);
      setTotal(data.total);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching products');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, category, subCategory, size]); // Auto trigger on quick filter select

  useEffect(() => {
    // When location changes to "/" without query params (e.g. clicking 'Shop' in navbar), reset all filters
    if (location.pathname === '/' && !location.search) {
      setSearch('');
      setCategory('');
      setSubCategory('');
      setSize('');
      setMinPrice('');
      setMaxPrice('');
      setPage(1);
      
      const fetchReset = async () => {
        setLoading(true);
        setError('');
        try {
          const { data } = await API.get('/api/products', { params: { page: 1, limit: 8 } });
          setProducts(data.products);
          setPages(data.pages);
          setTotal(data.total);
          setLoading(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Error fetching products');
          setLoading(false);
        }
      };
      fetchReset();
    }
  }, [location]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setSubCategory('');
    setSize('');
    setMinPrice('');
    setMaxPrice('');
    setPage(1);
    
    // Explicit direct API call with default pagination limits
    setLoading(true);
    setError('');
    API.get('/api/products', { params: { page: 1, limit: 8 } })
      .then(({ data }) => {
        setProducts(data.products);
        setPages(data.pages);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Error fetching products');
        setLoading(false);
      });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Rich Classic Hero Banner */}
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#0a0f1d] via-[#1e1b4b] to-[#0a0f1d] border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200"
            alt="Hero Banner"
            className="h-full w-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1d] via-[#0a0f1d]/85 to-transparent"></div>
        </div>

        <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-24 lg:w-3/5 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-300 border border-blue-400/30">
              Summer Collection 2026
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
              ⚡ EKart Express Delivery Active
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight">
            Redefine Your{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Signature Style
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 max-w-xl font-normal leading-relaxed">
            Discover tailored fits, vibrant colorways, and premium handcrafted apparel delivered straight to your door.
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden w-64 shrink-0 lg:block">
          <div className="glass-card rounded-2xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-blue-500" />
              <span>Filters</span>
            </h2>

            <form onSubmit={handleApplyFilters} className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory(''); // Reset subCategory on category change
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-550"
                >
                  <option value="">All Categories</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              {/* Sub-Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Sub-Category
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-550"
                >
                  <option value="">All Sub-Categories</option>
                  {(category ? SUBCATEGORY_OPTIONS[category] : ALL_SUBCATEGORIES).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-550"
                >
                  <option value="">All Sizes</option>
                  <option value="S">Small (S)</option>
                  <option value="M">Medium (M)</option>
                  <option value="L">Large (L)</option>
                  <option value="XL">Extra Large (XL)</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-550"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-550"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full rounded-lg bg-slate-200/50 dark:bg-slate-850 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Product Listing Area */}
        <div className="flex-1 space-y-6">
          {/* Flipkart-Style Vibrant Category Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
            {[
              { id: '', label: '⚡ All Deals', activeBg: 'bg-blue-600 text-white shadow-blue-500/25' },
              { id: 'men', label: '👔 Men', activeBg: 'bg-indigo-600 text-white shadow-indigo-500/25' },
              { id: 'women', label: '👗 Women', activeBg: 'bg-rose-600 text-white shadow-rose-500/25' },
              { id: 'kids', label: '🧒 Kids', activeBg: 'bg-amber-600 text-white shadow-amber-500/25' },
              { id: 'accessories', label: '🕶️ Accessories', activeBg: 'bg-emerald-600 text-white shadow-emerald-500/25' }
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  setSubCategory(''); // Reset subCategory on category change
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm ${
                  category === cat.id
                    ? `${cat.activeBg} scale-105 shadow-md`
                    : 'bg-white dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Top Bar (Search & Mobile Filter triggers) */}
          <div className="mb-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:max-w-md search-container">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/40 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-2 shadow-xl">
                  {suggestions.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => {
                        setSearch(p.title);
                        setShowSuggestions(false);
                        setPage(1);
                        API.get('/api/products', { params: { search: p.title, limit: 8, page: 1 } })
                          .then(({ data }) => {
                            setProducts(data.products);
                            setPages(data.pages);
                            setTotal(data.total);
                          });
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="font-semibold truncate max-w-[250px]">{p.title}</span>
                      <span className="text-[10px] text-blue-500 font-bold uppercase shrink-0">₹{p.price}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchProducts}
              className="hidden sm:inline-flex rounded-xl bg-slate-250 dark:bg-slate-850 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Search
            </button>

            {/* Mobile filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-slate-250 dark:bg-slate-850 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-800 sm:hidden hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Product Grid / Loader */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400">
              {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0f172a]/5 dark:bg-[#0f172a]/20 p-12 text-center text-slate-500 dark:text-slate-400">
              No products found matching your criteria.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination controls */}
              {pages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 p-2.5 text-slate-750 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Page {page} of {pages}
                  </span>
                  <button
                    disabled={page === pages}
                    onClick={() => setPage(page + 1)}
                    className="flex items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 p-2.5 text-slate-750 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition-colors hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm sm:hidden">
          <div className="h-full w-80 bg-slate-50 dark:bg-[#0b0f19] p-6 border-l border-slate-200 dark:border-slate-800 overflow-y-auto transition-colors">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-blue-500" />
                <span>Filters</span>
              </h2>
              <button
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-250 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory(''); // Reset subCategory on category change
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 text-sm text-slate-900 dark:text-slate-200 outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              {/* Sub-Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Sub-Category
                </label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 text-sm text-slate-900 dark:text-slate-200 outline-none"
                >
                  <option value="">All Sub-Categories</option>
                  {(category ? SUBCATEGORY_OPTIONS[category] : ALL_SUBCATEGORIES).map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Size
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 text-sm text-slate-900 dark:text-slate-200 outline-none"
                >
                  <option value="">All Sizes</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Price Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-3 text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-6">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClearFilters();
                    setShowFilters(false);
                  }}
                  className="w-full rounded-lg bg-slate-200/50 dark:bg-slate-850 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
