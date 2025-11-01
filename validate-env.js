#!/usr/bin/env node

/**
 * Environment Configuration Validator
 * Validates that all required environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

// Load .env file if it exists
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateURL(url, name) {
  try {
    new URL(url);
    log(`✅ ${name}: ${url}`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${name}: Invalid URL - ${url}`, colors.red);
    return false;
  }
}

function checkEnvironmentFile() {
  log('\n📁 Checking environment files...', colors.cyan);
  
  const envFiles = ['.env', '.env.development', '.env.production'];
  let foundFiles = [];
  
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ Found: ${file}`, colors.green);
      foundFiles.push(file);
    } else {
      log(`⚪ Missing: ${file}`, colors.yellow);
    }
  });
  
  return foundFiles.length > 0;
}

function validateConfiguration() {
  log('\n🔧 Validating configuration...', colors.cyan);
  
  let isValid = true;
  
  // Check API URLs
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL;
  
  if (!apiUrl) {
    log('❌ EXPO_PUBLIC_API_URL not configured', colors.red);
    isValid = false;
  } else {
    isValid &= validateURL(apiUrl, 'API URL');
  }
  
  if (!wsUrl) {
    log('❌ EXPO_PUBLIC_WS_URL not configured', colors.red);
    isValid = false;
  } else {
    isValid &= validateURL(wsUrl, 'WebSocket URL');
  }
  
  // Check feature flags
  log('\n🎛️  Feature flags:', colors.cyan);
  log(`   Notifications: ${process.env.EXPO_PUBLIC_ENABLE_NOTIFICATIONS || 'true'}`, colors.blue);
  log(`   WebSocket: ${process.env.EXPO_PUBLIC_ENABLE_WEBSOCKET || 'true'}`, colors.blue);
  log(`   Analytics: ${process.env.EXPO_PUBLIC_ENABLE_ANALYTICS || 'false'}`, colors.blue);
  log(`   Debug Mode: ${process.env.EXPO_PUBLIC_DEBUG_MODE || 'false'}`, colors.blue);
  
  // Check environment-specific settings
  const env = process.env.EXPO_PUBLIC_ENVIRONMENT || 'development';
  log(`\n🌍 Environment: ${env}`, colors.magenta);
  
  if (env === 'production') {
    if (process.env.EXPO_PUBLIC_DEBUG_MODE === 'true') {
      log('⚠️  WARNING: Debug mode is enabled in production!', colors.yellow);
    }
    
    if (!process.env.EXPO_PUBLIC_SENTRY_DSN) {
      log('⚠️  WARNING: Sentry DSN not configured for production', colors.yellow);
    }
  }
  
  return isValid;
}

function checkConfigurationFiles() {
  log('\n📋 Checking configuration files...', colors.cyan);
  
  const requiredFiles = [
    'config/environment.ts',
    'config/api.config.ts'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, colors.green);
    } else {
      log(`❌ ${file} missing`, colors.red);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function main() {
  log('🔍 MeetFlow Environment Configuration Validator', colors.cyan);
  log('====================================================\n');
  
  let isValid = true;
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    log('❌ package.json not found. Make sure you\'re in the project root.', colors.red);
    process.exit(1);
  }
  
  // Check environment files
  isValid &= checkEnvironmentFile();
  
  // Check configuration files
  isValid &= checkConfigurationFiles();
  
  // Validate configuration
  isValid &= validateConfiguration();
  
  // Final result
  log('\n' + '='.repeat(50), colors.cyan);
  if (isValid) {
    log('🎉 Configuration is valid!', colors.green);
    log('✅ Environment is ready for development/deployment', colors.green);
  } else {
    log('❌ Configuration has issues that need to be fixed.', colors.red);
    log('💡 Run "./setup-env.sh help" for setup instructions', colors.blue);
  }
  
  process.exit(isValid ? 0 : 1);
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateConfiguration, checkEnvironmentFile };