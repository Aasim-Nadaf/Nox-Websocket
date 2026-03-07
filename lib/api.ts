import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

export const API_URL =
  Platform.OS === 'android' ? 'http://192.168.1.235:5000/api' : 'http://192.168.1.235:5000/api';
// If testing on a real device, change this to your computer's local network IP

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
