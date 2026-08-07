const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prefer React Native entry points so firebase/auth exports
// getReactNativePersistence on device (not the web/node build).
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
