import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from './useAuth';

const AttendanceContext = createContext();

export function AttendanceProvider({ children }) {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load attendance records and students from AsyncStorage
    const loadData = async () => {
      try {
        // Load attendance records
        const recordsJson = await AsyncStorage.getItem('attendanceRecords');
        if (recordsJson) {
          setAttendanceRecords(JSON.parse(recordsJson));
        } else {
          // Initialize with empty array if not exists
          await AsyncStorage.setItem('attendanceRecords', JSON.stringify([]));
        }
        
        // Load students
        const studentsJson = await AsyncStorage.getItem('students');
        if (studentsJson) {
          setStudents(JSON.parse(studentsJson));
        } else {
          // Initialize with mock data if not exists
          const mockStudents = [
            { id: '1', name: 'John Doe', email: 'john@example.com' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            { id: '3', name: 'Michael Johnson', email: 'michael@example.com' },
            { id: '4', name: 'Emily Davis', email: 'emily@example.com' },
            { id: '5', name: 'Robert Wilson', email: 'robert@example.com' },
          ];
          await AsyncStorage.setItem('students', JSON.stringify(mockStudents));
          setStudents(mockStudents);
        }
      } catch (error) {
        console.error('Failed to load attendance data', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadData();
  }, []);

  const markAttendance = async (studentId, date) => {
    try {
      // Create new attendance record
      const newRecord = {
        id: Date.now().toString(),
        studentId,
        date: date.toISOString(),
        markedBy: user?.id,
        createdAt: new Date().toISOString(),
      };
      
      // Check if record already exists for this student and date
      const dateString = date.toISOString().split('T')[0];
      const existingRecord = attendanceRecords.find(
        record => 
          record.studentId === studentId && 
          record.date.split('T')[0] === dateString
      );
      
      if (existingRecord) {
        // Record already exists, no need to add again
        return existingRecord;
      }
      
      // Add to records list
      const updatedRecords = [...attendanceRecords, newRecord];
      setAttendanceRecords(updatedRecords);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('attendanceRecords', JSON.stringify(updatedRecords));
      
      return newRecord;
    } catch (error) {
      console.error('Failed to mark attendance', error);
      throw error;
    }
  };

  const getAttendanceRecords = async (studentId = null, startDate = null, endDate = null) => {
    try {
      // Filter records based on parameters
      let filteredRecords = [...attendanceRecords];
      
      if (studentId) {
        filteredRecords = filteredRecords.filter(record => record.studentId === studentId);
      }
      
      if (startDate) {
        const startDateStr = new Date(startDate).toISOString();
        filteredRecords = filteredRecords.filter(record => record.date >= startDateStr);
      }
      
      if (endDate) {
        const endDateStr = new Date(endDate).toISOString();
        filteredRecords = filteredRecords.filter(record => record.date <= endDateStr);
      }
      
      // If user is a student, only return their own records
      if (user?.role === 'student') {
        filteredRecords = filteredRecords.filter(record => record.studentId === user.id);
      }
      
      return filteredRecords;
    } catch (error) {
      console.error('Failed to get attendance records', error);
      return [];
    }
  };

  const getStudents = async () => {
    try {
      return students;
    } catch (error) {
      console.error('Failed to get students', error);
      return [];
    }
  };

  const addStudent = async (name, email) => {
    try {
      // Create new student
      const newStudent = {
        id: Date.now().toString(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };
      
      // Add to students list
      const updatedStudents = [...students, newStudent];
      setStudents(updatedStudents);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('students', JSON.stringify(updatedStudents));
      
      return newStudent;
    } catch (error) {
      console.error('Failed to add student', error);
      throw error;
    }
  };

  return (
    <AttendanceContext.Provider value={{ 
      markAttendance,
      getAttendanceRecords,
      getStudents,
      addStudent
    }}>
      {!isInitialized ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#5271FF" />
        </View>
      ) : (
        children
      )}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}