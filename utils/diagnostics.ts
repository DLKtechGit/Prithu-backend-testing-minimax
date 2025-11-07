/**
 * Quick Test Script for Prithu App Fixes
 * Run this to immediately test if your fixes are working
 * 
 * Usage: Import and call this function in your app's main component
 * or run in development console
 */

import { testServerConnection } from './services/serverConnection';
import { getConnectionHealthSummary, runServerTest } from './services/connectionMonitoring';
import { isSocketConnected } from './webSocket/webScoket';

export interface TestResult {
  serverTest: any;
  connectionHealth: string;
  socketStatus: boolean;
  overall: 'success' | 'warning' | 'error';
  recommendations: string[];
}

export const runQuickDiagnostics = async (): Promise<TestResult> => {
  console.log('🔍 Running Prithu App Quick Diagnostics...');
  console.log('=' * 50);
  
  const recommendations: string[] = [];
  let overall: 'success' | 'warning' | 'error' = 'success';
  
  try {
    // Test 1: Server Connectivity
    console.log('🌐 Testing Server Connectivity...');
    const serverTest = await testServerConnection();
    
    if (!serverTest.apiReachable) {
      recommendations.push('❌ API server is not reachable. Ensure backend is running on port 5000.');
      overall = 'error';
    }
    
    if (!serverTest.socketReachable) {
      recommendations.push('❌ Socket.io server is not reachable. Check Socket.io configuration.');
      overall = 'error';
    }
    
    // Test 2: Connection Health
    console.log('📊 Checking Connection Health...');
    const healthSummary = getConnectionHealthSummary();
    console.log(healthSummary);
    
    if (healthSummary.includes('UNHEALTHY')) {
      recommendations.push('🔴 Connection is unhealthy. Check server connectivity.');
      overall = 'error';
    } else if (healthSummary.includes('DEGRADED')) {
      recommendations.push('🟡 Connection is degraded but functional.');
    }
    
    // Test 3: Socket Status
    console.log('🔌 Checking Socket Status...');
    const socketConnected = isSocketConnected();
    console.log(`Socket Status: ${socketConnected ? '✅ Connected' : '❌ Disconnected'}`);
    
    if (!socketConnected) {
      recommendations.push('⚠️ WebSocket is not connected. This is normal if not logged in.');
    }
    
    // Test 4: Package Versions
    console.log('📦 Checking Dependencies...');
    try {
      const socketIOVersion = require('socket.io-client/package.json').version;
      const axiosVersion = require('axios/package.json').version;
      console.log(`socket.io-client: ${socketIOVersion}`);
      console.log(`axios: ${axiosVersion}`);
      
      if (!socketIOVersion.startsWith('4.')) {
        recommendations.push('⚠️ socket.io-client version may be incompatible. Expected 4.x');
      }
    } catch (e) {
      recommendations.push('⚠️ Could not verify package versions');
    }
    
    // Overall Assessment
    console.log('=' * 50);
    if (overall === 'success' && recommendations.length === 0) {
      console.log('🎉 ALL TESTS PASSED! Your app should be working correctly.');
    } else if (overall === 'warning') {
      console.log('⚠️ Some issues detected but app may still work.');
    } else {
      console.log('❌ Critical issues detected. App functionality may be impaired.');
    }
    
    if (recommendations.length > 0) {
      console.log('\\n💡 RECOMMENDATIONS:');\n      recommendations.forEach((rec, i) => console.log(`${i + 1}. ${rec}`));\n    }\n    \n    console.log('=' * 50);\n    \n    return {\n      serverTest,\n      connectionHealth: healthSummary,\n      socketStatus: socketConnected,\n      overall,\n      recommendations\n    };\n    \n  } catch (error) {\n    console.error('❌ Diagnostics failed:', error);\n    return {\n      serverTest: { errors: [error.message] },\n      connectionHealth: '❌ Unable to determine',\n      socketStatus: false,\n      overall: 'error',\n      recommendations: ['❌ Diagnostics test failed - check error details above']\n    };\n  }\n};\n\n/**\n * Easy-to-use diagnostic function for development\n * Call this in your app startup or in development console\n */\nexport const diagnoseApp = async () => {\n  const result = await runQuickDiagnostics();\n  \n  // Also try to run a more detailed server test\n  try {\n    console.log('\\n🔍 Running Detailed Server Test...');\n    const detailedTest = await runServerTest();\n    \n    if (detailedTest.errors.length > 0) {\n      console.log('\\n❌ Server Errors Detected:');\n      detailedTest.errors.forEach((error: string) => {\n        console.log(`  • ${error}`);\n      });\n    }\n    \n    if (detailedTest.recommendations.length > 0) {\n      console.log('\\n💡 Detailed Recommendations:');\n      detailedTest.recommendations.forEach((rec: string) => {\n        console.log(`  • ${rec}`);\n      });\n    }\n  } catch (e) {\n    console.log('⚠️ Could not run detailed server test');\n  }\n  \n  return result;\n};\n\n/**\n * Monitor connection status continuously\n * Useful for debugging connection issues\n */\nexport const startConnectionMonitoring = () => {\n  console.log('📡 Starting continuous connection monitoring...');\n  \n  const interval = setInterval(async () => {\n    const health = getConnectionHealthSummary();\n    const timestamp = new Date().toLocaleTimeString();\n    console.log(`[${timestamp}] ${health}`);\n  }, 30000); // Every 30 seconds\n  \n  // Return cleanup function\n  return () => {\n    clearInterval(interval);\n    console.log('📡 Connection monitoring stopped');\n  };\n};\n\n/**\n * Quick connectivity check for UI\n * Returns simple status for display in app\n */\nexport const getQuickStatus = () => {\n  try {\n    const health = getConnectionHealthSummary();\n    \n    if (health.includes('🟢 HEALTHY')) {\n      return { status: 'healthy', color: 'green', message: 'Connected' };\n    } else if (health.includes('🟡 DEGRADED')) {\n      return { status: 'degraded', color: 'orange', message: 'Degraded' };\n    } else if (health.includes('🔴 UNHEALTHY')) {\n      return { status: 'unhealthy', color: 'red', message: 'Disconnected' };\n    } else {\n      return { status: 'unknown', color: 'gray', message: 'Unknown' };\n    }\n  } catch (error) {\n    return { status: 'error', color: 'red', message: 'Error' };\n  }\n};\n\n// Default export for easy importing\nexport default {\n  runQuickDiagnostics,\n  diagnoseApp,\n  startConnectionMonitoring,\n  getQuickStatus\n};\n\n/**\n * AUTO-RUN DIAGNOSTICS (uncomment to run automatically)\n * \n * To run automatically when this file is imported, uncomment:\n */\n// if (typeof window !== 'undefined') {\n//   console.log('🚀 Auto-running Prithu diagnostics...');\n//   diagnoseApp();\n// }