import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';

export default function ProfileSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Skeleton width={100} height={100} style={styles.avatar} />
        <Skeleton width={150} height={24} style={styles.nameText} />
        <Skeleton width={100} height={20} style={styles.roleText} />
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        {/* Email Info */}
        <View style={styles.infoItem}>
          <Skeleton width={40} height={40} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Skeleton width={60} height={16} style={styles.infoLabel} />
            <Skeleton width={200} height={20} style={styles.infoValue} />
          </View>
        </View>

        {/* Department Info */}
        <View style={styles.infoItem}>
          <Skeleton width={40} height={40} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Skeleton width={90} height={16} style={styles.infoLabel} />
            <Skeleton width={180} height={20} style={styles.infoValue} />
          </View>
        </View>

        {/* Joined Info */}
        <View style={styles.infoItem}>
          <Skeleton width={40} height={40} style={styles.infoIcon} />
          <View style={styles.infoContent}>
            <Skeleton width={70} height={16} style={styles.infoLabel} />
            <Skeleton width={150} height={20} style={styles.infoValue} />
          </View>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        <Skeleton width={100} height={24} style={styles.sectionTitle} />
        
        {/* Logout Button Placeholder */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Skeleton width={40} height={40} style={styles.settingIcon} />
            <Skeleton width={80} height={20} style={styles.settingText} />
          </View>
        </View>
      </View>

      {/* Version Text */}
      <View style={styles.appInfo}>
        <Skeleton width={120} height={16} style={styles.versionText} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    borderRadius: 50,
    marginBottom: 16,
  },
  nameText: {
    marginBottom: 8,
    borderRadius: 4,
  },
  roleText: {
    borderRadius: 4,
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoIcon: {
    borderRadius: 20,
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    marginBottom: 8,
    borderRadius: 4,
  },
  infoValue: {
    borderRadius: 4,
  },
  settingsSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    borderRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    borderRadius: 20,
    marginRight: 16,
  },
  settingText: {
    borderRadius: 4,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    borderRadius: 4,
  },
});