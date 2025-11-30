import 'dotenv/config';

export default {
  expo: {
    name: "AAB Bus",
    slug: "aab-bus",
    owner: "favorite-projects",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/aab.jpeg",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    splash: {
      image: "./assets/images/logobus.png",
      resizeMode: "contain",
      backgroundColor: "#ffffffff"
    },

    ios: {
      supportsTablet: true,
      config: {
        usesNonExemptEncryption: false,
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
      },
    },

    android: {
      package: "com.favoriteprojects.aabbus",
      favicon: "./assets/images/logo.png",
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-asset",
      [
        "@sentry/react-native/expo",
        {
          url: "https://sentry.io/",
          project: "react-native",
          organization: "test-535"
        }
      ]
    ],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_MAPTILER_API_KEY: process.env.EXPO_PUBLIC_MAPTILER_API_KEY,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      EXPO_PUBLIC_BUS_API_URL: process.env.EXPO_PUBLIC_BUS_API_URL,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      eas: {
        projectId: "3d046363-3773-43e2-9c14-e724b97d4757"
      }
    },
  },
};
