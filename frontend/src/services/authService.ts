import { API_CONFIG, buildUrl } from '@/config/api';
import {
  SignUpRequest,
  SignInRequest,
  GoogleAuthRequest,
  AuthResponse,
  ApiResponse,
} from '@/types/auth';
import { auth } from '@/config/firebase';
import { sendPasswordResetEmail, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';

class AuthService {
  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    const url = buildUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP);
    console.log('[AuthService] Sign up URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[AuthService] Sign up failed:', response.status, result);
        throw new Error(result.message || 'Sign up failed');
      }

      return result as AuthResponse;
    } catch (error) {
      console.error('[AuthService] Sign up error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Cannot reach server at ${url}. Please check your internet connection.`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during sign up');
    }
  }

  /**
   * Sign in with Firebase ID token
   */
  async signIn(idToken: string): Promise<AuthResponse> {
    const url = buildUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNIN);
    console.log('[AuthService] Sign in URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[AuthService] Sign in failed:', response.status, result);
        throw new Error(result.message || 'Sign in failed');
      }

      return result as AuthResponse;
    } catch (error) {
      console.error('[AuthService] Sign in error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Cannot reach server at ${url}. Please check your internet connection.`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during sign in');
    }
  }

  /**
   * Sign in/up with Google
   */
  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    const url = buildUrl(API_CONFIG.ENDPOINTS.AUTH.GOOGLE);
    console.log('[AuthService] Google auth URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[AuthService] Google auth failed:', response.status, result);
        throw new Error(result.message || 'Google authentication failed');
      }

      return result as AuthResponse;
    } catch (error) {
      console.error('[AuthService] Google auth error:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Network error: Cannot reach server at ${url}. Please check your internet connection.`);
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during Google authentication');
    }
  }

  /**
   * Verify Firebase ID token
   */
  async verifyToken(idToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Token verification failed');
      }

      return result as AuthResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during token verification');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(firebaseUid: string): Promise<ApiResponse> {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.ENDPOINTS.AUTH.PROFILE(firebaseUid)),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch user profile');
      }

      return result as ApiResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    firebaseUid: string,
    updates: Record<string, any>
  ): Promise<ApiResponse> {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.ENDPOINTS.AUTH.PROFILE(firebaseUid)),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update user profile');
      }

      return result as ApiResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while updating user profile');
    }
  }

  /**
   * Delete user account
   */
  async deleteUserAccount(firebaseUid: string): Promise<ApiResponse> {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.ENDPOINTS.AUTH.PROFILE(firebaseUid)),
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete user account');
      }

      return result as ApiResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while deleting user account');
    }
  }

  /**
   * Check health status
   */
  async checkHealth(): Promise<string> {
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.AUTH.HEALTH), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.text();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during health check');
    }
  }

  /**
   * Send password reset email
   * @param email - User's email address
   * @param redirectUrl - Optional URL to redirect after password reset (defaults to signin page)
   */
  async sendPasswordResetEmail(email: string, redirectUrl?: string): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured');
      }

      const actionCodeSettings = {
        url: redirectUrl || `${window.location.origin}/signin`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error: any) {
      // Re-throw Firebase errors with better messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Verify password reset code
   * @param code - The password reset code from the email link
   * @returns The email address associated with the code
   */
  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured');
      }

      const email = await verifyPasswordResetCode(auth, code);
      return email;
    } catch (error: any) {
      if (error.code === 'auth/expired-action-code') {
        throw new Error('This password reset link has expired');
      } else if (error.code === 'auth/invalid-action-code') {
        throw new Error('This password reset link is invalid or has already been used');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to verify password reset code');
    }
  }

  /**
   * Confirm password reset
   * @param code - The password reset code from the email link
   * @param newPassword - The new password to set
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not configured');
      }

      await confirmPasswordReset(auth, code, newPassword);
    } catch (error: any) {
      if (error.code === 'auth/expired-action-code') {
        throw new Error('This password reset link has expired');
      } else if (error.code === 'auth/invalid-action-code') {
        throw new Error('This password reset link is invalid or has already been used');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please choose a stronger password');
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to reset password');
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
