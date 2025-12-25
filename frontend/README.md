# Surveyor Calendar - Frontend

Angular-based web dashboard for dispatchers and administrators to manage surveyor appointments, view real-time locations, and send notifications.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ANGULAR FRONTEND                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         COMPONENTS                                    │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │  Calendar  │  │  Surveyor  │  │  Location  │  │   Notify   │     │   │
│  │  │    View    │  │    List    │  │    Map     │  │   Panel    │     │   │
│  │  │            │  │            │  │            │  │            │     │   │
│  │  │ FullCalndr │  │ Status/    │  │ Real-time  │  │ Push Notif │     │   │
│  │  │ Drag/Drop  │  │ Filter     │  │ SSE Stream │  │ Send/View  │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         SERVICES                                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │    API     │  │    SSE     │  │   State    │  │   Utils    │     │   │
│  │  │  Service   │  │  Service   │  │  Service   │  │  Service   │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │      Spring Boot Backend        │
                    │   REST API + SSE Endpoints      │
                    └─────────────────────────────────┘
```

## Features

- **Calendar View** - FullCalendar integration with drag-and-drop scheduling
- **Surveyor Management** - View all surveyors, filter by type/status
- **Real-time Location Map** - Live surveyor positions via SSE
- **Location Trails** - Historical movement visualization
- **Push Notifications** - Send alerts to surveyor mobile apps
- **Appointment Management** - Create, edit, assign appointments
- **Dashboard Stats** - Overview of daily/weekly metrics

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Angular 17 |
| Calendar | FullCalendar 6 |
| State | RxJS |
| Styling | CSS/SCSS |
| Build | Angular CLI |
| HTTP | Angular HttpClient |
| Real-time | EventSource (SSE) |
| Push Notifications | Firebase Cloud Messaging |

## Performance

Lighthouse scores (production build):
- Performance: 91+
- Best Practices: 96
- SEO: 92

### Optimizations Applied

- Deferred font loading with `display=swap`
- Critical CSS inlining
- Deferred Firebase SDK loading
- Preconnect hints for external domains
- Production minification and tree-shaking
- GZIP compression support

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── calendar/
│   │   │   ├── surveyor-list/
│   │   │   ├── location-map/
│   │   │   └── notification-panel/
│   │   ├── services/
│   │   │   ├── api.service.ts
│   │   │   ├── sse.service.ts
│   │   │   └── state.service.ts
│   │   ├── models/
│   │   └── app.module.ts
│   ├── assets/
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── index.html
├── angular.json
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Angular CLI

### Installation

```bash
# Install dependencies
npm install

# Install Angular CLI globally (optional)
npm install -g @angular/cli
```

### Development

```bash
# Start development server
npm start
# or
ng serve --host 0.0.0.0 --port 4200

# App runs at http://localhost:4200
```

### Environment Configuration

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  sseUrl: 'http://localhost:8080/api/locations/stream'
};
```

For production, edit `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api',
  sseUrl: 'https://your-api-domain.com/api/locations/stream'
};
```

## Building

### Development Build

```bash
ng build
# Output: dist/
```

### Production Build

```bash
ng build --configuration production
# Output: dist/ (minified, optimized)
```

### Build with specific base href

```bash
ng build --base-href /app/
```

## Deployment

### Static Hosting (Nginx, Apache, S3)

```bash
# Build for production
ng build --configuration production

# Copy dist/ folder to your web server
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
# Build and run Docker image
docker build -t surveyor-frontend .
docker run -p 80:80 surveyor-frontend
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
ng build --configuration production
netlify deploy --prod --dir=dist/cmx-surveyor-calendar-ui
```

## CI/CD with GitHub Actions

### Workflow File

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

      # Deploy to your hosting (example: S3)
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

## API Integration

### REST Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveyors` | List all surveyors |
| GET | `/api/surveyors/{id}` | Get surveyor details |
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/{id}` | Update appointment |
| DELETE | `/api/appointments/{id}` | Delete appointment |
| POST | `/api/notifications/send` | Send push notification |

### SSE Endpoint

```typescript
// Connect to real-time location stream
const eventSource = new EventSource('/api/locations/stream');

eventSource.addEventListener('location', (event) => {
  const data = JSON.parse(event.data);
  // { surveyorId, lat, lng, status, displayName, trail }
});

eventSource.addEventListener('status', (event) => {
  const data = JSON.parse(event.data);
  // { surveyorId, status, displayName }
});
```

## Troubleshooting

### CORS Issues

Ensure backend has CORS configured:

```java
@CrossOrigin(origins = "*")
```

### SSE Connection Drops

The SSE service should auto-reconnect:

```typescript
eventSource.onerror = () => {
  setTimeout(() => this.connect(), 5000);
};
```

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm ci
ng build
```

## License

Proprietary - All rights reserved.
