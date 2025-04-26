import { View, StyleSheet } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  // Show skeleton while loading
  if (isLoading) {
    return (
      <View style={styles.container}>
        <DashboardSkeleton />
      </View>
    );
  }

  // If we have a user, redirect to the app
  if (user) {
    return <Redirect href="/(app)" />;
  }

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});