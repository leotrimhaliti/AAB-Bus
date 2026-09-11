import 'dotenv/config';

export default {
  expo: {
    name: "AAB Bus",
    slug: "aab-bus",
    owner: "favorite-projects",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    splash: {
      image: "./assets/images/logobus.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.favoriteprojects.aabbus",
      config: {
        usesNonExemptEncryption: false
      },
    },

    android: {
      package: "com.favoriteprojects.aabbus",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
    },

    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      "expo-asset",
      "@react-native-firebase/app",
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
      EXPO_PUBLIC_BUS_API_URL: process.env.EXPO_PUBLIC_BUS_API_URL,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
      eas: {
        projectId: "3d046363-3773-43e2-9c14-e724b97d4757"
      }
    },
  },
};
