module.exports = {
  expo: {
    name: "FleetInspect Pro",
    slug: "fleetinspect-pro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ch.cmx",
      buildNumber: "9",
      infoPlist: {
        NSCameraUsageDescription: "FleetInspect Pro needs camera access to capture vehicle inspection photos",
        NSPhotoLibraryUsageDescription: "FleetInspect Pro needs photo library access to save and upload inspection photos",
        NSLocationWhenInUseUsageDescription: "FleetInspect Pro needs location access to track inspection locations",
        NSLocationAlwaysAndWhenInUseUsageDescription: "FleetInspect Pro needs location access to track inspection locations",
        NSFaceIDUsageDescription: "Allow FleetInspect Pro to use Face ID for secure authentication",
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification"]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0F172A"
      },
      package: "com.ch.cmx",
      versionCode: 1,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.RECORD_AUDIO"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-splash-screen",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#0F172A",
          sounds: []
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "FleetInspect Pro needs camera access to capture vehicle inspection photos"
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "FleetInspect Pro needs photo library access to save and upload inspection photos"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "FleetInspect Pro needs location access to track inspection locations"
        }
      ],
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Allow FleetInspect Pro to use Face ID for secure authentication"
        }
      ]
    ],
    owner: "saileshsharma",
    runtimeVersion: {
      policy: "appVersion"
    },
    extra: {
      eas: {
        projectId: "8d1c3e80-23aa-4771-8c88-c8c63dc78f4a"
      }
    }
  }
};
