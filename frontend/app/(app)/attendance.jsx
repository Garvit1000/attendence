import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import AttendanceSkeleton from '@/components/skeletons/AttendanceSkeleton';
import { Calendar, Check, X, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const CALENDAR_PADDING = 16;
const DAYS_IN_WEEK = 7;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DAY_CELL_SIZE = (SCREEN_WIDTH - (CALENDAR_PADDING * 2 + 48)) / DAYS_IN_WEEK;

export default function AttendanceScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const { attendanceRecords, isLoadingRecords } = useAttendance();

  const isLoading = authLoading || isLoadingRecords;

  if (isLoading) {
    return <AttendanceSkeleton />;
  }

  // Calculate statistics
  const today = new Date();
  const todayRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    return (
      recordDate.getDate() === today.getDate() &&
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    );
  });

  const thisWeekRecords = attendanceRecords.filter(record => {
    const recordDate = new Date(record.date);
    const diffTime = Math.abs(today - recordDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
            <Calendar size={24} color="#1565C0" />
          </View>
          <Text style={styles.statValue}>{todayRecords.length}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
            <Clock size={24} color="#2E7D32" />
          </View>
          <Text style={styles.statValue}>{thisWeekRecords.length}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
      </View>

      {/* Month View */}
      <LinearGradient
        colors={['#5271FF', '#4361EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.monthContainer}
      >
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Week Headers */}
        <View style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {Array.from({ length: 35 }, (_, i) => {
            const date = new Date();
            date.setDate(1);
            const firstDayOfMonth = date.getDay();
            const currentDate = new Date(date);
            currentDate.setDate(i - firstDayOfMonth + 1);

            const isCurrentMonth = currentDate.getMonth() === date.getMonth();
            const isToday = currentDate.toDateString() === new Date().toDateString();

            const dayRecord = attendanceRecords.find(record => {
              const recordDate = new Date(record.date);
              return recordDate.toDateString() === currentDate.toDateString();
            });

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.calendarDay,
                  !isCurrentMonth && styles.otherMonthDay,
                  isToday && styles.today,
                  dayRecord && (dayRecord.present ? styles.presentDay : styles.absentDay)
                ]}
                onPress={() => {/* Handle date selection */}}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthText,
                  isToday && styles.todayText,
                  dayRecord && styles.recordDayText
                ]}>
                  {currentDate.getDate()}
                </Text>
                {dayRecord && (
                  <View style={[
                    styles.dayIndicator,
                    dayRecord.present ? styles.presentIndicator : styles.absentIndicator
                  ]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* Records List */}
      <BlurView intensity={80} style={styles.recordsContainer}>
        <Text style={styles.sectionTitle}>Attendance Records</Text>
        
        {attendanceRecords.length > 0 ? (
          attendanceRecords.map((record) => (
            <BlurView key={record.id} intensity={60} style={styles.recordItem}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>
                  {new Date(record.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                {user.role === 'student' && (
                  <View style={[
                    styles.statusBadge,
                    record.present ? styles.presentBadge : styles.absentBadge
                  ]}>
                    {record.present ? (
                      <Check size={16} color="#2E7D32" />
                    ) : (
                      <X size={16} color="#D32F2F" />
                    )}
                    <Text style={[
                      styles.statusText,
                      record.present ? styles.presentText : styles.absentText
                    ]}>
                      {record.present ? 'Present' : 'Absent'}
                    </Text>
                  </View>
                )}
              </View>

              {user.role === 'teacher' && record.students && (
                <View style={styles.recordDetails}>
                  <Text style={styles.detailText}>
                    {record.students.length} student{record.students.length !== 1 ? 's' : ''} present
                  </Text>
                </View>
              )}
            </BlurView>
          ))
        ) : (
          <Text style={styles.emptyText}>No attendance records found</Text>
        )}
      </BlurView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  monthContainer: {
    padding: CALENDAR_PADDING,
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  weekDayText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    width: DAY_CELL_SIZE,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  calendarDay: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DAY_CELL_SIZE / 2,
    marginVertical: 4,
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  otherMonthText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  today: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presentDay: {
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
  },
  absentDay: {
    backgroundColor: 'rgba(211, 47, 47, 0.2)',
  },
  recordDayText: {
    fontWeight: '600',
  },
  dayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  presentIndicator: {
    backgroundColor: '#4CAF50',
  },
  absentIndicator: {
    backgroundColor: '#FF5252',
  },
  recordsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    overflow: 'hidden',
  },
  recordItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  presentBadge: {
    backgroundColor: '#E8F5E9',
  },
  absentBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  presentText: {
    color: '#2E7D32',
  },
  absentText: {
    color: '#D32F2F',
  },
  recordDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    paddingVertical: 24,
  },
});