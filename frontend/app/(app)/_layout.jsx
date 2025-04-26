import { View, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import BottomBar from '@/components/BottomBar';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  
  // Show skeleton while loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <DashboardSkeleton />
      </View>
    );
  }
  
  // If no user and not loading, redirect to auth
  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: false,
          headerBackTitle: '',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: '#F8FAFC',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="register-student"
          options={{
            title: 'Register Student',
          }}
        />
        <Stack.Screen
          name="take-attendance"
          options={{
            title: 'Take Attendance',
          }}
        />
        <Stack.Screen
          name="attendance"
          options={{
            title: 'Attendance',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Stack>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
