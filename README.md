# 🚌 AAB Bus Tracking App

**Real-time bus tracking for AAB University**

---

## 📱 Overview

Cross-platform mobile application for **real-time GPS tracking** of university buses. Students and staff can view live bus locations, route information, and estimated arrival times.

### 🎯 Key Highlights

- 📍 **Live GPS Tracking** - Real-time bus location updates with 10-second polling
- 🗺️ **Interactive Maps** - Google Maps integration with route visualization and bus following
- 🔐 **Secure Authentication** - Dual authentication (Supabase + Faculty API)
- 📡 **Offline Support** - Cached data for offline viewing with sync
- 🌍 **Albanian Localization** - Full Albanian language support
- ♿ **Accessibility** - WCAG compliant with screen reader support
- 🎨 **Modern UI** - Polished interface with smooth animations
- 🔄 **Smart Retry** - Automatic retry with exponential backoff

---

## ✨ Features

### Core Functionality

| Feature | Description | Status |
|---------|-------------|--------|
| 🚌 Real-time Tracking | 10-second polling with live bus location updates | ✅ Active |
| 🗺️ Route Visualization | Complete bus routes with stops and progress tracking | ✅ Active |
| 👤 User Profiles | Faculty API integration for student/staff data | ✅ Active |
| 🔒 Secure Auth | Token encryption with expo-secure-store | ✅ Active |
| 📴 Offline Mode | Cached data when network unavailable | ✅ Active |
| 🔄 Auto-refresh | Automatic polling with smart retry mechanisms | ✅ Active |
| 🎨 Modern UI | Clean, intuitive interface with smooth animations | ✅ Active |
| 📊 Error Tracking | Sentry integration for crash reporting | ✅ Active |
| 📍 Bus Following | Camera follows selected bus in real-time | ✅ Active |
| 🔑 Password Reset | Modal popup for password recovery | ✅ Active |
| 🖼️ Image Preloading | Prevents flickering with expo-asset | ✅ Active |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native 0.81.4 with Expo SDK 54
- **Language:** TypeScript 5.9.2 (Strict mode)
- **Navigation:** Expo Router 6.0.8
- **Maps:** react-native-maps 1.20.1 (Google Maps)
- **State Management:** React Context API + Custom Hooks

### Backend
- **Database:** Supabase (PostgreSQL)
- **Real-time:** WebSocket connections
- **Authentication:** Supabase Auth + Faculty API
- **Storage:** Expo SecureStore (encrypted tokens)
- **Caching:** AsyncStorage

### Development & Testing
- **Testing:** Jest + React Native Testing Library
- **Linting:** ESLint (Expo config)
- **Type Checking:** TypeScript strict mode
- **Error Tracking:** Sentry React Native

---


## 🏗️ Project Structure

```
aab-bus/
├── app/                      # Application screens (Expo Router)
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.tsx        # Bus tracking map
│   │   ├── orari.tsx        # Schedule screen
│   │   └── profile.tsx      # User profile
│   ├── login.tsx            # Login screen
│   ├── signup.tsx           # Signup screen
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── ui/                  # UI components
│   │   ├── Skeleton.tsx     # Loading skeletons
│   │   └── ...
│   └── ErrorBoundary.tsx    # Error boundary component
├── contexts/                # React contexts
│   └── AuthContext.tsx      # Authentication context
├── hooks/                   # Custom React hooks
│   ├── useBusLocations.ts   # Bus data fetching
│   ├── useWebSocket.ts      # WebSocket connection
│   └── useNetworkStatus.ts  # Network monitoring
├── lib/                     # Utility libraries
│   ├── supabase.ts          # Supabase client
│   ├── validation.ts        # Form validation
│   ├── cache.ts             # Caching utilities
│   └── fetchWithRetry.ts    # HTTP retry logic
├── types/                   # TypeScript definitions
│   └── bus.ts               # Bus-related types
├── constants/               # App constants
│   └── RouteCoordinates.ts  # Bus route data
├── __tests__/               # Test files
│   ├── *.test.ts(x)         # Component & unit tests
└── package.json
```

---

## 🧪 Testing

### Unit & Integration Tests

```
Test Suites: 8 passed, 8 total
Tests:       54 passed, 54 total
Coverage:    85%+ across critical paths
```

### E2E Tests (Detox)

```
Test Suites: 5 suites (Login, Bus Tracking, Profile, Navigation, Accessibility)
Tests:       40+ E2E tests
Platforms:   iOS & Android
```

### Test Categories

- **Unit Tests:** Validation, caching, utilities
- **Component Tests:** Login, signup, profile, bus tracking
- **Hook Tests:** useBusLocations, useWebSocket, useNetworkStatus
- **Integration Tests:** Auth flow, data fetching
- **E2E Tests:** Full user flows across iOS and Android

See [e2e/README.md](e2e/README.md) for detailed E2E testing documentation.



## 📝 License

This project is developed for AAB University. All rights reserved.

---

## 📝 License

AAB University. All rights reserved.
