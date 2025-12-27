# FleetInspect Pro - Mobile App

A comprehensive mobile application for vehicle inspection surveyors built with React Native and Expo SDK 54.

## Production Status: READY

| Platform | Status | Build Type | Distribution |
|----------|--------|------------|--------------|
| iOS | Built | `.ipa` on EAS | TestFlight / App Store |
| Android | Built | `.aab` on EAS | Play Store |

| Metric | Value |
|--------|-------|
| Backend API | https://cmx-notification-be-production.up.railway.app |
| Expo SDK | 54.0.30 |
| React Native | 0.81.5 |
| Sentry | Configured |
| Push Notifications | Firebase Cloud Messaging |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              MOBILE APPLICATION                                      │
│                         (React Native + Expo SDK 54)                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                             SCREENS                                          │    │
│  │                                                                              │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐   │    │
│  │  │   Dashboard   │  │   Schedule    │  │   Inspect     │  │    Chat     │   │    │
│  │  │               │  │               │  │               │  │             │   │    │
│  │  │ • Weather     │  │ • Calendar    │  │ • 7-Step      │  │ • Dispatcher│   │    │
│  │  │ • Today Stats │  │ • Accept/     │  │   Checklist   │  │   Messages  │   │    │
│  │  │ • Progress    │  │   Reject      │  │ • Photo Docs  │  │ • Real-time │   │    │
│  │  │ • Next Appt   │  │ • Navigation  │  │ • Notes       │  │   WebSocket │   │    │
│  │  │ • Quick Status│  │ • Pull Refresh│  │ • Signature   │  │ • Typing    │   │    │
│  │  │ • SOS Button  │  │               │  │ • Submit      │  │   Indicator │   │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘   │    │
│  │                                                                              │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │    │
│  │  │    History    │  │    Profile    │  │    Login      │                    │    │
│  │  │               │  │               │  │               │                    │    │
│  │  │ • Past Jobs   │  │ • User Info   │  │ • Email/Pass  │                    │    │
│  │  │ • Photo Count │  │ • Change Pwd  │  │ • Register    │                    │    │
│  │  │ • View Report │  │ • Settings    │  │ • Biometric   │                    │    │
│  │  │               │  │ • Logout      │  │   (Face/Touch)│                    │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘                    │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                             SERVICES                                         │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │   API Client    │  │   API Service   │  │  Auth Service   │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • Circuit Break │  │ • Login/Logout  │  │ • Token Mgmt    │             │    │
│  │  │ • Retry Logic   │  │ • Appointments  │  │ • Secure Store  │             │    │
│  │  │ • Idempotency   │  │ • Location      │  │ • Session       │             │    │
│  │  │ • Deduplication │  │ • Status Update │  │                 │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │   Location      │  │  Notification   │  │    Chat         │             │    │
│  │  │   Service       │  │  Service        │  │    Service      │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • GPS Tracking  │  │ • FCM Push      │  │ • WebSocket     │             │    │
│  │  │ • Foreground    │  │ • Local Notif   │  │ • STOMP         │             │    │
│  │  │ • Background    │  │ • Token Reg     │  │ • Message Queue │             │    │
│  │  │ • QStash Queue  │  │                 │  │ • Reconnect     │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │   Storage       │  │  Offline Store  │  │  Image Upload   │             │    │
│  │  │   Service       │  │  Service        │  │  Service        │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • AsyncStorage  │  │ • Queue Actions │  │ • ImgBB Upload  │             │    │
│  │  │ • SecureStore   │  │ • Sync on Conn  │  │ • Compression   │             │    │
│  │  │ • Cache         │  │ • Retry Logic   │  │ • Base64        │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                              HOOKS                                           │    │
│  │                                                                              │    │
│  │  useAuth      useAppointments    useLocation    useChat    useNotifications │    │
│  │  useNetwork   useInspection      useAsyncState                              │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                           CONFIGURATION                                      │    │
│  │                                                                              │    │
│  │  • api.ts (API config, timeouts, base URL)                                  │    │
│  │  • sentry.ts (Error tracking, breadcrumbs)                                  │    │
│  │  • theme.ts (Colors, typography, spacing)                                   │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
            ▼                            ▼                            ▼
   ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
   │   Upstash QStash │        │  REST API (HTTP) │        │  WebSocket Chat  │
   │                  │        │                  │        │                  │
   │ • Location Queue │        │ • Authentication │        │ • STOMP over WS  │
   │ • Rate Limiting  │        │ • Appointments   │        │ • Real-time Msgs │
   │ • Retry w/ Backoff│       │ • Status Updates │        │ • Typing/Read    │
   │                  │        │ • Job Updates    │        │                  │
   └────────┬─────────┘        └────────┬─────────┘        └────────┬─────────┘
            │                            │                            │
            └────────────────────────────┼────────────────────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │     Spring Boot Backend       │
                         │   https://cmx-notification-   │
                         │   be-production.up.railway.app│
                         └───────────────────────────────┘
