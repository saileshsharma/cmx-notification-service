# FleetInspect Pro - Backend API

Spring Boot REST API for managing surveyor appointments, real-time location tracking, multi-channel notifications, and chat messaging.

## Production Status: LIVE

| Resource | URL |
|----------|-----|
| **API Base** | https://cmx-notification-be-production.up.railway.app |
| **Swagger UI** | https://cmx-notification-be-production.up.railway.app/swagger-ui/index.html |
| **OpenAPI Spec** | https://cmx-notification-be-production.up.railway.app/v3/api-docs |
| **Health Check** | https://cmx-notification-be-production.up.railway.app/actuator/health |
| **Metrics** | https://cmx-notification-be-production.up.railway.app/actuator/prometheus |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SPRING BOOT BACKEND                                      │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              PRESENTATION LAYER                                  │ │
│  │                                                                                  │ │
│  │  REST Controllers                    WebSocket                    SSE            │ │
│  │  ┌──────────────────────────────┐   ┌─────────────────┐   ┌─────────────────┐  │ │
│  │  │ SurveyorController           │   │ ChatController  │   │ LocationStream  │  │ │
│  │  │ AvailabilityController       │   │ • /app/chat.*   │   │ Controller      │  │ │
│  │  │ MobileController             │   │ • STOMP/SockJS  │   │ • /api/disp/    │  │ │
│  │  │ DispatchController           │   └─────────────────┘   │   stream        │  │ │
│  │  │ NotificationController       │                         └─────────────────┘  │ │
│  │  │ SurveyorActivityController   │                                               │ │
│  │  │ QStashWebhookController      │                                               │ │
│  │  └──────────────────────────────┘                                               │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              SERVICE LAYER                                       │ │
│  │                                                                                  │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │ │
│  │  │ SurveyorService │ │AvailabilitySvc  │ │NotificationSvc  │ │  ChatService  │ │ │
│  │  │                 │ │                 │ │                 │ │               │ │ │
│  │  │ • List/Filter   │ │ • CRUD blocks   │ │ • Push (FCM)    │ │ • Send/Store  │ │ │
│  │  │ • Update loc    │ │ • Date ranges   │ │ • Email (Mgun)  │ │ • Broadcast   │ │ │
│  │  │ • Update status │ │ • Conflicts     │ │ • SMS (Twilio)  │ │ • Read rcpt   │ │ │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘ │ │
│  │                                                                                  │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │ │
│  │  │DispatchService  │ │ActivityService  │ │DeviceTokenSvc   │ │ AuditService  │ │ │
│  │  │                 │ │                 │ │                 │ │               │ │ │
│  │  │ • Create offers │ │ • Log activity  │ │ • Register tkn  │ │ • Log notifs  │ │ │
│  │  │ • Accept/Reject │ │ • SSE broadcast │ │ • Platform mgmt │ │ • Stats/hist  │ │ │
│  │  │ • Expiration    │ │ • Query history │ │ • Cleanup       │ │ • Delivery    │ │ │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              RESILIENCE LAYER                                    │ │
│  │                                                                                  │ │
│  │  Resilience4j                     Spring Retry              Caffeine Cache      │ │
│  │  ┌─────────────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │ │
│  │  │ Circuit Breakers        │     │ @Retryable      │     │ availabilityCache│  │ │
│  │  │ • emailService          │     │ • 3 attempts    │     │ surveyorsCache   │  │ │
│  │  │ • smsService            │     │ • Exp backoff   │     │ 500 entries      │  │ │
│  │  │ • pushService           │     │ • 1s, 2s, 4s    │     │ 5-min TTL        │  │ │
│  │  └─────────────────────────┘     └─────────────────┘     └─────────────────┘   │ │
│  │                                                                                  │ │
│  │  Rate Limiters (Resilience4j)                                                   │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │ loginApi: 10/min │ mobileApi: 60/sec │ chatApi: 120/sec │ readApi: 200/s│   │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                           │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              DATA LAYER                                          │ │
│  │                                                                                  │ │
│  │  Spring Data JPA Repositories                                                    │ │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐       │ │
│  │  │SurveyorRepo   │ │AvailabilityRpo│ │DeviceTokenRepo│ │NotifLogRepo   │       │ │
│  │  │ChatMessageRepo│ │DispatchOfferRp│ │ActivityLogRepo│ │JobAssignRepo  │       │ │
│  │  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘       │ │
│  │                                                                                  │ │
│  │  PostgreSQL (Railway) - Managed via Liquibase migrations                        │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
                              │                     │
              ┌───────────────┼─────────────────────┼───────────────┐
              ▼               ▼                     ▼               ▼
        ┌───────────┐  ┌───────────┐        ┌───────────┐   ┌───────────┐
        │ Firebase  │  │  Mailgun  │        │  Twilio   │   │  QStash   │
        │   FCM     │  │  (Email)  │        │   (SMS)   │   │ (Webhook) │
        └───────────┘  └───────────┘        └───────────┘   └───────────┘
