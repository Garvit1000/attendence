import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/hooks/useAuth';
import { AttendanceProvider } from '@/hooks/useAttendance';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
      </AttendanceProvider>
    </AuthProvider>
  );
}