```

## Data Flow Diagrams

### Location Tracking Flow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           LOCATION UPDATE FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Mobile App              QStash                Backend              Web Dashboard│
│      │                     │                     │                       │       │
│      │ 1. expo-location    │                     │                       │       │
│      │    GPS Update       │                     │                       │       │
│      │─────────────────────┤                     │                       │       │
│      │                     │                     │                       │       │
│      │ 2. Publish to       │                     │                       │       │
│      │    QStash Queue     │                     │                       │       │
│      │────────────────────►│                     │                       │       │
│      │                     │                     │                       │       │
│      │                     │ 3. Webhook POST     │                       │       │
│      │                     │ (with retry)        │                       │       │
│      │                     │────────────────────►│                       │       │
│      │                     │                     │                       │       │
│      │                     │                     │ 4. Store in DB        │       │
│      │                     │                     │────────┐              │       │
│      │                     │                     │        │              │       │
│      │                     │                     │◄───────┘              │       │
│      │                     │                     │                       │       │
│      │                     │                     │ 5. SSE Broadcast      │       │
│      │                     │                     │──────────────────────►│       │
│      │                     │                     │                       │       │
│      │                     │                     │                  Map Update   │
│      │                     │                     │                       │       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Chat Message Flow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CHAT MESSAGE FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Mobile App              Backend               Web Dashboard                     │
│      │                      │                      │                             │
│      │ 1. WebSocket Connect │                      │                             │
│      │   (STOMP CONNECT)    │                      │                             │
│      │─────────────────────►│                      │                             │
│      │                      │                      │                             │
│      │ 2. Subscribe to      │                      │                             │
│      │    /topic/chat/      │                      │                             │
│      │    surveyor/{id}     │                      │                             │
│      │─────────────────────►│                      │                             │
│      │                      │                      │                             │
│      │                      │ 3. Dispatcher sends  │                             │
│      │                      │◄─────────────────────│                             │
│      │                      │                      │                             │
│      │ 4. Message delivered │                      │                             │
│      │◄─────────────────────│                      │                             │
│      │                      │                      │                             │
│      │ 5. Read receipt      │                      │                             │
│      │─────────────────────►│                      │                             │
│      │                      │─────────────────────►│                             │
│      │                      │                      │                             │
│      │ 6. Typing indicator  │                      │                             │
│      │─────────────────────►│                      │                             │
│      │                      │─────────────────────►│                             │
│      │                      │                      │                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Offline-First Flow
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           OFFLINE-FIRST ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                          ┌───────────────────────┐                               │
│                          │   User Action (e.g.   │                               │
│                          │   Submit Inspection)  │                               │
│                          └───────────┬───────────┘                               │
│                                      │                                           │
│                                      ▼                                           │
│                          ┌───────────────────────┐                               │
│                          │   Check Network       │                               │
│                          │   Connectivity        │                               │
│                          └───────────┬───────────┘                               │
│                                      │                                           │
│                    ┌─────────────────┼─────────────────┐                         │
│                    │ Online          │                 │ Offline                 │
│                    ▼                 │                 ▼                         │
│       ┌───────────────────────┐      │    ┌───────────────────────┐              │
│       │   Send to API         │      │    │   Queue in Offline    │              │
│       │   Immediately         │      │    │   Storage             │              │
│       └───────────┬───────────┘      │    └───────────┬───────────┘              │
│                   │                  │                │                          │
│                   ▼                  │                ▼                          │
│       ┌───────────────────────┐      │    ┌───────────────────────┐              │
│       │   Update Local        │      │    │   Show "Pending"      │              │
│       │   Cache               │      │    │   Status to User      │              │
│       └───────────────────────┘      │    └───────────────────────┘              │
│                                      │                │                          │
│                                      │                │ On Reconnect             │
│                                      │                ▼                          │
│                                      │    ┌───────────────────────┐              │
│                                      │    │   Sync Pending        │              │
│                                      │    │   Actions to API      │              │
│                                      │    └───────────────────────┘              │
│                                      │                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Dashboard Screen
- **Weather Widget** - Current conditions for outdoor inspections (OpenWeatherMap)
- **Today's Overview** - Completed, pending, and total appointment counts
- **Distance Stats** - Total miles driven today
- **Progress Bar** - Visual daily progress indicator (X of Y completed)
- **Next Inspection** - Countdown timer with address and quick navigation
- **Quick Status** - One-tap status updates:
  - On My Way (notifies dispatcher)
  - Arrived (logs arrival time)
  - Inspecting (starts inspection timer)
  - Completed (marks job done)
- **Emergency SOS** - One-tap alert to dispatch with location

### Schedule Screen
- **Appointment List** - View all assigned inspections
- **Color-Coded Status** - Pending (yellow), Accepted (green), Rejected (red)
- **Accept/Reject** - Respond to new assignments with optional notes
- **Navigation Integration** - One-tap directions via:
  - Google Maps (Android)
  - Apple Maps (iOS)
  - Waze (optional)
- **Pull to Refresh** - Real-time sync with backend
- **Filter Options** - Today, Week, All upcoming

### Inspection Workflow
Complete 7-step vehicle inspection checklist:

| Step | Name | Data Captured |
|------|------|---------------|
| 1 | Vehicle ID | VIN, Registration, Make, Model, Year, Color |
| 2 | Exterior | Body condition, Paint, Lights, Mirrors, Tires |
| 3 | Interior | Seats, Dashboard, Odometer reading, Controls |
| 4 | Engine | Fluids, Belts, Battery, Hoses, Leaks |
| 5 | Undercarriage | Suspension, Brakes, Exhaust, Frame |
| 6 | Photos | Camera integration, Damage documentation |
| 7 | Signature | Digital signature capture with timestamp |

- **Photo Capture** - Camera integration with gallery support
- **Photo Annotation** - Mark damage areas on vehicle diagram
- **Notes** - Voice-to-text or manual entry
- **Draft Save** - Auto-save progress locally
- **Submit Report** - Upload to backend with offline queue

### Chat Screen
- **Dispatcher Communication** - Real-time messaging with dispatch
- **WebSocket Connection** - STOMP protocol over WebSocket
- **Typing Indicators** - See when dispatcher is typing
- **Read Receipts** - Message delivery confirmation
- **Message Queue** - Offline messages queued for delivery
- **Auto-Reconnect** - Exponential backoff with jitter
- **Status Updates** - Auto-sent quick status messages
- **SOS Alerts** - Emergency notifications with location

### History Screen
- **Past Inspections** - View completed reports
- **Photo Count** - Images per inspection
- **Quick Access** - View detailed reports
- **Export** - Share reports as PDF

### Profile Screen
- **User Information** - Name, email, phone
- **Change Password** - Secure password update
- **Notification Settings** - Push notification preferences
- **Biometric Login** - Face ID / Touch ID toggle
- **Logout** - Clear session and tokens

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native | 0.81.5 |
| Platform | Expo SDK | 54.0.30 |
| Navigation | @react-navigation | Bottom Tabs |
| UI | expo-linear-gradient + Ionicons | - |
| Maps | react-native-maps | 1.20.1 |
| Location | expo-location | 19.0.8 |
| Camera | expo-image-picker | 17.0.10 |
| Signature | react-native-signature-canvas | 5.0.1 |
| Haptics | expo-haptics | 15.0.8 |
| Network | @react-native-community/netinfo | 11.4.1 |
| Storage | @react-native-async-storage | 2.2.0 |
| Secure Storage | expo-secure-store | 15.0.8 |
| Push Notifications | expo-notifications + FCM | 0.32.15 |
| Message Queue | Upstash QStash | - |
| Error Tracking | @sentry/react-native | 7.2.0 |
| Image Upload | ImgBB API | - |
| Biometrics | expo-local-authentication | 17.0.8 |
| Animations | react-native-reanimated | 4.1.1 |
| Gestures | react-native-gesture-handler | 2.28.0 |

## Project Structure

```
mobile-expo/
├── App.tsx                     # Entry point with navigation
├── index.ts                    # Expo entry
├── app.config.js               # Expo configuration
├── eas.json                    # EAS Build configuration
├── package.json                # Dependencies
│
├── src/
│   ├── config/
│   │   ├── api.ts              # API configuration & timeouts
│   │   └── sentry.ts           # Sentry error tracking setup
│   │
│   ├── constants/
│   │   ├── theme.ts            # Colors, typography, spacing
│   │   └── images.ts           # Asset references
│   │
│   ├── context/
│   │   └── index.ts            # React Context providers
│   │
│   ├── hooks/
│   │   ├── index.ts            # Hook exports
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useAppointments.ts  # Appointment management
│   │   ├── useLocation.ts      # GPS tracking hook
│   │   ├── useChat.ts          # Chat functionality
│   │   ├── useNotifications.ts # Push notifications
│   │   ├── useNetwork.ts       # Network connectivity
│   │   ├── useInspection.ts    # Inspection workflow
│   │   └── useAsyncState.ts    # Async state helper
│   │
│   ├── services/
│   │   ├── api.ts              # High-level API service
│   │   ├── apiClient.ts        # Low-level HTTP client
│   │   ├── authService.ts      # Authentication logic
│   │   ├── chat.ts             # WebSocket chat service
│   │   ├── location.ts         # GPS location service
│   │   ├── notifications.ts    # Push notification handling
│   │   ├── qstash.ts           # QStash message publishing
│   │   ├── storage.ts          # AsyncStorage wrapper
│   │   ├── offlineStorage.ts   # Offline queue management
│   │   └── imageUpload.ts      # ImgBB image upload
│   │
│   ├── screens/
│   │   └── index.ts            # Screen exports
│   │
│   ├── components/
│   │   └── index.ts            # Component exports
│   │
│   ├── containers/
│   │   └── index.ts            # Container exports
│   │
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   │
│   └── utils/
│       ├── index.ts            # Utility exports
│       └── logger.ts           # Logging utility
│
├── assets/                     # Icons and images
│   ├── icon.png                # App icon
│   ├── splash.png              # Splash screen
│   └── adaptive-icon.png       # Android adaptive icon
│
└── scripts/
    ├── setup-eas-tokens.sh     # EAS secrets setup script
    └── eas-tokens.json         # Token configuration (gitignored)
