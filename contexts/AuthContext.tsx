import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Keys for SecureStore
const CREDENTIALS_KEY = 'user_credentials';
const ACCESS_TOKEN_KEY = 'access_token';

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
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- Auto-login with saved credentials
  const tryAutoLogin = async () => {
    try {
      // First check if we have a valid access_token
      const savedToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      if (savedToken) {
        // Validate token by fetching profile
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/profile/details`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${savedToken}`,
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
          setIsAuthenticated(true);
          console.log('✅ Auto-login successful with saved token');
          return true;
        }
      }

      // If token expired or invalid, try re-login with saved credentials
      const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
      if (savedCredentials) {
        const { email, password } = JSON.parse(savedCredentials);
        console.log('🔄 Attempting auto-login with saved credentials...');
        
        // Faculty API login
        const body = `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/Token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        const apiData = await response.json();
        const token = apiData.access_token || apiData.access_ttoken;
        
        if (response.ok && token) {
          await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
          setIsAuthenticated(true);
          
          // Fetch profile with new token
          const profileResponse = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/profile/details`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (profileResponse.ok) {
            const data = await profileResponse.json();
            setProfile({
              name: data.emri,
              surname: data.mbiemri,
              email: data.adresaf,
              faculty: data.fakulteti,
              group: data.group,
              birthdate: data.datelindja,
              image: data.image,
            });
          }
          
          console.log('✅ Auto-login successful with saved credentials');
          return true;
        } else {
          // Credentials no longer valid, clear them
          await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
          await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          console.log('❌ Saved credentials expired, cleared');
        }
      }
      
      return false;
    } catch (err) {
      console.log('🔥 Auto-login error:', err);
      return false;
    }
  };

  // --- listen for supabase session changes AND auto-login
  useEffect(() => {
    const initAuth = async () => {
      // Try auto-login first (Faculty API)
      const autoLoginSuccess = await tryAutoLogin();
      
      // Handle Supabase session
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          if (session) {
            fetchProfile(session);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.warn('⚠️ Supabase session error:', err);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          if (session) {
            fetchProfile(session);
            setIsAuthenticated(true);
          }
        });

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        console.warn('⚠️ Supabase not available, skipping auth');
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // --- fetch profile from supabase AND faculty API
  const fetchProfile = async (session: Session | null) => {
    // --- supabase profile
    if (session && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        const profileData = data as { emri?: string; mbiemri?: string; email?: string };
        setProfile(prev => ({
          ...prev,
          name: profileData.emri,
          surname: profileData.mbiemri,
          email: profileData.email,
        }));
      }
      if (error) console.log('Supabase profile fetch error:', error);
    }

    // --- faculty API profile
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/profile/details`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok) {
          setProfile(prev => ({
            ...prev,
            name: data.emri,
            surname: data.mbiemri,
            email: data.adresaf,
            faculty: data.fakulteti,
            group: data.group,
            birthdate: data.datelindja,
            image: data.image,
          }));
        } else {
          console.log('Faculty API fetch profile error:', data);
        }
      } catch (err) {
        console.log('Faculty API fetch error:', err);
      }
    }
  };

  // --- combined sign in with credential saving for auto-login
  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    let error: any = null;
    let facultyLoginOk = false;

    // 1️⃣ Supabase login
    if (supabase) {
      try {
        const { data, error: supaError } = await supabase.auth.signInWithPassword({ email, password });
        if (!supaError && data.session) {
          setSession(data.session);
          setIsAuthenticated(true);
          await fetchProfile(data.session);
        } else if (supaError) {
          console.log('⚠️ Supabase login failed:', supaError.message);
          error = { message: 'Email ose fjalëkalimi është i gabuar' };
        }
      } catch (err) {
        console.log('🔥 Supabase login exception:', err);
        error = { message: 'Lidhja me serverin dështoi. Kontrolloni internetin.' };
      }
    }

    // 2️⃣ Faculty API login
    try {
      const body = `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/Token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const apiData = await response.json();
      const token = apiData.access_token || apiData.access_ttoken;
      if (response.ok && token) {
        facultyLoginOk = true;
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
        
        // 🔐 Save credentials securely for auto-login (always enabled for best UX)
        if (rememberMe) {
          await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ email, password }));
          console.log('✅ Credentials saved for auto-login');
        }
        
        setIsAuthenticated(true);
        await fetchProfile(session);
      } else {
        console.log('❌ Faculty API login failed:', apiData.error_description);
      }
    } catch (err) {
      console.log('🔥 Faculty API fetch error:', err);
    }

    // ✅ if faculty login works, ignore Supabase error
    if (facultyLoginOk) error = null;

    return { error };
  };


  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not available' } };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setProfile(null);
    setSession(null);
    setIsAuthenticated(false);
    
    // Clear all stored credentials and tokens
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    console.log('🚪 Logged out, credentials cleared');
  };


  return (
    <AuthContext.Provider value={{ session, loading, profile, isAuthenticated, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
