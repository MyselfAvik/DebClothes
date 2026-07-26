import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
} from '../controllers/productController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router
  .route('/')
  .get(getProducts)
  .post(verifyToken, isAdmin, upload.array('images', 5), createProduct);

router
  .route('/:id')
  .get(getProductById)
  .put(verifyToken, isAdmin, upload.array('images', 5), updateProduct)
  .delete(verifyToken, isAdmin, deleteProduct);

router.route('/:id/reviews').post(verifyToken, upload.array('images', 3), createProductReview);

export default router;
