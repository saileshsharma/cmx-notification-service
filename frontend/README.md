# FleetInspect Pro - Web Dashboard

Angular 17 web application for dispatchers and administrators to manage surveyor appointments, view real-time locations, and communicate with field surveyors.

## Production Status: READY

| Metric | Value |
|--------|-------|
| Backend API | https://cmx-notification-be-production.up.railway.app |
| Bundle Size | 825KB (195KB gzipped) |
| Framework | Angular 17.3 |
| Environment | Auto-detects by hostname |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              ANGULAR WEB DASHBOARD                                   │
│                                  (Angular 17)                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                            FEATURE MODULES                                   │    │
│  │                                                                              │    │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐   │    │
│  │  │   Dashboard   │  │   Calendar    │  │   Heatmap     │  │  Timeline   │   │    │
│  │  │               │  │               │  │               │  │             │   │    │
│  │  │ • KPI Cards   │  │ • FullCalendar│  │ • Location    │  │ • Activity  │   │    │
│  │  │ • Metrics     │  │ • Drag & Drop │  │   Heat Map    │  │   Stream    │   │    │
│  │  │ • Charts      │  │ • Event Modal │  │ • SSE Stream  │  │ • Infinite  │   │    │
│  │  │               │  │ • Filters     │  │ • Trails      │  │   Scroll    │   │    │
│  │  └───────────────┘  └───────────────┘  └───────────────┘  └─────────────┘   │    │
│  │                                                                              │    │
│  │  ┌───────────────┐  ┌───────────────┐                                       │    │
│  │  │    Header     │  │   Sidebar     │                                       │    │
│  │  │               │  │               │                                       │    │
│  │  │ • Navigation  │  │ • Surveyor    │                                       │    │
│  │  │ • User Menu   │  │   List        │                                       │    │
│  │  │ • Search      │  │ • Chat Panel  │                                       │    │
│  │  │               │  │ • Filters     │                                       │    │
│  │  └───────────────┘  └───────────────┘                                       │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                            CORE SERVICES                                     │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │  Appointment    │  │    Surveyor     │  │   Surveyor      │             │    │
│  │  │  Service        │  │    Service      │  │   Activity Svc  │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • CRUD Ops      │  │ • List/Filter   │  │ • Activity Log  │             │    │
│  │  │ • Drag Events   │  │ • Status Mgmt   │  │ • Trail Data    │             │    │
│  │  │ • Date Ranges   │  │ • Location      │  │ • Stats/Metrics │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │   Chat          │  │  Notification   │  │    Network      │             │    │
│  │  │   Service       │  │  Service        │  │    Service      │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • WebSocket     │  │ • Push FCM      │  │ • Online/Offline│             │    │
│  │  │ • STOMP         │  │ • Toast         │  │ • Retry Logic   │             │    │
│  │  │ • Messages      │  │ • History       │  │ • SSE Connect   │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │    │
│  │  │    Cache        │  │    Loading      │  │  Error Handler  │             │    │
│  │  │    Service      │  │    Service      │  │  Service        │             │    │
│  │  │                 │  │                 │  │                 │             │    │
│  │  │ • In-Memory     │  │ • Global Loader │  │ • Interceptor   │             │    │
│  │  │ • TTL Support   │  │ • Async Ops     │  │ • Retry/Fallback│             │    │
│  │  │ • Auto-Refresh  │  │ • Debounce      │  │ • User Feedback │             │    │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐    │
│  │                          SHARED COMPONENTS                                   │    │
│  │                                                                              │    │
│  │  • Modal Dialogs      • Form Controls      • Data Tables                    │    │
│  │  • Toast Notifications • Loading Spinners  • Error Boundaries               │    │
│  │                                                                              │    │
│  └─────────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
           ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
           │   REST API   │     │  WebSocket   │     │     SSE      │
           │   (HTTP)     │     │   (STOMP)    │     │  (Location)  │
           │              │     │              │     │              │
           │ Appointments │     │ Chat/Typing  │     │ Real-time    │
           │ Surveyors    │     │ Read Receipt │     │ GPS Updates  │
           │ Notifications│     │              │     │              │
           └──────────────┘     └──────────────┘     └──────────────┘
                    │                    │                    │
                    └────────────────────┼────────────────────┘
                                         │
                                         ▼
                         ┌───────────────────────────────┐
                         │     Spring Boot Backend       │
                         │   https://cmx-notification-   │
                         │   be-production.up.railway.app│
                         └───────────────────────────────┘
