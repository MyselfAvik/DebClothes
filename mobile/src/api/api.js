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

export default API;
export { getBaseURL };
