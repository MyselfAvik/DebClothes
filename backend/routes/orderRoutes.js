import express from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  verifyRazorpayPayment,
  handlePaymentFailure,
  requestReturnOrder,
  cancelMyOrder,
  processAdminRefund,
} from '../controllers/orderController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import upload from '../config/cloudinary.js';

const router = express.Router();

router.use(verifyToken); // All order routes require user login

router
  .route('/')
  .post(createOrder)
  .get(isAdmin, getAllOrders);

router.route('/my').get(getMyOrders);

router.route('/verify').post(verifyRazorpayPayment);
router.route('/:id/payment-failed').post(handlePaymentFailure);

router.route('/:id/cancel').put(cancelMyOrder);
router.route('/:id/return').post(upload.array('images', 4), requestReturnOrder);
router.route('/:id/status').put(isAdmin, updateOrderStatus);
router.route('/:id/refund').put(isAdmin, processAdminRefund);

export default router;
