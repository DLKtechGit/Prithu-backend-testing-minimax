import axios, { InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConfig } from "../config/environment";
import { handleTokenRefresh } from "../webSocket/webScoket";

// Get base URL from environment configuration
const config = getConfig();
const baseURL = config.apiUrl;

const api = axios.create({ baseURL });

// Request Interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const accessToken = await AsyncStorage.getItem("userToken");
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config;

    // Only retry once to prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) {
          console.log('No refresh token available');
          throw new Error("No refresh token");
        }

        console.log('Attempting token refresh...');
        
        // Use the same axios instance to ensure consistent behavior
        const res = await api.post<{ accessToken: string }>(
          '/api/refresh-token',
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;
        console.log('Token refreshed successfully');
        
        await AsyncStorage.setItem("userToken", newAccessToken);

        // Update the original request headers
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Notify WebSocket of token refresh
        try {
          await handleTokenRefresh(newAccessToken);
          console.log('WebSocket notified of token refresh');
        } catch (wsError) {
          console.error('Error notifying WebSocket of token refresh:', wsError);
          // Don't fail the request if WebSocket notification fails
        }

        // Retry the original request
        return api(originalRequest);
      } catch (err) {
        console.error('Token refresh failed:', err);
        // Clear tokens and redirect to login
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("refreshToken");
        await AsyncStorage.removeItem("sessionId");
        await AsyncStorage.removeItem("deviceId");
        await AsyncStorage.removeItem("userId");
        
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
