import express from 'express';
import { checkPincodeServiceability } from '../controllers/shippingController.js';

const router = express.Router();

// POST /api/shipping/check-pincode
router.post('/check-pincode', checkPincodeServiceability);

export default router;
