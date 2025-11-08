import { API_CONFIG, buildUrl } from '@/config/api';
import {
  SignUpRequest,
  SignInRequest,
  GoogleAuthRequest,
  AuthResponse,
  ApiResponse,
} from '@/types/auth';

class AuthService {
  /**
   * Sign up with email and password
   */
  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNUP), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Sign up failed');
      }

      return result as AuthResponse;
    } catch (error) {
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
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.AUTH.SIGNIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Sign in failed');
      }

      return result as AuthResponse;
    } catch (error) {
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
    try {
      const response = await fetch(buildUrl(API_CONFIG.ENDPOINTS.AUTH.GOOGLE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Google authentication failed');
      }

      return result as AuthResponse;
    } catch (error) {
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
}

// Export singleton instance
export const authService = new AuthService();
