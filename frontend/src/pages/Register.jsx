import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User as UserIcon, Mail, Lock, UserPlus, AlertCircle, Key, ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../api/axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const { register, loginWithGoogle, verifySignupOtp, resendOtp, error, user, clearError } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
    return () => clearError();
  }, [user, navigate, clearError]);

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
    if (!googleClientId || showOtp) return;

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
            text: 'signup_with',
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
  }, [googleClientId, showOtp, loginWithGoogle]);

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

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name || !email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      const data = await register(name, email, password);
      if (data && data.requireOtp) {
        setShowOtp(true);
        setOtpSentMessage(data.message || 'OTP verification code sent to your email.');
      }
    } catch (err) {
      // Handled by context error
    }
  };

  const handleSubmitOtp = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!otp || otp.length !== 6) {
      setFormError('Please enter a valid 6-digit OTP code');
      return;
    }

    try {
      await verifySignupOtp(email, otp);
    } catch (err) {
      // Handled by context error
    }
  };

  const handleResend = async () => {
    setFormError('');
    setResendLoading(true);
    try {
      const data = await resendOtp(email, 'Signup Verification');
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
        
        {!showOtp ? (
          <>
            {/* Step 1: Signup Details */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create Account</h2>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">Join DebClothes to start shopping</p>
            </div>

            {(error || formError) && (
              <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-500/10 p-4 text-sm text-red-405 border border-red-500/20">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSignup} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-305">
                  Full Name
                </label>
                <div className="relative mt-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500">
                    <UserIcon className="h-5 w-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a]/50 py-3 pl-10 pr-4 text-slate-900 dark:text-slate-200 placeholder-slate-405 dark:placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

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
                    placeholder="At least 6 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
              >
                <UserPlus className="h-5 w-5" />
                <span>Create Account</span>
              </button>
            </form>

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
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-500 hover:underline">
                Login
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Step 2: OTP verification */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Verify Email</h2>
              <p className="mt-2 text-sm text-slate-550 dark:text-slate-400">
                Enter the 6-digit verification code sent to <br />
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

            <form onSubmit={handleSubmitOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-555 dark:text-slate-305 text-center">
                  Verification Code (OTP)
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
                <span>Verify & Activate</span>
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
                  setShowOtp(false);
                  setOtp('');
                  clearError();
                }}
                className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to signup</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Register;
