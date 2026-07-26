import Product from '../models/Product.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Helper to determine if the request is from an admin
const checkAdminRequest = async (req) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      return user && user.role === 'admin';
    } catch (error) {
      return false;
    }
  }
  return false;
};

// Helper to sanitize product for customers (hide createdBy, stock numbers, etc.)
const sanitizeProductForCustomer = (product) => {
  const p = product.toObject ? product.toObject() : product;
  return {
    _id: p._id,
    title: p.title,
    description: p.description,
    price: p.price,
    discountPrice: p.discountPrice,
    category: p.category,
    subCategory: p.subCategory,
    images: p.images,
    ratingAverage: p.ratingAverage,
    ratingCount: p.ratingCount,
    isActive: p.isActive,
    sizes: p.sizes.map((s) => ({
      size: s.size,
      isAvailable: s.stock > 0,
    })),
    reviews: p.reviews || [],
    createdAt: p.createdAt,
  };
};

// @desc    Get all products (public listing, filtering, search, pagination)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res, next) => {
  try {
    const isAdmin = await checkAdminRequest(req);

    // Build query
    const queryObj = {};

    // Customers only see active products
    if (!isAdmin) {
      queryObj.isActive = true;
    }

    // Filter: Search
    if (req.query.search) {
      queryObj.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Filter: Category
    if (req.query.category) {
      queryObj.category = req.query.category;
    }

    // Filter: SubCategory
    if (req.query.subCategory) {
      queryObj.subCategory = req.query.subCategory;
    }

    // Filter: Size
    if (req.query.size) {
      queryObj.sizes = {
        $elemMatch: {
          size: req.query.size,
          stock: isAdmin ? { $gte: 0 } : { $gt: 0 },
        },
      };
    }

    // Filter: Price Range
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) {
        queryObj.price.$gte = Number(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        queryObj.price.$lte = Number(req.query.maxPrice);
      }
    }

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const totalProducts = await Product.countDocuments(queryObj);
    const products = await Product.find(queryObj)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Process output depending on role
    const results = isAdmin
      ? products
      : products.map((p) => sanitizeProductForCustomer(p));

    res.json({
      products: results,
      page,
      pages: Math.ceil(totalProducts / limit),
      total: totalProducts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product details by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res, next) => {
  try {
    const isAdmin = await checkAdminRequest(req);
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // If customer, check if product is active
    if (!isAdmin && !product.isActive) {
      res.status(404);
      throw new Error('Product is not available');
    }

    let hasPurchased = false;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const order = await Order.findOne({
          user: decoded.id,
          'items.product': product._id,
          orderStatus: 'delivered'
        });
        if (order) {
          hasPurchased = true;
        }
      } catch (err) {
        // Ignore auth decode errors for public access
      }
    }

    const result = isAdmin ? product.toObject() : sanitizeProductForCustomer(product);
    res.json({
      ...result,
      hasPurchased
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, discountPrice, category, subCategory, sizes, isActive } = req.body;

    // Validate size structure from req.body (it could be sent as a JSON string if multipart form data was used)
    let parsedSizes = sizes;
    if (typeof sizes === 'string') {
      parsedSizes = JSON.parse(sizes);
    }

    // Extract file upload paths (if any)
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        // If Cloudinary storage is active, path is the Cloudinary URL.
        // If local storage is active, we store relative local path.
        images.push(file.path);
      });
    } else if (req.body.images) {
      // In case images are passed directly as URLs
      const urls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      images.push(...urls);
    }

    const product = new Product({
      title,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      category,
      subCategory,
      sizes: parsedSizes,
      images,
      createdBy: req.user._id,
      isActive: isActive !== undefined ? isActive : true,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res, next) => {
  try {
    const { title, description, price, discountPrice, category, subCategory, sizes, isActive, existingImages } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Handle sizes
    let parsedSizes = sizes;
    if (sizes && typeof sizes === 'string') {
      parsedSizes = JSON.parse(sizes);
    }

    // Handle images: combining existing kept images + new uploads
    let updatedImages = [];
    if (existingImages) {
      const parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      updatedImages = Array.isArray(parsedExisting) ? parsedExisting : [parsedExisting];
    } else {
      updatedImages = product.images; // fallback to keeping all if not specified
    }

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        updatedImages.push(file.path);
      });
    }

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price !== undefined ? Number(price) : product.price;
    product.discountPrice = discountPrice !== undefined ? (discountPrice ? Number(discountPrice) : undefined) : product.discountPrice;
    product.category = category || product.category;
    product.subCategory = subCategory || product.subCategory;
    product.sizes = parsedSizes || product.sizes;
    product.images = updatedImages;
    product.isActive = isActive !== undefined ? isActive : product.isActive;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    await product.deleteOne();
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create / Update a product review (purchased items only)
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    if (!rating || !comment) {
      res.status(400);
      throw new Error('Please provide rating and comment');
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }

    // 1. Gate check: Check if user purchased the product
    const order = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      orderStatus: 'delivered'
    });

    if (!order) {
      res.status(400);
      throw new Error('Only customers who have purchased this product can leave a review');
    }

    // 2. Process image uploads (if any)
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        images.push(file.path);
      });
    }

    // 3. Check if user already reviewed this product
    const alreadyReviewedIdx = product.reviews.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewedIdx > -1) {
      // Overwrite existing review
      product.reviews[alreadyReviewedIdx].rating = Number(rating);
      product.reviews[alreadyReviewedIdx].comment = comment;
      
      // If new images are uploaded, replace them
      if (images.length > 0) {
        product.reviews[alreadyReviewedIdx].images = images;
      }
    } else {
      // Add new review
      const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
        images,
      };
      product.reviews.push(review);
    }

    // 4. Update product rating average & count
    product.ratingCount = product.reviews.length;
    const sumRatings = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    product.ratingAverage = product.ratingCount > 0 ? (sumRatings / product.ratingCount) : 0;

    await product.save();

    res.status(201).json({
      success: true,
      message: alreadyReviewedIdx > -1 ? 'Review updated successfully' : 'Review added successfully',
      reviews: product.reviews
    });
  } catch (error) {
    next(error);
  }
};
