# Surveyor Calendar - Backend API

Spring Boot REST API for managing surveyor appointments, real-time location tracking, and push notifications.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPRING BOOT BACKEND                                  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         CONTROLLERS                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Appointment│  │  Surveyor  │  │  Location  │  │   QStash   │     │   │
│  │  │ Controller │  │ Controller │  │  Stream    │  │  Webhook   │     │   │
│  │  │            │  │            │  │ Controller │  │ Controller │     │   │
│  │  │ CRUD Ops   │  │ List/CRUD  │  │ SSE Stream │  │ Location   │     │   │
│  │  │ Assign     │  │ Status     │  │ Trails     │  │ Updates    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          SERVICES                                     │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Appointment│  │  Surveyor  │  │  Location  │  │   Push     │     │   │
│  │  │  Service   │  │  Service   │  │  Broadcast │  │ Notification│    │   │
│  │  │            │  │            │  │  Service   │  │  Service   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        REPOSITORIES                                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Appointment│  │  Surveyor  │  │Availability│  │  Device    │     │   │
│  │  │ Repository │  │ Repository │  │ Repository │  │   Token    │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     DATABASE (PostgreSQL)                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │appointments│  │  surveyor  │  │availability│  │device_token│     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
         ▲                    ▲                    │
         │                    │                    ▼
    ┌────────────┐      ┌────────────┐      ┌────────────┐
    │   Mobile   │      │   QStash   │      │  Firebase  │
    │    App     │      │  (Upstash) │      │    FCM     │
    └────────────┘      └────────────┘      └────────────┘
```

## Features

- **Appointment Management** - CRUD operations for vehicle inspection appointments
- **Surveyor Management** - Track surveyors, their status, and availability
- **Real-time Location** - SSE streaming of surveyor positions
- **Location Trails** - Historical movement data
- **Push Notifications** - Firebase Cloud Messaging integration
- **QStash Webhooks** - Reliable message delivery from mobile apps
- **Authentication** - Email-based surveyor login
- **Swagger/OpenAPI** - Auto-generated API documentation

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Spring Boot 3.3 |
| Language | Java 17 |
| Database | PostgreSQL |
| Migrations | Liquibase |
| Real-time | Server-Sent Events (SSE) |
| Push Notifications | Firebase Admin SDK |
| Message Queue | Upstash QStash |
| API Docs | SpringDoc OpenAPI |
| Build | Maven |

## Project Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/cmx/
│   │   │   ├── controller/
│   │   │   │   ├── AppointmentController.java
│   │   │   │   ├── SurveyorController.java
│   │   │   │   ├── LocationStreamController.java
│   │   │   │   ├── QStashWebhookController.java
│   │   │   │   └── AuthController.java
│   │   │   ├── service/
│   │   │   │   ├── AppointmentService.java
│   │   │   │   ├── SurveyorService.java
│   │   │   │   ├── LocationBroadcastService.java
│   │   │   │   ├── AvailabilityService.java
│   │   │   │   └── PushNotificationService.java
│   │   │   ├── repository/
│   │   │   ├── model/
│   │   │   ├── dto/
│   │   │   ├── exception/
│   │   │   └── Application.java
│   │   └── resources/
│   │       ├── application.properties
│   │       ├── application-prod.properties
│   │       └── db/changelog/
│   └── test/
├── pom.xml
└── Dockerfile
```

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- PostgreSQL 14+
- Firebase project (for push notifications)

### Database Setup

```bash
# Create database
createdb surveyor_calendar

# Or using psql
psql -U postgres -c "CREATE DATABASE surveyor_calendar;"
```

### Configuration

Edit `src/main/resources/application.properties`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/surveyor_calendar
spring.datasource.username=postgres
spring.datasource.password=your_password

# Server
server.port=8080

# QStash (for mobile location updates)
qstash.current-signing-key=your_qstash_signing_key
qstash.next-signing-key=your_qstash_next_signing_key

# Firebase (for push notifications)
firebase.credentials.path=/path/to/firebase-service-account.json
```

### Environment Variables

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/surveyor_calendar
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=your_password
export QSTASH_CURRENT_SIGNING_KEY=your_key
export FIREBASE_CREDENTIALS_PATH=/path/to/firebase-creds.json
```

## Running

### Development

