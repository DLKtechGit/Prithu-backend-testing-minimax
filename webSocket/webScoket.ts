import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_CONFIG, getWebSocketURL } from "../config/api.config";

interface SocketOptions {
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

interface TokenInfo {
  token: string;
  timestamp: number;
}

let socket: Socket | null = null;
let reconnectAttempts = 0;
let isConnecting = false;
let currentTokenInfo: TokenInfo | null = null;
let tokenRefreshListeners: Array<(newToken: string) => void> = [];

// Token validation and refresh handling
const validateToken = async (token: string): Promise<boolean> => {
  if (!token || typeof token !== 'string') {
    console.error("Invalid token: token is missing or not a string");
    return false;
  }

  // Basic token format validation (adjust regex based on your token format)
  const tokenRegex = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/;
  if (!tokenRegex.test(token)) {
    console.error("Invalid token format");
    return false;
  }

  try {
    // Check token expiry if it's a JWT (optional - depends on your token structure)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && Date.now() / 1000 > payload.exp) {
        console.error("Token has expired");
        return false;
      }
    }
  } catch (error) {
    console.error("Error parsing token:", error);
    // Continue validation even if parsing fails
  }

  return true;
};

const getTokenInfo = async (): Promise<TokenInfo | null> => {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) {
      console.error("No authentication token found in storage");
      return null;
    }

    const isValid = await validateToken(token);
    if (!isValid) {
      console.error("Token validation failed");
      return null;
    }

    return {
      token,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("Error getting token info:", error);
    return null;
  }
};

// Monitor for token changes and trigger refresh handlers
const startTokenMonitoring = () => {
  let lastTokenCheck = Date.now();
  
  const checkTokenChanges = async () => {
    try {
      const currentToken = await AsyncStorage.getItem("userToken");
      if (currentToken && 
          currentToken !== currentTokenInfo?.token && 
          Date.now() - lastTokenCheck > 15000) { // Debounce updates (15 seconds)
        
        console.log("Token change detected, notifying listeners...");
        lastTokenCheck = Date.now();
        
        // Notify all listeners of the token change
        tokenRefreshListeners.forEach(callback => {
          try {
            callback(currentToken);
          } catch (error) {
            console.error("Error in token refresh listener:", error);
          }
        });
      }
    } catch (error) {
      console.error("Error checking for token changes:", error);
    }
  };

  // Check for token changes every 30 seconds (less frequent to avoid conflicts)
  const interval = setInterval(checkTokenChanges, 30000);
  
  // Also check when the app comes back to foreground (if applicable)
  return () => clearInterval(interval);
};

let tokenMonitoringCleanup: (() => void) | null = null;

// Token refresh handler
const handleTokenRefresh = async (newToken: string) => {
  console.log("Handling token refresh for WebSocket...");
  
  // Validate the new token
  const isValid = await validateToken(newToken);
  if (!isValid) {
    console.error("Invalid new token, disconnecting socket");
    disconnectSocket();
    return;
  }

  // Update current token info
  currentTokenInfo = {
    token: newToken,
    timestamp: Date.now()
  };

  // If socket is connected, re-authenticate
  if (socket && socket.connected) {
    console.log("Re-authenticating socket with new token...");
    
    try {
      socket.emit("reauthenticate", { token: newToken });
      
      // Also update the auth for the current socket
      socket.auth = { token: newToken };
      
      console.log("Socket re-authentication initiated");
    } catch (error) {
      console.error("Error re-authenticating socket:", error);
      // Force reconnection if re-authentication fails
      disconnectSocket();
    }
  } else if (socket && !socket.connected) {
    // If socket is not connected, reconnect with new token
    console.log("Reconnecting socket with new token...");
    connectSocket();
  }
};

// Register a token refresh listener
export const registerTokenRefreshListener = (callback: (newToken: string) => void): (() => void) => {
  tokenRefreshListeners.push(callback);
  
  // Return unregister function
  return () => {
    const index = tokenRefreshListeners.indexOf(callback);
    if (index > -1) {
      tokenRefreshListeners.splice(index, 1);
    }
  };
};

