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
  getDoc,
  updateDoc,
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { db } from '../config/firebase'; // Import Firestore instance
import { useAuth } from './useAuth'; // To get current user info
import { ActivityIndicator, View, Alert } from 'react-native';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';

const AttendanceContext = createContext();

export function AttendanceProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch students
  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== 'teacher') {
      setIsLoadingStudents(false);
      setStudents([]);
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
      console.error("Error fetching students:", error);
      setIsLoadingStudents(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  // Fetch attendance records
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoadingRecords(false);
      setAttendanceRecords([]);
      return;
    }

    setIsLoadingRecords(true);
    console.log("[useAttendance] Starting to fetch attendance records for user:", user.uid, "Role:", user.role);

    let unsubscribe;

    if (user.role === 'teacher') {
      const attendanceCol = collection(db, 'attendance');
      const q = query(
        attendanceCol,
        where('teacherId', '==', user.uid),
        orderBy('date', 'desc')
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("[useAttendance] Teacher records snapshot received");
        const fetchedRecords = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date
          };
        });
        setAttendanceRecords(fetchedRecords);
        setIsLoadingRecords(false);
      }, (error) => {
        console.error("Error fetching teacher records:", error);
        setIsLoadingRecords(false);
      });
    } else if (user.role === 'student') {
      const studentAttendanceCol = collection(db, 'studentAttendance');
      const q = query(
        studentAttendanceCol,
        where('studentId', '==', user.uid),
        orderBy('date', 'desc')
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("[useAttendance] Student records snapshot received");
        const studentRecords = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date
          };
        });
        setAttendanceRecords(studentRecords);
        setIsLoadingRecords(false);
      }, (error) => {
        console.error("Error fetching student records:", error);
        setIsLoadingRecords(false);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, authLoading]);

  const value = {
    attendanceRecords,
    students,
    isLoadingRecords,
    isLoadingStudents,
    getStudents: () => students,
    markAttendance: async (date, presentStudents) => {
      if (!user || user.role !== 'teacher') {
        throw new Error('Only teachers can mark attendance.');
      }

      const attendanceDoc = {
        teacherId: user.uid,
        date: Timestamp.fromDate(new Date(date)),
        students: presentStudents.map(student => ({
          id: student.id,
          studentId: student.studentId || student.id,
          name: student.name,
          present: true,
          markedAt: Timestamp.now()
        })),
        className: 'Class Session',
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'attendance'), attendanceDoc);

      // Create individual student records
      await Promise.all(presentStudents.map(student => {
        const studentAttendanceDoc = {
          teacherId: user.uid,
          studentId: student.studentId || student.id,
          date: Timestamp.fromDate(new Date(date)),
          present: true,
          studentName: student.name,
          className: 'Class Session',
          attendanceRecordId: docRef.id,
          createdAt: Timestamp.now()
        };
        return addDoc(collection(db, 'studentAttendance'), studentAttendanceDoc);
      }));

      return {
        id: docRef.id,
        ...attendanceDoc,
        date: attendanceDoc.date.toDate()
      };
    }
  };

  if (authLoading || isLoadingRecords || isLoadingStudents) {
    return <DashboardSkeleton />;
  }

  return (
    <AttendanceContext.Provider value={value}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}