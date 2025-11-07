// API Configuration for WebSocket and HTTP endpoints
import { getConfig, configHelpers } from './environment';

export interface APIConfig {
  baseURL: string;
  wsURL: string;
  heartbeatInterval: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
}

// Get API configuration from environment
const getAPIConfig = (): APIConfig => {
  const config = getConfig();
  
  return {
    baseURL: config.apiUrl,
    wsURL: config.wsUrl,
    heartbeatInterval: 45000, // 45 seconds (less frequent)
    maxReconnectAttempts: 5,
    reconnectDelay: 5000, // 5 seconds (more conservative)
  };
};

export const API_CONFIG: APIConfig = getAPIConfig();

// Helper functions for URL construction
export const getWebSocketURL = (path: string = ""): string => {
  return configHelpers.getWebSocketURL(path);
};

export const getAPIEndpoint = (path: string): string => {
  return configHelpers.getAPIEndpoint(path);
};

// Environment validation
export const validateConfig = (): boolean => {
  return configHelpers.validateConfig();
};

// Initialize configuration validation
validateConfig();