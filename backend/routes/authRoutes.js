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
  updateAddress,
  deleteAddress,
  changePassword,
  requestChangePasswordOtp,
  verifyChangePasswordOtp,
  getAllUsers,
  updateUserRole,
  googleLogin,
  requestAccountDeletion,
  deleteMyAccount,
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

// Account & Data Deletion Routes (Google Play & Privacy Compliance)
router.post('/delete-request', requestAccountDeletion);
router.delete('/account', verifyToken, deleteMyAccount);

// Address Management Routes
router.post('/addresses', verifyToken, addAddress);
router.put('/addresses/:id', verifyToken, updateAddress);
router.delete('/addresses/:id', verifyToken, deleteAddress);

// Password Change Routes (Direct with current password + OTP fallback)
router.put('/change-password', verifyToken, changePassword);
router.post('/change-password-request-otp', verifyToken, requestChangePasswordOtp);
router.post('/change-password-verify-otp', verifyToken, verifyChangePasswordOtp);

export default router;
