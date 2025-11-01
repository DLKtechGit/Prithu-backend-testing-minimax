# WebSocket and Heartbeat Configuration

This module provides configurable WebSocket connections and heartbeat services with robust error handling and automatic reconnection.

## Configuration

The system uses a centralized configuration in `/config/api.config.ts` that supports:

### Environment Variables
```bash
# API URLs
EXPO_PUBLIC_API_URL=https://your-api-domain.com
EXPO_PUBLIC_WS_URL=wss://your-websocket-domain.com

# Timing configurations
EXPO_PUBLIC_HEARTBEAT_INTERVAL=30000      # 30 seconds
EXPO_PUBLIC_MAX_RECONNECT=5               # Maximum reconnection attempts
EXPO_PUBLIC_RECONNECT_DELAY=3000          # Delay between reconnection attempts (3 seconds)
```

### Default Configuration
If no environment variables are set, the system falls back to:
- API URL: `http://192.168.1.10:5000`
- WebSocket URL: `http://192.168.1.10:5000`
- Heartbeat Interval: 30 seconds
- Max Reconnect Attempts: 5
- Reconnect Delay: 3 seconds

## Usage Examples

### Basic WebSocket Usage

```typescript
import { connectSocket, disconnectSocket, isSocketConnected, emitEvent } from './webSocket';

// Connect to WebSocket
const socket = await connectSocket();

// Check connection status
if (isSocketConnected()) {
  console.log('WebSocket is connected');
}

// Emit events
emitEvent('customEvent', { data: 'example' });

// Disconnect when done
disconnectSocket();
```

### Heartbeat Service Usage

```typescript
import { startHeartbeat, stopHeartbeat, isHeartbeatActive, testHeartbeatConnection } from './webSocket';

// Start heartbeat with default interval (30 seconds)
await startHeartbeat();

// Start heartbeat with custom interval
await startHeartbeat(60000); // 60 seconds

// Check if heartbeat is active
if (isHeartbeatActive()) {
  console.log('Heartbeat service is running');
}

// Test heartbeat connection
const isConnected = await testHeartbeatConnection();
console.log('Heartbeat connection test:', isConnected ? 'Success' : 'Failed');

// Stop heartbeat
await stopHeartbeat();
```

### Unified Service Management

```typescript
import { initializeServices, cleanupServices } from './webSocket';

// Initialize all services
const initialized = await initializeServices();
if (initialized) {
  console.log('All services initialized successfully');
}

// Cleanup when app closes
await cleanupServices();
```

### Configuration Validation

```typescript
import { validateConfig, API_CONFIG } from './webSocket';

// Check if configuration is valid
if (validateConfig()) {
  console.log('Configuration is valid');
  console.log('API URL:', API_CONFIG.baseURL);
  console.log('WebSocket URL:', API_CONFIG.wsURL);
  console.log('Heartbeat Interval:', API_CONFIG.heartbeatInterval);
}
```

### Token Refresh Management

```typescript
import { 
  reauthenticateSocket, 
  isTokenValid, 
  checkAndRefreshToken,
  initializeTokenRefreshIntegration 
} from './webSocket';

// Initialize automatic token refresh integration
const unregister = initializeTokenRefreshIntegration();

// Check token validity before operations
const valid = await isTokenValid();
if (!valid) {
  console.log('Token is invalid, forcing re-authentication...');
  await reauthenticateSocket();
}

// Manually check and refresh token
const isCurrent = await checkAndRefreshToken();
console.log('Token is current:', isCurrent);

// Force re-authentication on demand
await reauthenticateSocket();

// Clean up when done
unregister();
```

### Custom Token Refresh Listeners

```typescript
import { registerTokenRefreshListener } from './webSocket';

// Register custom token refresh handler
const unregister = registerTokenRefreshListener(async (newToken: string) => {
  console.log('Custom handler: Token refreshed:', newToken.substring(0, 10) + '...');
  
  // Your custom logic here
  // e.g., Update local state, notify other services, etc.
});

// Remember to unregister when no longer needed
unregister();
```

