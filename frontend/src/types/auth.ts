// TypeScript types matching backend DTOs

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignInRequest {
  idToken: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface AuthResponse {
 
  firebaseUid: string;
  idToken: string;
  email: string;
  username: string;
  isNewUser: boolean;
  userData?: Record<string, any>;
  message: string;
  
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AuthError {
  message: string;
  code?: string;
}
