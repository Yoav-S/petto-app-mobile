import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import auth from './firebaseAuth';

const storage = getStorage(auth.app);

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
 * Upload a pet photo to Firebase Storage and return its public download URL.
 *
 * The path MUST live under users/{uid}/... so it passes the Storage
 * security rules (each user may only write to their own folder).
 *
 * @param localUri Local device URI from the image picker.
 * @returns The https download URL to persist as pet.photo_url.
 */
export async function uploadPetPhoto(localUri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const blob = await uriToBlob(localUri);
  try {
    const path = `users/${user.uid}/pets/${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, {
      contentType: (blob as any).type || 'image/jpeg',
    });
    return await getDownloadURL(storageRef);
  } finally {
    // Free native memory held by the RN Blob (no-op on web).
    (blob as any).close?.();
  }
}