```

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Spring Boot | 3.3.x |
| Language | Java | 21 |
| Database | PostgreSQL | 14+ |
| Migrations | Liquibase | 4.x |
| Caching | Caffeine | 3.x |
| Resilience | Resilience4j | 2.x |
| Security | Spring Security | 6.x |
| WebSocket | Spring WebSocket + STOMP | - |
| API Docs | SpringDoc OpenAPI | 2.x |
| Push Notifications | Firebase Admin SDK | 9.x |
| Email | Mailgun (HTTP API) | - |
| SMS | Twilio SDK | 9.x |
| Build | Maven | 3.9+ |

---

## Project Structure

```
backend/
├── src/main/java/com/cmx/
│   ├── Application.java                    # Spring Boot entry point
│   │
│   ├── controller/                         # REST endpoints
│   │   ├── SurveyorController.java        # GET /api/surveyors
│   │   ├── AvailabilityController.java    # CRUD /api/availability
│   │   ├── MobileController.java          # /api/mobile/* (login, location, status)
│   │   ├── ChatController.java            # /api/chat/* + WebSocket handlers
│   │   ├── DispatchController.java        # /api/fnol/*/offers, /api/offers/*/accept
│   │   ├── NotificationController.java    # /api/notifications/*, /api/dev/*
│   │   ├── SurveyorActivityController.java # /api/activity, /api/dispatcher/stream
│   │   ├── LocationStreamController.java  # SSE /api/locations/stream
│   │   └── QStashWebhookController.java   # /api/webhook/qstash/location
│   │
│   ├── service/                           # Business logic
│   │   ├── SurveyorService.java          # Surveyor CRUD, location/status updates
│   │   ├── AvailabilityService.java      # Appointment/calendar management
│   │   ├── NotificationService.java      # Multi-channel notification dispatch
│   │   ├── ChatService.java              # Message storage and WebSocket broadcast
│   │   ├── DispatchService.java          # Job offer lifecycle management
│   │   ├── SurveyorActivityService.java  # Activity logging and SSE broadcast
│   │   ├── DeviceTokenService.java       # Push token registration
│   │   ├── NotificationAuditService.java # Notification history and stats
│   │   └── LocationBroadcastService.java # SSE location streaming
│   │
│   ├── repository/                        # Spring Data JPA repositories
│   │   ├── SurveyorRepository.java
│   │   ├── AvailabilityRepository.java
│   │   ├── DeviceTokenRepository.java
│   │   ├── NotificationLogRepository.java
│   │   ├── ChatMessageRepository.java
│   │   ├── DispatchOfferRepository.java
│   │   └── SurveyorActivityRepository.java
│   │
│   ├── model/                             # JPA entities
│   │   ├── Surveyor.java
│   │   ├── SurveyorAvailability.java
│   │   ├── DeviceToken.java
│   │   ├── NotificationLog.java
│   │   ├── ChatMessage.java
│   │   ├── DispatchOffer.java
│   │   └── SurveyorActivityLog.java
│   │
│   ├── dto/                               # Data transfer objects
│   │   ├── AvailabilityDto.java
│   │   ├── ChatMessageDto.java
│   │   ├── DispatchDto.java
│   │   ├── DeviceTokenDto.java
│   │   └── NotificationDto.java
│   │
│   ├── config/                            # Configuration classes
│   │   ├── DataSourceConfig.java         # DATABASE_URL auto-conversion
│   │   ├── WebSocketConfig.java          # STOMP/SockJS setup
│   │   ├── SecurityConfig.java           # Spring Security rules
│   │   ├── CacheConfig.java              # Caffeine cache setup
│   │   ├── FirebaseConfig.java           # FCM initialization
│   │   └── OpenApiConfig.java            # Swagger configuration
│   │
│   └── exception/                         # Exception handling
│       └── GlobalExceptionHandler.java
│
├── src/main/resources/
│   ├── application.properties             # Main configuration
│   ├── db/changelog/                      # Liquibase migrations
│   │   ├── db.changelog-master.xml
│   │   ├── 001-initial-schema.xml
│   │   ├── 002-add-chat-tables.xml
│   │   ├── 003-add-activity-log.xml
│   │   └── ...
│   └── templates/                         # Email templates (Thymeleaf)
│
└── pom.xml                                # Maven dependencies
```

---

## Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA (PostgreSQL)                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐      ┌─────────────────────────┐
│        surveyor         │      │  surveyor_availability  │
├─────────────────────────┤      ├─────────────────────────┤
│ id (PK)                 │      │ id (PK)                 │
│ code (VARCHAR)          │◄─────│ surveyor_id (FK)        │
│ display_name            │      │ start_time (TIMESTAMP)  │
│ email                   │      │ end_time (TIMESTAMP)    │
│ phone                   │      │ state (VARCHAR)         │
│ surveyor_type           │      │ title                   │
│ current_status          │      │ description             │
│ current_lat (DOUBLE)    │      │ source (MOBILE/WEB)     │
│ current_lng (DOUBLE)    │      │ response_status         │
│ last_location_update    │      │ responded_at            │
│ home_lat, home_lng      │      │ created_at, updated_at  │
│ password (VARCHAR)      │      └─────────────────────────┘
│ status (ACTIVE/INACTIVE)│
└─────────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│      device_token       │      │    notification_log     │
├─────────────────────────┤      ├─────────────────────────┤
│ id (PK)                 │      │ id (PK)                 │
│ surveyor_id (FK)        │      │ surveyor_id (FK)        │
│ token (VARCHAR)         │      │ channel (PUSH/EMAIL/SMS)│
│ platform (IOS/ANDROID)  │      │ event_type              │
│ created_at              │      │ title, body             │
│ updated_at              │      │ status (SENT/FAILED)    │
└─────────────────────────┘      │ error_message           │
                                 │ recipient               │
┌─────────────────────────┐      │ external_id             │
│   surveyor_activity_log │      │ created_at              │
├─────────────────────────┤      └─────────────────────────┘
│ id (PK)                 │
│ surveyor_id (FK)        │      ┌─────────────────────────┐
│ activity_type           │      │     chat_message        │
│ previous_value          │      ├─────────────────────────┤
│ new_value               │      │ id (PK)                 │
│ appointment_id          │      │ conversation_id         │
│ latitude, longitude     │      │ sender_id               │
│ notes                   │      │ sender_type             │
│ created_at              │      │ recipient_id            │
└─────────────────────────┘      │ recipient_type          │
                                 │ content (TEXT)          │
┌─────────────────────────┐      │ read_at                 │
│     dispatch_offer      │      │ created_at              │
├─────────────────────────┤      └─────────────────────────┘
│ id (PK)                 │
│ fnol_id (VARCHAR)       │
│ offer_group (VARCHAR)   │
│ surveyor_id (FK)        │
│ status                  │
│ expires_at              │
│ responded_at            │
│ created_at              │
└─────────────────────────┘
```