```

## Services Reference

### ApiClient (Circuit Breaker + Retry)
```typescript
// src/services/apiClient.ts
interface ApiClientConfig {
  maxRetries: 3;
  retryDelay: 1000;
  circuitBreakerThreshold: 5;
  circuitBreakerTimeout: 30000;
}

// Features:
// - Automatic retry with exponential backoff
// - Circuit breaker for failing endpoints
// - Request deduplication (idempotency keys)
// - Auth token injection
// - Request/response logging

apiClient.get<T>(endpoint, options?): Promise<ApiResponse<T>>
apiClient.post<T>(endpoint, data, options?): Promise<ApiResponse<T>>
apiClient.setAuthToken(token: string | null): void
apiClient.getCircuitState(endpoint): 'closed' | 'open' | 'half-open'
apiClient.resetCircuitBreaker(): void
```

### ApiService (High-Level API)
```typescript
// src/services/api.ts
// Authentication
apiService.login(request: LoginRequest): Promise<LoginResponse>
apiService.register(request: RegisterRequest): Promise<LoginResponse>

// Appointments
apiService.getAppointments(surveyorId, upcomingOnly): Promise<Appointment[]>
apiService.respondToAppointment(id, surveyorId, response): Promise<AppointmentResponse>

// Location & Status
apiService.updateLocation(surveyorId, lat, lng): Promise<UpdateResponse>
apiService.updateStatus(surveyorId, status): Promise<UpdateResponse>
apiService.updateLocationAndStatus(surveyorId, lat, lng, status): Promise<UpdateResponse>

