import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { preloadImages } from '@/utils/imagePreloader';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://0b16d05d1972f12c3418c8e788977d5d@o4510383110553600.ingest.de.sentry.io/4510383112061008',
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration()],
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  // Enable in development to see events
  beforeSend(event) {
    if (__DEV__) {
      console.log('📤 Sentry event captured:', event.message || event.exception);
    }
    return event; // Send events even in dev mode for testing
  },
});

// Preload images on app start
preloadImages().catch(err => console.warn('Image preload failed:', err));

function RootNavigator() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [session, loading]);

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade_from_bottom',
        animationDuration: 300,
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{
          animation: 'fade',
        }}
      />
      <Stack.Screen 
        name="signup" 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

export default Sentry.wrap(function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </ErrorBoundary>
  );
});