---

## API Reference

### Surveyor Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveyors` | List all surveyors with optional filters |
| GET | `/api/surveyors?type=INTERNAL` | Filter by surveyor type |
| GET | `/api/surveyors?currentStatus=AVAILABLE` | Filter by status |

### Availability/Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/availability` | List appointments with date range |
| GET | `/api/availability?from=...&to=...&surveyorId=1` | Filter by date and surveyor |
| POST | `/api/mobile/availability` | Create/update availability blocks |
| PUT | `/api/availability/{id}` | Update existing appointment |
| DELETE | `/api/availability/{id}` | Delete appointment |

### Mobile APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mobile/login` | Surveyor login + auto device registration |
| POST | `/api/mobile/device-token` | Register push notification token |
| DELETE | `/api/mobile/device-token` | Unregister device token |
| GET | `/api/mobile/notifications` | Get notification history |
| GET | `/api/mobile/appointments/{surveyorId}` | Get surveyor appointments |
| POST | `/api/mobile/appointments/{id}/respond` | Accept/reject appointment |
| POST | `/api/mobile/location` | Update GPS location |
| POST | `/api/mobile/status` | Update status (AVAILABLE/BUSY/OFFLINE) |
| POST | `/api/mobile/job-update` | Update job progress (ON_WAY/ARRIVED/INSPECTING/COMPLETED) |
| POST | `/api/mobile/location-status` | Update location and status together |
| GET | `/api/mobile/surveyor/{id}` | Get surveyor details |
| POST | `/api/mobile/change-password` | Change password |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/messages/{conversationId}` | Get message history |
| POST | `/api/chat/messages` | Send message (REST alternative) |
| GET | `/api/chat/conversations/surveyor/{id}` | Get surveyor's conversations |
| GET | `/api/chat/conversations/dispatcher/{id}` | Get dispatcher's conversations |
| POST | `/api/chat/conversations/start` | Start new conversation |
| GET | `/api/chat/unread?userId=X&userType=Y` | Get unread count |
| **WebSocket** | `/app/chat.send` | Send message via WebSocket |
| **WebSocket** | `/app/chat.typing` | Send typing indicator |
| **WebSocket** | `/topic/chat/{recipientId}` | Subscribe to messages |

### Dispatch

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fnol/{fnolId}/offers` | Create job offers for candidates |
| POST | `/api/offers/{offerGroup}/accept` | Accept offer |
| POST | `/api/jobs/{jobId}/complete` | Complete job |

