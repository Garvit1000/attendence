import { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp, 
  onSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Import Firestore instance
import { useAuth } from './useAuth'; // To get current user info
import { ActivityIndicator, View } from 'react-native';

const AttendanceContext = createContext();

export function AttendanceProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Fetch students (users with role 'student') from Firestore
  useEffect(() => {
    if (authLoading || !user) {
      // Don't fetch if auth is loading or user is not logged in
      // Set loading to false if not logged in but auth is finished
      if(!authLoading) {
        setIsLoadingStudents(false);
        setStudents([]);
      }
      return;
    }

    // Only teachers should likely fetch all students
    if (user.role !== 'teacher') {
      setIsLoadingStudents(false);
      setStudents([]); // Students don't need the full list
      return;
    }

    setIsLoadingStudents(true);
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where('role', '==', 'student'), orderBy('name'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedStudents = [];
      querySnapshot.forEach((doc) => {
        fetchedStudents.push({ id: doc.id, ...doc.data() });
      });
      setStudents(fetchedStudents);
      setIsLoadingStudents(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      setIsLoadingStudents(false);
    });

    // Cleanup listener on unmount or when user changes
    return () => unsubscribe();

  }, [user, authLoading]);

  // Fetch attendance records from Firestore
  useEffect(() => {
    if (authLoading || !user) {
        if(!authLoading) {
            setIsLoadingRecords(false);
            setAttendanceRecords([]);
        }
      return; // Don't fetch if auth is loading or user is not logged in
    }

    setIsLoadingRecords(true);
    const attendanceCol = collection(db, 'attendance');
    let q;

    if (user.role === 'teacher') {
      // Teachers get all records, ordered by date
      q = query(attendanceCol, orderBy('date', 'desc'));
    } else if (user.role === 'student') {
      // Students get only their own records, ordered by date
      q = query(attendanceCol, where('studentUid', '==', user.uid), orderBy('date', 'desc'));
    } else {
      // Handle other roles or unauthenticated state if necessary
      setIsLoadingRecords(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedRecords = [];
      querySnapshot.forEach((doc) => {
        // Convert Firestore Timestamp to JS Date if needed, or keep as Timestamp
        const data = doc.data();
        fetchedRecords.push({ 
          id: doc.id, 
          ...data,
          // Ensure date is a JS Date object if necessary for date pickers etc.
          // date: data.date instanceof Timestamp ? data.date.toDate() : data.date 
        });
      });
      setAttendanceRecords(fetchedRecords);
      setIsLoadingRecords(false);
    }, (error) => {
      console.error("Error fetching attendance records: ", error);
      setIsLoadingRecords(false);
    });

    // Cleanup listener on unmount or when user changes
    return () => unsubscribe();

  }, [user, authLoading]);

  const markAttendance = async (studentUid, date) => {
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can mark attendance.');
    }
    if (!studentUid || !date) {
        throw new Error('Student and date are required.');
    }
    
    try {
        // Check if attendance already marked for this student on this specific day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const attendanceCol = collection(db, 'attendance');
        const q = query(attendanceCol, 
                      where('studentUid', '==', studentUid), 
                      where('date', '>=', Timestamp.fromDate(startOfDay)),
                      where('date', '<=', Timestamp.fromDate(endOfDay)));
                      
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            console.log("Attendance already marked for this student today.");
            // Optionally return the existing record or throw a specific error
            return querySnapshot.docs[0].data(); // Return existing record data
        }

        // Fetch student details (like name) to store denormalized data if desired
        let studentName = 'Unknown';
        try {
            const studentDocRef = doc(db, 'users', studentUid);
            const studentDocSnap = await getDoc(studentDocRef);
            if (studentDocSnap.exists()) {
                studentName = studentDocSnap.data().name;
            }
        } catch (nameError) {
            console.error("Error fetching student name for attendance record:", nameError);
        }

        // Add new attendance record
        const newRecord = {
            studentUid: studentUid,
            studentName: studentName, // Store name for easier display
            date: Timestamp.fromDate(date), // Store as Firestore Timestamp
            markedByUid: user.uid,
            markedByName: user.name, // Store marker's name
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, 'attendance'), newRecord);
        
        // Return the newly created record with its ID
        return { id: docRef.id, ...newRecord };

    } catch (error) {
      console.error('Failed to mark attendance:', error);
      throw error; // Rethrow for UI handling
    }
  };

  // Function to get records (potentially with filtering, though real-time listener handles most cases)
  // This might be useful for specific one-off queries if needed, 
  // but the state `attendanceRecords` usually holds the relevant data.
  const getAttendanceRecords = () => {
    // Usually, components will just consume `attendanceRecords` from state
    return attendanceRecords;
  };

  const getStudents = () => {
      // Usually, components will just consume `students` from state
      return students;
  };

  // Loading state combines auth, records, and students loading
  const isLoading = authLoading || isLoadingRecords || isLoadingStudents;

  return (
    <AttendanceContext.Provider value={{ 
      attendanceRecords,
      students,
      markAttendance,
      getAttendanceRecords, // Keep if needed, otherwise remove
      getStudents, // Keep if needed, otherwise remove
      isLoading
    }}>
      {isLoading ? (
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