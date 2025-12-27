# FleetInspect Pro

A comprehensive enterprise-grade surveyor management and dispatch platform for vehicle inspection services. Built with Angular 17 (frontend), Spring Boot 3 (backend), and React Native/Expo (mobile).

## Production Status: LIVE

| Component | Status | URL/Location |
|-----------|--------|--------------|
| Backend API | ✅ Live | https://cmx-notification-be-production.up.railway.app |
| Swagger UI | ✅ Live | https://cmx-notification-be-production.up.railway.app/swagger-ui/index.html |
| Frontend Web | ✅ Ready | Deploy `frontend/dist` to any static host |
| Mobile iOS | ✅ Built | `.ipa` available on EAS |
| Mobile Android | ✅ Built | `.aab` available on EAS |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           FLEETINSPECT PRO - SYSTEM ARCHITECTURE                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────────┐
                              │     DISPATCHER       │
                              │    (Web Browser)     │
                              └──────────┬───────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              ANGULAR FRONTEND                                        │
│                                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Calendar   │  │   Map View  │  │   Chat      │  │  Activity   │  │ Dispatch │ │
│  │   View      │  │  (Leaflet)  │  │   Panel     │  │    Log      │  │  Panel   │ │
│  │             │  │             │  │             │  │             │  │          │ │
│  │ FullCalendar│  │ Real-time   │  │ WebSocket   │  │ SSE Stream  │  │ Job      │ │
│  │ Drag/Drop   │  │ Location    │  │ Messaging   │  │ Live Feed   │  │ Offers   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘ │
│                                                                                      │
│  Production: Auto-detects backend URL based on hostname                              │
│  Local: http://localhost:8080 | Production: Railway URL                              │
└────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                            HTTP REST + SSE + WebSocket
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                           SPRING BOOT BACKEND (Railway)                              │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              REST CONTROLLERS                                  │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │ │
│  │  │  Surveyor    │ │ Availability │ │    Mobile    │ │    Chat      │         │ │
│  │  │  Controller  │ │  Controller  │ │  Controller  │ │  Controller  │         │ │
│  │  │              │ │              │ │              │ │              │         │ │
│  │  │ GET /api/    │ │ GET/POST     │ │ POST /login  │ │ WebSocket +  │         │ │
│  │  │ surveyors    │ │ /availability│ │ /location    │ │ REST hybrid  │         │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │ │
│  │                                                                                │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │ │
│  │  │  Dispatch    │ │ Notification │ │   Activity   │ │   QStash     │         │ │
│  │  │  Controller  │ │  Controller  │ │  Controller  │ │   Webhook    │         │ │
│  │  │              │ │              │ │              │ │              │         │ │
│  │  │ Job Offers   │ │ Push/Email/  │ │ Real-time    │ │ Location     │         │ │
│  │  │ Accept/Reject│ │ SMS History  │ │ Activity Log │ │ Updates      │         │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              SERVICES LAYER                                    │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │ │
│  │  │  Surveyor    │ │ Availability │ │ Notification │ │    Chat      │         │ │
│  │  │   Service    │ │   Service    │ │   Service    │ │   Service    │         │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │ │
│  │  │   Dispatch   │ │   Activity   │ │ DeviceToken  │ │  SSE/Stream  │         │ │
│  │  │   Service    │ │   Service    │ │   Service    │ │   Service    │         │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           RESILIENCE & SECURITY                                │ │
│  │  • Resilience4j Circuit Breakers (Email, SMS, Push services)                  │ │
│  │  • Rate Limiting (Login: 10/min, Mobile: 60/sec, Chat: 120/sec)               │ │
│  │  • Caffeine Caching (5-min TTL, 500 entries max)                              │ │
│  │  • Spring Retry (3 attempts, exponential backoff)                             │ │
│  │  • Spring Security (Basic Auth, configurable)                                 │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATABASE (PostgreSQL)                             │ │
│  │                                                                                │ │
│  │  surveyor            surveyor_availability     device_token                   │ │
│  │  ├─ id               ├─ id                     ├─ id                          │ │
│  │  ├─ code             ├─ surveyor_id (FK)       ├─ surveyor_id (FK)            │ │
│  │  ├─ display_name     ├─ start_time             ├─ token                       │ │
│  │  ├─ email            ├─ end_time               ├─ platform (IOS/ANDROID)      │ │
│  │  ├─ phone            ├─ state                  └─ created_at                  │ │
│  │  ├─ surveyor_type    ├─ title                                                 │ │
│  │  ├─ current_status   ├─ description            notification_log               │ │
│  │  ├─ current_lat      └─ response_status        ├─ id                          │ │
│  │  ├─ current_lng                                ├─ surveyor_id                 │ │
│  │  └─ password         chat_message              ├─ channel (PUSH/EMAIL/SMS)    │ │
│  │                      ├─ id                     ├─ status (SENT/FAILED)        │ │
│  │  surveyor_activity   ├─ conversation_id        └─ error_message               │ │
│  │  ├─ id               ├─ sender_id                                             │ │
│  │  ├─ surveyor_id      ├─ content                dispatch_offer                 │ │
│  │  ├─ activity_type    └─ created_at             ├─ id                          │ │
│  │  ├─ previous_value                             ├─ fnol_id                     │ │
│  │  ├─ new_value                                  ├─ surveyor_id                 │ │
│  │  ├─ appointment_id                             ├─ status                      │ │
│  │  └─ latitude/lng                               └─ expires_at                  │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
           ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
           │   Firebase   │     │   Mailgun    │     │   Twilio     │
           │     FCM      │     │    Email     │     │     SMS      │
           │              │     │              │     │              │
           │ Push Notifs  │     │ HTML Email   │     │ SMS Alerts   │
           │ iOS/Android  │     │ Templates    │     │ +1 Number    │
           └──────────────┘     └──────────────┘     └──────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                           REACT NATIVE MOBILE APP (Expo)                            │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              TAB NAVIGATION                                    │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │ │
│  │  │  Dashboard   │ │   Schedule   │ │   Inspect    │ │    Chat      │         │ │
│  │  │              │ │              │ │              │ │              │         │ │
│  │  │ • Weather    │ │ • Calendar   │ │ • Checklist  │ │ • Dispatcher │         │ │
│  │  │ • Stats      │ │ • Accept/    │ │ • Photos     │ │ • Real-time  │         │ │
│  │  │ • Progress   │ │   Reject     │ │ • Signature  │ │   Messages   │         │ │
│  │  │ • Quick Stat │ │ • Navigate   │ │ • Submit     │ │ • Typing     │         │ │
│  │  │ • SOS Alert  │ │ • Details    │ │ • Offline    │ │   Indicator  │         │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                              SERVICES                                          │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │ │
│  │  │   Location   │ │    Push      │ │     API      │ │   Offline    │         │ │
│  │  │   Service    │ │   Service    │ │   Service    │ │   Storage    │         │ │
│  │  │              │ │              │ │              │ │              │         │ │
│  │  │ GPS Track    │ │ Expo Push +  │ │ REST Client  │ │ SQLite +     │         │ │
│  │  │ Background   │ │ FCM Bridge   │ │ Auth Token   │ │ AsyncStorage │         │ │
│  │  │ Geofencing   │ │ Local Notif  │ │ Retry Logic  │ │ Sync Queue   │         │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘         │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────┐ │
│  │                           ROBUSTNESS FEATURES                                  │ │
│  │  • NaN/Infinity handling for all numeric displays                             │ │
│  │  • Division by zero protection                                                │ │
│  │  • GPS timeout with fallback (10s timeout)                                    │ │
│  │  • Network connectivity detection                                             │ │
│  │  • Offline queue with automatic sync                                          │ │
│  │  • Error boundaries for crash prevention                                      │ │
│  │  • Sentry error tracking integration                                          │ │
│  └───────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         │ Location Updates
                                         ▼
                              ┌──────────────────────┐
                              │    Upstash QStash    │
                              │   (Message Queue)    │
                              │                      │
                              │ • Reliable delivery  │
                              │ • Automatic retries  │
                              │ • Signature verify   │
                              └──────────────────────┘
                                         │
                                         │ Webhook POST
                                         ▼
                              ┌──────────────────────┐
                              │   Backend Webhook    │
                              │  /api/webhook/qstash │
                              └──────────────────────┘
```

---

## Data Flow Diagrams

### 1. Appointment Creation Flow
```
Dispatcher                   Frontend                 Backend                    Database
    │                            │                        │                          │
    │  1. Create Appointment     │                        │                          │
    │ ─────────────────────────► │                        │                          │
    │                            │  2. POST /availability │                          │
    │                            │ ─────────────────────► │                          │
    │                            │                        │  3. INSERT               │
    │                            │                        │ ───────────────────────► │
    │                            │                        │                          │
    │                            │                        │  4. Trigger Notification │
    │                            │                        │ ─────────┐               │
    │                            │                        │          │               │
    │                            │                        │ ◄────────┘               │
    │                            │                        │                          │
    │                            │                        │     ┌─────────────────┐  │
    │                            │                        │ ──► │ Firebase (Push) │  │
    │                            │                        │     │ Mailgun (Email) │  │
    │                            │                        │     │ Twilio (SMS)    │  │
    │                            │                        │     └─────────────────┘  │
    │                            │                        │                          │
    │                            │  5. 200 OK + ID        │                          │
    │                            │ ◄───────────────────── │                          │
    │  6. Calendar Updated       │                        │                          │
    │ ◄───────────────────────── │                        │                          │
