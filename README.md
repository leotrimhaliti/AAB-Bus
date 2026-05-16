# 🚌 AAB Bus Tracking App

**Real-time bus tracking for AAB University**

---

## 📱 Overview

Cross-platform mobile application for **real-time GPS tracking** of university buses. Students and staff can view live bus locations, route information, and schedules.

### 🎯 Key Highlights

- 📍 **Live GPS Tracking** - Real-time bus location updates
- 🗺️ **Interactive Maps** - Leaflet-based map with route visualization
- 🔐 **Secure Authentication** - Supabase Auth + Faculty API integration
- � **Bus Schedules** - View departure times and routes
- 🌍 **Albanian Localization** - Full Albanian language support
- 📴 **Offline Support** - Cached data when network unavailable

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🚌 Real-time Tracking | Live bus location updates with polling |
| 🗺️ Route Visualization | Bus routes with stops and progress tracking |
| 📅 Schedule View | Bus departure times and booking system |
| 👤 User Profiles | Student/staff profile management |
| 🔒 Secure Auth | Token encryption with expo-secure-store |
| 📴 Offline Mode | Cached data when network unavailable |
|  Error Tracking | Sentry integration for crash reporting |

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native 0.81.5 with Expo SDK 54
- **Language:** TypeScript 5.9.2
- **Navigation:** Expo Router 6.0
- **Maps:** Leaflet (WebView-based)
- **Icons:** Lucide React Native

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth + Faculty API
- **Storage:** Expo SecureStore (encrypted tokens)
- **Caching:** AsyncStorage

### Development & Testing
- **Testing:** Jest + React Native Testing Library
- **Linting:** ESLint
- **Error Tracking:** Sentry React Native

---

## 🏗️ Project Structure

```
aab/
├── app/                      # Application screens (Expo Router)
│   ├── (tabs)/               # Tab navigation screens
│   │   ├── index.tsx         # Bus tracking map
│   │   ├── orari.tsx         # Schedule/booking screen
│   │   └── profile.tsx       # User profile
│   ├── login.tsx             # Login screen
│   └── _layout.tsx           # Root layout
├── components/               # Reusable components
│   ├── ui/                   # UI components (Skeleton, ErrorState, etc.)
│   ├── LeafletMap.tsx        # Map component
│   └── ErrorBoundary.tsx     # Error boundary
├── contexts/                 # React contexts
│   └── AuthContext.tsx       # Authentication context
├── hooks/                    # Custom React hooks
│   ├── useBusLocations.ts    # Bus data fetching
│   ├── useBusProgress.ts     # Bus route progress tracking
│   ├── useBusStops.ts        # Bus stops data
│   ├── useWebSocket.ts       # WebSocket connection
│   └── useNetworkStatus.ts   # Network monitoring
├── lib/                      # Utility libraries
│   ├── supabase.ts           # Supabase client
│   ├── validation.ts         # Form validation
│   ├── cache.ts              # Caching utilities
│   └── fetchWithRetry.ts     # HTTP retry logic
├── types/                    # TypeScript definitions
├── constants/                # App constants
└── __tests__/                # Test files
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI

### Installation

```bash
# Install dependencies
npm install

# Start development server
npx expo start
```

### Environment Variables

Create a `.env` file with:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_BUS_API_URL=your_bus_api_url
EXPO_PUBLIC_API_URL=your_api_url
```

---

## 🧪 Testing

```bash
# Run tests
npm test
```

---

## 📝 License

AAB University. All rights reserved.
