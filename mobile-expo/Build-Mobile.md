# Surveyor Calendar - Mobile App Build Guide

> **EAS (Expo Application Services)** build commands for iOS and Android

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Configuration](#project-configuration)
- [Build Profiles](#build-profiles)
- [Build Commands](#build-commands)
- [Store Submission](#store-submission)
- [Version Management](#version-management)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo account
eas login

# Verify login
eas whoami
```

### Project Setup

```bash
# Navigate to mobile project
cd mobile-expo

# Install dependencies
npm install

# Configure EAS (first time only)
eas build:configure
```

---

## Project Configuration

### App Information

| Property | Value |
|----------|-------|
| **App Name** | Surveyor Calendar |
| **Slug** | surveyor-calendar |
| **Version** | 1.0.0 |
| **Bundle ID (iOS)** | com.ch.cmx |
| **Package (Android)** | com.ch.cmx |
| **Project ID** | 80083875-01ca-42cc-8c96-acc5bda38a79 |
| **Owner** | saileshsharma |

### Current Version Numbers

| Platform | Version Type | Current Value |
|----------|-------------|---------------|
| iOS | buildNumber | 3 |
| Android | versionCode | 2 |

---

## Build Profiles

### Profile Comparison

| Profile | Distribution | Android Output | iOS Output | Use Case |
|---------|-------------|----------------|------------|----------|
| `development` | Internal | APK (dev client) | Simulator/Device | Local development & debugging |
| `preview` | Internal | APK | Device | Internal testing & QA |
| `production` | Store | AAB | IPA | App Store / Play Store release |

### EAS Configuration (`eas.json`)

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "local"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "ios": { "simulator": false }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "autoIncrement": true },
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "internal",
        "releaseStatus": "draft"
      }
    }
  }
}
```

---

## Build Commands

### Quick Reference

```bash
cd mobile-expo
```

| Command | Description |
|---------|-------------|
| `npx eas build --platform all --profile production` | Build both platforms for store |
| `npx eas build --platform android --profile production` | Android AAB for Play Store |
| `npx eas build --platform android --profile preview` | Android APK for internal testing |
| `npx eas build --platform ios --profile production` | iOS for App Store / TestFlight |

---

### Development Builds

For local development with Expo Dev Client:

```bash
# Android development build
npx eas build --platform android --profile development

# iOS development build
npx eas build --platform ios --profile development

# Both platforms
npx eas build --platform all --profile development
```

---

### Preview / Internal Testing Builds

For internal distribution and QA testing:

```bash
# Android APK (installable directly)
npx eas build --platform android --profile preview

# iOS (Ad-hoc distribution)
npx eas build --platform ios --profile preview

# Both platforms
npx eas build --platform all --profile preview
```

---

### Production Builds

For App Store and Play Store submission:

```bash
# Android AAB (for Google Play Store)
npx eas build --platform android --profile production

# iOS IPA (for App Store / TestFlight)
npx eas build --platform ios --profile production

# Both platforms simultaneously
npx eas build --platform all --profile production
```

---

## Store Submission

### iOS - App Store / TestFlight

```bash
# Submit latest iOS build to TestFlight
npx eas submit --platform ios

# Submit specific build
npx eas submit --platform ios --id <BUILD_ID>

# Submit with auto-submit after build
npx eas build --platform ios --profile production --auto-submit
```

### Android - Google Play Store

```bash
# Submit to internal track (configured in eas.json)
npx eas submit --platform android --profile production

# Submit specific build
npx eas submit --platform android --id <BUILD_ID>

# Submit with auto-submit after build
npx eas build --platform android --profile production --auto-submit
```

### Android Submission Tracks

| Track | Description |
|-------|-------------|
| `internal` | Internal testing (up to 100 testers) |
| `alpha` | Closed testing |
| `beta` | Open testing |
| `production` | Public release |

To change track, update `eas.json`:

```json
"submit": {
  "production": {
    "android": {
      "track": "beta",
      "releaseStatus": "completed"
    }
  }
}
```

---

## Version Management

### Incrementing Versions

Before each new build/submission, increment the version numbers in `app.json`:

#### For iOS (buildNumber)

```json
"ios": {
  "bundleIdentifier": "com.ch.cmx",
  "buildNumber": "4"
}
```

#### For Android (versionCode)

```json
"android": {
  "package": "com.ch.cmx",
  "versionCode": 3
}
```

#### App Version (for both platforms)

```json
"version": "1.0.1"
```

### Auto-Increment (Production builds)

The production profile has `autoIncrement: true`, which automatically increments:
- iOS: `buildNumber` after each successful build
- Android: `versionCode` after each successful build

---

## Troubleshooting

### Common Issues

#### 1. "Bundle version must be higher than previously uploaded version"

**Cause:** iOS buildNumber is same or lower than existing TestFlight build.

**Solution:**
```bash
# Edit app.json and increment buildNumber
"ios": {
  "buildNumber": "4"
}

# Rebuild
npx eas build --platform ios --profile production
```

#### 2. Build fails with credentials error

**Solution:**
```bash
# Clear credentials and reconfigure
eas credentials

# Or for specific platform
eas credentials --platform ios
eas credentials --platform android
```

#### 3. "EAS CLI version mismatch"

**Solution:**
```bash
# Update EAS CLI
npm install -g eas-cli@latest
```

#### 4. Build queue is long

**Solution:**
```bash
# Use priority queue (requires paid Expo plan)
npx eas build --platform ios --profile production --priority high
```

### Useful Commands

```bash
# Check build status
npx eas build:list

# View build logs
npx eas build:view <BUILD_ID>

# Cancel a build
npx eas build:cancel <BUILD_ID>

# Check credentials
npx eas credentials

# View project configuration
npx eas config
```

---

## Local Development

### Running on Device/Simulator

```bash
# Start Expo development server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Run with tunnel (for physical devices on different network)
npx expo start --tunnel
```

### Clearing Cache

```bash
# Clear Expo cache
npx expo start --clear

# Clear node modules and reinstall
rm -rf node_modules
npm install

# Clear Metro bundler cache
npx expo start --reset-cache
```

---

## Build Artifacts

After successful builds, artifacts can be found:

| Platform | Build Type | File | Location |
|----------|-----------|------|----------|
| Android | Preview | `.apk` | Download from Expo dashboard |
| Android | Production | `.aab` | Download from Expo dashboard |
| iOS | All | `.ipa` | Download from Expo dashboard |

### Download Links

After build completion, the download link is displayed in terminal:
```
Build URL: https://expo.dev/accounts/saileshsharma/projects/surveyor-calendar/builds/<BUILD_ID>
```

---

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Expo Dashboard](https://expo.dev/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)

---

*Last updated: December 2024*
