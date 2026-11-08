import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

/** Android 16 ignores orientation locks at this shortest-side breakpoint. */
const LARGE_SHORTEST_DP = 600;
/** Same value as expo-screen-orientation OrientationLock.PORTRAIT_UP. */
const PORTRAIT_UP = 3;

type OrientationNative = {
  lockAsync?: (lock: number) => Promise<void>;
  unlockAsync?: () => Promise<void>;
};

/**
 * Phones stay portrait. Tablets / unfolded foldables follow the user,
 * which is what Play asks for on large screens. iOS still uses app.json.
 * Skip when the native module is missing (Expo Go / a JS reload without a
 * matching native build).
 */
export function useCompactPortraitLock() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const native = requireOptionalNativeModule('ExpoScreenOrientation') as OrientationNative | null;
    if (!native?.lockAsync) return;

    const apply = () => {
      const { width, height } = Dimensions.get('window');
      const compact = Math.min(width, height) < LARGE_SHORTEST_DP;
      if (compact) {
        void native.lockAsync?.(PORTRAIT_UP);
      } else {
        void native.unlockAsync?.();
      }
    };

    apply();
    const sub = Dimensions.addEventListener('change', apply);
    return () => sub.remove();
  }, []);
}
