import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

/** Android 16 ignores orientation locks at this shortest-side breakpoint. */
const LARGE_SHORTEST_DP = 600;

/**
 * Phones stay portrait. Tablets / unfolded foldables follow the user,
 * which is what Play asks for on large screens. iOS still uses app.json.
 */
export function useCompactPortraitLock() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const apply = () => {
      const { width, height } = Dimensions.get('window');
      const compact = Math.min(width, height) < LARGE_SHORTEST_DP;
      if (compact) {
        void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        void ScreenOrientation.unlockAsync();
      }
    };

    apply();
    const sub = Dimensions.addEventListener('change', apply);
    return () => sub.remove();
  }, []);
}
