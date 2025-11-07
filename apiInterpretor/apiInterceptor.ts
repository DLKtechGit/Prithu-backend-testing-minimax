import axios from "axios";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getConfig } from "../config/environment";

import { handleTokenRefresh } from "../webSocket/webScoket";

import { getDeviceDetails } from "../app/utils/getDeviceDetails";
 
// 🌐 Base URL from environment

const { apiUrl: baseURL } = getConfig();
 
// Main Axios instance

const api = axios.create({ baseURL });
 
// Separate instance for refresh requests (no interceptors)

const refreshApi = axios.create({ baseURL });
 
// 🔒 Prevent multiple refreshes at once

let isRefreshing = false;

let refreshSubscribers = [];
 
// Add subscriber (queue requests during token refresh)

const subscribeTokenRefresh = (cb) => {

  refreshSubscribers.push(cb);

};
 
// Notify queued requests once new token is ready

const onRefreshed = (token) => {

  refreshSubscribers.forEach((cb) => cb(token));

  refreshSubscribers = [];

};
 
// 🔑 Request Interceptor — attach Authorization header

api.interceptors.request.use(async (config) => {

  const accessToken = await AsyncStorage.getItem("userToken");

  if (accessToken && config.headers) {

    config.headers.Authorization = `Bearer ${accessToken}`;

  }

  return config;

});
 
// 🔁 Response Interceptor — handle token expiration

api.interceptors.response.use(

  (response) => response,

  async (error) => {

    const originalRequest = error.config;
 
    // ⚠️ Token expired or invalid

    if (error.response?.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true; // prevent infinite loop
 
      if (!isRefreshing) {

        isRefreshing = true;

        console.log("🔄 Starting token refresh process...");
 
        try {

          const refreshToken = await AsyncStorage.getItem("refreshToken");

          const deviceId = await AsyncStorage.getItem("deviceId");
 
          if (!refreshToken || !deviceId) {

            console.log("⚠️ Missing refreshToken or deviceId — cannot refresh.");

            throw new Error("Missing refresh token or deviceId");

          }
 
          // 🔍 Get current device info

          const { os, browser, deviceType } = getDeviceDetails();
 
          // 🔁 Request new access token

          const res = await refreshApi.post("/api/refresh-token", {

            refreshToken,

            deviceId,

            deviceType,

            os,

            browser,

          });
 
          const { accessToken } = res.data;
 
          if (!accessToken) {

            throw new Error("No new access token received.");

          }
 
          console.log("✅ Token refreshed successfully");
 
          // 💾 Store new token

          await AsyncStorage.setItem("userToken", accessToken);
 
          // 🔔 Notify WebSocket (optional)

          try {

            await handleTokenRefresh(accessToken);

            console.log("📡 WebSocket notified of token refresh");

          } catch (wsError) {

            console.warn("⚠️ WebSocket refresh notification failed:", wsError.message);

          }
 
          // ✅ Retry all queued requests

          onRefreshed(accessToken);

          isRefreshing = false;
 
          // Update original request with new token

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          return refreshApi.request(originalRequest);
 
        } catch (refreshError) {

          console.error("❌ Token refresh failed:", refreshError.message);

          isRefreshing = false;
 
          // 🧹 Clear stored data on failure

          await AsyncStorage.multiRemove([

            "userToken",

            "refreshToken",

            "sessionId",

            "deviceId",

            "userId",

          ]);
 
          refreshSubscribers = [];

          return Promise.reject(refreshError);

        }

      }
 
      // 🕐 If refresh is already in progress, wait until it completes

      return new Promise((resolve) => {

        subscribeTokenRefresh((token) => {

          originalRequest.headers.Authorization = `Bearer ${token}`;

          resolve(refreshApi.request(originalRequest));

        });

      });

    }
 
    return Promise.reject(error);

  }

);
 
export default api;

 