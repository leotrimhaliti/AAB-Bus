import Constants from 'expo-constants';

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string): string | undefined {
    // Try Constants.expoConfig.extra first (works in production)
    const extraValue = Constants.expoConfig?.extra?.[key];
    if (extraValue) return extraValue;

    // Fallback to process.env (works in development)
    return process.env[key];
}

export const Config = {
    GOOGLE_MAPS_API_KEY: getEnvVar('GOOGLE_MAPS_API_KEY') || '***REMOVED***',
    SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
    SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    BUS_API_URL: getEnvVar('EXPO_PUBLIC_BUS_API_URL'),
    API_URL: getEnvVar('EXPO_PUBLIC_API_URL'),
    SENTRY_DSN: getEnvVar('EXPO_PUBLIC_SENTRY_DSN'),
} as const;

// Debug log in development
if (__DEV__) {
    console.log('📋 Config loaded:', {
        GOOGLE_MAPS_API_KEY: Config.GOOGLE_MAPS_API_KEY ? '✅ Loaded' : '❌ Missing',
        SUPABASE_URL: Config.SUPABASE_URL ? '✅ Loaded' : '❌ Missing',
        BUS_API_URL: Config.BUS_API_URL ? '✅ Loaded' : '❌ Missing',
    });
}
