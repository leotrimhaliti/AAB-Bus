import { ErrorBoundary } from '@/components/ErrorBoundary';
import SplashScreen from '@/components/SplashScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { logScreenView } from '@/lib/analytics';
import { preloadImages } from '@/utils/imagePreloader';
import * as Sentry from '@sentry/react-native';
import { Stack, router, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';

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

  // Automatic screen tracking
  const pathname = usePathname();
  const segments = useSegments();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only log if the path actually changed
    if (pathname && pathname !== previousPathRef.current) {
      previousPathRef.current = pathname;

      // Convert pathname to a readable screen name
      // e.g., "/(tabs)" -> "Home", "/(tabs)/orari" -> "Orari", "/login" -> "Login"
      let screenName = pathname;

      if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index') {
        screenName = 'Home';
      } else if (pathname.includes('/(tabs)/')) {
        // Extract the tab name and capitalize it
        const tabName = pathname.split('/').pop() || 'Unknown';
        screenName = tabName.charAt(0).toUpperCase() + tabName.slice(1);
      } else if (pathname === '/login') {
        screenName = 'Login';
      } else {
        // For other paths, clean up the pathname
        screenName = pathname.replace(/[/()\[\]]/g, '_').replace(/^_+|_+$/g, '') || 'Unknown';
      }

      logScreenView(screenName);
    }
  }, [pathname, segments]);

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