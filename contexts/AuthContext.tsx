import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Keys for SecureStore
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface UserProfile {
  name?: string;
  surname?: string;
  email?: string;
  faculty?: string;
  group?: string;
  birthdate?: string;
  image?: string;
}

interface AuthContextType {
  loading: boolean;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch profile from Faculty API
  const fetchProfile = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/profile/details`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile({
          name: data.emri,
          surname: data.mbiemri,
          email: data.adresaf,
          faculty: data.fakulteti,
          group: data.group,
          birthdate: data.datelindja,
          image: data.image,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Try to refresh token
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const body = `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`;
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/Token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (response.ok) {
        const apiData = await response.json();
        const newAccessToken = apiData.access_token || apiData.access_ttoken;
        const newRefreshToken = apiData.refresh_token;

        if (newAccessToken) {
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken);
          if (newRefreshToken) {
            await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
          }
          return newAccessToken;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  // Auto-login with saved token
  const tryAutoLogin = async (): Promise<boolean> => {
    try {
      // First check if we have a valid access_token
      const savedToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (savedToken) {
        const profileSuccess = await fetchProfile(savedToken);
        if (profileSuccess) {
          setIsAuthenticated(true);
          return true;
        }
      }

      // Token might be expired, try to refresh
      const newToken = await refreshAccessToken();
      if (newToken) {
        const profileSuccess = await fetchProfile(newToken);
        if (profileSuccess) {
          setIsAuthenticated(true);
          return true;
        }
      }

      // Both failed - clear stored tokens
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      return false;
    } catch {
      return false;
    }
  };

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      await tryAutoLogin();
      setLoading(false);
    };
    initAuth();
  }, []);

  // Sign in with Faculty API only
  const signIn = async (email: string, password: string): Promise<{ error: { message: string } | null }> => {
    try {
      const body = `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/Token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const apiData = await response.json();
      const accessToken = apiData.access_token || apiData.access_ttoken;
      const refreshToken = apiData.refresh_token;

      if (response.ok && accessToken) {
        // Store tokens securely (NOT passwords!)
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
          await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
        }

        setIsAuthenticated(true);
        await fetchProfile(accessToken);
        return { error: null };
      }

      return { error: { message: apiData.error_description || 'Email ose fjalëkalimi është i gabuar' } };
    } catch {
      return { error: { message: 'Lidhja me serverin dështoi. Kontrolloni internetin.' } };
    }
  };

  const signOut = async () => {
    setProfile(null);
    setIsAuthenticated(false);

    // Clear all stored tokens
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ loading, profile, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
