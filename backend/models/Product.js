import mongoose from 'mongoose';

const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    enum: ['S', 'M', 'L', 'XL', 'XXL', 'Free']
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Stock cannot be negative'],
    default: 0
  }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: [true, 'Please provide a review comment']
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a product title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price must be positive']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price must be positive'],
    validate: {
      validator: function(val) {
        return !val || val < this.price;
      },
      message: 'Discount price must be less than the original price'
    }
  },
  category: {
    type: String,
    required: [true, 'Please specify a category (e.g. men, women, kids)'],
    enum: ['men', 'women', 'kids', 'accessories']
  },
  subCategory: {
    type: String,
    required: [true, 'Please specify a sub-category (e.g. shirts, jeans)']
  },
  sizes: {
    type: [sizeSchema],
    validate: {
      validator: function(val) {
        return val && val.length > 0;
      },
      message: 'A product must have at least one size option'
    }
  },
  images: {
    type: [String],
    default: []
  },
  ratingAverage: {
    type: Number,
    default: 0,
    min: [0, 'Rating must be at least 0'],
    max: [5, 'Rating cannot be more than 5'],
    set: val => Math.round(val * 10) / 10 // Round to 1 decimal place
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reviews: {
    type: [reviewSchema],
    default: []
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
