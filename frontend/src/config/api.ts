// API Configuration
// Determine the API base URL with priority:
// 1. NEXT_PUBLIC_API_BASE_URL env var (production)
// 2. Localhost for local development
// 3. Derive from hostname for LAN testing

const deriveBaseUrl = (): string => {
  // Priority 1: Use environment variable if set (production/staging)
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  
  // During SSR or build-time, fallback to production backend
  if (typeof window === 'undefined') {
    return 'https://geowhisper-50cy.onrender.com';
  }

  const host = window.location.hostname;
  const protocol = window.location.protocol;

  // Priority 2: Local development
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:8080';
  }

  // Priority 3: LAN testing (phone accessing dev machine on same network)
  // e.g., if frontend is at http://192.168.1.12:3000, backend will be http://192.168.1.12:8080
  return `${protocol}//${host}:8080`;
};

const baseUrl = deriveBaseUrl();
console.log('[API_CONFIG] Using BASE_URL:', baseUrl);
console.log('[API_CONFIG] Environment NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);

export const API_CONFIG = {
  BASE_URL: baseUrl,
  ENDPOINTS: {
    AUTH: {
      HEALTH: '/api/auth/health',
      SIGNUP: '/api/auth/signup',
      SIGNIN: '/api/auth/signin',
      GOOGLE: '/api/auth/google',
      VERIFY: '/api/auth/verify',
      PROFILE: (firebaseUid: string) => `/api/auth/profile/${firebaseUid}`,
    },
  },
  TIMEOUT: 30000, // 30 seconds
};

// Helper function to build full URL
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export base URL for backward compatibility
export const API_BASE_URL = API_CONFIG.BASE_URL;
