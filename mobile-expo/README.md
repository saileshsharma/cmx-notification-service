# SurveyorPro Mobile App

A comprehensive mobile application for vehicle inspection surveyors built with React Native and Expo.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MOBILE APP                                      │
│                         (React Native + Expo)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Dashboard   │  │   Schedule   │  │   Inspect    │  │    Chat      │    │
│  │              │  │              │  │              │  │              │    │
│  │ • Weather    │  │ • Calendar   │  │ • Checklist  │  │ • Dispatcher │    │
│  │ • Stats      │  │ • Accept/    │  │ • Photos     │  │ • Real-time  │    │
│  │ • Progress   │  │   Reject     │  │ • Notes      │  │   Messages   │    │
│  │ • Next Appt  │  │ • Navigate   │  │ • Signature  │  │              │    │
│  │ • Quick Stat │  │              │  │ • Submit     │  │              │    │
│  │ • SOS        │  │              │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              SERVICES                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Location   │  │  Notification│  │     API      │  │   Storage    │    │
│  │   Service    │  │   Service    │  │   Service    │  │   Service    │    │
│  │              │  │              │  │              │  │              │    │
│  │ • GPS Track  │  │ • Push       │  │ • REST Calls │  │ • AsyncStore │    │
│  │ • Geo-fence  │  │ • Local      │  │ • Auth       │  │ • Offline    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            UPSTASH QSTASH                                    │
│                      (Message Queue / Rate Limiting)                         │
│                                                                              │
│  • Location updates from mobile devices                                      │
│  • Status change notifications                                               │
│  • Reliable message delivery with retries                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPRING BOOT BACKEND                                  │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   QStash     │  │   Location   │  │  Surveyor    │  │ Notification │    │
│  │   Webhook    │  │   Broadcast  │  │  Service     │  │   Service    │    │
│  │   Controller │  │   Service    │  │              │  │              │    │
│  │              │  │   (SSE)      │  │              │  │  (Firebase)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           PostgreSQL Database                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REACT WEB DASHBOARD                                  │
│                      (Dispatcher / Admin View)                               │
│                                                                              │
│  • Real-time surveyor location map (SSE)                                     │
│  • Appointment scheduling                                                    │
│  • Surveyor management                                                       │
│  • Push notification sending                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Features

### Dashboard
- **Weather Widget** - Current conditions for outdoor inspections
- **Today's Overview** - Completed, pending, and distance stats
- **Progress Bar** - Visual daily progress indicator
- **Next Inspection** - Countdown timer with quick navigation
- **Quick Status** - One-tap status updates (On My Way, Arrived, Inspecting, Completed)
- **Emergency SOS** - Alert dispatch immediately

### Schedule
- **Appointment List** - View all assigned inspections
- **Accept/Reject** - Respond to new assignments
- **Navigation** - One-tap directions via Google Maps/Apple Maps
- **Pull to Refresh** - Real-time sync with backend

### Inspection Workflow
- **7-Step Checklist**
  1. Vehicle Identification (VIN, registration)
  2. Exterior Inspection (body, paint, lights)
  3. Interior Inspection (seats, dashboard, odometer)
  4. Engine & Mechanical (fluids, belts, battery)
  5. Undercarriage (suspension, brakes, exhaust)
  6. Photo Documentation (damage areas)
  7. Owner Signature (digital capture)
- **Photo Capture** - Camera integration with gallery
- **Notes** - Add detailed inspection notes
- **Submit Report** - Upload to backend

### Chat
- **Dispatcher Communication** - Real-time messaging
- **Status Updates** - Auto-sent quick status messages
- **SOS Alerts** - Emergency notifications

### History
- **Past Inspections** - View completed reports
- **Photo Count** - Images per inspection
- **Quick Access** - View detailed reports

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | React Native + Expo |
| Navigation | Bottom Tab Navigation |
| UI | Linear Gradients, Ionicons |
| Location | expo-location |
| Camera | expo-image-picker |
| Haptics | expo-haptics |
| Network | expo-network |
| Storage | @react-native-async-storage |
| Push Notifications | expo-notifications + Firebase |
| Message Queue | Upstash QStash |

## Project Structure

```
mobile-expo/
├── App.tsx                 # Main app with all screens
├── app.config.js           # Expo configuration
├── eas.json                # EAS Build configuration
├── package.json            # Dependencies
├── src/
│   ├── services/
│   │   ├── api.ts          # REST API calls
│   │   ├── location.ts     # GPS tracking service
│   │   ├── notifications.ts # Push notification handling
│   │   ├── qstash.ts       # QStash message publishing
│   │   └── storage.ts      # AsyncStorage wrapper
│   └── types/
│       └── index.ts        # TypeScript types
├── assets/                 # Icons and images
└── .github/
    └── workflows/
        ├── build-mobile.yml    # CI build workflow
        └── release-mobile.yml  # CD release workflow
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- EAS CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

### Environment Variables

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://your-backend-url.com
EXPO_PUBLIC_QSTASH_URL=https://qstash.upstash.io
EXPO_PUBLIC_QSTASH_TOKEN=your-qstash-token
```

