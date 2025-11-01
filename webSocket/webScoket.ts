import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, getWebSocketURL } from "../../config/api.config";

interface SocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

let socket: Socket | null = null;
let reconnectAttempts = 0;
let isConnecting = false;

export const connectSocket = async (): Promise<Socket | null> => {
  console.log("WebSocket connection attempt", { attempts: reconnectAttempts });

  // Prevent duplicate connections
  if (socket && socket.connected) {
    console.log("Socket already connected:", socket?.id);
    return socket;
  }

  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    console.log("Connection already in progress");
    return null;
  }

  const token = await AsyncStorage.getItem("userToken");
  if (!token) {
    console.error("No authentication token found");
    return null;
  }

  // Validate configuration
  const wsURL = getWebSocketURL();
  if (!wsURL) {
    console.error("Invalid WebSocket URL configuration");
    return null;
  }

  isConnecting = true;

  try {
    const socketOptions: SocketOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: API_CONFIG.maxReconnectAttempts,
      reconnectionDelay: API_CONFIG.reconnectDelay,
      timeout: 10000, // 10 second timeout
    };

    socket = io(wsURL, {
      auth: { token },
      ...socketOptions,
    });

    // Connection successful
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket?.id);
      reconnectAttempts = 0;
      isConnecting = false;
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", {
        message: error.message,
        description: error.description,
        context: error.context,
        attempts: reconnectAttempts,
      });
      
      isConnecting = false;
      reconnectAttempts++;

      // Clean up socket on connection failure
      if (reconnectAttempts >= API_CONFIG.maxReconnectAttempts) {
        console.error("Max reconnection attempts reached");
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      }
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      isConnecting = false;
      
      // Attempt reconnection for unexpected disconnections
      if (reason === "io server disconnect") {
        // Server initiated disconnect - don't reconnect automatically
        console.log("Server initiated disconnect - not attempting reconnect");
      } else {
        // Client-side disconnect or network issue - attempt reconnection
        console.log("Attempting to reconnect...");
        reconnectAttempts = 0; // Reset attempts for new connection cycle
      }
    });

    // Handle successful reconnection
    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected successfully after", attemptNumber, "attempts");
      reconnectAttempts = 0;
      isConnecting = false;
    });

    // Handle reconnection attempts
    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("Socket reconnection attempt:", attemptNumber);
      reconnectAttempts = attemptNumber;
    });

    // Handle reconnection failure
    socket.on("reconnect_failed", () => {
      console.error("Socket reconnection failed after maximum attempts");
      isConnecting = false;
    });

    // User status events
    socket.on("userOnline", (data: { userId: string }) => {
      console.log("User online:", data.userId);
    });

    socket.on("userOffline", (data: { userId: string }) => {
      console.log("User offline:", data.userId);
    });

    // Set a connection timeout
    setTimeout(() => {
      if (isConnecting && socket && !socket.connected) {
        console.error("Socket connection timeout");
        isConnecting = false;
        socket.disconnect();
        socket = null;
      }
    }, 15000);

    return socket;

  } catch (error) {
    console.error("Socket initialization error:", error);
    isConnecting = false;
    return null;
  }
};

export const disconnectSocket = () => {
  console.log("Disconnecting socket...");
  
  if (socket) {
    // Remove all listeners before disconnecting
    socket.removeAllListeners();
    
    // Disconnect and clean up
    socket.disconnect();
    socket = null;
    
    reconnectAttempts = 0;
    isConnecting = false;
    
    console.log("Socket disconnected successfully");
  }
};

// Utility functions
export const getSocketStatus = () => {
  return {
    connected: socket?.connected || false,
    id: socket?.id || null,
    reconnectAttempts,
    isConnecting,
  };
};

export const isSocketConnected = (): boolean => {
  return socket?.connected || false;
};

export const emitEvent = (event: string, data?: any): boolean => {
  if (socket && socket.connected) {
    socket.emit(event, data);
    return true;
  } else {
    console.warn("Cannot emit event - socket not connected");
    return false;
  }
};