// Job Updates
apiService.updateJobStatus(surveyorId, status, appointmentId?, lat?, lng?, notes?): Promise<UpdateResponse>

// Profile
apiService.changePassword(surveyorId, currentPassword, newPassword): Promise<UpdateResponse>
apiService.getSurveyorDetails(surveyorId): Promise<Surveyor>
```

### ChatService (WebSocket + STOMP)
```typescript
// src/services/chat.ts
chatService.connect(surveyorId, surveyorName): void
chatService.disconnect(): void
chatService.cleanup(): void

// Messaging
chatService.sendMessage(recipientId, recipientType, content): Promise<void>
chatService.sendTypingIndicator(conversationId, isTyping): void
chatService.markAsRead(conversationId): void

// REST API fallback
chatService.loadMessages(conversationId, limit?, offset?): Promise<ChatMessage[]>
chatService.loadConversations(): Promise<ChatConversation[]>
chatService.getUnreadCount(): Promise<number>

// Subscriptions (return unsubscribe function)
chatService.subscribeToMessages(handler): () => void
chatService.subscribeToTyping(handler): () => void
chatService.subscribeToConnection(handler): () => void
chatService.subscribeToUnreadCount(handler): () => void

// State
chatService.isConnected(): boolean
chatService.getConnectionState(): ConnectionState
chatService.getQueuedMessageCount(): number
```

### LocationService (GPS + QStash)
```typescript
// src/services/location.ts
locationService.startTracking(surveyorId): Promise<void>
locationService.stopTracking(): void
locationService.getCurrentLocation(): Promise<Location>

