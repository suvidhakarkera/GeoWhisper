// API Configuration
// Determine a sensible API base URL at runtime when possible.
// If `NEXT_PUBLIC_API_BASE_URL` is set that will be used. Otherwise,
// when running in the browser we derive a host-aware default so mobile
// devices can reach the backend on the development machine (LAN IP).
const DEFAULT_LOCALHOST = 'http://localhost:8080';

const deriveBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
  // During SSR or build-time fallback to localhost
  if (typeof window === 'undefined') return DEFAULT_LOCALHOST;

  const host = window.location.hostname;
  const protocol = window.location.protocol || 'http:';

  // If served from localhost, assume backend is on localhost:8080
  if (host === 'localhost' || host === '127.0.0.1') return DEFAULT_LOCALHOST;

  // For LAN testing (phone accessing dev machine), try same host with backend port 8080
  // e.g., if frontend is at http://192.168.1.12:3000, backend will be http://192.168.1.12:8080
  return `${protocol}//${host}:8080`;
};

export const API_CONFIG = {
  BASE_URL: deriveBaseUrl(),
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