## Features

### WebSocket Service
- **Automatic Reconnection**: Configurable retry attempts with exponential backoff
- **Connection Status Tracking**: Monitor connection state and attempt counts
- **Event Broadcasting**: Safe event emission with connection validation
- **Error Recovery**: Comprehensive error handling with timeout protection
- **Connection Prevention**: Prevents duplicate connections

### Heartbeat Service
- **Configurable Intervals**: Customizable heartbeat frequency
- **Failure Recovery**: Automatic restart after consecutive failures
- **Authentication Handling**: Automatic stop on auth failures
- **Connection Testing**: Built-in connection validation
- **Performance Monitoring**: Tracks consecutive failure counts

### Token Refresh System
- **Automatic Token Monitoring**: Detects token changes every 10 seconds
- **Seamless Re-authentication**: Updates WebSocket authentication when tokens refresh
- **Integration with API Interceptor**: Automatically notifies WebSocket when API tokens refresh
- **Manual Re-authentication**: Functions to force token refresh and re-authentication
- **Token Validation**: Validates token format and expiry before connection
- **Error Recovery**: Handles authentication errors and triggers reconnection

### Configuration System
- **Environment Variables**: Full environment variable support
- **Runtime Validation**: Configuration validation on startup
- **Type Safety**: Full TypeScript support with proper interfaces
- **Fallback Support**: Sensible defaults for all configurations

## Error Handling

### WebSocket Errors
- Connection timeout protection
- Authentication failure handling (automatic re-authentication)
- Maximum reconnection attempt limits
- Proper cleanup on connection failure
- Token validation before connection
- Automatic token refresh detection and handling

### Heartbeat Errors
- Network error handling
- Authentication failure detection
- Consecutive failure tracking
- Automatic service restart

### Token Refresh Errors
- Invalid token format detection
- Expired token handling
- Token refresh failure recovery
- Stale token prevention
- Seamless re-authentication on token changes

## API Reference

### WebSocket Functions

#### `connectSocket(): Promise<Socket | null>`
Connects to the WebSocket server with authentication.

**Returns**: Socket instance or null if connection fails

**Features**:
- Prevents duplicate connections
- Handles authentication automatically
- Provides comprehensive error logging
- Supports automatic reconnection

#### `disconnectSocket(): void`
Disconnects and cleans up the WebSocket connection.

#### `isSocketConnected(): boolean`
Checks if WebSocket is currently connected.

#### `emitEvent(event: string, data?: any): boolean`
Safely emits events to the WebSocket.

**Parameters**:
- `event`: Event name
- `data`: Optional event data

**Returns**: True if event was emitted successfully

#### `getSocketStatus(): object`
Returns current connection status information.

#### `reauthenticateSocket(): Promise<boolean>`
Forces re-authentication of the WebSocket with the current token.

**Returns**: True if re-authentication was successful

**Use Cases**:
- Manual token refresh triggers
- Authentication error recovery
- Force token validation

#### `isTokenValid(): Promise<boolean>`
Checks if the current authentication token is valid.

**Returns**: True if token is valid

#### `checkAndRefreshToken(): Promise<boolean>`
Manually checks for token updates and refreshes if needed.

**Returns**: True if token is current

#### `registerTokenRefreshListener(callback: (newToken: string) => void): () => void`
Registers a callback to be notified when tokens are refreshed.

**Parameters**:
- `callback`: Function to call when token changes

**Returns**: Unregister function to remove the listener

#### `initializeTokenRefreshIntegration(): () => void`
Initializes automatic token refresh handling integration.

**Returns**: Unregister function

### Heartbeat Functions

#### `startHeartbeat(customInterval?: number): Promise<void>`
Starts the heartbeat service.

**Parameters**:
- `customInterval`: Optional custom interval in milliseconds

**Features**:
- Automatic session and token retrieval
- Configurable intervals
- Failure tracking and recovery
- Authentication error handling

