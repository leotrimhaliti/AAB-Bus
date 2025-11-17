# API Documentation

## Overview

This document provides detailed information about the APIs used in the AAB Bus Tracking application.

## Table of Contents

- [Faculty API](#faculty-api)
- [Supabase API](#supabase-api)
- [WebSocket Protocol](#websocket-protocol)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)

---

## Faculty API

Base URL: `https://testapieservice.uniaab.com`

### Authentication

#### POST `/Token`

Authenticate a user and receive an access token.

**Request:**
```http
POST /Token
Content-Type: application/x-www-form-urlencoded

grant_type=password&username={username}&password={password}
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| grant_type | string | Yes | Must be "password" |
| username | string | Yes | User's username or email |
| password | string | Yes | User's password |

**Success Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  ".issued": "Fri, 15 Nov 2025 10:00:00 GMT",
  ".expires": "Fri, 15 Nov 2025 11:00:00 GMT"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "invalid_grant",
  "error_description": "The user name or password is incorrect."
}
```

---

### Profile

#### GET `/api/profile/details`

Retrieve authenticated user's profile information.

**Request:**
```http
GET /api/profile/details
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "emri": "John",
  "mbiemri": "Doe",
  "adresaf": "john.doe@aab-edu.net",
  "fakulteti": "Faculty of Computer Science",
  "group": "Group A",
  "datelindja": "1995-01-01",
  "image": "https://example.com/images/profile.jpg",
  "nrIndeksi": "12345",
  "telefoni": "+383 49 123 456"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| emri | string | First name |
| mbiemri | string | Last name |
| adresaf | string | Email address |
| fakulteti | string | Faculty name |
| group | string | Student group |
| datelindja | string | Birth date (YYYY-MM-DD) |
| image | string | Profile image URL |
| nrIndeksi | string | Student index number |
| telefoni | string | Phone number |

**Error Responses:**

**401 Unauthorized:**
```json
{
  "Message": "Authorization has been denied for this request."
}
```

**404 Not Found:**
```json
{
  "Message": "Profile not found."
}
```

---

### Bus Tracking

#### GET `/api/buss/locations`

Retrieve current locations of all active buses.

**Request:**
```http
GET /api/buss/locations
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "bus-1": {
    "lat": "42.638123",
    "lng": "21.114567",
    "loc_valid": "1",
    "speed": "45",
    "heading": "180",
    "timestamp": "2025-11-15T10:30:00Z",
    "driver": "Driver Name",
    "route": "Route 1"
  },
  "bus-2": {
    "lat": "42.640234",
    "lng": "21.116789",
    "loc_valid": "1",
    "speed": "30",
    "heading": "90",
    "timestamp": "2025-11-15T10:30:05Z",
    "driver": "Driver Name 2",
    "route": "Route 1"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| lat | string | Latitude coordinate |
| lng | string | Longitude coordinate |
| loc_valid | "0" \| "1" | Location validity (1 = valid, 0 = invalid) |
| speed | string | Speed in km/h |
| heading | string | Direction in degrees (0-360) |
| timestamp | string | ISO 8601 timestamp |
| driver | string | Driver name (optional) |
| route | string | Route identifier (optional) |

---

## Supabase API

Base URL: `{your-project}.supabase.co`

### Authentication

#### Sign Up

```typescript
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

#### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

#### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

#### Get Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
```

---

### Database

#### Profiles Table

**Schema:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  emri TEXT,
  mbiemri TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Query Profile:**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

**Update Profile:**
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ emri: 'John', mbiemri: 'Doe' })
  .eq('id', userId);
```

---

## WebSocket Protocol

### Connection

**URL:** `wss://testapieservice.uniaab.com/ws/buses`

**Connection:**
```typescript
const ws = new WebSocket('wss://testapieservice.uniaab.com/ws/buses');

ws.onopen = () => {
  console.log('Connected to bus tracking WebSocket');
};
```

### Message Format

#### Server -> Client (Bus Update)

```json
{
  "type": "bus_update",
  "data": {
    "bus_id": "bus-1",
    "lat": "42.638123",
    "lng": "21.114567",
    "loc_valid": "1",
    "speed": "45",
    "heading": "180",
    "timestamp": "2025-11-15T10:30:00Z"
  }
}
```

#### Client -> Server (Subscribe)

```json
{
  "type": "subscribe",
  "buses": ["bus-1", "bus-2"]
}
```

#### Server -> Client (Error)

```json
{
  "type": "error",
  "code": "INVALID_MESSAGE",
  "message": "Invalid message format"
}
```

### Events

| Event | Description |
|-------|-------------|
| `open` | WebSocket connection established |
| `message` | Received bus location update |
| `error` | Connection or protocol error |
| `close` | Connection closed |

---

## Error Codes

### HTTP Status Codes

| Code | Description | Solution |
|------|-------------|----------|
| 200 | Success | - |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Verify resource exists |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Service is down, try later |

### Application Error Codes

| Code | Message | Description |
|------|---------|-------------|
| AUTH_001 | Invalid credentials | Username or password incorrect |
| AUTH_002 | Token expired | Access token has expired |
| AUTH_003 | Missing token | Authorization header missing |
| BUS_001 | No buses available | No active buses found |
| BUS_002 | Invalid location | GPS coordinates invalid |
| NETWORK_001 | Connection failed | Network connection lost |
| CACHE_001 | Cache unavailable | Local cache corrupted |

### Error Response Format

```typescript
interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
```

**Example:**
```json
{
  "code": "AUTH_001",
  "message": "Invalid credentials provided",
  "details": {
    "field": "password",
    "reason": "Password does not meet requirements"
  },
  "timestamp": "2025-11-15T10:30:00Z"
}
```

---

## Rate Limiting

### Faculty API

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/Token` | 5 requests | 1 minute |
| `/api/profile/details` | 60 requests | 1 minute |
| `/api/buss/locations` | 120 requests | 1 minute |

### Best Practices

1. **Implement caching** to reduce API calls
2. **Use WebSocket** for real-time updates instead of polling
3. **Handle rate limit errors** (429) with exponential backoff
4. **Cache responses** locally when possible

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1636982400
```

---

## Usage Examples

### Fetch Bus Locations with Retry

```typescript
import { fetchWithRetry } from './lib/fetchWithRetry';

const getBusLocations = async () => {
  try {
    const response = await fetchWithRetry(
      'https://testapieservice.aab-edu.net/api/buss/locations',
      { method: 'GET' },
      { retries: 3, delay: 1000 }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch bus locations:', error);
    throw error;
  }
};
```

### Authenticate and Get Profile

```typescript
import * as SecureStore from 'expo-secure-store';

const loginAndGetProfile = async (username: string, password: string) => {
  // 1. Authenticate
  const tokenResponse = await fetch('https://testapieservice.uniaab.com/Token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=password&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });

  const tokenData = await tokenResponse.json();
  const token = tokenData.access_token;

  // 2. Store token securely
  await SecureStore.setItemAsync('access_token', token);

  // 3. Get profile
  const profileResponse = await fetch('https://testapieservice.uniaab.com/api/profile/details', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const profile = await profileResponse.json();
  return profile;
};
```

### WebSocket Connection with Auto-Reconnect

```typescript
import { useWebSocket } from './hooks/useWebSocket';

const MyComponent = () => {
  const { send, attach, readyState } = useWebSocket(
    'wss://testapieservice.uniaab.com/ws/buses',
    {
      reconnectInterval: 3000,
      reconnectAttempts: 5,
    }
  );

  useEffect(() => {
    attach({
      message: (data) => {
        console.log('Received bus update:', data);
      },
      open: () => {
        console.log('WebSocket connected');
        // Subscribe to specific buses
        send({ type: 'subscribe', buses: ['bus-1', 'bus-2'] });
      },
      error: (error) => {
        console.error('WebSocket error:', error);
      },
    });
  }, [attach, send]);

  return <div>WebSocket Status: {readyState}</div>;
};
```

---

## Support

For API issues or questions:
- 📧 Email: support@aab-edu.net
- 🐛 Issues: [GitHub Issues](https://github.com/leotrimhaliti/ai-mobile-leotrimhaliti/issues)

---

<div align="center">

**Last Updated: November 15, 2025**

[Back to README](README.md)

</div>
