import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  authToken: string | null;
  firebaseUid: string | null;
  userEmail: string | null;
  username: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    authToken: null,
    firebaseUid: null,
    userEmail: null,
    username: null,
  });

  useEffect(() => {
    // Check for auth data in localStorage or sessionStorage
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    const uid = localStorage.getItem('firebaseUid') || sessionStorage.getItem('firebaseUid');
    const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
    const user = localStorage.getItem('username') || sessionStorage.getItem('username');

    if (token && uid) {
      setAuthState({
        isAuthenticated: true,
        authToken: token,
        firebaseUid: uid,
        userEmail: email,
        username: user,
      });
    }
  }, []);

  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('firebaseUid');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('username');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('firebaseUid');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('username');

    setAuthState({
      isAuthenticated: false,
      authToken: null,
      firebaseUid: null,
      userEmail: null,
      username: null,
    });
  };

  return {
    ...authState,
    logout,
  };
};