#### `stopHeartbeat(): Promise<void>`
Stops the heartbeat service and cleans up resources.

#### `isHeartbeatActive(): boolean`
Checks if heartbeat service is currently running.

#### `testHeartbeatConnection(): Promise<boolean>`
Tests the heartbeat connection without starting the service.

**Returns**: True if connection test succeeds

#### `getHeartbeatStatus(): object`
Returns current heartbeat service status.

### Configuration Functions

#### `validateConfig(): boolean`
Validates the current configuration.

**Returns**: True if configuration is valid

#### `getWebSocketURL(path?: string): string`
Constructs a WebSocket URL with optional path.

#### `getAPIEndpoint(path: string): string`
Constructs an API endpoint URL with the given path.

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check environment variables for correct URLs
   - Verify network connectivity
   - Ensure authentication token is valid
   - Use `isTokenValid()` to check token format
   - Use `checkAndRefreshToken()` to force token refresh

2. **WebSocket Uses Stale Token After API Refresh**
   - Initialize token refresh integration: `initializeTokenRefreshIntegration()`
   - The system now automatically detects token changes every 10 seconds
   - Manually trigger re-authentication: `reauthenticateSocket()`
   - Check if WebSocket is properly integrated with API interceptor

3. **Authentication Errors**
   - Use `isTokenValid()` to check token validity
   - Call `reauthenticateSocket()` to force re-authentication
   - Verify token format and expiry
   - Check for proper integration with API interceptor

4. **Heartbeat Stops Working**
   - Check for authentication failures
   - Verify API endpoint configuration
   - Monitor consecutive failure counts

5. **Configuration Issues**
   - Validate URLs with `validateConfig()`
   - Check environment variable names
   - Ensure proper TypeScript configuration

### Debug Information

All services provide comprehensive logging:
```typescript
// Check WebSocket status
console.log('WebSocket Status:', getSocketStatus());

// Check if token is valid
console.log('Token Valid:', await isTokenValid());

// Check and refresh token manually
await checkAndRefreshToken();

// Force re-authentication
await reauthenticateSocket();

// Check heartbeat status
console.log('Heartbeat Status:', getHeartbeatStatus());

// Configuration
console.log('Configuration:', API_CONFIG);
```

### Token Refresh Integration Verification

Verify the API interceptor integration:
```typescript
// In apiInterceptor.ts, look for this line:
import { handleTokenRefresh } from "../webSocket/webScoket";

// And ensure handleTokenRefresh is called after token refresh:
await handleTokenRefresh(newAccessToken);
```

### Testing Token Refresh

Test the token refresh functionality:
```typescript
import { initializeTokenRefreshIntegration } from './webSocket';

// Initialize integration
const cleanup = initializeTokenRefreshIntegration();

// Simulate token refresh (in your auth logic)
await AsyncStorage.setItem("userToken", "new-token-here");

// Wait a few seconds and check WebSocket status
setTimeout(() => {
  console.log('WebSocket should be re-authenticated:', getSocketStatus());
}, 5000);

// Cleanup
cleanup();
```

## Migration from Hardcoded URLs

The system has been updated to use configuration instead of hardcoded URLs:

### Before
```typescript
socket = io("http://192.168.1.10:5000", { auth: { token } });
await axios.post("http://192.168.1.10:5000/api/heartbeat", data);
```

### After
```typescript
import { connectSocket } from './webSocket';
import { getWebSocketURL, getAPIEndpoint } from './config/api.config';

// WebSocket automatically uses configuration
const socket = await connectSocket();

// Heartbeat automatically uses configuration
await startHeartbeat();

// Manual URL construction if needed
const wsUrl = getWebSocketURL(); // Uses EXPO_PUBLIC_WS_URL or default
const apiUrl = getAPIEndpoint("/api/heartbeat"); // Uses EXPO_PUBLIC_API_URL or default
```

This provides a clean, maintainable, and configurable system for WebSocket and heartbeat operations.