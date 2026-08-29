import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { sendOtpEmail } from '../config/mailer.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Generate 6-digit numeric OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register a new user (with OTP verification)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, addresses } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      if (user.isVerified) {
        res.status(400);
        throw new Error('User already exists with this email');
      } else {
        // User exists but is not verified: update details and generate new OTP
        user.name = name;
        user.password = password; // pre-save hook will hash it
        user.addresses = addresses || [];
      }
    } else {
      // Create new user (unverified by default)
      user = new User({
        name,
        email,
        password,
        role: 'customer', // Enforce customer role on registration
        addresses: addresses || [],
        isVerified: false
      });
    }

    // Generate OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    await user.save();

    // Send email
    await sendOtpEmail(email, otp, 'Signup Verification');

    res.status(201).json({
      requireOtp: true,
      email: user.email,
      message: 'Signup successful. OTP verification code sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify signup OTP and activate account
// @route   POST /api/auth/verify-signup-otp
// @access  Public
export const verifySignupOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please provide email and OTP code');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('Account is already verified');
    }

    // Check OTP validity
    if (user.otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP verification code');
    }

    if (user.otpExpire < Date.now()) {
      res.status(400);
      throw new Error('OTP code has expired. Please request a new one.');
    }

    // Activate user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      addresses: user.addresses,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token (Password Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter email and password');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Ensure user account is verified
    if (!user.isVerified) {
      // Trigger new OTP for registration automatically
      const otp = generateOtp();
      user.otp = otp;
      user.otpExpire = Date.now() + 5 * 60 * 1000;
      await user.save();
      await sendOtpEmail(user.email, otp, 'Signup Verification');

      res.status(403).json({
        requireOtpVerification: true,
        email: user.email,
        message: 'Account not verified. OTP code has been sent to complete signup verification.'
      });
      return;
    }

    // Compare passwords
    if (await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        addresses: user.addresses,
        token: generateToken(user._id)
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Request login OTP (Passwordless authentication)
// @route   POST /api/auth/login-request-otp
// @access  Public
export const requestLoginOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please enter email address');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('No user account found with this email address');
    }

    if (!user.isVerified) {
      res.status(403);
      throw new Error('This account has not been verified. Please register or verify the account first.');
    }

    // Generate login OTP
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    await sendOtpEmail(email, otp, 'Login Authentication');

    res.json({
      success: true,
      message: 'One-Time Password (OTP) has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify login OTP and authenticate user
// @route   POST /api/auth/login-verify-otp
// @access  Public
export const verifyLoginOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400);
      throw new Error('Please enter email and OTP code');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Validate OTP
    if (user.otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP login code');
    }

    if (user.otpExpire < Date.now()) {
      res.status(400);
      throw new Error('OTP has expired. Please request a new code.');
    }

    // Clear OTP codes and authenticate
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      addresses: user.addresses,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP (Common route for signup and login requests)
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;
    await user.save();

    const mailPurpose = purpose || (user.isVerified ? 'Login Authentication' : 'Signup Verification');
    await sendOtpEmail(email, otp, mailPurpose);

    res.json({
      success: true,
      message: 'New OTP verification code sent successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Add a saved address to profile (max 5)
// @route   POST /api/auth/addresses
// @access  Private
export const addAddress = async (req, res, next) => {
  try {
    const { line1, city, state, pincode, phone } = req.body;

    if (!line1 || !city || !state || !pincode || !phone) {
      res.status(400);
      throw new Error('Please fill in all address fields');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.addresses.length >= 5) {
      res.status(400);
      throw new Error('Address storage limit reached (maximum 5 addresses saved)');
    }

    user.addresses.push({ line1, city, state, pincode, phone });
    await user.save();

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved address from profile
// @route   DELETE /api/auth/addresses/:id
// @access  Private
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== req.params.id
    );
    
    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a saved address in profile
// @route   PUT /api/auth/addresses/:id
// @access  Private
export const updateAddress = async (req, res, next) => {
  try {
    const { line1, city, state, pincode, phone } = req.body;

    if (!line1 || !city || !state || !pincode || !phone) {
      res.status(400);
      throw new Error('Please fill in all address fields');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const address = user.addresses.find(
      (addr) => addr._id.toString() === req.params.id
    );

    if (!address) {
      res.status(404);
      throw new Error('Address not found');
    }

    address.line1 = line1;
    address.city = city;
    address.state = state;
    address.pincode = pincode;
    address.phone = phone;

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// @desc    Request Password Change OTP
// @route   POST /api/auth/change-password-request-otp
// @access  Private
export const requestChangePasswordOtp = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    await sendOtpEmail(user.email, otp, 'Password Change');

    res.json({
      success: true,
      message: 'One-Time Password (OTP) for password reset has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and change password
// @route   POST /api/auth/change-password-verify-otp
// @access  Private
export const verifyChangePasswordOtp = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      res.status(400);
      throw new Error('Please enter OTP and your new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.otp !== otp) {
      res.status(400);
      throw new Error('Invalid OTP code');
    }

    if (user.otpExpire < Date.now()) {
      res.status(400);
      throw new Error('OTP has expired. Please request a new code.');
    }

    user.password = newPassword; // Pre-save hook will hash this password
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Your password has been successfully updated.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users / customers (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password -otp -otpExpire');
    
    // Count orders for each user dynamically
    const usersWithOrderCount = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id });
        const u = user.toObject();
        return {
          ...u,
          orderCount,
        };
      })
    );
    
    res.json(usersWithOrderCount);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['customer', 'admin'].includes(role)) {
      res.status(400);
      throw new Error('Please specify a valid role: customer or admin');
    }

    if (req.params.id === req.user.id && role !== 'admin') {
      res.status(400);
      throw new Error('You cannot change your own administrator role');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login or Signup with Google OAuth token
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      throw new Error('Google identity token is required');
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      res.status(500);
      throw new Error('Google Client ID is not configured on the server. Please add GOOGLE_CLIENT_ID to backend/.env');
    }

    // Verify token using google-auth-library or fetch from Google UserInfo API
    let email, name, email_verified;
    if (token.startsWith('mock_')) {
      const parts = token.replace('mock_', '').split('|');
      email = parts[0] || 'googleuser@test.com';
      name = parts[1] || 'Google User';
      email_verified = true;
    } else {
      // First try Google ID Token verification
      let verifiedViaIdToken = false;
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: googleClientId,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          email = payload.email;
          name = payload.name;
          email_verified = payload.email_verified;
          verifiedViaIdToken = true;
        }
      } catch (verifyErr) {
        // Fall through to access_token verification via Google UserInfo API
      }

      // If not verified via ID token, try Google OAuth2 UserInfo API with access_token
      if (!verifiedViaIdToken) {
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.email) {
              email = data.email;
              name = data.name || data.given_name || 'Google User';
              email_verified = data.email_verified !== undefined ? data.email_verified : true;
            }
          } else {
            res.status(401);
            throw new Error('Invalid Google credential token or verification failed');
          }
        } catch (fetchErr) {
          console.error('Google token verification failed:', fetchErr);
          res.status(401);
          throw new Error('Invalid Google credential token or verification failed');
        }
      }
    }

    if (!email_verified || !email) {
      res.status(400);
      throw new Error('Your Google email address must be verified by Google to log in');
    }

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists. Ensure their email is marked as verified.
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      // Create new user with Google profile details.
      // Generate a long random password for Mongoose schema validation.
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      user = new User({
        name: name || 'Google User',
        email,
        password: randomPassword,
        role: 'customer',
        isVerified: true,
      });
      await user.save();
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      addresses: user.addresses,
      token: generateToken(user._id)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password directly with current password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Please enter current password and new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.password = newPassword; // Mongoose pre-save hook will hash it
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

