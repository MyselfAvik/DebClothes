import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, Key, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Login Method Toggle State: 'password' | 'otp'
  const [loginMethod, setLoginMethod] = useState('password');

  // OTP Verification States
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [otpPurpose, setOtpPurpose] = useState('Login Authentication'); // 'Login Authentication' | 'Signup Verification'
  const [resendLoading, setResendLoading] = useState(false);

  const {
    login,
    loginWithGoogle,
    verifySignupOtp,
    requestLoginOtp,
    verifyLoginOtp,
    resendOtp,
    error,
    user,
    clearError,
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  const redirect = location.state?.from?.pathname || '/';

  const [googleClientId, setGoogleClientId] = useState('');

  // Fetch Google Client ID on mount
  useEffect(() => {
    const fetchGoogleClientId = async () => {
      try {
        const { data } = await API.get('/api/config/google-client-id');
        setGoogleClientId(data.clientId);
      } catch (err) {
        console.error('Failed to fetch Google Client ID:', err);
      }
    };
    fetchGoogleClientId();
  }, []);

  // Initialize Google Sign-In Button
  useEffect(() => {
    if (!googleClientId || showOtpVerification) return;

    const handleGoogleLoginSuccess = async (response) => {
      setFormError('');
      try {
        await loginWithGoogle(response.credential);
        toast.success('Successfully logged in with Google!');
      } catch (err) {
        // Error is set in AuthContext and shown in formError / error toast
      }
    };

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleLoginSuccess,
        });

        const btnElement = document.getElementById('googleSignInBtn');
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: btnElement.offsetWidth || 384,
          });
        }
      }
    };

    if (window.google) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [googleClientId, showOtpVerification, loginWithGoogle]);

  useEffect(() => {
    if (user) {
      navigate(redirect, { replace: true });
    }
    return () => clearError();
  }, [user, navigate, redirect, clearError]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (formError) {
      toast.error(formError);
    }
  }, [formError]);

  useEffect(() => {
    if (otpSentMessage) {
      toast.success(otpSentMessage);
    }
  }, [otpSentMessage]);

  // Handle standard Password Login submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter email and password');
      return;
    }
    try {
      await login(email, password);
    } catch (err) {
      // Check if user is unverified and requires OTP verification
      if (err.response?.status === 403 && err.response?.data?.requireOtpVerification) {
        setOtpPurpose('Signup Verification');
        setOtpSentMessage(err.response.data.message || 'OTP sent to complete account verification.');
        setShowOtpVerification(true);
        clearError();
      }
    }
  };

  // Handle requesting passwordless OTP code
  const handleOtpRequestSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email) {
      setFormError('Please enter email address');
      return;
    }
    try {
      const data = await requestLoginOtp(email);
      setOtpPurpose('Login Authentication');
      setOtpSentMessage(data.message || 'OTP verification code sent to your email.');
      setShowOtpVerification(true);
    } catch (err) {
      // Handled by context error
    }
  };

  // Handle OTP submission (verifying code)
  const handleOtpVerificationSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!otp || otp.length !== 6) {
      setFormError('Please enter a valid 6-digit OTP code');
      return;
    }

    try {
      if (otpPurpose === 'Signup Verification') {
        // Complete signup flow
        await verifySignupOtp(email, otp);
      } else {
        // Complete passwordless login flow
        await verifyLoginOtp(email, otp);
      }
    } catch (err) {
      // Handled by context error
    }
  };

  // Handle resend OTP code request
  const handleResend = async () => {
    setFormError('');
    setResendLoading(true);
    try {
      const data = await resendOtp(email, otpPurpose);
      setOtpSentMessage(data.message || 'New OTP verification code sent successfully.');
      setResendLoading(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to resend OTP');
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 shadow-2xl">
        
        {!showOtpVerification ? (
          <>
            {/* Step 1: Login method forms */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Welcome Back</h2>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">Sign in to your DebClothes account</p>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('password');
                  clearError();
                  setFormError('');
                }}
                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                  loginMethod === 'password'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('otp');
                  clearError();
                  setFormError('');
                }}
                className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all ${
                  loginMethod === 'otp'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-500'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                OTP Login
              </button>
            </div>

            {(error || formError) && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-405 border border-red-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError || error}</span>
              </div>
            )}

            {loginMethod === 'password' ? (
              /* Password login form */
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-305">
                    Email Address
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 placeholder-slate-405 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-305">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 placeholder-slate-405 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </button>
              </form>
            ) : (
              /* OTP passwordless login request form */
              <form onSubmit={handleOtpRequestSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-305">
                    Email Address
                  </label>
                  <div className="relative mt-2">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 placeholder-slate-405 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>Request Login OTP</span>
                </button>
              </form>
            )}

            {/* Divider and Google Sign-In */}
            {googleClientId && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-[#141b2d] px-2 text-slate-500 dark:text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="flex justify-center w-full min-h-[44px]">
                  <div id="googleSignInBtn" className="w-full max-w-[384px]"></div>
                </div>
              </>
            )}

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 dark:text-blue-500 hover:underline">
                Sign Up
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Step 2: OTP verification code enter view */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Verify OTP</h2>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">
                Please enter the 6-digit code sent to <br />
                <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
              </p>
            </div>

            {otpSentMessage && (
              <div className="mb-6 rounded-lg bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {otpSentMessage}
              </div>
            )}

            {(error || formError) && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-405 border border-red-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError || error}</span>
              </div>
            )}

            <form onSubmit={handleOtpVerificationSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-305 text-center">
                  OTP Code
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <Key className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full text-center tracking-[10px] text-lg font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 placeholder-slate-405 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <span>Verify & Login</span>
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4 text-sm">
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-500 hover:underline disabled:opacity-50"
              >
                {resendLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Resend Code</span>
              </button>

              <button
                onClick={() => {
                  setShowOtpVerification(false);
                  setOtp('');
                  clearError();
                }}
                className="flex items-center gap-1.5 text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to login options</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Login;
