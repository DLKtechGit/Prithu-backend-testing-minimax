// Quick test for environment configuration
const config = require('./config/environment').getConfig();
const helpers = require('./config/environment').configHelpers;

console.log('🔍 Environment Configuration Test');
console.log('================================');
console.log('API URL:', config.apiUrl);
console.log('WebSocket URL:', config.wsUrl);
console.log('Environment:', config.environment);
console.log('Debug Mode:', config.debugMode);
console.log('Notifications:', config.enableNotifications);
console.log('API Endpoint Test:', helpers.getAPIEndpoint('/test'));
console.log('WebSocket URL Test:', helpers.getWebSocketURL());
console.log('✅ Configuration test completed');