// Force re-authentication with current token
export const reauthenticateSocket = async (): Promise<boolean> => {
  console.log("Forcing socket re-authentication...");
  
  try {
    const tokenInfo = await getTokenInfo();
    if (!tokenInfo) {
      console.error("Cannot re-authenticate: no valid token");
      return false;
    }

    // Update current token info
    currentTokenInfo = tokenInfo;

    if (socket && socket.connected) {
      socket.emit("reauthenticate", { token: tokenInfo.token });
      console.log("Socket re-authentication triggered");
      return true;
    } else {
      console.log("Socket not connected, connecting...");
      const newSocket = await connectSocket();
      return newSocket !== null;
    }
  } catch (error) {
    console.error("Error during socket re-authentication:", error);
    return false;
  }
};

// Export token refresh handler for external use
export { handleTokenRefresh };

// Reconnect with new credentials
export const reconnectSocket = async (token?: string, sessionId?: string): Promise<Socket | null> => {
  console.log("Reconnecting socket...");
  
  // Disconnect existing socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  
  // Reset state
  reconnectAttempts = 0;
  isConnecting = false;
  currentTokenInfo = null;
  
  // Connect with new credentials
  return await connectSocket(token, sessionId);
};

export const connectSocket = async (token?: string, sessionId?: string): Promise<Socket | null> => {
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

  // Get and validate token - either from parameters or storage
  let tokenInfo = null;
  let finalToken = token;
  
  if (token && sessionId) {
    // Use provided token and session info
    const isValid = await validateToken(token);
    if (isValid) {
      tokenInfo = {
        token: token,
        timestamp: Date.now()
      };
      finalToken = token;
    } else {
      console.error("Provided token is invalid");
      return null;
    }
  } else {
    // Get token from storage
    tokenInfo = await getTokenInfo();
    if (!tokenInfo) {
      console.error("Cannot connect: no valid authentication token");
      return null;
    }
    finalToken = tokenInfo.token;
  }

  // Update current token info
  currentTokenInfo = tokenInfo;

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
      timeout: 15000, // Increased timeout to 15 seconds
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      upgrade: true,
      rememberUpgrade: true,
      forceNew: false,
    };

    socket = io(wsURL, {
      auth: { 
        token: finalToken,
        ...(sessionId && { sessionId })
      },
      ...socketOptions,
    });

    // Add connection status logging
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket?.id);
      console.log("Connection details:", {
        transport: socket.io.engine?.transport?.name,
        protocol: socket.io.engine?.protocol,
        url: socket.io.engine?.uri
      });
      reconnectAttempts = 0;
      isConnecting = false;

      // Start token monitoring if not already started
      if (!tokenMonitoringCleanup) {
        console.log("Starting token monitoring...");
        tokenMonitoringCleanup = startTokenMonitoring();
      }
    });

    // Handle connection errors with detailed logging
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", {
        message: error.message,
        description: error.description,
        context: error.context,
        attempts: reconnectAttempts,
        type: error.type,
        code: error.code
      });
      
      // Log specific error types for debugging
      if (error.message?.includes('Transport unknown')) {
        console.error('Socket.io transport error - server may not be running or version mismatch');
        console.error('Server URL:', wsURL);
        console.error('Client trying to connect to:', socket?.io?.engine?.uri);
      }
      
      isConnecting = false;
      reconnectAttempts++;

      // Handle authentication errors
      if (error.message?.includes("Authentication") || 
          error.message?.includes("Unauthorized") || 
          error.type === "AuthenticationError" ||
          error.code === "UNAUTHORIZED") {
        console.error("Authentication error detected, attempting token refresh...");
        
        // Force token refresh check
        reauthenticateSocket();
      }

      // Handle server connection errors
      if (error.message?.includes('Transport unknown') || 
          error.code === 'ERR_CONNECTION_REFUSED' ||
          error.code === 'NETWORK_ERROR') {
        console.error('Server connection issue detected - check if server is running');
        console.error('Expected server at:', wsURL);
      }

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

    // Handle authentication status updates from server
    socket.on("auth_status", (data: { status: string; message?: string }) => {
      console.log("Authentication status from server:", data);
      
      if (data.status === "failed" || data.status === "invalid") {
        console.error("Server rejected authentication:", data.message);
        // Trigger re-authentication
        reauthenticateSocket();
      } else if (data.status === "success") {
        console.log("Authentication confirmed by server");
      }
    });

    // Handle token refresh requests from server
    socket.on("token_refresh_request", () => {
      console.log("Server requested token refresh");
      reauthenticateSocket();
    });

    // Set a connection timeout with better error handling
    setTimeout(() => {
      if (isConnecting && socket && !socket.connected) {
        console.error("Socket connection timeout after 15 seconds");
        console.error("Connection details at timeout:", {
          url: wsURL,
          hasToken: !!finalToken,
          reconnectAttempts,
          isConnecting
        });
        
        isConnecting = false;
        
        // Disconnect and clean up
        try {
          socket.disconnect();
          socket = null;
        } catch (cleanupError) {
          console.error("Error during socket cleanup:", cleanupError);
        }
        
        // Log helpful information for debugging
        console.error("\n=== CONNECTION DEBUG INFO ===");
        console.error("Server URL:", wsURL);
        console.error("Token available:", !!finalToken);
        console.error("Network status: Check if server is running at the above URL");
        console.error("Common fixes:");
        console.error("1. Ensure backend server is running on port 5000");
        console.error("2. Check Socket.io version compatibility");
        console.error("3. Verify CORS settings on server");
        console.error("4. Check firewall/network configuration");
        console.error("==============================\n");
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
  
  // Stop token monitoring
  if (tokenMonitoringCleanup) {
    tokenMonitoringCleanup();
    tokenMonitoringCleanup = null;
  }
  
  if (socket) {
    // Remove all listeners before disconnecting
    socket.removeAllListeners();
    
    // Disconnect and clean up
    socket.disconnect();
    socket = null;
    
    reconnectAttempts = 0;
    isConnecting = false;
    currentTokenInfo = null;
    
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

// Check if current token is still valid
export const isTokenValid = async (): Promise<boolean> => {
  try {
    const tokenInfo = await getTokenInfo();
    return tokenInfo !== null;
  } catch (error) {
    console.error("Error checking token validity:", error);
    return false;
  }
};

// Manually trigger token refresh check
export const checkAndRefreshToken = async (): Promise<boolean> => {
  console.log("Manually checking and refreshing token...");
  
  const tokenInfo = await getTokenInfo();
  if (!tokenInfo) {
    console.error("No valid token found for refresh check");
    return false;
  }
  
  // Compare with current token info
  if (currentTokenInfo && currentTokenInfo.token !== tokenInfo.token) {
    console.log("Token has changed, triggering re-authentication");
    return await reauthenticateSocket();
  }
  
  console.log("Token is up to date");
  return true;
};

// Initialize token refresh listener integration with custom event support
export const initializeTokenRefreshIntegration = () => {
  console.log("Initializing WebSocket token refresh integration...");
  
  // Listen for custom token refresh events from apiInterceptor
  const handleTokenRefreshEvent = (event: CustomEvent) => {
    const { newToken } = event.detail;
    console.log("WebSocket: Token refresh event received:", newToken ? "Token present" : "No token");
    if (newToken) {
      handleTokenRefresh(newToken);
    }
  };
  
  // Add custom event listener
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('tokenRefreshed', handleTokenRefreshEvent as EventListener);
  }
  
  // Set up automatic token refresh handling
  const unregister = registerTokenRefreshListener(async (newToken: string) => {
    console.log("WebSocket: Token refresh detected, updating socket...");
    await handleTokenRefresh(newToken);
  });
  
  // Return cleanup function
  return () => {
    unregister();
    if (typeof window !== 'undefined' && window.removeEventListener) {
      window.removeEventListener('tokenRefreshed', handleTokenRefreshEvent as EventListener);
    }
  };
};
