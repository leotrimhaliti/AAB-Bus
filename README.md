# 🚌 AAB Bus Tracking App

<div align="center">

**Real-time bus tracking for AAB University students and staff**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📱 Overview

AAB Bus Tracking is a cross-platform mobile application that provides **real-time GPS tracking** of university buses. Students and staff can view live bus locations, route information, and estimated arrival times through an intuitive map interface.

### 🎯 Key Highlights

- 📍 **Live GPS Tracking** - Real-time bus location updates via WebSocket
- 🗺️ **Interactive Maps** - Google Maps integration with route visualization
- 🔐 **Secure Authentication** - Dual authentication (Supabase + Faculty API)
- 📡 **Offline Support** - Cached data for offline viewing
- 🌍 **Albanian Localization** - Full Albanian language support
- ♿ **Accessibility** - WCAG compliant with screen reader support

---

## ✨ Features

### Core Functionality

| Feature | Description | Status |
|---------|-------------|--------|
| 🚌 Real-time Tracking | WebSocket-based live bus location updates | ✅ Active |
| 🗺️ Route Visualization | View complete bus routes with stops | ✅ Active |
| 👤 User Profiles | Faculty API integration for student/staff data | ✅ Active |
| 🔒 Secure Auth | Token encryption with expo-secure-store | ✅ Active |
| 📴 Offline Mode | Cached data when network unavailable | ✅ Active |
| 🔄 Auto-refresh | Automatic polling fallback mechanism | ✅ Active |
| 🎨 Modern UI | Clean, intuitive interface design | ✅ Active |
| 📊 Error Tracking | Sentry integration for crash reporting | ✅ Active |

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

## 📦 Installation

### Prerequisites

Ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Expo CLI** (optional, but recommended)
- **iOS Simulator** (macOS) or **Android Emulator**

### 1️⃣ Clone the repository
```bash
git clone https://github.com/leotrimhaliti/ai-mobile-leotrimhaliti.git
cd aab-bus
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional: Faculty API
FACULTY_API_URL=https://testapieservice.uniaab.com

# Optional: Sentry Error Tracking
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 4️⃣ Run the Application

```bash
# Development mode
npm run dev

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

---

## 🚀 Usage

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run E2E tests (iOS)
npm run test:e2e:ios

# Run E2E tests (Android)
npm run test:e2e:android

# Build app for E2E testing
npm run build:e2e:ios
npm run build:e2e:android
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
# Build for web
npm run build:web

# Build native apps (requires EAS)
npx eas build --platform ios
npx eas build --platform android
```

---

## 📖 API Documentation

### Faculty API Endpoints

#### Authentication
```http
POST /Token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username={username}&password={password}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Get Profile Details
```http
GET /api/profile/details
Authorization: Bearer {access_token}
```

**Response:**
```json
{
  "emri": "John",
  "mbiemri": "Doe",
  "adresaf": "john.doe@aab-edu.net",
  "fakulteti": "Engineering",
  "group": "Group A",
  "datelindja": "1995-01-01",
  "image": "https://example.com/avatar.jpg"
}
```

#### Get Bus Locations
```http
GET /api/buss/locations
```

**Response:**
```json
{
  "bus-1": {
    "lat": "42.638",
    "lng": "21.114",
    "loc_valid": "1",
    "speed": "45",
    "heading": "180",
    "timestamp": "2025-11-15T10:30:00Z"
  }
}
```

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

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Workflow

1. Ensure all tests pass: `npm test`
2. Run type checking: `npm run typecheck`
3. Lint your code: `npm run lint`
4. Follow the existing code style
5. Write tests for new features

---

## 📝 License

This project is developed for AAB University. All rights reserved.

---

## 👥 Authors

- **Leotrim Haliti** - [GitHub](https://github.com/leotrimhaliti)

---

## 🙏 Acknowledgments

- AAB University for project requirements
- Supabase for backend infrastructure
- Expo team for the excellent development framework
- React Native community for invaluable resources

---

## 📞 Support

For questions or issues:
- 📧 Email: support@aab-edu.net
- 🐛 Issues: [GitHub Issues](https://github.com/leotrimhaliti/ai-mobile-leotrimhaliti/issues)

---

<div align="center">

**Made with ❤️ for AAB University**

[⬆ Back to Top](#-aab-bus-tracking-app)

</div>
