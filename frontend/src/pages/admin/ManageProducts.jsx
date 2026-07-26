import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Quick edit states
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickPrice, setQuickPrice] = useState('');
  const [quickDiscountPrice, setQuickDiscountPrice] = useState('');
  const [quickSizes, setQuickSizes] = useState([]);
  const [quickLoading, setQuickLoading] = useState(false);

  const startQuickEdit = (product) => {
    setQuickEditId(product._id);
    setQuickPrice(product.price);
    setQuickDiscountPrice(product.discountPrice || '');
    setQuickSizes(product.sizes.map((s) => ({ size: s.size, stock: s.stock })));
  };

  const handleQuickSave = async (productId) => {
    setQuickLoading(true);
    try {
      const { data } = await API.put(`/api/products/${productId}`, {
        price: Number(quickPrice),
        discountPrice: quickDiscountPrice ? Number(quickDiscountPrice) : undefined,
        sizes: quickSizes,
      });

      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, ...data } : p))
      );

      toast.success('Product quick updated successfully!');
      setQuickEditId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to quick update product');
    } finally {
      setQuickLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/api/products', { params: { limit: 100 } });
      setProducts(data.products);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(productId);
    try {
      await API.delete(`/api/products/${productId}`);
      setProducts(products.filter((p) => p._id !== productId));
      toast.success('Product deleted successfully');
      setDeleteLoading(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
      setDeleteLoading(null);
    }
  };

  const getProductImage = (images) => {
    if (images && images.length > 0) {
      const img = images[0];
      if (img.startsWith('http')) {
        return img;
      }
      return `http://localhost:5000/${img}`;
    }
    return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=60';
  };

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total catalog collection size: {products.length} products</p>
        </div>
        <Link
          to="/admin/product/new"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-red-405">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#0f172a]/5 dark:bg-[#0f172a]/20 p-12 text-center text-slate-500 dark:text-slate-400">
          No products in the catalog. Click "Add New Product" to create your first item.
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-850">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-700 dark:text-slate-350">
              <thead className="border-b border-slate-200 dark:border-slate-850 bg-[#0f172a]/5 dark:bg-[#0f172a]/40 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Size Availability & Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-850/50">
                {products.map((p) => {
                  const hasDiscount = p.discountPrice && p.discountPrice < p.price;
                  return (
                    <tr key={p._id} className="hover:bg-slate-100 dark:hover:bg-slate-800/10 transition-colors">
                      {/* Product details */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getProductImage(p.images)}
                            alt=""
                            className="h-12 w-10 rounded bg-slate-200 dark:bg-slate-900 object-cover object-top border border-slate-200 dark:border-slate-800"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=60';
                            }}
                          />
                          <div className="max-w-[200px]">
                            <p className="font-semibold text-slate-900 dark:text-white truncate" title={p.title}>
                              {p.title}
                            </p>
                            <p className="text-xs text-slate-450 dark:text-slate-450 truncate" title={p._id}>
                              ID: {p._id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-6 py-4 capitalize text-slate-700 dark:text-slate-300">
                        {p.category} &middot; <span className="text-slate-450 dark:text-slate-450 text-xs">{p.subCategory}</span>
                      </td>

                      {/* Price */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {p._id === quickEditId ? (
                          <div className="flex flex-col gap-1 w-24">
                            <input
                              type="number"
                              placeholder="Price"
                              value={quickPrice}
                              onChange={(e) => setQuickPrice(e.target.value)}
                              className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 font-bold"
                            />
                            <input
                              type="number"
                              placeholder="Discount"
                              value={quickDiscountPrice}
                              onChange={(e) => setQuickDiscountPrice(e.target.value)}
                              className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 text-slate-500"
                            />
                          </div>
                        ) : hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">₹{p.discountPrice}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 line-through">₹{p.price}</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-900 dark:text-white">₹{p.price}</span>
                        )}
                      </td>

                      {/* Stock sizes */}
                      <td className="px-6 py-4">
                        {p._id === quickEditId ? (
                          <div className="flex flex-col gap-1.5 max-w-[220px]">
                            {quickSizes.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold w-8 text-slate-500">{s.size}:</span>
                                <input
                                  type="number"
                                  value={s.stock}
                                  onChange={(e) => {
                                    const updated = [...quickSizes];
                                    updated[idx].stock = Number(e.target.value);
                                    setQuickSizes(updated);
                                  }}
                                  className="w-16 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-1.5 py-0.5 text-xs outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 font-semibold"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                            {p.sizes?.map((s, idx) => (
                              <span
                                key={idx}
                                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                                  s.stock > 0
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                }`}
                              >
                                {s.size}: <span className="font-bold">{s.stock}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.isActive
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-450 border border-slate-300 dark:border-slate-700/50'
                          }`}
                        >
                          {p.isActive ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p._id === quickEditId ? (
                            <>
                              <button
                                disabled={quickLoading}
                                onClick={() => handleQuickSave(p._id)}
                                className="rounded-lg p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-semibold text-xs flex items-center gap-1"
                                title="Save Quick Edits"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                disabled={quickLoading}
                                onClick={() => setQuickEditId(null)}
                                className="rounded-lg p-2 bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                title="Cancel Quick Edits"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startQuickEdit(p)}
                                className="rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 text-blue-500 hover:bg-blue-500/5 hover:border-blue-500/30 transition-all font-bold text-xs"
                                title="Quick stock/price edit"
                              >
                                Quick Edit
                              </button>
                              <Link
                                to={`/admin/product/${p._id}/edit`}
                                className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Link>
                              <button
                                disabled={deleteLoading === p._id}
                                onClick={() => handleDelete(p._id)}
                                className="rounded-lg p-2 text-slate-500 dark:text-slate-400 transition-colors hover:bg-red-100 dark:hover:bg-red-950/20 hover:text-red-650 hover:text-red-655"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
