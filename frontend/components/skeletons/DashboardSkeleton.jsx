import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Skeleton width={200} height={28} style={styles.headerText} />
          <Skeleton width={40} height={40} style={styles.headerIcon} />
        </View>
        <Skeleton width={250} height={20} style={styles.subHeaderText} />
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <Skeleton width={40} height={40} style={styles.statIcon} />
          <Skeleton width={80} height={20} style={styles.statValue} />
          <Skeleton width={120} height={16} style={styles.statLabel} />
        </View>

        <View style={styles.statsCard}>
          <Skeleton width={40} height={40} style={styles.statIcon} />
          <Skeleton width={80} height={20} style={styles.statValue} />
          <Skeleton width={120} height={16} style={styles.statLabel} />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Skeleton width={150} height={24} style={styles.sectionTitle} />
        
        {/* Activity Items */}
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.activityItem}>
            <Skeleton width={40} height={40} style={styles.activityIcon} />
            <View style={styles.activityContent}>
              <Skeleton width={200} height={18} style={styles.activityTitle} />
              <Skeleton width={150} height={14} style={styles.activityMeta} />
            </View>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Skeleton width={130} height={24} style={styles.sectionTitle} />
        <View style={styles.actionGrid}>
          {[1, 2, 3, 4].map((_, index) => (
            <View key={index} style={styles.actionCard}>
              <Skeleton width={40} height={40} style={styles.actionIcon} />
              <Skeleton width={80} height={16} style={styles.actionText} />
            </View>
          ))}
        </View>
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
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    borderRadius: 4,
  },
  headerIcon: {
    borderRadius: 20,
  },
  subHeaderText: {
    borderRadius: 4,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    borderRadius: 20,
  },
  statValue: {
    borderRadius: 4,
  },
  statLabel: {
    borderRadius: 4,
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    borderRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  activityIcon: {
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    borderRadius: 4,
  },
  activityMeta: {
    borderRadius: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  actionCard: {
    width: '45%',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    borderRadius: 20,
  },
  actionText: {
    borderRadius: 4,
  },
});