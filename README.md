# AAB Bus

Real-time bus tracking app for AAB University, built with React Native and Expo. Students log in with their faculty account, see live bus positions on a map, check the departure schedule, and view their profile.

## Features

- Live map of active buses (Leaflet inside a WebView, polling a GPS API every 10 seconds)
- Route timeline showing the stops ahead for a selected bus, with progress along the route
- Stale-position handling: a bus position older than 30 seconds is shown as "last known" rather than live (see `lib/busFreshness.ts`)
- Departure schedule per stop, computed from a fixed timetable
- Login and password reset against the faculty API, with token-based auto re-login
- Offline support: cached bus data is shown when the network is unreachable
- Crash and error reporting via Sentry, usage analytics via Firebase

## Tech stack

- React Native 0.81, Expo SDK 54, Expo Router 6
- TypeScript 5.9, React 19
- Leaflet (via `react-native-webview`) for the map
- Jest and React Native Testing Library for tests
- Sentry for error tracking, Firebase Analytics for usage
- EAS Build for native builds and store submission

There is no local database. Data comes from two external REST APIs (faculty auth/profile, and bus GPS positions), a hardcoded list of stops, and local device storage (`expo-secure-store` for tokens, `AsyncStorage` for an offline cache).

## Project structure

```
app/                    Screens (Expo Router)
  login.tsx             Login + forgot-password
  (tabs)/index.tsx       Live map
  (tabs)/orari.tsx        Departure schedule
  (tabs)/profile.tsx      User profile
components/             LeafletMap, BusTripTimeline, ErrorBoundary, SplashScreen
components/ui/          ErrorState, Skeleton
contexts/AuthContext.tsx  Login, logout, token refresh, session state
hooks/                  useBusLocations, useBusProgress, useBusStops,
                        useNetworkStatus, useWebSocket
lib/                    validation, cache, fetchWithRetry,
                        busFreshness, analytics
types/                  Shared TypeScript types
__tests__/              Jest test suites
docs/                   Architecture diagrams
```

## Setup

Requirements: Node.js 18+, npm, and either the Expo Go app on a phone or an Android/iOS emulator.

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

```
EXPO_PUBLIC_API_URL=...      # faculty API: auth + profile
EXPO_PUBLIC_BUS_API_URL=...  # GPS bus-location endpoint
EXPO_PUBLIC_SENTRY_DSN=...   # optional, error tracking
```

Map tiles come straight from OpenStreetMap inside the Leaflet WebView (`components/LeafletMap.tsx`), so no maps API key is needed.

`EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_BUS_API_URL` are read directly in code (`contexts/AuthContext.tsx`, `app/(tabs)/index.tsx`). Without them, login and the live map won't work. Bus stops are a fixed list in `hooks/useBusStops.ts`, so the schedule and route screens work without a backend.

Start the dev server:

```bash
npx expo start
```

Then open it with Expo Go (scan the QR code), or press `a` for Android, `i` for iOS, `w` for web.

## Scripts

```bash
npm test          # run the Jest suite
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
npm run android    # expo run:android
npm run ios        # expo run:ios
npm run build:web  # expo export --platform web
```

## Building for a device

Native builds go through EAS (`eas.json` defines `development`, `preview`, and `production` profiles):

```bash
eas build --profile preview
```

## License

AAB University. All rights reserved.
