import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxiosError } from "axios";
import api from "../apiInterpretor/apiInterceptor";
import { API_CONFIG } from "../config/api.config";

interface HeartbeatResponse {
  success: boolean;
  message?: string;
}

let heartbeatInterval: NodeJS.Timeout | null = null;
let isHeartbeatRunning = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

export const startHeartbeat = async (customInterval?: number) => {
  console.log("Starting heartbeat service...");
  
  // Prevent multiple heartbeat services
  if (isHeartbeatRunning) {
    console.log("Heartbeat already running");
    return;
  }

  isHeartbeatRunning = true;
  consecutiveFailures = 0;

  // Clear any existing interval
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  const sendHeartbeat = async () => {
    try {
      const sessionId = await AsyncStorage.getItem("sessionId");

      if (!sessionId) {
        console.warn("Missing session ID");
        return;
      }

      console.log("Sending heartbeat...", { sessionId });

      const response = await api.post<HeartbeatResponse>(
        '/api/heartbeat',
        { sessionId },
        {
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.success) {
        console.log("Heartbeat sent successfully");
        consecutiveFailures = 0; // Reset failure count on success
        
        // Clear any existing failure timeout
        if (heartbeatInterval) {
          clearTimeout(heartbeatInterval as any);
        }
      } else {
        throw new Error(response.data.message || "Heartbeat failed");
      }

    } catch (error: any) {
      console.error("Heartbeat error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        consecutiveFailures,
      });

      consecutiveFailures++;

      // Handle different types of errors
      if (error.response?.status === 401) {
        console.error("Authentication failed - stopping heartbeat");
        await stopHeartbeat();
        return;
      }

      if (error.code === "ECONNABORTED" || error.code === "NETWORK_ERROR") {
        console.error("Network error during heartbeat");
      }

      // Stop heartbeat after too many consecutive failures
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error("Too many consecutive heartbeat failures - stopping service");
        await stopHeartbeat();
        
        // Attempt to restart after a delay
        setTimeout(() => {
          if (!isHeartbeatRunning) {
            console.log("Attempting to restart heartbeat service...");
            startHeartbeat(customInterval);
          }
        }, API_CONFIG.reconnectDelay * 2);
      }
    }
  };

  // Send initial heartbeat
  await sendHeartbeat();

  // Set up recurring heartbeat
  const interval = customInterval || API_CONFIG.heartbeatInterval;
  
  heartbeatInterval = setInterval(sendHeartbeat, interval);
  
  console.log("Heartbeat service started with interval:", interval, "ms");
};

export const stopHeartbeat = async () => {
  console.log("Stopping heartbeat service...");
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  
  isHeartbeatRunning = false;
  consecutiveFailures = 0;
  
  console.log("Heartbeat service stopped");
};

// Utility functions
export const getHeartbeatStatus = () => {
  return {
    isRunning: isHeartbeatRunning,
    consecutiveFailures,
    maxFailures: MAX_CONSECUTIVE_FAILURES,
    interval: heartbeatInterval ? API_CONFIG.heartbeatInterval : null,
  };
};

export const isHeartbeatActive = (): boolean => {
  return isHeartbeatRunning;
};

export const testHeartbeatConnection = async (): Promise<boolean> => {
  try {
    const sessionId = await AsyncStorage.getItem("sessionId");

    if (!sessionId) {
      console.error("Missing session ID for heartbeat test");
      return false;
    }
    
    await api.post(
      '/api/heartbeat',
      { sessionId },
      {
        timeout: 5000, // 5 second timeout for test
      }
    );

    console.log("Heartbeat connection test successful");
    return true;
  } catch (error) {
    console.error("Heartbeat connection test failed:", error);
    return false;
  }
};

// Initialize heartbeat on app start (if needed)
export const initializeHeartbeat = () => {
  console.log("Initializing heartbeat system...");
  // You can call startHeartbeat() here if you want automatic startup
  // startHeartbeat();
};
