import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import auth from './firebaseAuth';

const storage = getStorage(auth.app);
const UPLOAD_TIMEOUT_MS = 30000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Read a local file URI (file://, content://, ph://) as a Blob.
 *
 * We use XMLHttpRequest instead of fetch().blob() because it is the
 * Firebase-recommended, most reliable way to turn a local RN URI into a
 * Blob across iOS/Android (fetch().blob() is flaky on some RN versions).
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to read local image file.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Upload a local image to Firebase Storage and return its public download URL.
 *
 * The path MUST live under users/{uid}/... so it passes the Storage
 * security rules (each user may only write to their own folder).
 *
 * @param localUri Local device URI from the image picker.
 * @param subfolder Folder under the user's namespace (e.g. 'pets', 'notes').
 * @returns The https download URL to persist.
 */
export async function uploadImage(localUri: string, subfolder = 'uploads'): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const blob = await uriToBlob(localUri);
  try {
    const path = `users/${user.uid}/${subfolder}/${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    await withTimeout(
      uploadBytes(storageRef, blob, {
        contentType: (blob as any).type || 'image/jpeg',
      }),
      UPLOAD_TIMEOUT_MS,
      'Image upload timed out.',
    );
    return await withTimeout(
      getDownloadURL(storageRef),
      UPLOAD_TIMEOUT_MS,
      'Image upload timed out while fetching the download URL.',
    );
  } finally {
    // Free native memory held by the RN Blob (no-op on web).
    (blob as any).close?.();
  }
}

/** Thin wrapper: upload a pet photo under users/{uid}/pets/. */
export function uploadPetPhoto(localUri: string): Promise<string> {
  return uploadImage(localUri, 'pets');
}

/** Thin wrapper: upload a health-note image under users/{uid}/health/. */
export function uploadHealthNotePhoto(localUri: string): Promise<string> {
  return uploadImage(localUri, 'health');
}
