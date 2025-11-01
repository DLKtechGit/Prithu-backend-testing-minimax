# Migration Guide: From Hardcoded URLs to Environment Configuration

This guide helps you migrate from the old hardcoded URL system to the new environment configuration.

## 📋 What Changed

### Before (Old System)
- URLs were hardcoded in files like `apiInterceptor.ts`, `notification.ts`
- Difficult to switch between environments
- Easy to accidentally use wrong URLs
- No centralized configuration

### After (New System)
- All URLs are configured via environment variables
- Easy environment switching
- Centralized configuration management
- Type-safe configuration access

## 🔄 Migration Steps

### 1. Environment Setup

**Old:** You might have manually changed URLs in code files.

**New:** Set up environment files:

```bash
# Copy environment template
cp .env.example .env

# Or use setup script
npm run env:setup

# Or directly copy environment files
npm run env:dev    # For development
npm run env:prod   # For production
```

### 2. Update API Endpoints

**Old:** Hardcoded in `apiInterpretor/apiInterceptor.ts`
```typescript
const baseURL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.10:5000";
```

**New:** Automatically handled by configuration
```typescript
import { getConfig } from '../config/environment';
const config = getConfig();
const baseURL = config.apiUrl;
```

### 3. Update Notification URLs

**Old:** Hardcoded in `utils/notification.ts`
```typescript
await fetch('https://your-backend.com/api/devices/register', {
```

**New:** Using configuration
```typescript
import { getConfig, configHelpers } from '../config/environment';
const config = getConfig();
const apiEndpoint = configHelpers.getAPIEndpoint('/api/devices/register');
```

### 4. Update WebSocket URLs

**Old:** Hardcoded in `webSocket/webScoket.ts`
```typescript
socket = io("http://192.168.1.10:5000", {
```

**New:** Using configuration helper
```typescript
import { configHelpers } from '../config/environment';
const wsURL = configHelpers.getWebSocketURL();
socket = io(wsURL, {
```

### 5. Update Image URLs

**Old:** Hardcoded in components
```typescript
source={{ uri: 'https://example.com/image.jpg' }}
```

**New:** Using configuration
```typescript
import { getConfig } from '../config/environment';
const config = getConfig();
source={{ uri: config.defaultImageUrl }}
```

## 🚀 Quick Migration Commands

### Step 1: Setup Environment
```bash
npm run env:dev
```

### Step 2: Validate Configuration
```bash
npm run validate-env
```

### Step 3: Test Development Server
```bash
npm start:dev
```

## 🔧 Configuration Migration Examples

### API URL Changes

**Old approach:**
```typescript
// Had to manually change this in multiple files
const API_BASE = "http://192.168.1.10:5000";
```

**New approach:**
```bash
# In .env file
EXPO_PUBLIC_API_URL=http://192.168.1.10:5000
```

### Feature Flags

**Old approach:**
```typescript
// Had to comment/uncomment code
if (false) { // Disable notifications
  // notification code
}
```

**New approach:**
```bash
# In .env file
EXPO_PUBLIC_ENABLE_NOTIFICATIONS=false
```

```typescript
import { configHelpers } from '../config/environment';

if (configHelpers.isFeatureEnabled('enableNotifications')) {
  // notification code runs automatically
}
```

## 📂 File Changes Summary

### Files Modified
1. `config/environment.ts` - NEW: Main configuration manager
2. `config/api.config.ts` - UPDATED: Now uses environment config
3. `utils/notification.ts` - UPDATED: Uses config for API endpoints
4. `apiInterpretor/apiInterceptor.ts` - UPDATED: Uses config for base URL
5. `app/Emails/OtpMsg.tsx` - UPDATED: Uses config for image URLs

### Files Created
1. `.env.example` - Template for environment variables
2. `.env.development` - Development environment settings
3. `.env.production` - Production environment settings
4. `setup-env.sh` - Environment setup script
5. `validate-env.js` - Configuration validation script
6. `types/environment.d.ts` - TypeScript definitions

### No Changes Needed
- `webSocket/heartBeat.ts` - Already used configuration
- `webSocket/webScoket.ts` - Already used configuration

## ⚡ Quick Reference

### New npm Scripts

```bash
# Environment management
npm run env:dev      # Switch to development
npm run env:prod     # Switch to production
npm run env:setup    # Interactive setup
npm run validate-env # Validate configuration

# Development with specific environments
npm run start:dev    # Start with dev environment
npm run start:prod   # Start with prod environment
npm run android:dev  # Android dev build
npm run ios:prod     # iOS production build
```

### Configuration Access

```typescript
import { getConfig, configHelpers } from '../config/environment';

// Get full config
const config = getConfig();

// Get specific values
const apiUrl = config.apiUrl;
const wsUrl = config.wsUrl;
const environment = config.environment;

// Use helpers
const endpoint = configHelpers.getAPIEndpoint('/api/users');
const websocketUrl = configHelpers.getWebSocketURL();

// Check features
const notificationsEnabled = configHelpers.isFeatureEnabled('enableNotifications');
```

## 🎯 Common Migration Tasks

### Adding a New API Endpoint

**Old way:**
```typescript
const response = await fetch('http://192.168.1.10:5000/api/new-endpoint');
```

**New way:**
```typescript
import { configHelpers } from '../config/environment';
const endpoint = configHelpers.getAPIEndpoint('/api/new-endpoint');
const response = await fetch(endpoint);
```

### Adding a New Feature Flag

**Old way:**
```typescript
// Manual commenting/uncommenting
// if (someCondition) {
//   newFeature();
// }
```

**New way:**
1. Add to `.env` files:
   ```bash
   EXPO_PUBLIC_ENABLE_NEW_FEATURE=true
   ```

2. Use in code:
   ```typescript
   import { configHelpers } from '../config/environment';
   
   if (configHelpers.isFeatureEnabled('enableNewFeature')) {
     newFeature();
   }
   ```

### Environment-Specific Behavior

**Old way:**
```typescript
const isDev = __DEV__; // Expo's built-in
if (isDev) {
  // dev logic
}
```

**New way:**
```typescript
import { getConfig } from '../config/environment';
const config = getConfig();

if (config.environment === 'development') {
  // dev logic
} else if (config.environment === 'production') {
  // production logic
}
```

## ✅ Testing Your Migration

1. **Run validation:**
   ```bash
   npm run validate-env
   ```

2. **Test development:**
   ```bash
   npm run start:dev
   ```

3. **Test production config:**
   ```bash
   npm run env:prod && npm start
   ```

4. **Check console output:**
   - Look for configuration logging in debug mode
   - Verify API calls use correct endpoints

## 🆘 Need Help?

1. Check `ENVIRONMENT_SETUP.md` for detailed documentation
2. Run `npm run validate-env` to check for issues
3. Enable debug mode: `EXPO_PUBLIC_DEBUG_MODE=true npm start`
4. Review the troubleshooting section in the main documentation

## 🎉 Benefits of the New System

- ✅ Easy environment switching
- ✅ No more hardcoded URLs
- ✅ Type-safe configuration
- ✅ Centralized management
- ✅ Better development workflow
- ✅ Reduced configuration errors
- ✅ Easier testing and deployment