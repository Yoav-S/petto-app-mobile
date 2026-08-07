import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

function getNativePersistence(): Persistence | null {
  if (Platform.OS === 'web') return null;
  try {
    // Present on the React Native Auth build; missing on web/node builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const authMod = require('firebase/auth') as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    };
    if (typeof authMod.getReactNativePersistence === 'function') {
      return authMod.getReactNativePersistence(AsyncStorage);
    }
  } catch {
    // fall through
  }
  return null;
}

function createAuth(): Auth {
  const persistence = getNativePersistence();
  if (persistence) {
    try {
      return initializeAuth(app, { persistence });
    } catch {
      // Auth already initialized (fast refresh / second import).
      return getAuth(app);
    }
  }
  return getAuth(app);
}

const auth = createAuth();

export default auth;
