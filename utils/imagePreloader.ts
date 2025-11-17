import { Image } from 'react-native';
import { Asset } from 'expo-asset';

const imagesToPreload = [
  require('@/assets/images/aab-buss.png'),
  require('@/assets/images/logo.png'),
  require('@/assets/images/logobus.png'),
];

let imagesPreloaded = false;

/**
 * Preload all app images to improve performance and prevent flickering
 */
export async function preloadImages(): Promise<void> {
  if (imagesPreloaded) return;

  try {
    // Preload local images using Expo Asset
    const assetPromises = imagesToPreload.map(image => {
      return Asset.fromModule(image).downloadAsync();
    });

    // Preload using React Native Image
    const imagePromises = imagesToPreload.map(image => {
      return Image.prefetch(Image.resolveAssetSource(image).uri);
    });

    await Promise.all([...assetPromises, ...imagePromises]);
    imagesPreloaded = true;
    console.log('✅ All images preloaded successfully');
  } catch (error) {
    console.error('⚠️ Error preloading images:', error);
    // Don't throw - allow app to continue even if preloading fails
  }
}

/**
 * Check if images are preloaded
 */
export function areImagesPreloaded(): boolean {
  return imagesPreloaded;
}

/**
 * Reset preload state (useful for testing)
 */
export function resetPreloadState(): void {
  imagesPreloaded = false;
}
