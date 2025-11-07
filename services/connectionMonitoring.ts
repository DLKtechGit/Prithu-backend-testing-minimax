// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getSocketStatus, isSocketConnected, reconnectSocket } from '../webSocket/webScoket';
// import { getHeartbeatStatus, isHeartbeatActive } from '../webSocket/heartBeat';
// import { serverTest, testServerConnection } from './serverConnection';

// interface ConnectionStatus {
//   socketConnected: boolean;
//   heartbeatActive: boolean;
//   lastHeartbeat: number | null;
//   consecutiveFailures: number;
//   needsReconnection: boolean;
//   serverReachable: boolean;
//   apiReachable: boolean;
//   lastServerTest: number | null;
//   connectionHealth: 'healthy' | 'degraded' | 'unhealthy';
// }

// let connectionCheckInterval: NodeJS.Timeout | null = null;
// let isMonitoring = false;
// let lastStatusCheck = 0;

// export const startConnectionMonitoring = () => {
//   if (isMonitoring) {
//     console.log('Connection monitoring already active');
//     return;
//   }

//   isMonitoring = true;
//   console.log('Starting connection monitoring...');

//   // Check immediately
//   checkConnectionStatus();

//   // Set up monitoring interval (check every 60 seconds)
//   connectionCheckInterval = setInterval(checkConnectionStatus, 60000);
// };

// export const stopConnectionMonitoring = () => {
//   if (connectionCheckInterval) {
//     clearInterval(connectionCheckInterval);
//     connectionCheckInterval = null;
//   }
//   isMonitoring = false;
//   console.log('Connection monitoring stopped');
// };

// const checkConnectionStatus = async () => {
//   try {
//     const now = Date.now();
    
//     // Don't check too frequently (minimum 30 seconds between checks)
//     if (now - lastStatusCheck < 30000) {
//       return;
//     }
    
//     lastStatusCheck = now;

//     const socketStatus = getSocketStatus();
//     const heartbeatStatus = getHeartbeatStatus();
    
//     // Perform server connectivity test every 5 minutes
//     let serverReachable = true;
//     let apiReachable = true;
//     let lastServerTest = 0;
    
//     if (now - lastServerTest > 300000) { // 5 minutes
//       console.log('🌐 Running server connectivity test...');
//       try {
//         const testResult = await serverTest.testServerConnectivity();
//         serverReachable = testResult.socketReachable;
//         apiReachable = testResult.apiReachable;
//         lastServerTest = now;
        
//         if (!serverReachable || !apiReachable) {
//           console.error('Server connectivity issues detected:');
//           console.error(serverTest.getFormattedResults());
//         }
//       } catch (error) {
//         console.error('Server connectivity test failed:', error);
//         serverReachable = false;
//         apiReachable = false;
//         lastServerTest = now;
//       }
//     }
    
//     const status: ConnectionStatus = {
//       socketConnected: socketStatus.connected,
//       heartbeatActive: heartbeatStatus.isRunning,
//       lastHeartbeat: null,
//       consecutiveFailures: heartbeatStatus.consecutiveFailures,
//       needsReconnection: false,
//       serverReachable,
//       apiReachable,
//       lastServerTest,
//       connectionHealth: 'healthy'
//     };

//     // Determine connection health
//     if (!serverReachable || !apiReachable) {
//       status.connectionHealth = 'unhealthy';
//     } else if (!status.socketConnected || status.consecutiveFailures > 0) {
//       status.connectionHealth = 'degraded';
//     } else {
//       status.connectionHealth = 'healthy';
//     }

//     console.log('Connection status check:', status);

//     // If server is unreachable, don't attempt reconnection
//     if (!serverReachable || !apiReachable) {
//       console.log('Server is unreachable, skipping reconnection attempts');
//       return status;
//     }

//     // If socket is disconnected but we have valid tokens, attempt reconnection
//     if (!status.socketConnected) {
//       const userToken = await AsyncStorage.getItem('userToken');
//       const sessionId = await AsyncStorage.getItem('sessionId');
      
//       if (userToken && sessionId) {
//         console.log('Socket disconnected but auth tokens exist, attempting reconnection...');
//         try {
//           await reconnectSocket(userToken, sessionId);
//           console.log('Reconnection attempt completed');
//         } catch (error) {
//           console.error('Reconnection failed:', error);
//         }
//       }
//     }

//     // If heartbeat has too many failures, restart it
//     if (status.consecutiveFailures >= 3) {
//       console.log('Heartbeat has too many failures, restarting...');
//       // The heartbeat service should handle this internally
//     }

//     return status;
//   } catch (error) {
//     console.error('Error during connection status check:', error);
//     return null;
//   }
// };

// export const getConnectionStatus = (): ConnectionStatus | null => {
//   try {
//     const socketStatus = getSocketStatus();
//     const heartbeatStatus = getHeartbeatStatus();
    
//     return {
//       socketConnected: socketStatus.connected,
//       heartbeatActive: heartbeatStatus.isRunning,
//       lastHeartbeat: null,
//       consecutiveFailures: heartbeatStatus.consecutiveFailures,
//       needsReconnection: !socketStatus.connected,
//       serverReachable: true, // Default assumption for quick status
//       apiReachable: true,
//       lastServerTest: null,
//       connectionHealth: 'healthy' // Default for quick status
//     };
//   } catch (error) {
//     console.error('Error getting connection status:', error);
//     return null;
//   }
// };

// export const isConnectionHealthy = (): boolean => {
//   const status = getConnectionStatus();
//   if (!status) return false;
  
//   return status.socketConnected && 
//          status.heartbeatActive && 
//          status.consecutiveFailures < 3;
// };

// /**
//  * Run a manual server connectivity test
//  */
// export const runServerTest = async () => {
//   console.log('🔍 Manual server connectivity test initiated...');
//   try {
//     const result = await testServerConnection();
//     console.log(serverTest.getFormattedResults());
//     return result;
//   } catch (error) {
//     console.error('Manual server test failed:', error);
//     throw error;
//   }
// };

// /**
//  * Get connection health summary
//  */
// export const getConnectionHealthSummary = (): string => {
//   const status = getConnectionStatus();
//   if (!status) return '❌ Unable to determine connection status';
  
//   const healthIcons = {
//     healthy: '🟢',
//     degraded: '🟡', 
//     unhealthy: '🔴'
//   };
  
//   const icon = healthIcons[status.connectionHealth];
  
//   let summary = `${icon} Connection Status: ${status.connectionHealth.toUpperCase()}\n`;
//   summary += `Socket: ${status.socketConnected ? '✅ Connected' : '❌ Disconnected'}\n`;
//   summary += `Heartbeat: ${status.heartbeatActive ? '✅ Active' : '❌ Inactive'}\n`;
//   summary += `Failures: ${status.consecutiveFailures}/3\n`;
  
//   if (status.lastServerTest) {
//     const timeSinceTest = Math.floor((Date.now() - status.lastServerTest) / 60000);
//     summary += `Last Server Test: ${timeSinceTest} minutes ago\n`;
//   }
  
//   return summary;
// };