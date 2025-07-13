import { imagePreloader } from './imagePreloader';

/**
 * Global Image Preloader
 * Preloads critical images that are used across the app
 */

// Critical app images that should be preloaded immediately
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