```bash
# Using Maven
./mvnw spring-boot:run

# Or with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Server starts at http://localhost:8080
```

### With Docker

```bash
# Build JAR
./mvnw clean package -DskipTests

# Build Docker image
docker build -t surveyor-backend .

# Run container
docker run -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/surveyor_calendar \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD=password \
  surveyor-backend
```

## Building

### Development Build

```bash
./mvnw clean compile
```

### Production Build

```bash
# Build JAR (skipping tests)
./mvnw clean package -DskipTests

# Output: target/surveyor-calendar-api-0.1.0.jar

# Run the JAR
java -jar target/surveyor-calendar-api-0.1.0.jar
```

### Build with Tests

```bash
./mvnw clean package
```

## Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=jdbc:postgresql://db:5432/surveyor_calendar
      - DATABASE_USERNAME=postgres
      - DATABASE_PASSWORD=postgres
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: surveyor_calendar
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

### Railway / Render / Heroku

```bash
# Procfile
web: java -jar target/surveyor-calendar-api-0.1.0.jar --server.port=$PORT
```

### AWS ECS / Kubernetes

Use the Dockerfile and deploy to your container orchestration platform.

## CI/CD with GitHub Actions

### Workflow File

Create `.github/workflows/backend.yml`:

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

defaults:
  run:
    working-directory: backend

jobs:
  build:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
          cache: maven

      - name: Build with Maven
        run: mvn clean package -DskipTests

      - name: Run Tests
        run: mvn test
        env:
          DATABASE_URL: jdbc:postgresql://localhost:5432/test_db
          DATABASE_USERNAME: postgres
          DATABASE_PASSWORD: postgres

      - name: Upload JAR artifact
        uses: actions/upload-artifact@v4
        with:
          name: backend-jar
          path: backend/target/*.jar

  docker:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - uses: actions/download-artifact@v4
        with:
          name: backend-jar
          path: backend/target/

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/surveyor-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/surveyor-backend:${{ github.sha }}

  deploy:
    needs: docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password/token |
| `RAILWAY_WEBHOOK_URL` | Railway deploy webhook (if using Railway) |
| `DATABASE_URL` | Production database URL |

## API Documentation

### Swagger UI

Access at: `http://localhost:8080/swagger-ui.html`

### OpenAPI JSON

Access at: `http://localhost:8080/v3/api-docs`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Surveyor login |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List all appointments |
| GET | `/api/appointments/{id}` | Get appointment by ID |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/{id}` | Update appointment |
| DELETE | `/api/appointments/{id}` | Delete appointment |
| POST | `/api/appointments/{id}/respond` | Accept/reject appointment |
| GET | `/api/appointments/surveyor/{id}` | Get surveyor's appointments |

### Surveyors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveyors` | List all surveyors |
| GET | `/api/surveyors/{id}` | Get surveyor details |
| PUT | `/api/surveyors/{id}/location` | Update location |
| PUT | `/api/surveyors/{id}/status` | Update status |

### Location Stream (SSE)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations/stream` | Subscribe to location updates |
| GET | `/api/locations/trails` | Get all location trails |
| GET | `/api/locations/trails/{id}` | Get surveyor's trail |
| GET | `/api/locations/stream/status` | Get stream status |

### Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook/qstash/location` | Receive location from QStash |
| GET | `/api/webhook/qstash/health` | Health check |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notifications/send` | Send push notification |
| GET | `/api/notifications/stats` | Get notification stats |

## Available Maven Commands

| Command | Description |
|---------|-------------|
| `./mvnw spring-boot:run` | Run development server |
| `./mvnw clean compile` | Compile the project |
| `./mvnw clean package` | Build JAR file |
| `./mvnw clean package -DskipTests` | Build without tests |
| `./mvnw test` | Run tests |
| `./mvnw clean install` | Build and install to local repo |
| `./mvnw liquibase:diff` | Generate DB migration diff |

## Database Migrations

Migrations are managed with Liquibase in `src/main/resources/db/changelog/`.

```bash
# Generate new migration
./mvnw liquibase:diff

# Rollback last change
./mvnw liquibase:rollback -Dliquibase.rollbackCount=1
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -h localhost -U postgres -d surveyor_calendar
```

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Build Failures

```bash
# Clean and rebuild
./mvnw clean install -U
```

## License

Proprietary - All rights reserved.
