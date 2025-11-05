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
  const isConfigured = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );

  // Log configuration status for debugging
  if (typeof window !== 'undefined') {
    if (isConfigured) {
      console.log('✅ Firebase is properly configured');
      console.log('📝 Project ID:', firebaseConfig.projectId);
      console.log('📝 Auth Domain:', firebaseConfig.authDomain);
    } else {
      console.error('❌ Firebase is NOT configured!');
      console.error('Missing values:', {
        apiKey: !!firebaseConfig.apiKey,
        authDomain: !!firebaseConfig.authDomain,
        projectId: !!firebaseConfig.projectId,
        appId: !!firebaseConfig.appId,
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
