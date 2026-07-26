import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import { ArrowLeft, Save, Upload, Plus, Trash, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SUBCATEGORY_OPTIONS = {
  men: ['Shirt', 'T-Shirt', 'Pant', 'Track Pant', 'Jeans', 'Hoodie', 'Jacket', 'Shorts'],
  women: ['Dress', 'Top', 'T-Shirt', 'Pant', 'Track Pant', 'Jeans', 'Skirt', 'Saree', 'Kurtis', 'Hoodie', 'Jacket'],
  kids: ['T-Shirt', 'Shirt', 'Pant', 'Track Pant', 'Shorts', 'Frock', 'Jacket'],
  accessories: ['Socks', 'Belt', 'Sunglasses', 'Hat/Cap', 'Watch', 'Bag/Wallet']
};

const AddEditProduct = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [fetchingProduct, setFetchingProduct] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [category, setCategory] = useState('men');
  const [subCategory, setSubCategory] = useState('Shirt');
  const [subCategorySelect, setSubCategorySelect] = useState('Shirt');
  const [customSubCategory, setCustomSubCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Sizing Options
  const [sizes, setSizes] = useState([
    { size: 'S', stock: 10 },
    { size: 'M', stock: 10 },
    { size: 'L', stock: 10 },
    { size: 'XL', stock: 5 },
  ]);

  // Image Uploads
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      const fetchProductDetails = async () => {
        setFetchingProduct(true);
        try {
          const { data } = await API.get(`/api/products/${id}`);
          setTitle(data.title);
          setDescription(data.description);
          setPrice(data.price);
          setDiscountPrice(data.discountPrice || '');
          setCategory(data.category);
          const fetchedSubCat = data.subCategory || '';
          const currentOptions = SUBCATEGORY_OPTIONS[data.category] || [];
          if (currentOptions.includes(fetchedSubCat)) {
            setSubCategory(fetchedSubCat);
            setSubCategorySelect(fetchedSubCat);
            setCustomSubCategory('');
          } else {
            setSubCategorySelect('Other');
            setCustomSubCategory(fetchedSubCat);
            setSubCategory(fetchedSubCat);
          }
          setIsActive(data.isActive);
          setSizes(data.sizes || []);
          setExistingImages(data.images || []);
          setFetchingProduct(false);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch product details');
          setFetchingProduct(false);
        }
      };

      fetchProductDetails();
    }
  }, [id, isEditMode]);

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const options = SUBCATEGORY_OPTIONS[newCat] || [];
    if (options.length > 0) {
      setSubCategorySelect(options[0]);
      setSubCategory(options[0]);
      setCustomSubCategory('');
    } else {
      setSubCategorySelect('Other');
      setSubCategory('');
      setCustomSubCategory('');
    }
  };

  const handleSubCategorySelectChange = (newSelectVal) => {
    setSubCategorySelect(newSelectVal);
    if (newSelectVal === 'Other') {
      setSubCategory(customSubCategory);
    } else {
      setSubCategory(newSelectVal);
    }
  };

  const handleCustomSubCategoryChange = (newCustomVal) => {
    setCustomSubCategory(newCustomVal);
    setSubCategory(newCustomVal);
  };

  // Handle sizes stock manipulation
  const handleStockChange = (idx, value) => {
    const updated = [...sizes];
    updated[idx].stock = Math.max(0, parseInt(value) || 0);
    setSizes(updated);
  };

  const handleAddSizeOption = () => {
    const defaultSizes = ['S', 'M', 'L', 'XL', 'XXL', 'Free'];
    const currentSizes = sizes.map((s) => s.size);
    const nextAvailable = defaultSizes.find((s) => !currentSizes.includes(s));

    if (nextAvailable) {
      setSizes([...sizes, { size: nextAvailable, stock: 5 }]);
    } else {
      toast.error('All standard sizes are already configured.');
    }
  };

  const handleRemoveSizeOption = (idx) => {
    setSizes(sizes.filter((_, i) => i !== idx));
  };

  const handleSizeNameChange = (idx, value) => {
    const updated = [...sizes];
    updated[idx].size = value;
    setSizes(updated);
  };

  // Image File Handling
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...previews]);
  };

  const handleRemovePreview = (idx) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingImage = (idx) => {
    setExistingImages(existingImages.filter((_, i) => i !== idx));
  };

  const getImageUrl = (imagePath) => {
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5000/${imagePath}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Field Validations
    if (!title || !description || !price || !category || !subCategory) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (sizes.length === 0) {
      setError('Please configure at least one size option');
      setLoading(false);
      return;
    }

    if (discountPrice && Number(discountPrice) >= Number(price)) {
      setError('Discount price must be less than original price');
      setLoading(false);
      return;
    }

    try {
      // Use FormData to allow file uploads concurrently
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('discountPrice', discountPrice || '');
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('isActive', isActive);
      formData.append('sizes', JSON.stringify(sizes));

      // Append new files
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Append existing remaining images for edit mode
      if (isEditMode) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (isEditMode) {
        await API.put(`/api/products/${id}`, formData, config);
        toast.success('Product updated successfully!');
      } else {
        await API.post('/api/products', formData, config);
        toast.success('Product created successfully!');
      }

      setLoading(false);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
      setError(err.response?.data?.message || 'Failed to save product');
      setLoading(false);
    }
  };

  if (fetchingProduct) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Top Header Navigation */}
      <div className="mb-8 flex items-center gap-4">
        <Link to="/admin" className="rounded-lg p-2 text-slate-500 dark:text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditMode ? 'Modify Product' : 'Add New Product'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Configure catalog properties, pricing, and stock options</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 border border-red-500/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details glass card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Core Details</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Slim Fit Cotton Shirt"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                Sub-Category <span className="text-red-500">*</span>
              </label>
              <select
                value={subCategorySelect}
                onChange={(e) => handleSubCategorySelectChange(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {(SUBCATEGORY_OPTIONS[category] || []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Other (Custom)</option>
              </select>

              {subCategorySelect === 'Other' && (
                <input
                  type="text"
                  required
                  value={customSubCategory}
                  onChange={(e) => handleCustomSubCategoryChange(e.target.value)}
                  className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter custom subcategory..."
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="kids">Kids</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="flex items-center pt-8">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0f172a] text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                  Visible (Active) in Shop catalog
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
              Product Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Made from 100% organic cotton, breathable knit..."
            />
          </div>
        </div>

        {/* Pricing glass card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pricing Configuration (INR)</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                Original Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="1499"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350">
                Discount Price (Optional)
              </label>
              <input
                type="number"
                min="0"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 px-4 py-2.5 text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="999"
              />
            </div>
          </div>
        </div>

        {/* Size Inventory Config Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Size & Inventory Levels</h2>
            <button
              type="button"
              onClick={handleAddSizeOption}
              className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Size Option</span>
            </button>
          </div>

          <div className="space-y-3">
            {sizes.map((s, idx) => (
              <div key={idx} className="flex items-center gap-4 bg-slate-100/50 dark:bg-[#0f172a]/30 p-3 rounded-xl border border-slate-200 dark:border-slate-850">
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Size</label>
                  <select
                    value={s.size}
                    onChange={(e) => handleSizeNameChange(idx, e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-1.5 text-sm text-slate-900 dark:text-slate-200"
                  >
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="Free">Free</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">Available Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={s.stock}
                    onChange={(e) => handleStockChange(idx, e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 p-1.5 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSizeOption(idx)}
                  className="mt-5 rounded-lg p-2 text-slate-500 dark:text-slate-455 hover:bg-red-105 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Product Images glass card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-slate-850 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Product Images</h2>

          {/* Existing Images list */}
          {isEditMode && existingImages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Retained Images</p>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img, idx) => (
                  <div key={idx} className="group relative h-20 w-16 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                    <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload and preview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-350 mb-3">
              Upload New Images
            </label>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Dropzone container */}
              <label className="flex h-36 flex-1 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-[#0f172a]/20 hover:bg-slate-200/50 dark:hover:bg-[#0f172a]/40 transition-colors">
                <Upload className="h-8 w-8 text-blue-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Select Files</span>
                <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-1">supports jpg, png, webp (max 5)</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Upload Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">New Previews</p>
                  <div className="flex flex-wrap gap-3">
                    {imagePreviews.map((previewUrl, idx) => (
                      <div key={idx} className="group relative h-20 w-16 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                        <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePreview(idx)}
                          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="flex gap-4">
          <Link
            to="/admin"
            className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 py-3.5 text-center font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-850 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/20"
          >
            <Save className="h-5 w-5" />
            <span>{loading ? 'Saving...' : 'Save Product'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEditProduct;
