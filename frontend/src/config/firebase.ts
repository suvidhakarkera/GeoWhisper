/**
 * Firebase Configuration and Initialization
 * 
 * This file handles Firebase app initialization for the client-side.
 * It uses Firebase v9+ modular SDK for better tree-shaking and smaller bundle size.
 * 
 * Environment variables are loaded from .env.local file.
 * All variables must be prefixed with NEXT_PUBLIC_ to be accessible in the browser.
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';

/**
 * Firebase configuration object
 * These values are loaded from environment variables in .env.local
 * 
 * To get these values:
 * 1. Go to Firebase Console: https://console.firebase.google.com
 * 2. Select your project (geowhisper-1)
 * 3. Go to Project Settings (gear icon) > General tab
 * 4. Scroll to "Your apps" section
 * 5. If no web app exists, click "Add app" and select Web (</> icon)
 * 6. Copy the config values from the SDK setup
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

/**
 * Helper function to check if Firebase is properly configured
 * Returns true only if all required config values are present
 */
const isFirebaseConfigured = (): boolean => {
  const { apiKey, authDomain, projectId, appId, storageBucket, messagingSenderId } = firebaseConfig;

  // Basic presence checks
  const hasAll = !!(apiKey && authDomain && projectId && appId);

  // Guard against placeholder or obviously invalid values
  const looksReal =
    /^AIza[A-Za-z0-9_\-]{10,}$/.test(apiKey) && // API keys from Firebase start with AIza
    !/your-/.test(authDomain + projectId + (storageBucket || '') + (messagingSenderId || '') + appId) &&
    /\./.test(authDomain) &&
    /^1:\d+:web:/.test(appId);

  const isConfigured = hasAll && looksReal;

  // Log configuration status for debugging
  if (typeof window !== 'undefined') {
    if (isConfigured) {
      console.log('✅ Firebase is properly configured');
      console.log('📝 Project ID:', projectId);
      console.log('📝 Auth Domain:', authDomain);
    } else {
      // Use warn instead of error to avoid Next.js red error overlay during local dev
      console.warn('❌ Firebase is NOT configured!');
      console.warn('Missing/invalid values:', {
        apiKeyLooksValid: /^AIza/.test(apiKey),
        authDomain,
        projectId,
        appIdStartsWith1Web: /^1:\d+:web:/.test(appId),
      });
    }
  }

  return isConfigured;
};

/**
 * Initialize Firebase App
 * Only runs on client-side (browser) and if config is valid
 */
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Only initialize on client-side (not during SSR)
if (typeof window !== 'undefined') {
  if (isFirebaseConfigured()) {
    try {
      // Check if Firebase app is already initialized
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log('✅ Firebase App initialized successfully');
      } else {
        app = getApps()[0];
        console.log('✅ Firebase App already initialized');
      }
      
      // Initialize Firebase Authentication
      auth = getAuth(app);
      console.log('✅ Firebase Auth initialized');
      
      // Initialize Google Auth Provider
      googleProvider = new GoogleAuthProvider();
      
      // Configure Google Provider to always show account selection
      // This ensures users can choose which Google account to use
      googleProvider.setCustomParameters({
        prompt: 'select_account' // Forces account selection every time
      });
      
      console.log('✅ Google Auth Provider configured');
      
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
    }
  } else {
    console.warn(
      '⚠️ Firebase is not configured!\n' +
      '📋 Please follow these steps:\n' +
      '1. Copy .env.example to .env.local\n' +
      '2. Get Firebase config from: https://console.firebase.google.com/project/geowhisper-1/settings/general\n' +
      '3. Update .env.local with real values\n' +
      '4. Restart the development server\n' +
      '\nSee FIREBASE_SETUP.md for detailed instructions.'
    );
  }
}

/**
 * Export Firebase instances for use in components
 * 
 * Usage:
 * import { auth, googleProvider } from '@/config/firebase';
 * import { signInWithPopup } from 'firebase/auth';
 * 
 * const result = await signInWithPopup(auth, googleProvider);
 */
export { auth, googleProvider, isFirebaseConfigured };

// Extra: export a status helper for UI diagnostics
export const firebaseConfigStatus = () => {
  const keys = {
    NEXT_PUBLIC_FIREBASE_API_KEY: !!firebaseConfig.apiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!firebaseConfig.authDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!firebaseConfig.projectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!firebaseConfig.storageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!firebaseConfig.messagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!firebaseConfig.appId,
  };
  return {
    ok: isFirebaseConfigured(),
    projectId: firebaseConfig.projectId,
    keys,
  };
};
