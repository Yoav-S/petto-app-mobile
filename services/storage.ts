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

/** Prefer a real image/* type; never upload HEIC labeled as JPEG. */
function resolveImageMeta(localUri: string, mimeHint?: string | null): {
  ext: string;
  contentType: string;
} {
  const mime = (mimeHint || '').split(';')[0].trim().toLowerCase();
  if (mime.startsWith('image/')) {
    if (mime === 'image/jpg' || mime === 'image/jpeg') {
      return { ext: 'jpg', contentType: 'image/jpeg' };
    }
    if (mime === 'image/png') return { ext: 'png', contentType: 'image/png' };
    if (mime === 'image/webp') return { ext: 'webp', contentType: 'image/webp' };
    if (mime === 'image/gif') return { ext: 'gif', contentType: 'image/gif' };
    if (mime === 'image/heic' || mime === 'image/heif') {
      // Keep container honest so decoders don't treat HEIC bytes as JPEG.
      return { ext: mime === 'image/heif' ? 'heif' : 'heic', contentType: mime };
    }
    const subtype = mime.slice('image/'.length).replace(/[^a-z0-9]+/g, '') || 'jpg';
    return { ext: subtype === 'jpeg' ? 'jpg' : subtype, contentType: mime };
  }

  const match = localUri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const extRaw = (match?.[1] || 'jpg').toLowerCase();
  if (extRaw === 'png') return { ext: 'png', contentType: 'image/png' };
  if (extRaw === 'webp') return { ext: 'webp', contentType: 'image/webp' };
  if (extRaw === 'gif') return { ext: 'gif', contentType: 'image/gif' };
  if (extRaw === 'heic') return { ext: 'heic', contentType: 'image/heic' };
  if (extRaw === 'heif') return { ext: 'heif', contentType: 'image/heif' };
  return { ext: 'jpg', contentType: 'image/jpeg' };
}

/**
 * Upload a local image to Firebase Storage and return its public download URL.
 *
 * The path MUST live under users/{uid}/... so it passes the Storage
 * security rules (each user may only write to their own folder).
 *
 * @param localUri Local device URI from the image picker.
 * @param subfolder Folder under the user's namespace (e.g. 'pets', 'notes').
 * @param mimeHint Optional MIME from the image picker asset.
 * @returns The https download URL to persist.
 */
export async function uploadImage(
  localUri: string,
  subfolder = 'uploads',
  mimeHint?: string | null,
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const { ext, contentType } = resolveImageMeta(localUri, mimeHint);
  const blob = await uriToBlob(localUri);
  try {
    const path = `users/${user.uid}/${subfolder}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const blobType = ((blob as { type?: string }).type || '').trim();
    await withTimeout(
      uploadBytes(storageRef, blob, {
        contentType: blobType.startsWith('image/') ? blobType : contentType,
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
    (blob as { close?: () => void }).close?.();
  }
}

/** Thin wrapper: upload a pet photo under users/{uid}/pets/. */
export function uploadPetPhoto(localUri: string, mimeHint?: string | null): Promise<string> {
  return uploadImage(localUri, 'pets', mimeHint);
}

/** Thin wrapper: upload a topic-note image under users/{uid}/health/. */
export function uploadHealthNotePhoto(localUri: string, mimeHint?: string | null): Promise<string> {
  return uploadImage(localUri, 'health', mimeHint);
}
