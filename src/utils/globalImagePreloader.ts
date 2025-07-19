import { imagePreloader } from './imagePreloader';

/**
 * Global Image Preloader
 * Preloads critical images that are used across the app
 */

// App images for immediate preloading
const numinaLogo = require('../assets/images/chromelogo.png');
const happyNuminaImage = require('../assets/images/happynumina.png');
const numinaContentImage = require('../assets/images/numinacontent.png');
const numinaShadesImage = require('../assets/images/numinashades.png');
const numinaSmileImage = require('../assets/images/numinasmile.png');
const numinaMoonImage = require('../assets/images/numinamoonface.png');

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