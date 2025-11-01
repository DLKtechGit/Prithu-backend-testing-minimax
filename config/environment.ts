import Constants from 'expo-constants';

// Environment type definition
export type Environment = 'development' | 'staging' | 'production';

// Configuration interface
export interface AppConfig {
  // API Configuration
  apiUrl: string;
  wsUrl: string;
  timeout: number;
  
  // Feature Flags
  enableNotifications: boolean;
  enableWebSocket: boolean;
  enableAnalytics: boolean;
  debugMode: boolean;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  
  // Assets
  companyLogoUrl: string;
  defaultImageUrl: string;
  
  // External Services
  fcmProjectId: string;
  sentryDsn?: string;
  googleMapsApiKey?: string;
  
  // App Metadata
  environment: Environment;
  version: string;
}

// Environment detection
const getEnvironment = (): Environment => {
  const env = Constants.expoConfig?.extra?.environment || 
              process.env.EXPO_PUBLIC_ENVIRONMENT || 
              'development';
  
  switch (env) {
    case 'production':
      return 'production';
    case 'staging':
      return 'staging';
    default:
      return 'development';
  }
};

// Base configuration with environment fallbacks
const getBaseConfig = (): Partial<AppConfig> => {
  const env = getEnvironment();
  
  // Default values that can be overridden by environment variables
  const defaults: Partial<AppConfig> = {
    // API Configuration
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 
            (Constants.expoConfig?.extra?.apiUrl as string) ||
            'http://192.168.1.10:5000',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || 
           (Constants.expoConfig?.extra?.wsUrl as string) ||
           'http://192.168.1.10:5000',
    timeout: 15000,
    
    // Feature Flags
    enableNotifications: process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS !== 'false',
    enableWebSocket: process.env.EXPO_PUBLIC_ENABLE_WEBSOCKET !== 'false',
    enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
    debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' ||
               (Constants.expoConfig?.extra?.debugMode as boolean) ||
               env === 'development',
    
    // Logging
    logLevel: (process.env.EXPO_PUBLIC_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') ||
              (env === 'production' ? 'error' : 'debug'),
    
    // Assets
    companyLogoUrl: process.env.EXPO_PUBLIC_COMPANY_LOGO_URL || 
                    'https://via.placeholder.com/150x150/007BFF/ffffff?text=Logo',
    defaultImageUrl: process.env.EXPO_PUBLIC_DEFAULT_IMAGE_URL || 
                     'https://via.placeholder.com/400x600/F0F0F0/333333?text=Image',
    
    // External Services
    fcmProjectId: process.env.EXPO_PUBLIC_FCM_PROJECT_ID || 'meetflow-default',
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    
    // Environment
    environment: env,
    version: Constants.expoConfig?.version || '1.0.0',
  };

  // Environment-specific overrides
  const envOverrides: Partial<AppConfig> = {};
  
  switch (env) {
    case 'production':
      return { ...defaults, ...envOverrides };
    case 'staging':
      return { ...defaults, ...envOverrides };
    default:
      return { ...defaults, ...envOverrides };
  }
};

// Singleton configuration instance
let appConfig: AppConfig | null = null;

// Configuration initialization
const initConfig = (): AppConfig => {
  if (appConfig) return appConfig;
  
  const baseConfig = getBaseConfig();
  
  // Validate required configuration
  if (!baseConfig.apiUrl) {
    throw new Error('API URL is required but not configured');
  }
  
  if (!baseConfig.wsUrl) {
    throw new Error('WebSocket URL is required but not configured');
  }
  
  // Validate URLs
  try {
    new URL(baseConfig.apiUrl);
    new URL(baseConfig.wsUrl);
  } catch (error) {
    console.error('Invalid configuration URLs:', error);
    throw new Error('Invalid API or WebSocket URL configuration');
  }
  
  appConfig = baseConfig as AppConfig;
  
  // Log configuration in development
  if (appConfig.debugMode) {
    console.log('App Configuration:', {
      environment: appConfig.environment,
      apiUrl: appConfig.apiUrl,
      wsUrl: appConfig.wsUrl,
      features: {
        notifications: appConfig.enableNotifications,
        websocket: appConfig.enableWebSocket,
        analytics: appConfig.enableAnalytics,
      },
    });
  }
  
  return appConfig;
};

// Public configuration getter
export const getConfig = (): AppConfig => {
  return initConfig();
};

// Configuration utilities
export const configHelpers = {
  // Get API endpoint with path
  getAPIEndpoint: (path: string): string => {
    const config = getConfig();
    const base = config.apiUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    return `${base}${normalizedPath}`;
  },
  
  // Get WebSocket URL with path
  getWebSocketURL: (path: string = ''): string => {
    const config = getConfig();
    const base = config.wsUrl.replace(/\/$/, '');
    return path ? `${base}${path.startsWith('/') ? path : '/' + path}` : base;
  },
  
  // Check if feature is enabled
  isFeatureEnabled: (feature: keyof Pick<AppConfig, 'enableNotifications' | 'enableWebSocket' | 'enableAnalytics'>): boolean => {
    const config = getConfig();
    return config[feature] === true;
  },
  
  // Get environment-specific setting
  getEnvironmentSetting: <T>(key: keyof AppConfig, fallback: T): T => {
    const config = getConfig();
    return (config[key] as T) || fallback;
  },
  
  // Validate current configuration
  validateConfig: (): boolean => {
    try {
      const config = getConfig();
      
      // Check required URLs
      if (!config.apiUrl || !config.wsUrl) {
        console.error('Missing required API URLs');
        return false;
      }
      
      // Validate URLs
      new URL(config.apiUrl);
      new URL(config.wsUrl);
      
      // Check for debug mode in production
      if (config.environment === 'production' && config.debugMode) {
        console.warn('Debug mode is enabled in production environment');
      }
      
      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }
};

// Initialize configuration
initConfig();