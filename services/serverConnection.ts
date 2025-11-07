/**
 * Server Connection Test Utility
 * Tests backend server connectivity and Socket.io availability
 */
// import axios from 'axios';
// import { io } from 'socket.io-client';
// import { getConfig } from '../config/environment';

// interface ServerTestResult {
//   apiReachable: boolean;
//   socketReachable: boolean;
//   socketVersion: string | null;
//   errors: string[];
//   recommendations: string[];
// }

// export class ServerConnectionTest {
//   private config = getConfig();
//   private testResults: ServerTestResult = {
//     apiReachable: false,
//     socketReachable: false,
//     socketVersion: null,
//     errors: [],
//     recommendations: []
//   };

//   /**
//    * Test server connectivity comprehensively
//    */
//   async testServerConnectivity(): Promise<ServerTestResult> {
//     console.log('🔍 Starting server connectivity test...');
    
//     // Reset results
//     this.testResults = {
//       apiReachable: false,
//       socketReachable: false,
//       socketVersion: null,
//       errors: [],
//       recommendations: []
//     };

//     try {
//       // Test 1: Basic API connectivity
//       await this.testAPIConnectivity();
      
//       // Test 2: Socket.io connectivity
//       await this.testSocketConnectivity();
      
//       // Generate recommendations based on results
//       this.generateRecommendations();
      
//     } catch (error) {
//       console.error('❌ Server connectivity test failed:', error);
//       this.testResults.errors.push(`Test execution failed: ${error.message}`);
//     }

//     console.log('📊 Server test results:', this.testResults);
//     return this.testResults;
//   }

//   /**
//    * Test basic API endpoint connectivity
//    */
//   private async testAPIConnectivity(): Promise<void> {
//     try {
//       const testEndpoint = '/api/health';
//       const url = `${this.config.apiUrl}${testEndpoint}`;
      
//       console.log(`🌐 Testing API endpoint: ${url}`);
      
//       const response = await axios.get(url, {
//         timeout: 5000,
//         headers: {
//           'Accept': 'application/json'
//         }
//       });
      
//       if (response.status === 200) {
//         this.testResults.apiReachable = true;
//         console.log('✅ API endpoint reachable');
//       } else {
//         this.testResults.errors.push(`API returned status ${response.status}`);
//         console.log(`⚠️ API returned unexpected status: ${response.status}`);
//       }
      
//     } catch (error: any) {
//       this.testResults.errors.push(`API test failed: ${error.message}`);
//       console.log(`❌ API connectivity failed: ${error.message}`);
      
//       // Provide specific error diagnosis
//       if (error.code === 'ECONNREFUSED') {
//         this.testResults.recommendations.push('Server is not running. Start your backend server on the configured port.');
//       } else if (error.code === 'ENOTFOUND') {
//         this.testResults.recommendations.push('Server hostname not found. Check server URL configuration.');
//       } else if (error.code === 'ETIMEDOUT') {
//         this.testResults.recommendations.push('Connection timeout. Server may be overloaded or network issue.');
//       }
//     }
//   }

//   /**
//    * Test Socket.io connectivity
//    */
//   private async testSocketConnectivity(): Promise<void> {
//     try {
//       console.log(`🔌 Testing Socket.io connectivity to: ${this.config.wsUrl}`);
      
//       // Test Socket.io with basic connection
//       const socket = io(this.config.wsUrl, {
//         timeout: 5000,
//         transports: ['websocket', 'polling'],
//         forceNew: true
//       });

//       return new Promise((resolve, reject) => {
//         // Test connection
//         const timeout = setTimeout(() => {
//           socket.disconnect();
//           this.testResults.errors.push('Socket.io connection timeout');
//           console.log('❌ Socket.io connection timeout');
//           reject(new Error('Socket.io connection timeout'));
//         }, 5000);

//         socket.on('connect', () => {
//           clearTimeout(timeout);
//           this.testResults.socketReachable = true;
          
//           // Get socket version info if available
//           try {
//             this.testResults.socketVersion = socket.io.engine?.protocol || 'Unknown';
//           } catch (e) {
//             this.testResults.socketVersion = 'Version check failed';
//           }
          
//           console.log('✅ Socket.io connection successful');
//           console.log('Socket.io details:', {
//             version: this.testResults.socketVersion,
//             id: socket.id,
//             transport: socket.io.engine?.transport?.name
//           });
          
