'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';

export interface UserData {
  firebaseUid: string;
  email: string;
  username: string;
  createdAt?: string;
  totalPosts: number;
  totalReactions: number;
  zonesVisited: number;
}

interface UserContextType {
  user: UserData | null;
  authToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (authToken: string, userData: UserData) => void;
  logout: () => void;
  updateUserData: (updates: Partial<UserData>) => void;
  refreshUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user data from storage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        // Check localStorage first, then sessionStorage
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const storedUser = localStorage.getItem('userData') || sessionStorage.getItem('userData');

        if (token && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setAuthToken(token);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        // Clear corrupted data
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = (token: string, userData: UserData) => {
    setAuthToken(token);
    setUser(userData);

    // Store in localStorage (or sessionStorage based on "Remember Me")
    const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
    storage.setItem('authToken', token);
    storage.setItem('userData', JSON.stringify(userData));
    
    // Also store individual fields for backward compatibility
    storage.setItem('firebaseUid', userData.firebaseUid);
    storage.setItem('userEmail', userData.email);
    storage.setItem('username', userData.username);
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);

    // Clear all auth data from both storages
    ['authToken', 'userData', 'firebaseUid', 'userEmail', 'username', 'rememberMe'].forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  const updateUserData = (updates: Partial<UserData>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Update storage
      const storage = localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage;
      storage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const refreshUserProfile = async () => {
    if (!user?.firebaseUid) {
      return;
    }

    try {
      const response = await authService.getUserProfile(user.firebaseUid);
      if (response.data) {
        const updatedUser: UserData = {
          firebaseUid: user.firebaseUid,
          email: response.data.email || user.email,
          username: response.data.username || user.username,
          createdAt: response.data.createdAt,
          totalPosts: response.data.totalPosts || 0,
          totalReactions: response.data.totalReactions || 0,
          zonesVisited: response.data.zonesVisited || 0,
        };
        updateUserData(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        authToken,
        isAuthenticated: !!authToken && !!user,
        isLoading,
        login,
        logout,
        updateUserData,
        refreshUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