```

## Real-Time Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REAL-TIME LOCATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Mobile App              QStash                Backend              Web Dashboard│
│      │                     │                     │                       │       │
│      │ 1. GPS Update       │                     │                       │       │
│      │────────────────────►│                     │                       │       │
│      │                     │ 2. Webhook POST     │                       │       │
│      │                     │────────────────────►│                       │       │
│      │                     │                     │ 3. SSE Broadcast      │       │
│      │                     │                     │──────────────────────►│       │
│      │                     │                     │                       │       │
│      │                     │                     │                  Map Update   │
│      │                     │                     │                       │       │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                           REAL-TIME CHAT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Web Dashboard            Backend               Mobile App                       │
│      │                      │                      │                             │
│      │ 1. WebSocket (STOMP) │                      │                             │
│      │─────────────────────►│                      │                             │
│      │                      │ 2. Relay Message     │                             │
│      │                      │─────────────────────►│                             │
│      │                      │                      │                             │
│      │                      │ 3. Delivery Receipt  │                             │
│      │◄─────────────────────│                      │                             │
│      │                      │                      │                             │
│      │ 4. Typing Indicator  │                      │                             │
│      │─────────────────────►│                      │                             │
│      │                      │─────────────────────►│                             │
│      │                      │                      │                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Calendar View (FullCalendar 6)
- **Multi-View Support** - Day, Week, Month views
- **Drag & Drop** - Reschedule appointments visually
- **Event Resizing** - Adjust appointment duration
- **Color Coding** - Status-based event colors
- **Quick Actions** - Click to edit, double-click to open
- **Surveyor Filter** - Show/hide by surveyor
- **Date Range Picker** - Navigate to specific dates

### Dashboard
- **KPI Cards** - Today's appointments, completed, pending
- **Surveyor Status** - Active/busy/offline counts
- **Recent Activity** - Live activity stream
- **Quick Actions** - Create appointment, send notification

### Real-Time Location Map (SSE)
- **Live Tracking** - GPS positions updated in real-time
- **Location Trails** - Historical movement paths
- **Heat Map** - Activity density visualization
- **Status Indicators** - Color-coded surveyor markers
- **Auto-Reconnect** - Seamless SSE recovery

### Chat System (WebSocket + STOMP)
- **Real-Time Messaging** - Instant message delivery
- **Typing Indicators** - See when surveyor is typing
- **Read Receipts** - Message delivery confirmation
- **Conversation List** - All surveyor threads
- **Unread Counts** - Badge notifications
- **Message History** - Scrollable chat history

### Surveyor Management
- **Surveyor List** - Filter by type, status
- **Status Updates** - Change availability
- **Activity Log** - Audit trail of actions
- **Location History** - Track movement patterns

### Notification System
- **Push Notifications** - Send to mobile devices (FCM)
- **Notification History** - View sent notifications
- **Template Messages** - Quick send common messages
- **Targeting** - Individual or group notifications

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Angular | 17.3 |
| Calendar | FullCalendar | 6.1.15 |
| Real-Time | WebSocket + STOMP | 7.2.1 |
| SSE | EventSource (native) | - |
| State | RxJS | 7.8 |
| HTTP | Angular HttpClient | 17.3 |
| Styling | CSS/SCSS | - |
| Build | Angular CLI | 17.3 |
| TypeScript | TypeScript | 5.4 |
| WebSocket | SockJS Client | 1.6.1 |

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts          # Root component (127KB - main UI)
│   │   ├── app.component.html        # Main template (84KB)
│   │   │
│   │   ├── core/                     # Core module
│   │   │   └── services/
│   │   │       ├── api-config.ts     # Environment auto-detection
│   │   │       ├── appointment.service.ts   # Appointment CRUD
│   │   │       ├── surveyor.service.ts      # Surveyor management
│   │   │       ├── surveyor-activity.service.ts  # Activity logs
│   │   │       ├── chat.service.ts          # WebSocket chat
│   │   │       ├── notification.service.ts  # Push notifications
│   │   │       ├── network.service.ts       # Connectivity
│   │   │       ├── cache.service.ts         # In-memory cache
│   │   │       ├── loading.service.ts       # Loading state
│   │   │       ├── error-handler.service.ts # Error handling
│   │   │       └── storage.service.ts       # Local storage
│   │   │
│   │   ├── features/                 # Feature modules
│   │   │   ├── calendar/             # FullCalendar integration
│   │   │   ├── dashboard/            # KPI dashboard
│   │   │   ├── heatmap/              # Location heat map
│   │   │   ├── timeline/             # Activity timeline
│   │   │   ├── header/               # Top navigation
│   │   │   └── sidebar/              # Surveyor panel
│   │   │
│   │   └── shared/                   # Shared components
│   │       └── ...                   # Reusable UI components
│   │
│   ├── assets/                       # Static assets
│   ├── environments/                 # Environment configs
│   │   ├── environment.ts            # Development
│   │   └── environment.prod.ts       # Production
│   │
│   └── index.html                    # Entry HTML
│
├── angular.json                      # Angular CLI config
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── README.md                         # This file
```

