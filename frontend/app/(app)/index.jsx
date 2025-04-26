import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useAttendance } from '@/hooks/useAttendance';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { UserRound, Users, Calendar, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    attendanceRecords, 
    students,
    isLoadingRecords,
    isLoadingStudents 
  } = useAttendance();

  if (isLoadingRecords || isLoadingStudents) {
    return <DashboardSkeleton />;
  }

  const handleRegisterStudent = () => {
    router.push('/(app)/register-student');
  };

  const handleTakeAttendance = () => {
    router.push('/(app)/take-attendance');
  };

  // Calculate statistics
  const totalStudents = students.length;
  const totalSessions = attendanceRecords.length;
  
  const today = new Date();
  const todayRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return (
      recordDate.getDate() === today.getDate() &&
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    );
  });

  const recentRecords = attendanceRecords.slice(0, 5); // Last 5 records

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#5271FF', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          {user?.role === 'teacher' && (
            <TouchableOpacity 
              style={styles.todayButton}
              onPress={handleTakeAttendance}
            >
              <Text style={styles.todayButtonText}>Take Attendance</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.statsOverview}>
        {user?.role === 'teacher' && (
          <LinearGradient
            colors={['#E8F5E9', '#C8E6C9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statCard}
          >
            <View style={styles.statCardContent}>
              <Users size={24} color="#2E7D32" />
              <Text style={styles.statValue}>{totalStudents}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
          </LinearGradient>
        )}

        <LinearGradient
          colors={['#E3F2FD', '#BBDEFB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardContent}>
            <Calendar size={24} color="#1565C0" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#F3E5F5', '#E1BEE7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statCard}
        >
          <View style={styles.statCardContent}>
            <Clock size={24} color="#6A1B9A" />
            <Text style={styles.statValue}>{todayRecords.length}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions for Teachers */}
      {user?.role === 'teacher' && (
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity onPress={handleTakeAttendance} style={styles.actionCard}>
              <LinearGradient
                colors={['#5271FF', '#4361EE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Calendar size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Take Attendance</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRegisterStudent} style={styles.actionCard}>
              <LinearGradient
                colors={['#2E7D32', '#388E3C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Users size={24} color="#FFFFFF" />
                <Text style={styles.actionText}>Register Student</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Recent Activity */}
      <View style={styles.activitySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentRecords.length > 0 ? (
          recentRecords.map((record, index) => (
            <View key={record.id || index} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#EFF6FF' }]}>
                <UserRound size={20} color="#5271FF" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>
                  {user?.role === 'teacher' 
                    ? `Marked attendance for ${record.students?.length || 0} students`
                    : 'Attendance marked'}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(record.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activity</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  todayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsOverview: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 2,
  },
  statCardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  actionSection: {
    padding: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activitySection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  seeAllButton: {
    color: '#5271FF',
    fontSize: 14,
    fontWeight: '600',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    paddingVertical: 24,
  },
});