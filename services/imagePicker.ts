/**
 * Safe ImagePicker entry points for iOS.
 *
 * Opening PHPicker / UIImagePicker while a React Native Modal (our bottom
 * sheets) is still dismissing presents the gallery twice and often crashes.
 */
import { InteractionManager, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  BOTTOM_SHEET_CLOSE_MS,
  BOTTOM_SHEET_IOS_GAP_MS,
} from '@/components/ui/BottomSheetModal';

const SHEET_CLOSE_MS =
  BOTTOM_SHEET_CLOSE_MS + BOTTOM_SHEET_IOS_GAP_MS + (Platform.OS === 'ios' ? 40 : 0);

let inFlight = false;

function waitForModalsToSettle(): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, SHEET_CLOSE_MS);
    });
  });
}

export type PickedImage = {
  uri: string;
  mimeType: string | null;
};

async function runExclusive<T>(fn: () => Promise<T>): Promise<T | null> {
  if (inFlight) return null;
  inFlight = true;
  try {
    await waitForModalsToSettle();
    return await fn();
  } finally {
    inFlight = false;
  }
}

const DEFAULT_LIBRARY: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.85,
  preferredAssetRepresentationMode:
    ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

/**
 * Request library permission + open gallery once.
 * Returns null if busy, denied, or cancelled.
 */
export async function pickImageFromLibrary(
  options: ImagePicker.ImagePickerOptions = {},
): Promise<PickedImage | null | 'denied'> {
  return runExclusive(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return 'denied';

    const result = await ImagePicker.launchImageLibraryAsync({
      ...DEFAULT_LIBRARY,
      ...options,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    return {
      uri: result.assets[0].uri,
      mimeType: result.assets[0].mimeType ?? null,
    };
  });
}

/**
 * Request camera permission + open camera once.
 * Returns null if busy, denied, or cancelled.
 */
export async function pickImageFromCamera(
  options: ImagePicker.ImagePickerOptions = {},
): Promise<PickedImage | null | 'denied'> {
  return runExclusive(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return 'denied';

    const result = await ImagePicker.launchCameraAsync({
      ...DEFAULT_LIBRARY,
      ...options,
    });
    if (result.canceled || !result.assets[0]?.uri) return null;
    return {
      uri: result.assets[0].uri,
      mimeType: result.assets[0].mimeType ?? null,
    };
  });
}
