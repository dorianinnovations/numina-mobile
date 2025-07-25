// 3D Model Registry for React Native Metro Bundler
// This ensures all GLB models and HDR environments are properly bundled

import { Asset } from 'expo-asset';

export interface ModelInfo {
  name: string;
  emoji: string;
  description: string;
  asset: any; // require() result
  uri?: string; // resolved URI
}

// Pre-load all models to ensure Metro bundler includes them
const MODEL_REGISTRY: Record<string, ModelInfo> = {
  spinning_rings: {
    name: 'Spinning Rings',
    emoji: '🔄',
    description: 'Animated spinning ring geometry',
    asset: require('../../../assets/models/spinning_rings.glb')
  },
  uxr_circle: {
    name: 'UXR Circle Ring',
    emoji: '⭕',
    description: 'UXR circle rotating ring',
    asset: require('../../../assets/models/uxr_circle_rotating_ring.glb')
  },
  sphere: {
    name: 'Sphere',
    emoji: '🌐',
    description: 'Simple sphere geometry',
    asset: require('../../../assets/models/sphere.glb')
  },
  sphere_shading: {
    name: 'Sphere Shading Practice',
    emoji: '🎨',
    description: 'Sphere with shading practice',
    asset: require('../../../assets/models/sphere_shading_practice.glb')
  },
  triangular_tiles: {
    name: 'Triangular Tiles',
    emoji: '🔺',
    description: 'Triangular tiles on ico sphere',
    asset: require('../../../assets/models/triangular_tiles_on_ico_sphere_2.glb')
  }
};

export const getModelAsset = async (modelKey: string): Promise<string> => {
  const model = MODEL_REGISTRY[modelKey];
  if (!model) {
    console.warn(`Model "${modelKey}" not found in registry`);
    return getModelAsset('spinning_rings'); // Fallback
  }
  
  // Resolve the asset to get actual URI
  try {
    const asset = Asset.fromModule(model.asset);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  } catch (error) {
    console.error(`Failed to resolve asset for model ${modelKey}:`, error);
    throw error;
  }
};

export const getModelInfo = (modelKey: string): ModelInfo => {
  return MODEL_REGISTRY[modelKey] || MODEL_REGISTRY.spinning_rings;
};

export const getAllModels = (): Record<string, ModelInfo> => {
  return MODEL_REGISTRY;
};

export const getAvailableModelKeys = (): string[] => {
  return Object.keys(MODEL_REGISTRY);
};

// HDR Environment Registry
export const HDR_ENVIRONMENTS = {
  kloofendal: require('../../../assets/models/kloofendal_48d_partly_cloudy_puresky_4k.hdr'),
  wasteland: require('../../../assets/models/wasteland_clouds_puresky_16k.hdr'),
  newonkk: require('../../../assets/models/newonkk.hdr')
};

export const getHDREnvironment = async (key: string = 'kloofendal'): Promise<string> => {
  try {
    const hdrAsset = HDR_ENVIRONMENTS[key as keyof typeof HDR_ENVIRONMENTS];
    if (!hdrAsset) {
      console.warn(`HDR environment "${key}" not found`);
      return '';
    }
    
    const asset = Asset.fromModule(hdrAsset);
    await asset.downloadAsync();
    return asset.localUri || asset.uri;
  } catch (error) {
    console.error(`Failed to resolve HDR environment ${key}:`, error);
    return '';
  }
};