import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocketStatus, isSocketConnected, reconnectSocket } from '../webSocket/webScoket';
import { getHeartbeatStatus, isHeartbeatActive } from '../webSocket/heartBeat';

interface ConnectionStatus {
  socketConnected: boolean;
  heartbeatActive: boolean;
  lastHeartbeat: number | null;
  consecutiveFailures: number;
  needsReconnection: boolean;
}

let connectionCheckInterval: NodeJS.Timeout | null = null;
let isMonitoring = false;
let lastStatusCheck = 0;

export const startConnectionMonitoring = () => {
  if (isMonitoring) {
    console.log('Connection monitoring already active');
    return;
  }

  isMonitoring = true;
  console.log('Starting connection monitoring...');

  // Check immediately
  checkConnectionStatus();

  // Set up monitoring interval (check every 60 seconds)
  connectionCheckInterval = setInterval(checkConnectionStatus, 60000);
};

export const stopConnectionMonitoring = () => {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
  isMonitoring = false;
  console.log('Connection monitoring stopped');
};

const checkConnectionStatus = async () => {
  try {
    const now = Date.now();
    
    // Don't check too frequently (minimum 30 seconds between checks)
    if (now - lastStatusCheck < 30000) {
      return;
    }
    
    lastStatusCheck = now;

    const socketStatus = getSocketStatus();
    const heartbeatStatus = getHeartbeatStatus();
    
    const status: ConnectionStatus = {
      socketConnected: socketStatus.connected,
      heartbeatActive: heartbeatStatus.isRunning,
      lastHeartbeat: null, // We would need to track this in a real implementation
      consecutiveFailures: heartbeatStatus.consecutiveFailures,
      needsReconnection: false
    };

    console.log('Connection status check:', status);

    // If socket is disconnected but we have valid tokens, attempt reconnection
    if (!status.socketConnected) {
      const userToken = await AsyncStorage.getItem('userToken');
      const sessionId = await AsyncStorage.getItem('sessionId');
      
      if (userToken && sessionId) {
        console.log('Socket disconnected but auth tokens exist, attempting reconnection...');
        try {
          await reconnectSocket(userToken, sessionId);
          console.log('Reconnection attempt completed');
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }
    }

    // If heartbeat has too many failures, restart it
    if (status.consecutiveFailures >= 3) {
      console.log('Heartbeat has too many failures, restarting...');
      // The heartbeat service should handle this internally
    }

    return status;
  } catch (error) {
    console.error('Error during connection status check:', error);
    return null;
  }
};

export const getConnectionStatus = (): ConnectionStatus | null => {
  try {
    const socketStatus = getSocketStatus();
    const heartbeatStatus = getHeartbeatStatus();
    
    return {
      socketConnected: socketStatus.connected,
      heartbeatActive: heartbeatStatus.isRunning,
      lastHeartbeat: null,
      consecutiveFailures: heartbeatStatus.consecutiveFailures,
      needsReconnection: !socketStatus.connected
    };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return null;
  }
};

export const isConnectionHealthy = (): boolean => {
  const status = getConnectionStatus();
  if (!status) return false;
  
  return status.socketConnected && 
         status.heartbeatActive && 
         status.consecutiveFailures < 3;
};