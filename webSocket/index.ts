// WebSocket and Heartbeat Services
// Unified exports for easy importing

// WebSocket exports
export {
  connectSocket,
  disconnectSocket,
  getSocketStatus,
  isSocketConnected,
  emitEvent,
} from "./webScoket";

// Heartbeat exports
export {
  startHeartbeat,
  stopHeartbeat,
  getHeartbeatStatus,
  isHeartbeatActive,
  testHeartbeatConnection,
  initializeHeartbeat,
} from "./heartBeat";

// Configuration exports
export {
  API_CONFIG,
  getWebSocketURL,
  getAPIEndpoint,
  validateConfig,
} from "../config/api.config";

// Service initialization helper
export const initializeServices = async () => {
  console.log("Initializing WebSocket and Heartbeat services...");
  
  try {
    // Validate configuration
    const configValid = validateConfig();
    if (!configValid) {
      throw new Error("Invalid API configuration");
    }

    console.log("Services initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize services:", error);
    return false;
  }
};

// Cleanup helper
export const cleanupServices = async () => {
  console.log("Cleaning up WebSocket and Heartbeat services...");
  
  disconnectSocket();
  await stopHeartbeat();
  
  console.log("Services cleaned up successfully");
};