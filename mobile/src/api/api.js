import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS simulator/Web.
// In production, replace with your production server URL.
const getBaseURL = () => {
  // Use local Wi-Fi IP of the host machine so physical devices can connect
  return "https://debclothes-backend.onrender.com";
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Request interceptor to automatically add token and handle FormData multipart boundaries
API.interceptors.request.use(
  async (config) => {
    try {
      const storedUserInfo = await AsyncStorage.getItem('userInfo');
      if (storedUserInfo) {
        const userInfo = JSON.parse(storedUserInfo);
        if (userInfo && userInfo.token) {
          config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
      }
    } catch (error) {
      console.error('Error fetching token from AsyncStorage', error);
    }

    // Auto-detect FormData and remove Content-Type so React Native / Axios sets boundary correctly
    if (config.data instanceof FormData || (config.data && typeof config.data.getParts === 'function')) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Rock-solid multipart file upload for React Native standalone APKs and Expo Go.
 * Uses native fetch() to ensure binary stream and boundary headers are generated perfectly.
 */
export const uploadMultipartAsync = async (endpoint, formData, method = 'POST') => {
  const baseURL = getBaseURL();
  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
  let token = null;
  try {
    const storedUserInfo = await AsyncStorage.getItem('userInfo');
    if (storedUserInfo) {
      const userInfo = JSON.parse(storedUserInfo);
      if (userInfo && userInfo.token) {
        token = userInfo.token;
      }
    }
  } catch (e) {
    console.error('Error fetching token for multipart upload:', e);
  }

  const headers = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || `Upload failed with status ${response.status}`);
    error.response = { data, status: response.status };
    throw error;
  }

  return { data };
};

export default API;
export { getBaseURL };
