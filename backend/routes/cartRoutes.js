import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQty,
  removeFromCart,
  clearCart,
} from '../controllers/cartController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken); // All cart routes require user login

router
  .route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router
  .route('/:itemId')
  .put(updateCartItemQty)
  .delete(removeFromCart);

export default router;
