import express from 'express';
import {
  registerUser,
  verifySignupOtp,
  loginUser,
  requestLoginOtp,
  verifyLoginOtp,
  resendOtp,
  getMe,
  addAddress,
  deleteAddress,
  requestChangePasswordOtp,
  verifyChangePasswordOtp,
  getAllUsers,
  updateUserRole,
  googleLogin,
} from '../controllers/authController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/login-request-otp', requestLoginOtp);
router.post('/login-verify-otp', verifyLoginOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.put('/users/:id/role', verifyToken, isAdmin, updateUserRole);

// Address Management Routes
router.post('/addresses', verifyToken, addAddress);
router.delete('/addresses/:id', verifyToken, deleteAddress);

// Password Change via OTP Routes
router.post('/change-password-request-otp', verifyToken, requestChangePasswordOtp);
router.post('/change-password-verify-otp', verifyToken, verifyChangePasswordOtp);

export default router;
