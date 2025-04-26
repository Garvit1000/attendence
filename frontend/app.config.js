export default {
  name: "Attendance Management",
  slug: "attendence-management",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.attendancemanagement"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.yourcompany.attendancemanagement"
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    eas: {
      projectId: "c74573ea-0134-4288-9945-e86c1e73f0ca"
    }
  },
  plugins: [
    [
      "expo-image-picker",
      {
        "photosPermission": "The app needs access to your photos to let you select profile pictures and class photos.",
        "cameraPermission": "The app needs access to your camera to take photos for attendance."
      }
    ]
  ]
};