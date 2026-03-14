import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0] || 'localhost';

// 1. FOR LOCAL DEV: Uses your computer's IP (works in Expo Go)
// 2. FOR PRODUCTION/APK: Replace the string below with your ngrok or server URL
const PRODUCTION_URL = 'https://nox-websocket.onrender.com';

export const API_URL = __DEV__ ? `http://${localhost}:5000/api` : `${PRODUCTION_URL}/api`;

export const WS_URL = __DEV__
  ? `ws://${localhost}:5000`
  : `${PRODUCTION_URL.replace('https://', 'wss://')}`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
