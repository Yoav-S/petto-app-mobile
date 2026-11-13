const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prefer React Native entry points so firebase/auth exports
// getReactNativePersistence on device (not the web/node build).
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Keep expo-router's Android Activity-relaunch linking race from spamming
  // "linking in multiple places" (dev-only false positive).
  if (
    moduleName === './useLinking' &&
    typeof context.originModulePath === 'string' &&
    context.originModulePath.replace(/\\/g, '/').includes('expo-router/build/fork/')
  ) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'metro-shims/expo-router-useLinking.native.js'),
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
