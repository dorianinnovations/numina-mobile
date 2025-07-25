const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for GLB/GLTF and HDR files
config.resolver.assetExts.push('glb', 'gltf', 'bin', 'hdr', 'exr');

// Ensure 3D model files are treated as assets
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;