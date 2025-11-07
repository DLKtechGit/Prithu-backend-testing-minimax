import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectSocket, disconnectSocket, getSocketStatus } from '../webSocket/webScoket';
import { startHeartbeat, stopHeartbeat, isHeartbeatActive } from '../webSocket/heartBeat';
import { startConnectionMonitoring, stopConnectionMonitoring } from './connectionMonitoring';

interface AppInitializationResult {
  success: boolean;
  isAuthenticated: boolean;
  socketConnected: boolean;
  heartbeatActive: boolean;
  error?: string;
}

let isInitializing = false;
let initializationPromise: Promise<AppInitializationResult> | null = null;

export const initializeApp = async (): Promise<AppInitializationResult> => {
  // Prevent multiple simultaneous initializations
  if (isInitializing && initializationPromise) {
    console.log('App initialization already in progress, waiting...');
    return initializationPromise;
  }

  isInitializing = true;
  console.log('Starting app initialization...');

  initializationPromise = performInitialization();
  
  try {
    const result = await initializationPromise;
    return result;
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
};

const performInitialization = async (): Promise<AppInitializationResult> => {
  try {
    console.log('🔍 Checking authentication status...');
    
    // Check for existing authentication
    const userToken = await AsyncStorage.getItem('userToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const sessionId = await AsyncStorage.getItem('sessionId');
    
    if (!userToken || !refreshToken || !sessionId) {
      console.log('No valid authentication found, skipping initialization');
      return {
        success: true,
        isAuthenticated: false,
        socketConnected: false,
        heartbeatActive: false
      };
    }

    console.log('✅ Valid authentication found, initializing services...');

    // Initialize WebSocket connection
    console.log('📡 Connecting WebSocket...');
    const socket = await connectSocket(userToken, sessionId);
    
    if (!socket) {
      console.warn('⚠️ WebSocket connection failed');
      return {
        success: false,
        isAuthenticated: true,
        socketConnected: false,
        heartbeatActive: false,
        error: 'Failed to connect WebSocket'
      };
    }

    console.log('✅ WebSocket connected successfully');

    // Start heartbeat service
    console.log('❤️ Starting heartbeat service...');
    try {
      if (typeof startHeartbeat === 'function') {
        await startHeartbeat();
        console.log('✅ Heartbeat service started');
      } else {
        console.log('ℹ️ Heartbeat service not available');
      }
    } catch (heartbeatError) {
      console.warn('⚠️ Heartbeat service failed to start:', heartbeatError);
      // Don't fail the entire initialization for heartbeat issues
    }

    // Start connection monitoring
    console.log('📊 Starting connection monitoring...');
    try {
      startConnectionMonitoring();
      console.log('✅ Connection monitoring started');
    } catch (monitoringError) {
      console.warn('⚠️ Connection monitoring failed to start:', monitoringError);
      // Don't fail the entire initialization for monitoring issues
    }

    // Wait a moment for connections to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify final status
    const socketStatus = getSocketStatus();
    const heartbeatStatus = isHeartbeatActive();

    console.log('Initialization complete:', {
      socketConnected: socketStatus.connected,
      heartbeatActive: heartbeatStatus,
      socketId: socketStatus.id
    });

    return {
      success: true,
      isAuthenticated: true,
      socketConnected: socketStatus.connected,
      heartbeatActive: heartbeatStatus
    };

  } catch (error: any) {
    console.error('❌ App initialization failed:', error);
    
    // Clean up on failure
    try {
      disconnectSocket();
      if (typeof stopHeartbeat === 'function') {
        await stopHeartbeat();
      }
      stopConnectionMonitoring();
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup after initialization failure failed:', cleanupError);
    }

    return {
      success: false,
      isAuthenticated: false,
      socketConnected: false,
      heartbeatActive: false,
      error: error.message || 'Unknown initialization error'
    };
  }
};

export const cleanupApp = async (): Promise<void> => {
  console.log('Cleaning up app services...');
  
  try {
    disconnectSocket();
  } catch (error) {
    console.warn('Error disconnecting socket:', error);
  }

  try {
    if (typeof stopHeartbeat === 'function') {
      await stopHeartbeat();
    }
  } catch (error) {
    console.warn('Error stopping heartbeat:', error);
  }

  try {
    stopConnectionMonitoring();
  } catch (error) {
    console.warn('Error stopping connection monitoring:', error);
  }

  isInitializing = false;
  initializationPromise = null;
  
  console.log('App cleanup complete');
};

export const getInitializationStatus = () => {
  return {
    isInitializing,
    hasPromise: initializationPromise !== null
  };
};