// Background tracking
locationService.startBackgroundTracking(): Promise<void>
locationService.stopBackgroundTracking(): void

// QStash queue for reliable delivery
locationService.queueLocationUpdate(lat, lng, status): Promise<void>
```

### NotificationService (FCM)
```typescript
// src/services/notifications.ts
notificationService.registerForPushNotifications(surveyorId): Promise<string>
notificationService.getExpoPushToken(): Promise<string>
notificationService.handleNotificationReceived(notification): void
notificationService.handleNotificationResponse(response): void
```

## Custom Hooks Reference

### useAuth
```typescript
const {
  user,           // Current surveyor info
  isLoading,      // Auth state loading
  isLoggedIn,     // Boolean auth status
  login,          // Login function
  logout,         // Logout function
  register        // Registration function
} = useAuth();
```

### useAppointments
```typescript
const {
  appointments,    // Appointment list
  isLoading,       // Loading state
  error,           // Error state
  refresh,         // Refresh appointments
  respondToAppointment  // Accept/reject
} = useAppointments(surveyorId);
```

### useLocation
```typescript
const {
  location,        // Current GPS coords
  isTracking,      // Tracking active
  error,           // Error state
  startTracking,   // Start GPS
  stopTracking,    // Stop GPS
  updateStatus     // Update surveyor status
} = useLocation(surveyorId);
```

### useChat
```typescript
const {
  messages,        // Message list
  conversations,   // Conversation list
  unreadCount,     // Unread badge count
  isConnected,     // WebSocket connected
  sendMessage,     // Send message
  sendTyping,      // Send typing indicator
  loadMessages,    // Load history
  markAsRead       // Mark conversation read
} = useChat(surveyorId, surveyorName);
```

### useNetwork
```typescript
const {
  isConnected,     // Network available
  connectionType,  // wifi/cellular
  isInternetReachable  // Internet accessible
} = useNetwork();
```

## API Endpoints Used

### Mobile-Specific Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mobile/login` | Surveyor login |
| POST | `/api/mobile/register` | New surveyor registration |
| POST | `/api/mobile/device-token` | Register FCM token |
| GET | `/api/mobile/appointments/{surveyorId}` | Get appointments |
| POST | `/api/mobile/appointments/{id}/respond` | Accept/reject |
| POST | `/api/mobile/location` | Update location |
| POST | `/api/mobile/status` | Update status |
| POST | `/api/mobile/location-status` | Update both |
| POST | `/api/mobile/job-update` | Job status update |
| POST | `/api/mobile/change-password` | Change password |
| GET | `/api/mobile/surveyor/{id}` | Get surveyor details |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| WS | `/ws/chat` | WebSocket connection |
| GET | `/api/chat/messages/{conversationId}` | Load messages |
| GET | `/api/chat/conversations/surveyor/{id}` | List conversations |
| POST | `/api/chat/messages` | Send via REST (fallback) |
| GET | `/api/chat/unread` | Get unread count |