### Activity & Real-time

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Get activity log with filters |
| GET | `/api/activity/recent?hours=2` | Get recent activity |
| GET | `/api/dispatcher/stream` | SSE stream for live activity updates |
| GET | `/api/dispatcher/status` | SSE connection status |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/history` | Get notification audit log |
| GET | `/api/notifications/stats` | Get notification statistics |
| GET | `/api/dev/notification-status` | Get service status (Push/Email/SMS) |
| POST | `/api/dev/test-notification/{surveyorId}` | Send test notification |
| GET | `/api/dev/device-tokens/{surveyorId}` | Get registered device tokens |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/qstash/location` | Receive location updates from QStash |
| GET | `/api/webhook/qstash/health` | Webhook health check |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/actuator/health` | Health check |
| GET | `/actuator/prometheus` | Prometheus metrics |
| GET | `/swagger-ui/index.html` | Swagger UI |
| GET | `/v3/api-docs` | OpenAPI JSON |

---

## Configuration

### application.properties

```properties
# Server
server.port=8080

# Database (auto-converted from Railway's DATABASE_URL)
# DataSourceConfig.java handles postgresql:// → jdbc:postgresql:// conversion

# Email (Mailgun)
email.enabled=true
email.from=${EMAIL_FROM:noreply@example.com}
mailgun.api.key=${MAILGUN_API_KEY:}
mailgun.domain=${MAILGUN_DOMAIN:}

# SMS (Twilio)
sms.enabled=true
twilio.account.sid=${TWILIO_ACCOUNT_SID:}
twilio.auth.token=${TWILIO_AUTH_TOKEN:}
twilio.phone.number=${TWILIO_PHONE_NUMBER:}

# Firebase Push
firebase.credentials.json=${FIREBASE_CREDENTIALS_JSON:}

# QStash Webhooks
qstash.current-signing-key=${QSTASH_CURRENT_SIGNING_KEY:}
qstash.next-signing-key=${QSTASH_NEXT_SIGNING_KEY:}

# Security
security.enabled=${SECURITY_ENABLED:false}

# Rate Limiting
resilience4j.ratelimiter.instances.loginApi.limitForPeriod=10
resilience4j.ratelimiter.instances.mobileApi.limitForPeriod=60
resilience4j.ratelimiter.instances.chatApi.limitForPeriod=120
```

---

## Railway Environment Variables

All these are currently configured in Railway:

| Variable | Status | Value/Notes |
|----------|--------|-------------|
| `DATABASE_URL` | ✅ Auto | PostgreSQL addon (auto-converted) |
| `TWILIO_ACCOUNT_SID` | ✅ Set | ACb3ca474e0911c21d0a555605c132fd1d |
| `TWILIO_AUTH_TOKEN` | ✅ Set | (secret) |
| `TWILIO_PHONE_NUMBER` | ✅ Set | +19377452900 |
| `MAILGUN_API_KEY` | ✅ Set | (secret) |
| `MAILGUN_DOMAIN` | ✅ Set | sandboxb7a00d52da994b4d8ac33650a1e57e3b.mailgun.org |
| `EMAIL_FROM` | ✅ Set | Mailgun Sandbox |
| `FIREBASE_CREDENTIALS_JSON` | ✅ Set | (minified JSON) |
| `QSTASH_CURRENT_SIGNING_KEY` | ✅ Set | sig_5uDhZ2qNkcNSy2sjRd9mWAzefpaw |
| `QSTASH_NEXT_SIGNING_KEY` | ✅ Set | sig_5SnXVe2d3vPS6wEdjsD9U8rsVQj9 |
| `H2_CONSOLE_ENABLED` | ✅ Set | false |

### Known Limitations

1. **Mailgun**: Using sandbox domain - only verified recipients
2. **Twilio**: India (+91) region not enabled

---

## Running Locally

### Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL 14+ (optional - H2 works for dev)

### Development Mode (H2 Database)

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui/index.html
# H2 Console: http://localhost:8080/h2-console
```

### With PostgreSQL

```bash
export DATABASE_URL=postgresql://user:pass@localhost:5432/fleetinspect
mvn spring-boot:run
```

### Production Build

```bash
mvn clean package -DskipTests
java -jar target/surveyor-calendar-api-*.jar
```

---

## Testing

### API Health Check
```bash
curl https://cmx-notification-be-production.up.railway.app/actuator/health
# {"status":"UP"}
```

### Test Notification
```bash
curl -X POST https://cmx-notification-be-production.up.railway.app/api/dev/test-notification/71 \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello from API"}'
```

---

## License

Proprietary - All rights reserved.
