import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../Skeleton';

export default function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Skeleton width={120} height={20} style={styles.welcomeText} />
            <Skeleton width={180} height={32} style={styles.nameText} />
          </View>
          <Skeleton width={120} height={36} style={styles.actionButton} />
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Skeleton width={32} height={32} style={styles.icon} />
          <Skeleton width={60} height={28} style={styles.statValue} />
          <Skeleton width={80} height={16} style={styles.statLabel} />
        </View>
        
        <View style={styles.statCard}>
          <Skeleton width={32} height={32} style={styles.icon} />
          <Skeleton width={60} height={28} style={styles.statValue} />
          <Skeleton width={80} height={16} style={styles.statLabel} />
        </View>

        <View style={styles.statCard}>
          <Skeleton width={32} height={32} style={styles.icon} />
          <Skeleton width={60} height={28} style={styles.statValue} />
          <Skeleton width={80} height={16} style={styles.statLabel} />
        </View>
      </View>

      {/* Quick Actions Section */}
      <View style={styles.section}>
        <Skeleton width={140} height={24} style={styles.sectionTitle} />
        <View style={styles.actionGrid}>
          <View style={styles.actionCard}>
            <Skeleton width={32} height={32} style={styles.icon} />
            <Skeleton width={100} height={20} style={styles.actionText} />
          </View>
          <View style={styles.actionCard}>
            <Skeleton width={32} height={32} style={styles.icon} />
            <Skeleton width={100} height={20} style={styles.actionText} />
          </View>
        </View>
      </View>

      {/* Recent Activity Section */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Skeleton width={160} height={24} style={styles.sectionTitle} />
          <Skeleton width={60} height={20} style={styles.seeAll} />
        </View>

        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.activityItem}>
            <Skeleton width={40} height={40} style={styles.activityIcon} />
            <View style={styles.activityContent}>
              <Skeleton width={200} height={20} style={styles.activityTitle} />
              <Skeleton width={120} height={16} style={styles.activityTime} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#5271FF',
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    marginBottom: 8,
    borderRadius: 4,
  },
  nameText: {
    borderRadius: 6,
  },
  actionButton: {
    borderRadius: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    borderRadius: 16,
  },
  statValue: {
    borderRadius: 4,
  },
  statLabel: {
    borderRadius: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    borderRadius: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    borderRadius: 4,
  },
  activitySection: {
    margin: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    borderRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
  },
  activityIcon: {
    borderRadius: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    gap: 8,
  },
  activityTitle: {
    borderRadius: 4,
  },
  activityTime: {
    borderRadius: 4,
  },
});