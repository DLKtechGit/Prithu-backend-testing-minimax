import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConfig } from "../config/environment";
import { getDeviceDetails } from "../app/utils/getDeviceDetails";

const { apiUrl: baseURL } = getConfig();

// Main Axios
const api = axios.create({ baseURL });

// Separate axios for refresh calls (no interceptors)
const refreshApi = axios.create({ baseURL });

// Track refresh state
let isRefreshing = false;
let refreshSubscribers = [];

// Queue requests during refresh
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

// Release queued requests
const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const accessToken = await AsyncStorage.getItem("userToken");
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        console.log("🔄 Refreshing token...");

        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          const deviceId = await AsyncStorage.getItem("deviceId");

          if (!refreshToken || !deviceId) {
            throw new Error("Missing refresh token or deviceId");
          }

          // ✅ FIX — properly await device details
          const { os, browser, deviceType } = await getDeviceDetails();

          const res = await refreshApi.post("/api/refresh-token", {
            refreshToken,
            deviceId,
            os,
            browser,
            deviceType,
          });

          const { accessToken, sessionId, userId } = res.data;

          if (!accessToken) throw new Error("Refresh did not return access token");

          // Store new tokens
          await AsyncStorage.setItem("userToken", accessToken);
          if (sessionId) await AsyncStorage.setItem("sessionId", sessionId);
          if (userId) await AsyncStorage.setItem("userId", userId);

          console.log("✅ Token refreshed");

          onRefreshed(accessToken);
          isRefreshing = false;

          // Retry failed request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);

        } catch (refreshErr) {
          console.log("❌ Token refresh failed:", refreshErr.message);
          isRefreshing = false;

          // Clear storage (force logout)
          await AsyncStorage.multiRemove([
            "userToken",
            "refreshToken",
            "sessionId",
            "deviceId",
            "userId",
          ]);

          return Promise.reject(refreshErr);
        }
      }

      // If refresh already in progress → wait for new token
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          } else {
            reject(new Error("Token refresh failed"));
          }
        });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
