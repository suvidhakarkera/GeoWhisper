// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
  ENDPOINTS: {
    AUTH: {
      HEALTH: '/api/auth/health',
      SIGNUP: '/api/auth/signup',
      SIGNIN: '/api/auth/signin',
      GOOGLE: '/api/auth/google',
      VERIFY: '/api/auth/verify',
      PROFILE: (firebaseUid: string) => `/api/auth/profile/${firebaseUid}`,
    },
    POSTS: {
      CREATE: '/api/posts',
      NEARBY: '/api/posts/nearby',
      USER: (userId: string) => `/api/posts/user/${userId}`,
    },
  },
  TIMEOUT: 30000, // 30 seconds
};

// Export base URL for convenience
export const API_BASE_URL = `${API_CONFIG.BASE_URL}/api`;

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
