import * as Sentry from '@sentry/react-native';

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    if (__DEV__) {
      console.log('Sentry DSN not configured. Skipping Sentry initialization.');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
    beforeSend(event) {
      // Don't send events in development
      if (__DEV__) {
        console.log('Sentry event (dev mode):', event);
        return null;
      }
      return event;
    },
  });
}       