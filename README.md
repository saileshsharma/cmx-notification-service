# CMX Surveyor Calendar

A full-stack application for managing surveyor schedules, appointments, and availability. Built with Angular 17 (frontend), Spring Boot 3 (backend), and React Native/Expo (mobile).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CMX SURVEYOR CALENDAR                               │
│                              System Architecture                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────┐
                                    │   RAILWAY    │
                                    │   (Cloud)    │
                                    └──────────────┘
                                           │
           ┌───────────────────────────────┼───────────────────────────────┐
           │                               │                               │
           ▼                               ▼                               ▼
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   FRONTEND (FE)     │      │   BACKEND (BE)      │      │   MOBILE APP        │
│   Angular 17        │      │   Spring Boot 3     │      │   React Native/Expo │
│                     │      │                     │      │                     │
│ ┌─────────────────┐ │      │ ┌─────────────────┐ │      │ ┌─────────────────┐ │
│ │ Calendar View   │ │      │ │ REST API        │ │      │ │ Surveyor Login  │ │
│ │ Timeline View   │ │      │ │ Controllers     │ │      │ │ Appointments    │ │
│ │ Heatmap View    │ │      │ │                 │ │      │ │ Accept/Reject   │ │
│ │ Map View        │ │◄────►│ │ /api/surveyors  │ │      │ │ Location Track  │ │
│ │ (Leaflet/OSM)   │ │ HTTP │ │ /api/availability│ │      │ │ Status Update   │ │
│ └─────────────────┘ │      │ │ /api/mobile/*   │ │      │ └─────────────────┘ │
│                     │      │ └─────────────────┘ │      │          │          │
│ Production URL:     │      │                     │      │          │          │
│ cmx-notification-   │      │ ┌─────────────────┐ │      │          ▼          │
│ fe-production.      │      │ │ Services        │ │      │ ┌─────────────────┐ │
│ up.railway.app      │      │ │                 │ │      │ │ QStash Service  │ │
└─────────────────────┘      │ │ SurveyorService │ │      │ │ (Message Queue) │ │
                             │ │ AvailabilityServ│ │      │ └────────┬────────┘ │
                             │ │ NotificationServ│ │      │          │          │
                             │ └─────────────────┘ │      └──────────┼──────────┘
                             │                     │                 │
                             │ ┌─────────────────┐ │                 │
                             │ │ QStash Webhook  │◄┼─────────────────┘
                             │ │ /api/webhook/   │ │      Upstash QStash
                             │ │ qstash/location │ │      (Serverless MQ)
                             │ └─────────────────┘ │
                             │                     │
                             │ ┌─────────────────┐ │
                             │ │ Database (H2)   │ │
                             │ │                 │ │
                             │ │ • surveyors     │ │
                             │ │ • availability  │ │
                             │ │ • device_tokens │ │
                             │ │ • notifications │ │
                             │ └─────────────────┘ │
                             │                     │
                             │ ┌─────────────────┐ │
                             │ │ Notifications   │ │
                             │ │                 │ │
                             │ │ • Firebase FCM  │─┼──► Push Notifications
                             │ │ • Mailgun Email │─┼──► Email Alerts
                             │ │ • Twilio SMS    │─┼──► SMS Messages
                             │ └─────────────────┘ │
                             │                     │
                             │ Production URL:     │
                             │ cmx-notification-   │
                             │ be-production.      │
                             │ up.railway.app      │
                             └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

1. APPOINTMENT MANAGEMENT FLOW:
   ┌────────┐    HTTP     ┌─────────┐    SQL     ┌──────────┐
   │   FE   │────────────►│   BE    │───────────►│    DB    │
   │Calendar│◄────────────│   API   │◄───────────│   (H2)   │
   └────────┘   JSON      └─────────┘            └──────────┘

2. LOCATION TRACKING FLOW (via QStash):
   ┌────────┐   HTTPS    ┌─────────┐   Webhook   ┌─────────┐   SQL    ┌────┐
   │ Mobile │───────────►│ QStash  │────────────►│   BE    │─────────►│ DB │
   │  App   │            │ (Queue) │             │ Webhook │          │    │
   └────────┘            └─────────┘             └─────────┘          └────┘
        │                                              │
        │ Location + Status                            │ Update surveyor
        │ • lat, lng                                   │ • current_lat
        │ • AVAILABLE/BUSY/OFFLINE                     │ • current_lng
        │ • timestamp                                  │ • current_status
        │                                              │ • last_location_update
        ▼                                              ▼

3. NOTIFICATION FLOW:
   ┌─────────┐           ┌─────────┐           ┌─────────────────────┐
   │   BE    │──────────►│ Firebase│──────────►│ Mobile Push (FCM)   │
   │ Service │           │   FCM   │           └─────────────────────┘
   └─────────┘           └─────────┘
        │
        ├───────────────►┌─────────┐           ┌─────────────────────┐
        │                │ Mailgun │──────────►│ Email Notification  │
        │                └─────────┘           └─────────────────────┘
        │
        └───────────────►┌─────────┐           ┌─────────────────────┐
                         │ Twilio  │──────────►│ SMS Notification    │
                         └─────────┘           └─────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNOLOGY STACK                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│     FRONTEND     │     BACKEND      │      MOBILE      │   INFRASTRUCTURE │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ • Angular 17     │ • Spring Boot 3  │ • React Native   │ • Railway (PaaS) │
│ • TypeScript     │ • Java 17        │ • Expo SDK 52    │ • Upstash QStash │
│ • FullCalendar   │ • H2 Database    │ • TypeScript     │ • Firebase FCM   │
│ • Leaflet Maps   │ • Liquibase      │ • Expo Location  │ • Mailgun        │
│ • RxJS           │ • Swagger/OpenAPI│ • Expo Notify    │ • Twilio         │
│ • SCSS           │ • Thymeleaf      │                  │ • EAS Build      │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYMENT URLS                                     │
└─────────────────────────────────────────────────────────────────────────────────┘

│ Component │ Production URL                                        │
├───────────┼───────────────────────────────────────────────────────┤
│ Frontend  │ https://cmx-notification-fe-production.up.railway.app │
│ Backend   │ https://cmx-notification-be-production.up.railway.app │
│ API Docs  │ https://cmx-notification-be-production.up.railway.app/swagger-ui.html │
│ Mobile    │ Built via EAS Build (Expo)                            │
└───────────┴───────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your API keys

# 2. Start both services
./start.sh
```

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **H2 Console**: http://localhost:8080/h2-console

## Project Structure

```
├── backend/                 # Spring Boot API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Config & Liquibase migrations
│   └── pom.xml             # Maven dependencies
├── frontend/               # Angular 17 SPA
│   ├── src/app/           # Angular components & services
│   └── package.json       # npm dependencies
├── e2e-tests/             # Playwright E2E tests
├── .env.example           # Environment template
├── .env                   # Your secrets (gitignored)
├── .gitignore            # Git ignore rules
└── start.sh              # Startup script
```

## Prerequisites

- **Java 17+** - `java -version`
- **Maven 3.8+** - `mvn -version`
- **Node.js 18+** - `node -version`
- **npm 9+** - `npm -version`

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `EMAIL_FROM` | Sender email address |
| `SMTP_USERNAME` | SMTP username (Gmail) |
| `SMTP_PASSWORD` | SMTP app password |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Twilio phone number |
| `FIREBASE_CREDENTIALS_PATH` | Path to Firebase JSON |

---

# Backend (Spring Boot)

## Tech Stack

- **Spring Boot 3.2** - REST API framework
- **H2 Database** - Embedded SQL database (PostgreSQL compatible)
- **Liquibase** - Database migrations
- **Thymeleaf** - Email templates
- **Firebase Admin SDK** - Push notifications
- **Twilio SDK** - SMS notifications

## Running the Backend

```bash
cd backend

# Development (with hot reload)
mvn spring-boot:run

# Build JAR
mvn clean package -DskipTests

# Run JAR
java -jar target/calendar-api-1.0.0.jar
```

## API Endpoints

### Surveyors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveyors` | List all surveyors |
| GET | `/api/surveyors?type=INTERNAL` | Filter by type |
| GET | `/api/surveyors?currentStatus=AVAILABLE` | Filter by status |
| GET | `/api/surveyors/{id}` | Get surveyor by ID |
| GET | `/api/surveyors/{id}/notes` | Get surveyor notes |
| POST | `/api/surveyors/{id}/notes` | Add/update note |

### Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability` | List appointments |
| GET | `/api/availability?from=...&to=...` | Filter by date range |
| GET | `/api/availability?surveyorIds=1,2,3` | Filter by surveyors |
| POST | `/api/availability` | Create appointment |
| PUT | `/api/availability/{id}` | Update appointment |
| DELETE | `/api/availability/{id}` | Delete appointment |

### Dispatch

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dispatch/offer` | Create job offer |
| POST | `/api/dispatch/accept/{offerId}` | Accept offer |
| POST | `/api/dispatch/reject/{offerId}` | Reject offer |
| POST | `/api/dispatch/complete/{offerId}` | Complete job |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/register` | Register device token |
| POST | `/api/notifications/test` | Send test notification |
| GET | `/api/notifications/history/{surveyorId}` | Get notification history |

### Request/Response Examples

**Create Appointment:**
```json
POST /api/availability
{
  "surveyorId": 1,
  "blocks": [{
    "startTime": "2024-12-24T09:00:00Z",
    "endTime": "2024-12-24T17:00:00Z",
    "state": "BUSY",
    "title": "Client Meeting",
    "description": "Annual review"
  }]
}
```

**Response:**
```json
{
  "id": 123,
  "surveyor_id": 1,
  "start_time": "2024-12-24T09:00:00Z",
  "end_time": "2024-12-24T17:00:00Z",
  "state": "BUSY",
  "title": "Client Meeting"
}
```

## Database

### H2 Console Access
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:file:./data/calendar`
- Username: `sa`
- Password: (empty)

### Schema
Managed via Liquibase migrations in `src/main/resources/db/changelog/`

**Key Tables:**
- `surveyors` - Surveyor profiles
- `availability` - Appointments/schedules
- `dispatch_offers` - Job dispatch workflow
- `notification_history` - Notification logs
- `device_tokens` - Push notification tokens

## Configuration

`src/main/resources/application.properties`:

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:h2:file:./data/calendar

# Email (uses env vars)
spring.mail.username=${SMTP_USERNAME:}
spring.mail.password=${SMTP_PASSWORD:}

# Twilio (uses env vars)
twilio.account.sid=${TWILIO_ACCOUNT_SID:}
twilio.auth.token=${TWILIO_AUTH_TOKEN:}
```

---

# Frontend (Angular)

## Tech Stack

- **Angular 17** - Standalone components
- **FullCalendar** - Calendar UI
- **RxJS** - Reactive state management
- **TypeScript 5.2** - Type safety

## Running the Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server (hot reload)
npm start
# or
ng serve --host 0.0.0.0 --port 4200

# Production build
npm run build
```

## Architecture

```
src/app/
├── core/                    # Core module
│   ├── models/             # TypeScript interfaces
│   │   ├── surveyor.model.ts
│   │   ├── appointment.model.ts
│   │   ├── notification.model.ts
│   │   └── dashboard.model.ts
│   └── services/           # API & state services
│       ├── surveyor.service.ts
│       ├── appointment.service.ts
│       ├── notification.service.ts
│       └── storage.service.ts
├── shared/                  # Shared components
│   └── components/
│       ├── toast/          # Toast notifications
│       ├── modal/          # Modal dialogs
│       ├── sidebar/        # Surveyor sidebar
│       ├── surveyor-card/  # Surveyor card
│       └── button/         # Reusable button
├── features/               # Feature components
│   ├── header/            # App header
│   ├── calendar/          # FullCalendar view
│   ├── timeline/          # Timeline view
│   ├── heatmap/           # Workload heatmap
│   └── dashboard/         # Stats dashboard
└── app.component.ts       # Root component
```

## Key Features

### Views
- **Calendar View** - Weekly/monthly calendar with drag-drop
- **Timeline View** - Resource timeline for multiple surveyors
- **Heatmap View** - Visual workload distribution

### Sidebar
- Surveyor list with status indicators
- Search and filter (by type, status)
- Multi-select for batch operations
- Collapsible groups (Internal/External)

### Appointments
- Create via calendar click or date selection
- Edit/delete existing appointments
- Drag-drop rescheduling
- Conflict detection

### Notifications
- Toast notifications for actions
- Push notification testing
- Activity log

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Refresh data |
| `D` | Toggle dashboard |
| `Escape` | Close modals |

## State Management

Uses RxJS `BehaviorSubject` for reactive state:

```typescript
// Service
private surveyorsSubject = new BehaviorSubject<Surveyor[]>([]);
surveyors$ = this.surveyorsSubject.asObservable();

// Component
this.surveyorService.surveyors$.subscribe(surveyors => {
  this.surveyors = surveyors;
});
```

## API Configuration

The frontend connects to the backend at `http://localhost:8080/api`. To change:

```typescript
// In any service
private readonly apiBase = (window as any).__API_BASE__ || 'http://localhost:8080/api';
```

---

# Mobile App (React Native/Expo)

## Tech Stack

- **React Native** - Cross-platform mobile framework
- **Expo SDK 52** - Development and build tooling
- **TypeScript** - Type safety
- **Expo Location** - GPS location tracking
- **Expo Notifications** - Push notifications

## Project Structure

```
mobile-expo/
├── src/
│   ├── config/
│   │   └── api.ts              # API & QStash configuration
│   ├── services/
│   │   ├── api.ts              # REST API service
│   │   ├── qstash.ts           # QStash message queue service
│   │   ├── location.ts         # Location tracking service
│   │   ├── notifications.ts    # Push notification handling
│   │   └── storage.ts          # AsyncStorage wrapper
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── App.tsx                 # Main app component
├── app.json                    # Expo configuration
├── eas.json                    # EAS Build configuration
└── package.json
```

## Features

### Surveyor Login
- Select surveyor from dropdown list
- Register device for push notifications
- Persist login state

### Appointment Management
- View upcoming appointments
- Accept or reject appointments
- Pull-to-refresh

### Location Tracking
- Real-time GPS tracking
- Background location updates
- Automatic sync every 2 minutes

### Status Updates
- AVAILABLE / BUSY / OFFLINE
- One-tap status change
- Synced via QStash message queue

## Running the App

```bash
cd mobile-expo

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Run on Android emulator
npx expo start --android

# Run on iOS simulator (macOS only)
npx expo start --ios
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK (preview)
eas build --profile preview --platform android

# Build Android AAB (production)
eas build --profile production --platform android

# Build iOS (requires Apple Developer account)
eas build --profile production --platform ios
```

## QStash Integration

The mobile app publishes location and status updates to Upstash QStash, which then delivers them to the backend webhook. This decouples the mobile app from the backend.

**Flow:**
```
Mobile App → QStash API → Backend Webhook → Database
```

**Configuration** (`src/config/api.ts`):
```typescript
export const QSTASH_TOKEN = 'your-qstash-token';
export const QSTASH_DESTINATION_URL = 'https://your-backend/api/webhook/qstash/location';
```

**Message Types:**
- `location` - GPS coordinates only
- `status` - Availability status only
- `location_status` - Both location and status
- `appointment_response` - Accept/reject appointments

---

# E2E Tests

## Running Tests

```bash
cd e2e-tests

# Install Playwright
npm install
npx playwright install

# Run all tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/frontend.spec.ts
```

## Test Coverage

- **API Tests** (`api.spec.ts`) - 17 tests
  - Surveyor CRUD
  - Availability CRUD
  - Filtering & pagination
  - Dispatch workflow
  - Notifications

- **Frontend Tests** (`frontend.spec.ts`) - 16 tests
  - Page load & navigation
  - Surveyor management
  - Calendar views
  - Appointment creation
  - Keyboard shortcuts

- **Integration Tests** (`integration.spec.ts`) - 6 tests
  - End-to-end workflows
  - Data consistency

## Test Configuration

`playwright.config.ts`:
```typescript
{
  baseURL: 'http://localhost:4200',
  webServer: [
    { command: 'cd ../backend && mvn spring-boot:run', port: 8080 },
    { command: 'cd ../frontend && npm start', port: 4200 }
  ]
}
```

---

# Development

## Code Style

### Backend (Java)
- Follow Spring Boot conventions
- Use constructor injection
- DTOs for API requests/responses
- Liquibase for schema changes

### Frontend (Angular)
- Standalone components
- Barrel exports (`index.ts`)
- Services for state management
- Models for type safety

## Adding a New Feature

1. **Backend**
   - Add entity in `model/`
   - Add repository in `repository/`
   - Add service in `service/`
   - Add controller in `controller/`
   - Add Liquibase migration

2. **Frontend**
   - Add model in `core/models/`
   - Add service in `core/services/`
   - Add component in `features/` or `shared/`
   - Update barrel exports

## Troubleshooting

### Port already in use
```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:4200 | xargs kill -9
```

### Database issues
```bash
rm -rf backend/data/*.db
```

### Node modules issues
```bash
rm -rf frontend/node_modules
npm install
```

### Environment variables not loading
```bash
source .env
echo $TWILIO_ACCOUNT_SID
```

---

# Deployment

## Production Build

```bash
# Backend
cd backend
mvn clean package -DskipTests
# JAR at: target/calendar-api-1.0.0.jar

# Frontend
cd frontend
npm run build
# Output at: dist/
```

## Docker (optional)

```dockerfile
# Backend Dockerfile
FROM eclipse-temurin:17-jdk
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]

# Frontend Dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
```

## Environment Variables for Production

Set these in your deployment environment:
- `SPRING_DATASOURCE_URL` - Production database URL
- `SMTP_*` - Email credentials
- `TWILIO_*` - SMS credentials
- `FIREBASE_CREDENTIALS_PATH` - Firebase service account

---

# License

Proprietary - CMX Internal Use Only
