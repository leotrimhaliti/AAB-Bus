import { ErrorBoundary } from '@/components/ErrorBoundary';
import SplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { preloadImages } from '@/utils/imagePreloader';
import * as Sentry from '@sentry/react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    sendDefaultPii: true,
    enableLogs: true,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [Sentry.mobileReplayIntegration()],
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
  });
}

// Preload images on app start
preloadImages().catch(() => { });

function RootNavigator() {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [loading, isAuthenticated]);

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
        name="(tabs)"
        options={{
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  useFrameworkReady();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="auto" />
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default SENTRY_DSN ? Sentry.wrap(RootLayout) : RootLayout;