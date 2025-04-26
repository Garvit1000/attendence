import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Home, BarChart3, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function BottomBar() {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    {
      name: 'Home',
      icon: Home,
      path: '/(app)',
      label: 'Home'
    },
    {
      name: 'Attendance',
      icon: BarChart3,
      path: '/(app)/attendance',
      label: 'Attendance'
    },
    {
      name: 'Profile',
      icon: User,
      path: '/(app)/profile',
      label: 'Profile'
    }
  ];

  return (
    <BlurView intensity={80} style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.path)}
          >
            <View style={[
              styles.tabContent,
              isActive && styles.activeTab
            ]}>
              <tab.icon
                size={24}
                color={isActive ? '#5271FF' : '#9CA3AF'}
                style={styles.icon}
              />
              <Text style={[
                styles.label,
                isActive && styles.activeLabel
              ]}>
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: 'rgba(82, 113, 255, 0.1)',
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#5271FF',
    fontWeight: '600',
  },
});