```

### 2. Mobile Location Tracking Flow
```
Mobile App              QStash                  Backend               Database        Frontend (SSE)
    │                      │                       │                      │                │
    │  1. GPS Update       │                       │                      │                │
    │ ───────────────────► │                       │                      │                │
    │    (via QStash API)  │                       │                      │                │
    │                      │  2. Webhook POST      │                      │                │
    │                      │ ────────────────────► │                      │                │
    │                      │    (signed request)   │                      │                │
    │                      │                       │  3. Verify signature │                │
    │                      │                       │ ─────────┐           │                │
    │                      │                       │ ◄────────┘           │                │
    │                      │                       │                      │                │
    │                      │                       │  4. UPDATE surveyor  │                │
    │                      │                       │ ───────────────────► │                │
    │                      │                       │                      │                │
    │                      │                       │  5. Log activity     │                │
    │                      │                       │ ───────────────────► │                │
    │                      │                       │                      │                │
    │                      │                       │  6. Broadcast SSE    │                │
    │                      │                       │ ──────────────────────────────────► │
    │                      │                       │                      │                │
    │                      │                       │                      │    7. Map Update
    │                      │                       │                      │ ◄────────────── │
```

### 3. Chat Messaging Flow
```
Surveyor (Mobile)          Backend (WebSocket)           Dispatcher (Web)
       │                          │                            │
       │  1. Send Message         │                            │
       │  /app/chat.send          │                            │
       │ ───────────────────────► │                            │
       │                          │  2. Store in DB            │
       │                          │ ─────────┐                 │
       │                          │ ◄────────┘                 │
       │                          │                            │
       │                          │  3. Broadcast to recipient │
       │                          │  /topic/chat/{recipientId} │
       │                          │ ─────────────────────────► │
       │                          │                            │
       │                          │  4. Push notification      │
       │ ◄─────────────────────── │    (if app in background) │
       │   (Firebase Push)        │                            │
```

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Angular | 17 | SPA Dashboard |
| | FullCalendar | 6.x | Calendar UI |
| | Leaflet | 1.9 | Map visualization |
| | RxJS | 7.x | Reactive state |
| | STOMP.js | 7.x | WebSocket client |
| **Backend** | Spring Boot | 3.3 | REST API |
| | Java | 21 | Runtime |
| | PostgreSQL | 14+ | Database |
| | Liquibase | 4.x | DB migrations |
| | Resilience4j | 2.x | Circuit breakers |
| | Caffeine | 3.x | Caching |
| | Spring Security | 6.x | Authentication |
| **Mobile** | React Native | 0.76 | Cross-platform |
| | Expo | SDK 52 | Build & deploy |
| | TypeScript | 5.x | Type safety |
| | SQLite | - | Offline storage |
| **Infrastructure** | Railway | - | Backend hosting |
| | EAS Build | - | Mobile CI/CD |
| | Firebase | - | Push notifications |
| | Mailgun | - | Email delivery |
| | Twilio | - | SMS delivery |
| | Upstash QStash | - | Message queue |
| | Sentry | - | Error tracking |

---

## Project Structure

```
fleetinspect-pro/
├── backend/                          # Spring Boot API
│   ├── src/main/java/com/cmx/
│   │   ├── controller/               # REST endpoints
│   │   │   ├── SurveyorController.java
│   │   │   ├── AvailabilityController.java
│   │   │   ├── MobileController.java
│   │   │   ├── ChatController.java
│   │   │   ├── DispatchController.java
│   │   │   ├── NotificationController.java
│   │   │   ├── SurveyorActivityController.java
│   │   │   ├── LocationStreamController.java
│   │   │   └── QStashWebhookController.java
│   │   ├── service/                  # Business logic
│   │   ├── repository/               # Data access
│   │   ├── model/                    # JPA entities
│   │   ├── dto/                      # Data transfer objects
│   │   └── config/                   # App configuration
│   ├── src/main/resources/
│   │   ├── application.properties    # Config
│   │   ├── db/changelog/             # Liquibase migrations
│   │   └── templates/                # Email templates
│   └── pom.xml
│
├── frontend/                         # Angular Dashboard
│   ├── src/app/
│   │   ├── core/
│   │   │   ├── models/               # TypeScript interfaces
│   │   │   └── services/             # API services
│   │   ├── shared/components/        # Reusable UI
│   │   └── features/                 # Feature modules
│   │       ├── calendar/
│   │       ├── map/
│   │       ├── chat/
│   │       └── activity/
│   └── package.json
│
├── mobile-expo/                      # React Native App
│   ├── src/
│   │   ├── screens/                  # Tab screens
│   │   ├── components/               # UI components
│   │   ├── services/                 # API & location
│   │   ├── store/                    # State management
│   │   └── utils/                    # Helpers
│   ├── scripts/
│   │   ├── eas-tokens.json          # EAS secrets config
│   │   └── setup-eas-tokens.sh      # Secret setup script
│   ├── app.config.js                # Expo config
│   └── eas.json                     # Build profiles
│
└── .env                             # Environment variables
```

---

## Quick Start

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL 14+ (or use H2 for local dev)

### 1. Backend
```bash
cd backend
cp ../.env.example ../.env
# Edit .env with your credentials

