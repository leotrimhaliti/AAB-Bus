import 'dotenv/config';

export default {
  expo: {
    name: "AAB Bus",
    slug: "AAB Bus",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logobus.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },

    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },

    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/logo.png",
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
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
  },
};