### Webhook (Location via QStash)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/qstash/location` | Receive location from QStash |

## Environment Variables

### Local Development (.env)
```env
EXPO_PUBLIC_API_BASE_URL=https://cmx-notification-be-production.up.railway.app/api
EXPO_PUBLIC_QSTASH_TOKEN=your-qstash-token
EXPO_PUBLIC_QSTASH_DESTINATION_URL=https://cmx-notification-be-production.up.railway.app/api/webhook/qstash/location
EXPO_PUBLIC_IMGBB_API_KEY=your-imgbb-key
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### EAS Environment Variables (Production)

Configured via `eas env:create` or the setup script:

| Variable | Visibility | Description |
|----------|------------|-------------|
| `EXPO_PUBLIC_QSTASH_TOKEN` | sensitive | QStash API token |
| `EXPO_PUBLIC_IMGBB_API_KEY` | sensitive | ImgBB image upload key |
| `EXPO_PUBLIC_SENTRY_DSN` | sensitive | Sentry error tracking DSN |
| `SENTRY_ORG` | secret | Sentry organization slug |
| `SENTRY_PROJECT` | secret | Sentry project name |
| `SENTRY_AUTH_TOKEN` | secret | Sentry auth token for source maps |

### EAS Secrets Setup Script

```bash
# Run from mobile-expo directory
cd scripts
./setup-eas-tokens.sh
```

The script reads from `scripts/eas-tokens.json` and sets all variables automatically.

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- iOS Simulator (Mac) or Android Emulator
- Expo Go app (for device testing)

### Installation

```bash
# Clone and navigate
cd mobile-expo

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android

# Run on device (scan QR with Expo Go)
npx expo start --tunnel
```

### Development Workflow

```bash
# Start Metro bundler
npm start

# Start with clearing cache
npx expo start -c

# Run iOS build locally
npx expo run:ios --device

# Run Android build locally
npx expo run:android --device
```

## Building & Deployment

### EAS Build Profiles

| Profile | Platform | Output | Use Case |
|---------|----------|--------|----------|
| development | iOS/Android | Debug build | Local dev with Expo Go |
| preview | iOS | .ipa | Internal testing |
| preview | Android | .apk | Internal testing |
| production | iOS | .ipa | App Store submission |
| production | Android | .aab | Play Store submission |

### Preview Build (Internal Testing)

```bash
# Android APK (for direct installation)
npx eas build --platform android --profile preview