## Building & Deployment

### Preview Build (Internal Testing)

```bash
# Android APK
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
```

### Submit to Stores

```bash
# Submit to Google Play Store
npx eas submit --platform android --latest

# Submit to App Store Connect (TestFlight)
npx eas submit --platform ios --latest
```

## CI/CD Setup

### GitHub Actions Workflows

#### 1. Build Workflow (`.github/workflows/build-mobile.yml`)
- **Trigger**: Push to `main`, PRs, or manual dispatch
- **Builds**: Android APK and iOS app in parallel
- **Profiles**: development, preview, production

#### 2. Release Workflow (`.github/workflows/release-mobile.yml`)
- **Trigger**: Tags like `mobile-v1.0.0` or manual dispatch
- **Builds**: Production apps
- **Submits**: To App Store Connect and Google Play Store
- **Creates**: GitHub Release

### Required GitHub Secrets

Add these to your repository (`Settings > Secrets > Actions`):

| Secret | Description | How to Get |
|--------|-------------|------------|
| `EXPO_TOKEN` | Expo access token | [Expo Access Tokens](https://expo.dev/accounts/[username]/settings/access-tokens) |
| `APPLE_API_KEY_ID` | App Store Connect API Key ID | [App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api) |
| `APPLE_ISSUER_ID` | App Store Connect Issuer ID | Same as above (shown at top of page) |
| `APPLE_API_KEY` | Contents of .p8 file | Download from App Store Connect |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY` | Service account JSON | [Google Cloud Console](https://console.cloud.google.com/) |

### Getting Secrets

#### EXPO_TOKEN
1. Go to https://expo.dev/accounts/[username]/settings/access-tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token

#### Apple Secrets (iOS/TestFlight)
1. Go to https://appstoreconnect.apple.com/access/integrations/api
2. Click "+" to create a new key
3. Name: "GitHub Actions", Access: "App Manager"
4. Click "Generate"
5. Copy:
   - **Key ID** → `APPLE_API_KEY_ID`
   - **Issuer ID** (top of page) → `APPLE_ISSUER_ID`
   - Download `.p8` file, copy contents → `APPLE_API_KEY`

#### Google Play Secret (Android)
1. Go to https://console.cloud.google.com/
2. Create/select project
3. Go to **IAM & Admin > Service Accounts**
4. Create service account: `github-actions-play-store`
5. **Keys** tab > **Add Key** > **Create new key** > **JSON**
6. Copy JSON contents → `GOOGLE_PLAY_SERVICE_ACCOUNT_KEY`
7. Link in Play Console: **Settings > API access > Grant access**

### Manual Workflow Trigger

1. Go to **Actions** tab in GitHub
2. Select "Build Mobile Apps" or "Release Mobile Apps"
3. Click "Run workflow"
4. Select options and run

### Release with Tag

```bash
# Create and push a release tag
git tag mobile-v1.0.1
git push origin mobile-v1.0.1
```

This triggers the release workflow automatically.

## Real-time Location Flow

```
Mobile App                  QStash                    Backend                   Web Dashboard
    │                         │                          │                           │
    │  1. GPS Update          │                          │                           │
    │ ─────────────────────►  │                          │                           │
    │                         │  2. Webhook POST         │                           │
    │                         │ ──────────────────────►  │                           │
    │                         │                          │  3. SSE Broadcast         │
    │                         │                          │ ─────────────────────────►│
    │                         │                          │                           │
    │                         │                          │  4. Map Update            │
    │                         │                          │                      ◄────│
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Surveyor login with email/password

### Appointments
- `GET /api/appointments/surveyor/{id}` - Get surveyor appointments
- `POST /api/appointments/{id}/respond` - Accept/reject appointment

### Location
- `GET /api/locations/stream` - SSE stream for real-time updates
- `GET /api/locations/trails` - Get location history trails

### Webhook
- `POST /api/webhook/qstash/location` - Receive location updates from QStash

## Troubleshooting

### Build Fails on iOS
```bash
# Run interactive build for credential setup
npx eas build --platform ios --profile preview
```

### Push Notifications Not Working
1. Check Firebase configuration in `google-services.json`
2. Verify `EXPO_TOKEN` is set in GitHub secrets
3. Check device token registration in backend logs

### Location Not Updating
1. Ensure location permissions are granted
2. Check QStash token is valid
3. Verify backend webhook endpoint is accessible

## License

Proprietary - All rights reserved.
