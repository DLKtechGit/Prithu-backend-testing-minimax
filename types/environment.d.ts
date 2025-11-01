// Type definitions for Expo Constants extra fields
declare module 'expo-constants' {
  interface Constants {
    expoConfig?: {
      extra?: {
        apiUrl?: string;
        wsUrl?: string;
        enableNotifications?: boolean;
        enableWebSocket?: boolean;
        debugMode?: boolean;
        environment?: string;
      };
    };
  }
}

// Extend process.env for Expo environment variables
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_API_URL?: string;
      EXPO_PUBLIC_WS_URL?: string;
      EXPO_PUBLIC_ENABLE_NOTIFICATIONS?: string;
      EXPO_PUBLIC_ENABLE_WEBSOCKET?: string;
      EXPO_PUBLIC_ENABLE_ANALYTICS?: string;
      EXPO_PUBLIC_DEBUG_MODE?: string;
      EXPO_PUBLIC_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
      EXPO_PUBLIC_COMPANY_LOGO_URL?: string;
      EXPO_PUBLIC_DEFAULT_IMAGE_URL?: string;
      EXPO_PUBLIC_FCM_PROJECT_ID?: string;
      EXPO_PUBLIC_SENTRY_DSN?: string;
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
      EXPO_PUBLIC_ENVIRONMENT?: 'development' | 'staging' | 'production';
      EXPO_PUBLIC_HEARTBEAT_INTERVAL?: string;
      EXPO_PUBLIC_MAX_RECONNECT?: string;
      EXPO_PUBLIC_RECONNECT_DELAY?: string;
    }
  }
}