# Run with H2 (no PostgreSQL needed)
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# API available at http://localhost:8080
# Swagger UI at http://localhost:8080/swagger-ui/index.html
```

### 2. Frontend
```bash
cd frontend
npm install
npm start

# Dashboard at http://localhost:4200
# Auto-connects to local backend
```

### 3. Mobile
```bash
cd mobile-expo
npm install
npx expo start

# Scan QR with Expo Go app
```

---

## Environment Variables

### Backend (Railway)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Auto | PostgreSQL URL (Railway auto-sets) |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Yes | Twilio phone number |
| `MAILGUN_API_KEY` | Yes | Mailgun API key |
| `MAILGUN_DOMAIN` | Yes | Mailgun domain |
| `EMAIL_FROM` | Yes | Sender email address |
| `FIREBASE_CREDENTIALS_JSON` | Yes | Firebase service account (minified JSON) |
| `QSTASH_CURRENT_SIGNING_KEY` | Yes | QStash webhook signature key |
| `QSTASH_NEXT_SIGNING_KEY` | Yes | QStash key rotation |
| `H2_CONSOLE_ENABLED` | No | Set `false` for production |
| `SECURITY_ENABLED` | No | Enable basic auth |

### Mobile (EAS)

| Variable | Visibility | Description |
|----------|------------|-------------|
| `EXPO_PUBLIC_QSTASH_TOKEN` | sensitive | QStash API token |
| `EXPO_PUBLIC_IMGBB_API_KEY` | sensitive | Image upload API key |
| `EXPO_PUBLIC_SENTRY_DSN` | sensitive | Sentry error tracking |
| `SENTRY_ORG` | secret | Sentry organization |
| `SENTRY_PROJECT` | secret | Sentry project name |
| `SENTRY_AUTH_TOKEN` | secret | Source map upload token |

---

## API Documentation

Full API documentation available at:
- **Swagger UI**: https://cmx-notification-be-production.up.railway.app/swagger-ui/index.html
- **OpenAPI JSON**: https://cmx-notification-be-production.up.railway.app/v3/api-docs

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveyors` | List all surveyors |
| GET | `/api/availability` | Get appointments (with date range filter) |
| POST | `/api/mobile/login` | Surveyor login + device registration |
| POST | `/api/mobile/location` | Update surveyor GPS location |
| POST | `/api/mobile/job-update` | Update job status |
| GET | `/api/chat/conversations/surveyor/{id}` | Get surveyor conversations |
| POST | `/api/fnol/{id}/offers` | Create job dispatch offers |
| GET | `/api/activity` | Get real-time activity log |
| GET | `/api/dispatcher/stream` | SSE stream for live updates |

---

## Features

### Dispatcher Dashboard
- Real-time calendar with drag-drop scheduling
- Live surveyor location map (Leaflet + OpenStreetMap)
- Chat messaging with surveyors (WebSocket)
- Activity log with SSE streaming
- Job dispatch with multi-surveyor offers
- Notification history and stats

### Mobile App
- Push notifications for new assignments
- Accept/reject job offers
- Quick status updates (On Way, Arrived, Inspecting, Completed)
- GPS location tracking (foreground + background)
- Offline mode with sync queue
- In-app chat with dispatcher
- Photo capture and upload
- Digital signature capture

### Notification System
- **Push**: Firebase Cloud Messaging (iOS + Android)
- **Email**: Mailgun with HTML templates
- **SMS**: Twilio with international support
- Delivery tracking and audit log
- Circuit breaker protection

---

## Deployment

### Backend (Railway)
1. Connect GitHub repository
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy automatically on push

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/cmx-surveyor-calendar-ui to any static host
```

### Mobile
```bash
cd mobile-expo
# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

---

## Monitoring

- **Health Check**: `/actuator/health`
- **Metrics**: `/actuator/prometheus`
- **Sentry**: Error tracking for mobile
- **Notification Stats**: `/api/notifications/stats`

---

## License

Proprietary - All rights reserved.
