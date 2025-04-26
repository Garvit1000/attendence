import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '@/hooks/useAuth';
import { View, StyleSheet } from 'react-native';
import Skeleton from '@/components/Skeleton';

function AuthSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Image Skeleton */}
      <View style={styles.header}>
        <Skeleton width="100%" height={250} style={styles.headerImage} />
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <Skeleton width={250} height={32} style={styles.title} />
        <Skeleton width={300} height={20} style={styles.subtitle} />
        
        <View style={styles.form}>
          <Skeleton width="100%" height={56} style={styles.input} />
          <Skeleton width="100%" height={56} style={styles.input} />
          <Skeleton width="100%" height={56} style={styles.button} />
        </View>
        
        <View style={styles.footer}>
          <Skeleton width={200} height={20} style={styles.footerText} />
        </View>
      </View>
    </View>
  );
}

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  // Show skeleton loading state while checking auth state
  if (isLoading) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthSkeleton />
      </>
    );
  }

  // If user is logged in, redirect to app
  if (user) {
    return <Redirect href="/(app)" />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' }
      }} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 250,
    width: '100%',
    overflow: 'hidden',
  },
  headerImage: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  title: {
    marginBottom: 12,
    borderRadius: 6,
  },
  subtitle: {
    marginBottom: 40,
    borderRadius: 4,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    borderRadius: 12,
  },
  button: {
    borderRadius: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  footerText: {
    borderRadius: 4,
  },
});