## Core Services Reference

### ApiConfigService
Auto-detects environment based on hostname:
```typescript
// src/app/core/services/api-config.ts
const isLocal = window.location.hostname === 'localhost'
             || window.location.hostname === '127.0.0.1';

export const API_BASE = isLocal
  ? 'http://localhost:8080/api'
  : 'https://cmx-notification-be-production.up.railway.app/api';
```

### AppointmentService
```typescript
// Key methods
getAppointments(start: Date, end: Date): Observable<Appointment[]>
createAppointment(data: AppointmentCreate): Observable<Appointment>
updateAppointment(id: number, data: AppointmentUpdate): Observable<Appointment>
deleteAppointment(id: number): Observable<void>
rescheduleAppointment(id: number, start: Date, end: Date): Observable<Appointment>
```

### ChatService (WebSocket + STOMP)
```typescript
// Connection
connect(dispatcherId: number, dispatcherName: string): void
disconnect(): void

// Messaging
sendMessage(recipientId: number, content: string): void
loadMessages(conversationId: string): Promise<ChatMessage[]>
loadConversations(): Promise<ChatConversation[]>

// Real-time subscriptions
subscribeToMessages(handler: (msg: ChatMessage) => void): () => void
subscribeToTyping(handler: (indicator: TypingIndicator) => void): () => void
subscribeToConnection(handler: (connected: boolean) => void): () => void
```

### SurveyorActivityService
```typescript
// Activity log methods
getActivityLog(surveyorId: number, from: Date, to: Date): Observable<Activity[]>
getLocationTrails(surveyorId: number, date: Date): Observable<Trail[]>
getStats(surveyorId: number): Observable<SurveyorStats>
streamLocations(): Observable<LocationUpdate>  // SSE
```

## API Integration

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveyors` | List all surveyors |
| GET | `/api/surveyors/{id}` | Get surveyor details |
| GET | `/api/appointments` | List appointments (date range) |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/{id}` | Update appointment |
| DELETE | `/api/appointments/{id}` | Delete appointment |
| GET | `/api/activity/{surveyorId}` | Get activity log |
| GET | `/api/availability/{surveyorId}` | Check availability |
| POST | `/api/notifications/send` | Send push notification |

### SSE Endpoint (Real-Time Location)
```typescript
// Connect to real-time location stream
const eventSource = new EventSource(`${API_BASE}/locations/stream`);

eventSource.addEventListener('location', (event) => {
  const data = JSON.parse(event.data);
  // { surveyorId, lat, lng, status, displayName, timestamp }
});

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  // { surveyorId, status, displayName }
});

eventSource.onerror = () => {
  // Auto-reconnect logic
  setTimeout(() => this.connect(), 5000);
};
```