# iOS (requires Apple Developer account)
npx eas build --platform ios --profile preview
```

### Production Build

```bash
# Android AAB (for Play Store)
npx eas build --platform android --profile production

# iOS (for App Store)
npx eas build --platform ios --profile production

# Both platforms
npx eas build --platform all --profile production
```

### Submit to Stores

```bash
# Submit to Google Play Store
npx eas submit --platform android --latest

# Submit to App Store Connect (TestFlight)
npx eas submit --platform ios --latest
```

## CI/CD with GitHub Actions

### Workflow Location
`../.github/workflows/eas-build.yml` (root of repository)

### Triggers
- Push to `main` (changes to `mobile-expo/**`)
- Pull requests to `main`
- Tags: `mobile-v*` (for releases)
- Manual dispatch with options

### Workflow Features
- Parallel iOS and Android builds
- Multiple profiles (development, preview, production)
- Optional store submission
- Auto-creates GitHub releases on tags

### Required GitHub Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `EXPO_TOKEN` | Expo access token | [Expo Access Tokens](https://expo.dev/accounts/[username]/settings/access-tokens) |
| `APPLE_API_KEY_ID` | App Store Connect API Key ID | [App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api) |
| `APPLE_ISSUER_ID` | App Store Connect Issuer ID | Same page (shown at top) |
| `APPLE_API_KEY` | Contents of .p8 file | Download from App Store Connect |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Service account JSON | [Google Cloud Console](https://console.cloud.google.com/) |

### Release with Tag

```bash
# Create and push a release tag
git tag mobile-v1.0.1
git push origin mobile-v1.0.1
```

This triggers the release workflow automatically.

## Troubleshooting

### Build Fails on iOS
```bash
# Clear credentials and rebuild
npx eas credentials --platform ios
npx eas build --platform ios --profile preview --clear-cache
```

### Push Notifications Not Working
1. Verify Firebase configuration in `google-services.json` and `GoogleService-Info.plist`
2. Check device token registration in backend logs
3. Ensure `EXPO_TOKEN` is set in GitHub secrets
4. Test with Expo push tool: https://expo.dev/notifications

### Location Not Updating
1. Check location permissions in device settings
2. Verify QStash token is valid and not expired
3. Check backend webhook endpoint is accessible
4. Review Sentry for location service errors

### WebSocket Chat Disconnects
```typescript
// Check connection state
chatService.getConnectionState() // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// Force reconnect
chatService.disconnect();
chatService.connect(surveyorId, name);

// Check queued messages
chatService.getQueuedMessageCount();
```

### Offline Data Not Syncing
1. Check network connectivity with `useNetwork` hook
2. Review offline queue in AsyncStorage
3. Check Sentry for sync errors
4. Manual sync trigger on reconnection

### Slow Image Uploads
1. Check network connectivity
2. Images are compressed before upload
3. ImgBB API rate limits may apply
4. Consider smaller image dimensions

### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start -c

# Reset node_modules
rm -rf node_modules
npm install

# Clear watchman
watchman watch-del-all
```

## Security

### Secure Storage
- Authentication tokens stored in `expo-secure-store`
- Sensitive data encrypted at rest
- Automatic token refresh on expiry

### Biometric Authentication
- Face ID / Touch ID for app unlock
- Configurable in Profile settings
- Falls back to PIN/password

### Network Security
- All API calls over HTTPS
- Certificate pinning (production)
- Request signing for sensitive operations

## Performance

### Optimizations
- Lazy loading for screens
- Image compression before upload
- Memoized components
- Virtualized lists for long data
- Background location updates batched
- WebSocket heartbeat optimization

### Bundle Size
- Development: ~50MB
- Production iOS: ~25MB
- Production Android: ~15MB

## License

Proprietary - All rights reserved.
