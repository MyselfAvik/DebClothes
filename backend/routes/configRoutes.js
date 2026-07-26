import express from 'express';
const router = express.Router();

// @desc    Get public config settings
// @route   GET /api/config/razorpay-key
// @access  Public
router.get('/razorpay-key', (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_stubkey'
  });
});

// @desc    Get public Google Client ID
// @route   GET /api/config/google-client-id
// @access  Public
router.get('/google-client-id', (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

export default router;
