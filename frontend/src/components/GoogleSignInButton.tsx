/**
 * Google Sign-In Button Component
 * 
 * A reusable component for Google authentication with Firebase.
 * Handles the complete authentication flow with proper error handling.
 * 
 * Features:
 * - Sign in with Google popup
 * - Loading states
 * - Error handling with user-friendly messages
 * - Automatic backend integration
 * - TypeScript support
 */

'use client';

import { useState } from 'react';
import { signInWithPopup, UserCredential } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/config/firebase';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';

/**
 * Props for GoogleSignInButton component
 */
interface GoogleSignInButtonProps {
  /** Callback function called on successful sign-in */
  onSuccess?: (user: any, idToken: string) => void | Promise<void>;
  
  /** Callback function called on error */
  onError?: (error: Error) => void;
  
  /** Button text */
  text?: string;
  
  /** Whether this is for signup (true) or signin (false) */
  isSignUp?: boolean;
  
  /** Custom CSS classes */
  className?: string;
}

/**
 * Google Sign-In Button Component
 * 
 * Usage:
 * ```tsx
 * <GoogleSignInButton 
 *   onSuccess={async (user, idToken) => {
 *     console.log('User signed in:', user);
 *     // Send to backend, redirect, etc.
 *   }}
 *   onError={(error) => console.error(error)}
 *   text="Sign in with Google"
 * />
 * ```
 */
export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'Continue with Google',
  isSignUp = false,
  className = '',
}: GoogleSignInButtonProps) {
  // Loading state for button
  const [isLoading, setIsLoading] = useState(false);
  
  // Error message to display to user
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * Handle Google Sign-In button click
   * 
   * Flow:
   * 1. Check if Firebase is configured
   * 2. Open Google sign-in popup
   * 3. Get user credentials from Firebase
   * 4. Extract user info and ID token
   * 5. Call onSuccess callback with user data
   * 6. Handle any errors that occur
   */
  const handleGoogleSignIn = async () => {
    // Clear any previous error messages
    setErrorMessage('');
    
    // Validate Firebase configuration
    if (!isFirebaseConfigured()) {
      const error = new Error(
        'Google Sign-In is not configured. Please contact the administrator.'
      );
      console.error('❌ Firebase not configured');
      setErrorMessage(error.message);
      onError?.(error);
      return;
    }

    // Validate Firebase Auth and Google Provider
    if (!auth || !googleProvider) {
      const error = new Error(
        'Google Sign-In is not available. Please try again later.'
      );
      console.error('❌ Firebase Auth or Google Provider not initialized');
      setErrorMessage(error.message);
      onError?.(error);
      return;
    }

    // Set loading state
    setIsLoading(true);
    console.log('🔄 Initiating Google Sign-In...');

    try {
      // Open Google Sign-In popup
      // This will show a popup where user can select their Google account
      console.log('📱 Opening Google Sign-In popup...');
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      
      // Get user object from result
      const user = result.user;
      console.log('✅ Google Sign-In successful!');
      console.log('👤 User Info:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });

      // Get Firebase ID token (JWT)
      // This token will be sent to backend for verification
      console.log('🔑 Getting Firebase ID token...');
      const idToken = await user.getIdToken();
      console.log('✅ ID token obtained');

      // Prepare user data object
      const userData = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
      };

      // Call success callback if provided
      if (onSuccess) {
        console.log('📤 Calling onSuccess callback...');
        await onSuccess(userData, idToken);
      }

      console.log('🎉 Google Sign-In flow completed successfully!');

    } catch (error: any) {
      // Handle different types of errors
      console.error('❌ Google Sign-In error:', error);

      let userFriendlyMessage = '';

      // Firebase error codes
      if (error.code === 'auth/popup-closed-by-user') {
        userFriendlyMessage = 'Sign-in cancelled. Please try again.';
        console.log('ℹ️ User closed the popup');
      } else if (error.code === 'auth/popup-blocked') {
        userFriendlyMessage = 'Popup blocked. Please allow popups for this site.';
        console.error('⚠️ Popup was blocked by browser');
      } else if (error.code === 'auth/unauthorized-domain') {
        userFriendlyMessage = 'This domain is not authorized. Please contact support.';
        console.error('⚠️ Domain not authorized in Firebase Console');
      } else if (error.code === 'auth/operation-not-allowed') {
        userFriendlyMessage = 'Google Sign-In is disabled. Please contact support.';
        console.error('⚠️ Google Sign-In not enabled in Firebase Console');
      } else if (error.code === 'auth/api-key-not-valid') {
        userFriendlyMessage = 'Invalid API key. Please check your configuration.';
        console.error('⚠️ Firebase API key is invalid');
      } else if (error instanceof Error) {
        userFriendlyMessage = error.message;
      } else {
        userFriendlyMessage = 'Google sign-in failed. Please try again.';
      }

      setErrorMessage(userFriendlyMessage);

      // Call error callback if provided
      const errorObj = error instanceof Error ? error : new Error(userFriendlyMessage);
      onError?.(errorObj);

    } finally {
      // Always reset loading state
      setIsLoading(false);
      console.log('🏁 Sign-in flow completed');
    }
  };

  return (
    <div className="w-full">
      {/* Google Sign-In Button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`
          w-full flex items-center justify-center gap-3 px-4 py-3
          bg-white hover:bg-gray-50 text-gray-700
          border-2 border-gray-200 hover:border-gray-300
          rounded-lg font-medium transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
        type="button"
      >
        {/* Show loader or Google icon based on loading state */}
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
        ) : (
          <FcGoogle className="w-5 h-5" />
        )}
        
        {/* Button text */}
        <span className="text-sm sm:text-base">
          {isLoading ? 'Signing in...' : text}
        </span>
      </button>

      {/* Error message display */}
      {errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 text-center">
            ⚠️ {errorMessage}
          </p>
        </div>
      )}

      {/* Helper text for configuration issues */}
      {!isFirebaseConfigured() && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-700 text-center">
            ℹ️ Google Sign-In needs to be configured. Please check the console for details.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Example Usage:
 * 
 * ```tsx
 * import GoogleSignInButton from '@/components/GoogleSignInButton';
 * import { useRouter } from 'next/navigation';
 * 
 * function MySignInPage() {
 *   const router = useRouter();
 * 
 *   const handleSuccess = async (user: any, idToken: string) => {
 *     // Send token to your backend
 *     const response = await fetch('/api/auth/google', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ idToken }),
 *     });
 * 
 *     if (response.ok) {
 *       router.push('/dashboard');
 *     }
 *   };
 * 
 *   return (
 *     <GoogleSignInButton
 *       onSuccess={handleSuccess}
 *       onError={(error) => console.error(error)}
 *       text="Sign in with Google"
 *     />
 *   );
 * }
 * ```
 */
