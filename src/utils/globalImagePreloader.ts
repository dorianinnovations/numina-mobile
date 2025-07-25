import { imagePreloader } from './imagePreloader';

/**
 * Global Image Preloader
 * Preloads critical images that are used across the app
 */

// App images for immediate preloading
const numinaLogo = require('../assets/chromelogo.png');
const happyNuminaImage = require('../assets/happynumina.png');
const numinaContentImage = require('../assets/numinacontent.png');
const numinaShadesImage = require('../assets/numinashades.png');
const numinaSmileImage = require('../assets/numinasmile.png');
const numinaMoonImage = require('../assets/numinamoonface.png');

const criticalImages = [
  numinaLogo,
  happyNuminaImage,
  numinaContentImage, 
  numinaShadesImage,
  numinaSmileImage,
  numinaMoonImage,
];

export const preloadCriticalImages = async (): Promise<void> => {
  try {
    await imagePreloader.preloadImages(criticalImages);
  } catch (error) {
    // Silently handle preload errors
  }
};

export default preloadCriticalImages;