### WebSocket (Chat - STOMP over SockJS)
```typescript
// Connect to chat WebSocket
const wsUrl = API_BASE.replace('/api', '').replace('https://', 'wss://');
const socket = new WebSocket(`${wsUrl}/ws/chat`);

// STOMP Subscribe
// /topic/chat/dispatcher/{dispatcherId} - Messages
// /topic/chat/dispatcher/{dispatcherId}/typing - Typing indicators
// /topic/chat/dispatcher/{dispatcherId}/read - Read receipts

// STOMP Destinations
// /app/chat.send - Send message
// /app/chat.typing - Send typing indicator
// /app/chat.read - Mark as read
```

## Performance

### Lighthouse Scores (Production)
| Metric | Score |
|--------|-------|
| Performance | 91+ |
| Best Practices | 96 |
| SEO | 92 |
| Accessibility | 88 |

### Optimizations Applied
- Deferred font loading with `display=swap`
- Critical CSS inlining
- Deferred Firebase SDK loading
- Preconnect hints for external domains
- Production minification and tree-shaking
- GZIP compression support
- Lazy loading for feature modules
- SSE connection pooling
- WebSocket heartbeat for connection keep-alive

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Angular CLI 17+ (optional, included in devDependencies)

### Installation

```bash
# Install dependencies
npm install

# Install Angular CLI globally (optional)
npm install -g @angular/cli
```

### Development

```bash
# Start development server (auto-detects localhost → local backend)
npm start

# Or with specific host/port
ng serve --host 0.0.0.0 --port 4200

# App runs at http://localhost:4200
# API calls go to http://localhost:8080/api
```

### Building

```bash
# Development build
ng build

# Production build (minified, optimized)
ng build --configuration production

# With specific base href
ng build --base-href /app/
```

## Deployment

### Static Hosting (Nginx, Apache, S3)

```bash
# Build for production
ng build --configuration production

# Copy dist/ folder to your web server
# dist/cmx-surveyor-calendar-ui/
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/cmx-surveyor-calendar-ui /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t surveyor-frontend .
docker run -p 80:80 surveyor-frontend
```

### Vercel

```bash
npm i -g vercel
vercel --prod
```

### Netlify

```bash
npm i -g netlify-cli
ng build --configuration production
netlify deploy --prod --dir=dist/cmx-surveyor-calendar-ui
```

## CI/CD with GitHub Actions

Create `.github/workflows/frontend.yml`:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
  pull_request:
    branches: [main]
    paths:
      - 'frontend/**'

defaults:
  run:
    working-directory: frontend

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/download-artifact@v4
        with:
          name: frontend-dist
          path: dist/

      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --delete
        env:
          AWS_S3_BUCKET: ${{ secrets.AWS_S3_BUCKET }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: 'dist/cmx-surveyor-calendar-ui'
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_S3_BUCKET` | S3 bucket name for hosting |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on port 4200 |
| `npm run build` | Production build |
| `ng serve` | Start dev server |
| `ng build` | Build the project |
| `ng test` | Run unit tests |
| `ng e2e` | Run end-to-end tests |
| `ng lint` | Lint the codebase |

## Troubleshooting

### CORS Issues
Ensure backend has CORS configured for your domain:
```java
@CrossOrigin(origins = {"http://localhost:4200", "https://yourdomain.com"})
```

### SSE Connection Drops
The service auto-reconnects with exponential backoff:
```typescript
eventSource.onerror = () => {
  this.reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
  setTimeout(() => this.connect(), delay);
};
```

### WebSocket Connection Issues
```typescript
// Check connection state
chatService.getConnectionState() // 'connected' | 'connecting' | 'disconnected' | 'reconnecting'

// Force reconnect
chatService.disconnect();
chatService.connect(dispatcherId, name);
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist .angular
npm ci
ng build
```

### Memory Issues on Build
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
ng build --configuration production
```

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 |
| Firefox | Latest 2 |
| Safari | 14+ |
| Edge | Latest 2 |
| iOS Safari | 14+ |
| Chrome Android | Latest |

## License

Proprietary - All rights reserved.
