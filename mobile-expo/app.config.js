module.exports = {
  expo: {
    name: "Surveyor Calendar",
    slug: "surveyor-calendar",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#1976D2"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ch.cmx",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        UIBackgroundModes: ["remote-notification", "fetch"]
      },
      entitlements: {
        "aps-environment": "production"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1976D2"
      },
      package: "com.ch.cmx",
      permissions: [
        "NOTIFICATIONS",
        "VIBRATE"
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#1976D2"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "80083875-01ca-42cc-8c96-acc5bda38a79"
      }
    },
    owner: "saileshsharma"
  }
};