//           socket.disconnect();
//           resolve(void 0);
//         });

//         socket.on('connect_error', (error) => {
//           clearTimeout(timeout);
//           this.testResults.errors.push(`Socket.io error: ${error.message}`);
//           console.log(`❌ Socket.io connection error: ${error.message}`);
          
//           // Provide specific Socket.io error diagnosis
//           if (error.message?.includes('Transport unknown')) {
//             this.testResults.recommendations.push('Socket.io server may not be running or version mismatch. Check if Socket.io server is properly configured.');
//           } else if (error.message?.includes('CORS')) {
//             this.testResults.recommendations.push('CORS issue detected. Update server CORS configuration.');
//           } else if (error.message?.includes('Authentication')) {
//             this.testResults.recommendations.push('Socket.io authentication issue. Check token configuration.');
//           }
          
//           socket.disconnect();
//           reject(error);
//         });

//         socket.on('error', (error) => {
//           clearTimeout(timeout);
//           this.testResults.errors.push(`Socket.io general error: ${error}`);
//           console.log(`❌ Socket.io error: ${error}`);
//           socket.disconnect();
//           reject(new Error(`Socket.io error: ${error}`));
//         });
//       });
      
//     } catch (error: any) {
//       this.testResults.errors.push(`Socket.io test failed: ${error.message}`);
//       console.log(`❌ Socket.io test failed: ${error.message}`);
//     }
//   }

//   /**
//    * Generate recommendations based on test results
//    */
//   private generateRecommendations(): void {
//     if (!this.testResults.apiReachable && !this.testResults.socketReachable) {
//       this.testResults.recommendations.push('Both API and Socket.io are unreachable. Check server status and network configuration.');
//       this.testResults.recommendations.push('Verify server is running on the correct port (5000 by default).');
//     } else if (!this.testResults.apiReachable) {
//       this.testResults.recommendations.push('API is unreachable but Socket.io is working. Check API endpoint routing.');
//     } else if (!this.testResults.socketReachable) {
//       this.testResults.recommendations.push('Socket.io is unreachable. Check Socket.io server configuration and CORS settings.');
//     }

//     if (this.testResults.errors.some(e => e.includes('timeout'))) {
//       this.testResults.recommendations.push('Timeout issues detected. Consider increasing timeout values or checking server performance.');
//     }

//     if (this.testResults.errors.some(e => e.includes('CORS'))) {
//       this.testResults.recommendations.push('CORS issues detected. Update server CORS configuration to allow requests from this domain.');
//     }

//     // General recommendations
//     this.testResults.recommendations.push('Ensure backend server is running and accessible from the device/network.');
//     this.testResults.recommendations.push('Check firewall settings and network connectivity.');
//   }

//   /**
//    * Quick connectivity check (non-blocking)
//    */
//   async quickCheck(): Promise<{ isReachable: boolean; error?: string }> {
//     try {
//       const response = await axios.get(`${this.config.apiUrl}/api/health`, {
//         timeout: 3000
//       });
      
//       return {
//         isReachable: response.status === 200
//       };
//     } catch (error: any) {
//       return {
//         isReachable: false,
//         error: error.message
//       };
//     }
//   }

//   /**
//    * Get formatted test results for display
//    */
//   getFormattedResults(): string {
//     const { apiReachable, socketReachable, errors, recommendations } = this.testResults;
    
//     let output = '\n=== SERVER CONNECTION TEST RESULTS ===\n';
//     output += `API Connectivity: ${apiReachable ? '✅ PASS' : '❌ FAIL'}\n`;
//     output += `Socket.io Connectivity: ${socketReachable ? '✅ PASS' : '❌ FAIL'}\n`;
    
//     if (errors.length > 0) {
//       output += '\n❌ ERRORS:\n';
//       errors.forEach((error, index) => {
//         output += `${index + 1}. ${error}\n`;
//       });
//     }
    
//     if (recommendations.length > 0) {
//       output += '\n💡 RECOMMENDATIONS:\n';
//       recommendations.forEach((rec, index) => {
//         output += `${index + 1}. ${rec}\n`;
//       });
//     }
    
//     output += '=====================================\n';
//     return output;
//   }
// }

// // Export singleton instance
// export const serverTest = new ServerConnectionTest();

// // Export convenience functions
// export const testServerConnection = () => serverTest.testServerConnectivity();
// export const quickServerCheck = () => serverTest.quickCheck();