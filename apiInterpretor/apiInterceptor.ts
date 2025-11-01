import axios, { InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getConfig } from "../config/environment";

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await axios.post<{ accessToken: string }>(
          `${baseURL}/api/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = res.data.accessToken;
        await AsyncStorage.setItem("userToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest); // retry with updated token
      } catch (err) {
        // optional: clear tokens and redirect to login
        await AsyncStorage.removeItem("userToken");
        await AsyncStorage.removeItem("refreshToken");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
