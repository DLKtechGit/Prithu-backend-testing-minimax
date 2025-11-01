# Environment Configuration Guide

This guide explains how to use the new environment configuration system in the MeetFlow app.

## 📋 Overview

The app now supports environment-based configuration with separate settings for development, staging, and production environments. All hardcoded URLs and constants have been replaced with environment variables.

## 🚀 Quick Start

### 1. Setup Environment

Choose your environment:

```bash
# Development environment (default)
npm run env:dev

# Production environment
npm run env:prod

# Interactive setup
npm run env:setup
```

### 2. Validate Configuration

```bash
npm run validate-env
```

### 3. Start Development Server

```bash
# Start with development environment
npm run start:dev

# Or start normally (uses .env file)
npm start
```

## 🏗️ Configuration Files

### Environment Files

- `.env.example` - Template with all available variables
- `.env.development` - Development environment settings
- `.env.production` - Production environment settings
- `.env` - Active environment configuration (created from above)

### Core Configuration Files

- `config/environment.ts` - Main configuration manager
- `config/api.config.ts` - API-specific configuration
- `types/environment.d.ts` - TypeScript definitions

## 🔧 Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL | `https://api.meetflow.com` |
| `EXPO_PUBLIC_WS_URL` | WebSocket server URL | `https://api.meetflow.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_ENABLE_NOTIFICATIONS` | Enable push notifications | `true` |
| `EXPO_PUBLIC_ENABLE_WEBSOCKET` | Enable WebSocket connections | `true` |
| `EXPO_PUBLIC_ENABLE_ANALYTICS` | Enable analytics tracking | `false` |
| `EXPO_PUBLIC_DEBUG_MODE` | Enable debug logging | `false` |
| `EXPO_PUBLIC_LOG_LEVEL` | Logging level | `info` |
| `EXPO_PUBLIC_COMPANY_LOGO_URL` | Company logo URL | Placeholder |
| `EXPO_PUBLIC_DEFAULT_IMAGE_URL` | Default image URL | Placeholder |
| `EXPO_PUBLIC_FCM_PROJECT_ID` | Firebase project ID | `meetflow-default` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry error tracking | (empty) |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key | (empty) |

## 🌍 Environment-Specific Settings

### Development
- Debug mode enabled
- Verbose logging
- Local API endpoints
- Development CDN URLs

### Production
- Debug mode disabled
- Error-only logging
- Production API endpoints
- Production CDN URLs
- Error tracking enabled

## 📱 Usage in Code

### Import Configuration

```typescript
import { getConfig, configHelpers } from '../config/environment';

// Get full configuration
const config = getConfig();

// Use specific values
console.log(`API URL: ${config.apiUrl}`);
console.log(`Environment: ${config.environment}`);
```

### Helper Functions

```typescript
import { configHelpers } from '../config/environment';

// Get API endpoint
const loginEndpoint = configHelpers.getAPIEndpoint('/api/auth/login');

// Get WebSocket URL
const wsUrl = configHelpers.getWebSocketURL();

// Check feature flags
if (configHelpers.isFeatureEnabled('enableNotifications')) {
  // Enable notifications
}
```

### Feature Flags

```typescript
const config = getConfig();

// Check individual features
if (config.enableWebSocket) {
  // Initialize WebSocket connection
}

if (config.enableAnalytics) {
  // Initialize analytics
}
```

## 🔄 Switching Environments

### Method 1: Using npm scripts

```bash
# Switch to development
npm run env:dev && npm start

# Switch to production
npm run env:prod && npm start
```

### Method 2: Using setup script

```bash
# Interactive setup
./setup-env.sh

# Direct environment setup
./setup-env.sh development
./setup-env.sh production
```

### Method 3: Manual environment variables

```bash
EXPO_PUBLIC_ENVIRONMENT=production npm start
EXPO_PUBLIC_API_URL=https://api.staging.meetflow.com npm start
```

## 🏗️ Building for Different Environments

### Development Build

```bash
# Android
npm run android:dev

# iOS
npm run ios:dev

# Web
npm run web:dev
```

### Production Build

```bash
# EAS Build
eas build --platform android
eas build --platform ios

# With environment
EXPO_PUBLIC_ENVIRONMENT=production eas build
```

## 🔍 Validation

Run the validation script to check your configuration:

```bash
npm run validate-env
```

This will:
- Check for required environment files
- Validate API URLs
- Check configuration consistency
- Warn about potential issues

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API URL" Error**
   - Check `EXPO_PUBLIC_API_URL` format (must include http/https)
   - Ensure URL is accessible

2. **WebSocket Connection Fails**
   - Verify `EXPO_PUBLIC_WS_URL` matches your WebSocket server
   - Check firewall/network settings

3. **Configuration Not Loading**
   - Ensure `.env` file exists in project root
   - Restart the development server after changes
   - Check TypeScript errors in `config/environment.ts`

4. **Feature Flags Not Working**
   - Verify environment variables are set correctly
   - Check that values are strings ("true"/"false") not booleans

### Debug Mode

Enable debug mode to see configuration details:

```bash
EXPO_PUBLIC_DEBUG_MODE=true npm start
```

This will log the current configuration on app startup.

## 📚 Best Practices

1. **Never commit `.env` files** - Add them to `.gitignore`
2. **Use `.env.example` for templates** - Keep this updated with all variables
3. **Validate configuration** - Run `npm run validate-env` before building
4. **Separate environments** - Use different API endpoints for each environment
5. **Test thoroughly** - Always test configuration changes

## 🔐 Security

- **Production variables** - Never commit production API keys or secrets
- **Environment isolation** - Keep development and production configurations separate
- **Access control** - Limit who can modify production environment settings

## 🆘 Support

If you encounter issues:

1. Run `npm run validate-env` to check configuration
2. Check the console for debug messages (with debug mode enabled)
3. Review the troubleshooting section above
4. Verify all URLs are accessible and properly formatted