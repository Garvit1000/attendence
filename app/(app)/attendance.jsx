import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Calendar, ChevronDown, ChevronUp, Check, X } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';

export default function AttendanceScreen() {
  const { user } = useAuth();
  const { getAttendanceRecords, getStudents } = useAttendance();
  const [attendanceData, setAttendanceData] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  
  const isTeacher = user?.role === 'teacher';
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const loadData = async () => {
      const records = await getAttendanceRecords();
      setAttendanceData(records);
      
      if (isTeacher) {
        const studentList = await getStudents();
        setStudents(studentList);
      }
    };
    
    loadData();
  }, []);

  const getDaysInMonth = (month, year = new Date().getFullYear()) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateDates = () => {
    const year = new Date().getFullYear();
    const daysInMonth = getDaysInMonth(selectedMonth, year);
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, selectedMonth, i + 1);
      return {
        date,
        day: i + 1,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    });
  };

  const getAttendanceForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    
    if (isTeacher) {
      // For teachers, return all students' attendance for the date
      return students.map(student => {
        const record = attendanceData.find(
          r => r.studentId === student.id && r.date.split('T')[0] === dateString
        );
        
        return {
          ...student,
          present: !!record,
        };
      });
    } else {
      // For students, return their own attendance
      const record = attendanceData.find(
        r => r.studentId === user.id && r.date.split('T')[0] === dateString
      );
      
      return [{
        id: user.id,
        name: user.name,
        present: !!record,
      }];
    }
  };

  const renderDateItem = ({ item }) => {
    const isSelected = selectedDate && 
      selectedDate.getDate() === item.day && 
      selectedDate.getMonth() === item.date.getMonth();
    
    return (
      <TouchableOpacity 
        style={[styles.dateItem, isSelected && styles.selectedDateItem]}
        onPress={() => setSelectedDate(item.date)}
      >
        <Text style={[styles.dayName, isSelected && styles.selectedDateText]}>
          {item.dayName}
        </Text>
        <Text style={[styles.dayNumber, isSelected && styles.selectedDateText]}>
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceItem}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentId}>ID: {item.id}</Text>
      </View>
      <View style={[
        styles.statusIndicator, 
        item.present ? styles.presentIndicator : styles.absentIndicator
      ]}>
        {item.present ? (
          <Check size={16} color="#FFFFFF" />
        ) : (
          <X size={16} color="#FFFFFF" />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.monthSelector}
          onPress={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
        >
          <Calendar size={20} color="#5271FF" />
          <Text style={styles.monthText}>{months[selectedMonth]}</Text>
          {isMonthPickerOpen ? (
            <ChevronUp size={20} color="#6B7280" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </TouchableOpacity>
        
        {isMonthPickerOpen && (
          <View style={styles.monthPicker}>
            {months.map((month, index) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthOption,
                  selectedMonth === index && styles.selectedMonthOption
                ]}
                onPress={() => {
                  setSelectedMonth(index);
                  setIsMonthPickerOpen(false);
                  setSelectedDate(null);
                }}
              >
                <Text style={[
                  styles.monthOptionText,
                  selectedMonth === index && styles.selectedMonthOptionText
                ]}>
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <FlatList
        horizontal
        data={generateDates()}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.day.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
      />
      
      <View style={styles.attendanceContainer}>
        <Text style={styles.sectionTitle}>
          {selectedDate ? 
            `Attendance for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 
            'Select a date to view attendance'
          }
        </Text>
        
        {selectedDate ? (
          <FlatList
            data={getAttendanceForDate(selectedDate)}
            renderItem={renderAttendanceItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.attendanceList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No attendance records found</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>Select a date to view attendance</Text>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  monthPicker: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  monthOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  selectedMonthOption: {
    backgroundColor: '#F0F4FF',
  },
  monthOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedMonthOptionText: {
    color: '#5271FF',
    fontWeight: '500',
  },
  dateList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDateItem: {
    backgroundColor: '#5271FF',
  },
  dayName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  attendanceContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  attendanceList: {
    paddingBottom: 24,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  studentId: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentIndicator: {
    backgroundColor: '#10B981',
  },
  absentIndicator: {
    backgroundColor: '#EF4444',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});