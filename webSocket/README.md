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

### Configuration System
- **Environment Variables**: Full environment variable support
- **Runtime Validation**: Configuration validation on startup
- **Type Safety**: Full TypeScript support with proper interfaces
- **Fallback Support**: Sensible defaults for all configurations

## Error Handling

### WebSocket Errors
- Connection timeout protection
- Authentication failure handling
- Maximum reconnection attempt limits
- Proper cleanup on connection failure

### Heartbeat Errors
- Network error handling
- Authentication failure detection
- Consecutive failure tracking
- Automatic service restart

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

2. **Heartbeat Stops Working**
   - Check for authentication failures
   - Verify API endpoint configuration
   - Monitor consecutive failure counts

3. **Configuration Issues**
   - Validate URLs with `validateConfig()`
   - Check environment variable names
   - Ensure proper TypeScript configuration

### Debug Information

Both services provide comprehensive logging:
```typescript
// Enable debug logging
console.log('WebSocket Status:', getSocketStatus());
console.log('Heartbeat Status:', getHeartbeatStatus());
console.log('Configuration:', API_CONFIG);
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