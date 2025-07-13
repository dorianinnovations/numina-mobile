import { Image } from 'react-native';

/**
 * Image Preloader Utility
 * Preloads all tutorial images on app start for instant loading
 */
class ImagePreloader {
  private preloadedImages: Set<string> = new Set();
  private preloadPromises: Map<string, Promise<boolean>> = new Map();

  /**
   * Preload a single image
   */
  async preloadImage(source: any): Promise<boolean> {
    try {
      if (!source) {
        return false;
      }
      
      const uri = typeof source === 'string' ? source : Image.resolveAssetSource(source)?.uri;
      
      if (!uri) {
        return false;
      }
      
      if (this.preloadedImages.has(uri)) {
        return true;
      }

      if (this.preloadPromises.has(uri)) {
        return this.preloadPromises.get(uri)!;
      }

      const promise = new Promise<boolean>((resolve) => {
        Image.prefetch(uri)
          .then(() => {
            this.preloadedImages.add(uri);
            resolve(true);
          })
          .catch(() => {
            resolve(false);
          });
      });

      this.preloadPromises.set(uri, promise);
      return promise;
    } catch (error) {
      return false;
    }
  }

  /**
   * Preload multiple images in parallel
   */
  async preloadImages(sources: any[]): Promise<boolean[]> {
    const promises = sources.map(source => this.preloadImage(source));
    return Promise.all(promises);
  }

  /**
   * Check if an image is preloaded
   */
  isPreloaded(source: any): boolean {
    try {
      if (!source) {
        return false;
      }
      const uri = typeof source === 'string' ? source : Image.resolveAssetSource(source)?.uri;
      return uri ? this.preloadedImages.has(uri) : false;
    } catch {
      return false;
    }
  }

  /**
   * Get preload progress for multiple images
   */
  getPreloadProgress(sources: any[]): number {
    const preloadedCount = sources.filter(source => this.isPreloaded(source)).length;
    return sources.length > 0 ? preloadedCount / sources.length : 1;
  }
}

export const imagePreloader = new ImagePreloader();
export default imagePreloader;