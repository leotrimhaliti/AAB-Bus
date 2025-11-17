import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // --- listen for supabase session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) fetchProfile(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- fetch profile from supabase AND faculty API
  const fetchProfile = async (session: Session | null) => {
    // --- supabase profile
    if (session) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(prev => ({
          ...prev,
          name: data.emri,
          surname: data.mbiemri,
          email: data.email,
        }));
      }
      if (error) console.log('Supabase profile fetch error:', error);
    }

    // --- faculty API profile
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      try {
        const response = await fetch('https://testapieservice.uniaab.com/api/profile/details', {
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

  // --- combined sign in
  const signIn = async (email: string, password: string) => {
  let error: any = null;
  let facultyLoginOk = false;

  // 1️⃣ Supabase login
  try {
    const { data, error: supaError } = await supabase.auth.signInWithPassword({ email, password });
    if (!supaError && data.session) {
      setSession(data.session);
      await fetchProfile(data.session);
    } else if (supaError) {
      console.log('⚠️ Supabase login failed:', supaError.message);
      error = { message: 'Email ose fjalëkalimi është i gabuar' };
    }
  } catch (err) {
    console.log('🔥 Supabase login exception:', err);
    error = { message: 'Lidhja me serverin dështoi. Kontrolloni internetin.' };
  }

  // 2️⃣ Faculty API login
  try {
    const body = `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const response = await fetch('https://testapieservice.uniaab.com/Token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const apiData = await response.json();
    const token = apiData.access_token || apiData.access_ttoken;
    if (response.ok && token) {
      facultyLoginOk = true;
      await SecureStore.setItemAsync('access_token', token);
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
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signOut = async () => {
  await supabase.auth.signOut();
  setProfile(null);
  setSession(null);
  await SecureStore.deleteItemAsync('access_token');
};


  return (
    <AuthContext.Provider value={{ session, loading, profile, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
