import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, ActivityIndicator, Alert } from 'react-native';
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
  const [loading, setLoading] = useState(true);
  
  const isTeacher = user?.role === 'teacher';
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setAttendanceData([]);
      setStudents([]);
      setLoading(false);
    }
  }, [user?.id, user?.uid]);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log("[AttendanceScreen] Loading attendance data for user:", user?.uid, "Role:", user?.role);
      
      const [records, studentsList] = await Promise.all([
        getAttendanceRecords({ forceRefresh: true }),
        isTeacher ? getStudents() : Promise.resolve([])
      ]);
      
      console.log("[AttendanceScreen] Received attendance records:", records?.length || 0);
      if (isTeacher) {
        console.log("[AttendanceScreen] Received students:", studentsList?.length || 0);
      }
      
      const processedRecords = processAttendanceRecords(records, studentsList);
      console.log("[AttendanceScreen] Processed records:", processedRecords?.length || 0);
      
      setAttendanceData(processedRecords || []);
      
      if (isTeacher) {
        setStudents(studentsList || []);
      }
      
      const today = new Date();
      if (!selectedDate) {
        setSelectedDate(today);
      }
    } catch (error) {
      console.error('[AttendanceScreen] Error loading attendance data:', error);
      Alert.alert(
        "Error Loading Attendance", 
        "There was a problem loading your attendance records. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };
  
  const processAttendanceRecords = (records, studentsList) => {
    if (!user) {
      return [];
    }
    
    if (!records || !Array.isArray(records)) {
      console.log("[AttendanceScreen] No records or invalid records data");
      return [];
    }
    
    console.log("[AttendanceScreen] Processing records:", records.length);
    
    if (!isTeacher && user?.id) {
      const studentID = user.id || user.uid;
      
      if (!studentID) {
        console.log("[AttendanceScreen] No student ID found, returning empty records");
        return [];
      }
      
      const studentRecords = records.filter(record => {
        if (!record) return false;
        
        if (record.studentId === studentID) {
          return true;
        }
        
        if (record.students && Array.isArray(record.students)) {
          return record.students.some(s => 
            (s && s.id === studentID) || 
            (s && s.studentId === studentID)
          );
        }
        
        return false;
      });
      
      console.log("[AttendanceScreen] Filtered student records:", studentRecords.length);
      return studentRecords;
    }
    
    return records;
  };

  const getDaysInMonth = (month, year = new Date().getFullYear()) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateDates = () => {
    const year = new Date().getFullYear();
    const daysInMonth = getDaysInMonth(selectedMonth, year);
    
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, selectedMonth, i + 1);
      return {
        date,
        day: i + 1,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        hasAttendance: false
      };
    });
    
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach(record => {
        if (record.date) {
          const recordDate = new Date(record.date);
          if (recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === year) {
            const dayIndex = recordDate.getDate() - 1;
            if (dayIndex >= 0 && dayIndex < dates.length) {
              dates[dayIndex].hasAttendance = true;
            }
          }
        }
      });
    }
    
    return dates;
  };

  const getAttendanceForDate = (date) => {
    if (!date || !user) return [];
    
    // Format the selected date consistently as "YYYY-MM-DD"
    const selectedYear = date.getFullYear();
    const selectedMonth = date.getMonth();
    const selectedDay = date.getDate();
    
    // Create a more reliable date string for comparison
    const dateString = `${selectedYear}-${(selectedMonth + 1).toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    
    console.log("[AttendanceScreen] Checking attendance for date:", dateString);
    
    const studentID = user.id || user.uid;
    
    if (isTeacher) {
      const studentsPresent = new Set();
      
      // Process all attendance records for this date
      attendanceData.forEach(record => {
        try {
          if (!record.date) return;
          
          // Get the record date parts
          const recordDate = new Date(record.date);
          const recordYear = recordDate.getFullYear();
          const recordMonth = recordDate.getMonth();
          const recordDay = recordDate.getDate();
          
          // Compare date parts directly for more reliable matching
          if (recordYear === selectedYear && 
              recordMonth === selectedMonth && 
              recordDay === selectedDay) {
              
            console.log("[AttendanceScreen] Found matching record:", record.id || 'unknown');
            
            // Process students array if available
            if (record.students && Array.isArray(record.students)) {
              record.students.forEach(student => {
                if (student) {
                  // Add all possible ID formats
                  if (student.id) studentsPresent.add(student.id);
                  if (student.studentId) studentsPresent.add(student.studentId);
                }
              });
            }
            
            // Add direct student ID if available
            if (record.studentId) {
              studentsPresent.add(record.studentId);
            }
          }
        } catch (error) {
          console.error("[AttendanceScreen] Error processing record:", error);
        }
      });
      
      console.log("[AttendanceScreen] Students present:", Array.from(studentsPresent));
      
      // Map registered students with attendance status
      return students.map(student => {
        const studentId = student.id || student.studentId;
        const isPresent = studentsPresent.has(studentId);
        return {
          ...student,
          present: isPresent
        };
      });
    } else {
      // For student view
      if (!studentID) return [];
      
      // Find if the student was present on this date
      let wasPresent = false;
      
      for (const record of attendanceData) {
        try {
          if (!record.date) continue;
          
          // Get the record date parts
          const recordDate = new Date(record.date);
          const recordYear = recordDate.getFullYear();
          const recordMonth = recordDate.getMonth();
          const recordDay = recordDate.getDate();
          
          // Compare date parts directly
          if (recordYear === selectedYear && 
              recordMonth === selectedMonth && 
              recordDay === selectedDay) {
            
            console.log("[AttendanceScreen] Student checking record for", dateString, record.id || 'unknown');
            
            // Direct student record match
            if (record.studentId === studentID) {
              console.log("[AttendanceScreen] Found direct match for student");
              wasPresent = true;
              break;
            }
            
            // Check in students array
            if (record.students && Array.isArray(record.students)) {
              for (const s of record.students) {
                if (!s) continue;
                
                const studentMatches = 
                  (s.id && s.id === studentID) || 
                  (s.studentId && s.studentId === studentID);
                
                if (studentMatches) {
                  console.log("[AttendanceScreen] Found student in class record");
                  wasPresent = true;
                  break;
                }
              }
              
              // Break the outer loop if student was found
              if (wasPresent) break;
            }
          }
        } catch (error) {
          console.error("[AttendanceScreen] Error checking student record:", error);
        }
      }
      
      console.log("[AttendanceScreen] Student", studentID, "present on", dateString, ":", wasPresent);
      
      return [{
        id: studentID,
        name: user.name || 'Student',
        present: wasPresent
      }];
    }
  };

  const renderDateItem = ({ item }) => {
    const isSelected = selectedDate && 
      selectedDate.getDate() === item.day && 
      selectedDate.getMonth() === item.date.getMonth();
    
    const isToday = 
      item.date.getDate() === new Date().getDate() && 
      item.date.getMonth() === new Date().getMonth() &&
      item.date.getFullYear() === new Date().getFullYear();
    
    return (
      <TouchableOpacity 
        style={[
          styles.dateItem, 
          isSelected && styles.selectedDateItem,
          isToday && !isSelected && styles.todayDateItem
        ]}
        onPress={() => setSelectedDate(item.date)}
      >
        <Text style={[
          styles.dayName, 
          isSelected && styles.selectedDateText,
          isToday && !isSelected && styles.todayDateText
        ]}>
          {item.dayName}
        </Text>
        <Text style={[
          styles.dayNumber, 
          isSelected && styles.selectedDateText,
          isToday && !isSelected && styles.todayDateText
        ]}>
          {item.day}
        </Text>
        
        {item.hasAttendance && (
          <View style={isSelected ? styles.selectedAttendanceIndicator : styles.attendanceIndicator}>
            <Check size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceItem}>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentId}>ID: {item.studentId || item.id}</Text>
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
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5271FF" />
        <Text style={styles.loadingText}>Loading attendance records...</Text>
      </View>
    );
  }

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
        initialScrollIndex={selectedDate ? selectedDate.getDate() - 3 : 0}
        getItemLayout={(data, index) => (
          {length: 76, offset: 76 * index, index}
        )}
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
            keyExtractor={(item) => (item.id || item.studentId || `temp-${Math.random()}`).toString()}
            contentContainerStyle={styles.attendanceList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No attendance records found for this date</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
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
  todayDateItem: {
    borderWidth: 1,
    borderColor: '#5271FF',
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
  todayDateText: {
    color: '#5271FF',
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
  attendanceIndicator: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAttendanceIndicator: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});