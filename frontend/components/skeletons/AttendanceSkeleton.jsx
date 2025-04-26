import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';

export default function AttendanceSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.header}>
        <View style={styles.statsRow}>
          {[1, 2].map((_, index) => (
            <View key={index} style={styles.statCard}>
              <Skeleton width={100} height={28} style={styles.statValue} />
              <Skeleton width={80} height={16} style={styles.statLabel} />
            </View>
          ))}
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <Skeleton width={100} height={36} style={styles.filterButton} />
        <Skeleton width={100} height={36} style={styles.filterButton} />
      </View>

      {/* Attendance List */}
      <View style={styles.listContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Skeleton width={120} height={20} style={styles.sectionTitle} />
          <Skeleton width={80} height={20} style={styles.sectionCount} />
        </View>

        {/* Attendance Items */}
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View key={index} style={styles.attendanceItem}>
            <View style={styles.itemLeft}>
              <Skeleton width={40} height={40} style={styles.itemIcon} />
              <View style={styles.itemContent}>
                <Skeleton width={180} height={18} style={styles.itemTitle} />
                <Skeleton width={120} height={14} style={styles.itemSubtitle} />
              </View>
            </View>
            <Skeleton width={60} height={24} style={styles.itemStatus} />
          </View>
        ))}
      </View>

      {/* FAB Placeholder */}
      <View style={styles.fabPlaceholder}>
        <Skeleton width={56} height={56} style={styles.fab} />
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    minWidth: 150,
    gap: 8,
  },
  statValue: {
    borderRadius: 4,
  },
  statLabel: {
    borderRadius: 4,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterButton: {
    borderRadius: 8,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    borderRadius: 4,
  },
  sectionCount: {
    borderRadius: 4,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    borderRadius: 20,
    marginRight: 12,
  },
  itemContent: {
    gap: 4,
  },
  itemTitle: {
    borderRadius: 4,
  },
  itemSubtitle: {
    borderRadius: 4,
  },
  itemStatus: {
    borderRadius: 12,
  },
  fabPlaceholder: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  fab: {
    borderRadius: 28,
  },
});