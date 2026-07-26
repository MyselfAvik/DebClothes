import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const parsedUser = JSON.parse(storedUserInfo);
          // Verify with backend if token is still valid
          const { data } = await API.get('/api/auth/me');
          // Keep token in the state object
          setUser({ ...data, token: parsedUser.token });
        } catch (err) {
          console.error('Failed to verify token, logging out:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/login', { email, password });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };
  
  const loginWithGoogle = async (googleToken) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/google', { token: googleToken });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/register', {
        name,
        email,
        password
      });
      // Do not setUser immediately: user is not verified yet
      setLoading(false);
      return data; // { requireOtp: true, email }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const verifySignupOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/verify-signup-otp', { email, otp });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP Verification failed');
      setLoading(false);
      throw err;
    }
  };

  const requestLoginOtp = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/login-request-otp', { email });
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request OTP');
      setLoading(false);
      throw err;
    }
  };

  const verifyLoginOtp = async (email, otp) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/login-verify-otp', { email, otp });
      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP Login Verification failed');
      setLoading(false);
      throw err;
    }
  };

  const resendOtp = async (email, purpose) => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/resend-otp', { email, purpose });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      throw err;
    }
  };

  const addAddress = async (addressData) => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/addresses', addressData);
      // Data returns updated user document, merge token from current state user
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add address');
      throw err;
    }
  };

  const deleteAddress = async (addressId) => {
    setError(null);
    try {
      const { data } = await API.delete(`/api/auth/addresses/${addressId}`);
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address');
      throw err;
    }
  };

  const requestChangePasswordOtp = async () => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/change-password-request-otp');
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset OTP');
      throw err;
    }
  };

  const verifyChangePasswordOtp = async (otp, newPassword) => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/change-password-verify-otp', { otp, newPassword });
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Password update failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        loginWithGoogle,
        register,
        verifySignupOtp,
        requestLoginOtp,
        verifyLoginOtp,
        resendOtp,
        addAddress,
        deleteAddress,
        requestChangePasswordOtp,
        verifyChangePasswordOtp,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
