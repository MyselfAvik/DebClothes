import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const storedUserInfo = await AsyncStorage.getItem('userInfo');
        if (storedUserInfo) {
          const parsedUser = JSON.parse(storedUserInfo);
          // Verify with backend if token is still valid
          const { data } = await API.get('/api/auth/me');
          // Keep token in the state object
          setUser({ ...data, token: parsedUser.token });
        }
      } catch (err) {
        console.error('Failed to verify token, logging out:', err);
        await logout();
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/login', { email, password });
      setUser(data);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      setLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async (mockToken) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post('/api/auth/google', { token: mockToken });
      setUser(data);
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Sign-In failed';
      setError(msg);
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
        password,
      });
      setLoading(false);
      return data; // { requireOtp: true, email }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
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
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP Verification failed';
      setError(msg);
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
      const msg = err.response?.data?.message || 'Failed to request OTP';
      setError(msg);
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
      await AsyncStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP Login Verification failed';
      setError(msg);
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
      const msg = err.response?.data?.message || 'Failed to resend OTP';
      setError(msg);
      throw err;
    }
  };

  const addAddress = async (addressData) => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/addresses', addressData);
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add address';
      setError(msg);
      throw err;
    }
  };

  const updateAddress = async (addressId, addressData) => {
    setError(null);
    try {
      const { data } = await API.put(`/api/auth/addresses/${addressId}`, addressData);
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update address';
      setError(msg);
      throw err;
    }
  };

  const deleteAddress = async (addressId) => {
    setError(null);
    try {
      const { data } = await API.delete(`/api/auth/addresses/${addressId}`);
      const updatedUser = { ...data, token: user.token };
      setUser(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete address';
      setError(msg);
      throw err;
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setError(null);
    try {
      const { data } = await API.put('/api/auth/change-password', { currentPassword, newPassword });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Password update failed';
      setError(msg);
      throw err;
    }
  };

  const requestChangePasswordOtp = async () => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/change-password-request-otp');
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to request password reset OTP';
      setError(msg);
      throw err;
    }
  };

  const verifyChangePasswordOtp = async (otp, newPassword) => {
    setError(null);
    try {
      const { data } = await API.post('/api/auth/change-password-verify-otp', { otp, newPassword });
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Password update failed';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('userInfo');
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
        updateAddress,
        deleteAddress,
        changePassword,
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
