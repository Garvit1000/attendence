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
    
    try {
      console.log("[useAttendance] Starting to fetch attendance records for user:", user.uid, "Role:", user.role);
      
      // Handle different collections and query approaches based on role
      if (user.role === 'teacher') {
        // Teachers get all records they created, ordered by date
        console.log("[useAttendance] Fetching teacher attendance records");
        const attendanceCol = collection(db, 'attendance');
        const q = query(
          attendanceCol, 
          where('teacherId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          console.log("[useAttendance] Teacher records snapshot received, count:", querySnapshot.size);
          const fetchedRecords = [];
          querySnapshot.forEach((doc) => {
            // Convert Firestore Timestamp to JS Date if needed
            const data = doc.data();
            fetchedRecords.push({ 
              id: doc.id, 
              ...data,
              date: data.date instanceof Timestamp ? data.date.toDate() : data.date 
            });
          });
          setAttendanceRecords(fetchedRecords);
          setIsLoadingRecords(false);
        }, (error) => {
          console.error("Error fetching teacher attendance records: ", error);
          setIsLoadingRecords(false);
        });
        
        return () => unsubscribe();
      } else if (user.role === 'student') {
        console.log("[useAttendance] Fetching student attendance records for studentId:", user.uid);
        
        // For students, first fetch all teachers they're associated with
        // This is needed to construct our query properly
        const usersCol = collection(db, 'users');
        const teachersQuery = query(
          usersCol,
          where('role', '==', 'teacher')
        );
        
        getDocs(teachersQuery).then(teacherSnapshot => {
          const teacherIds = [];
          teacherSnapshot.forEach(doc => {
            teacherIds.push(doc.id);
          });
          
          console.log("[useAttendance] Found potential teachers:", teacherIds);
          
          // For students, we need to query from two collections
          // First from studentAttendance where they are directly referenced
          const studentAttendanceCol = collection(db, 'studentAttendance');
          const studentQuery = query(
            studentAttendanceCol,
            where('studentId', '==', user.uid),
            orderBy('date', 'desc')
          );
          
          // Get individual student attendance records
          const unsubscribeStudent = onSnapshot(studentQuery, (querySnapshot) => {
            console.log("[useAttendance] Student individual records snapshot received, count:", querySnapshot.size);
            const studentRecords = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              studentRecords.push({
                id: doc.id,
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
                recordType: 'individual'
              });
            });
            
            // Check if we have any records already
            if (studentRecords.length > 0) {
              console.log("[useAttendance] Found individual student records:", studentRecords.length);
              setAttendanceRecords(studentRecords);
              setIsLoadingRecords(false);
              return;
            }
            
            // If we don't have individual records, try class-wide records
            console.log("[useAttendance] No individual records found, checking class records");
            
            if (teacherIds.length === 0) {
              console.log("[useAttendance] No teachers found, can't query class records");
              setAttendanceRecords([]);
              setIsLoadingRecords(false);
              return;
            }
            
            // Query class-wide attendance records from each teacher
            // We need multiple queries since Firestore doesn't support OR conditions
            const classQueries = teacherIds.map(teacherId => {
              const attendanceCol = collection(db, 'attendance');
              return query(
                attendanceCol,
                where('teacherId', '==', teacherId),
                orderBy('date', 'desc')
              );
            });
            
            // Run all queries and combine results
            Promise.all(classQueries.map(q => getDocs(q)))
              .then(snapshots => {
                const classRecords = [];
                
                snapshots.forEach(snapshot => {
                  snapshot.forEach(doc => {
                    const data = doc.data();
                    
                    // Check if this student is included in the students array
                    if (data.students && Array.isArray(data.students)) {
                      const isIncluded = data.students.some(
                        s => (s.id === user.uid || s.studentId === user.uid)
                      );
                      
                      if (isIncluded) {
                        classRecords.push({
                          id: doc.id,
                          ...data,
                          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
                          recordType: 'class'
                        });
                      }
                    }
                  });
                });
                
                console.log("[useAttendance] Found class records:", classRecords.length);
                
                // Combine both types of records and sort by date
                const combinedRecords = [...studentRecords, ...classRecords]
                  .sort((a, b) => new Date(b.date) - new Date(a.date));
                  
                setAttendanceRecords(combinedRecords);
              })
              .catch(error => {
                console.error("Error fetching class attendance records: ", error);
                // We still have studentRecords to show
                setAttendanceRecords(studentRecords);
              })
              .finally(() => {
                setIsLoadingRecords(false);
              });
          }, (error) => {
            console.error("Error fetching student attendance records: ", error);
            setIsLoadingRecords(false);
          });
          
          return () => {
            if (unsubscribeStudent) unsubscribeStudent();
          };
        }).catch(error => {
          console.error("Error fetching teachers: ", error);
          setIsLoadingRecords(false);
        });
      }
    } catch (error) {
      console.error("Error setting up attendance listeners: ", error);
      setIsLoadingRecords(false);
    }
  }, [user, authLoading]);

  const registerStudent = async (studentData, faceImage) => {
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can register students.');
    }

    try {
      console.log("[useAttendance] Starting student registration process...");
      console.log("[useAttendance] Image type:", typeof faceImage, faceImage instanceof Blob);
      
      // Convert image to base64
      let base64Image;
      try {
        if (faceImage instanceof Blob) {
          console.log("[useAttendance] Processing blob directly...");
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => {
              console.error("[useAttendance] FileReader error:", error);
              reject(new Error("Failed to read image file"));
            };
          });
          reader.readAsDataURL(faceImage);
          base64Image = await base64Promise;
        } else if (faceImage.uri) {
          console.log("[useAttendance] Processing file with URI:", faceImage.uri);
          // Handle file object with uri property
          const response = await fetch(faceImage.uri);
          const blob = await response.blob();
          
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => {
              console.error("[useAttendance] FileReader error:", error);
              reject(new Error("Failed to read image file"));
            };
          });
          reader.readAsDataURL(blob);
          base64Image = await base64Promise;
        } else {
          throw new Error("Invalid image format");
        }
        
        console.log("[useAttendance] Successfully converted image to base64");
      } catch (imageError) {
        console.error("[useAttendance] Image processing error:", imageError);
        throw new Error("Failed to process the student photo: " + (imageError.message || "Unknown error"));
      }

      // Validate required fields
      if (!studentData.name || !studentData.email || !studentData.studentId) {
        throw new Error("Missing required student information");
      }

      // Create student document
      const studentDoc = {
        ...studentData,
        teacherId: user.uid,
        createdAt: Timestamp.now(),
        profileImage: base64Image,
        // We'll store face encoding here later when we implement the backend
        faceEncoding: null,
        role: 'student'
      };

      console.log("[useAttendance] Saving student to Firestore...");
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'users'), studentDoc);
      console.log("[useAttendance] Student saved successfully with ID:", docRef.id);
      
      return { id: docRef.id, ...studentDoc };
    } catch (error) {
      console.error('[useAttendance] Failed to register student:', error);
      throw error;
    }
  };

  const processClassPhoto = async (classPhoto) => {
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can process class photos.');
    }

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(classPhoto);
      const base64Image = await base64Promise;

      // Get all students for this teacher
      const studentsQuery = query(
        collection(db, 'users'),
        where('teacherId', '==', user.uid),
        where('role', '==', 'student')
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Here we'll send the image to the backend for face recognition
      // For now, we'll just return the students list
      return {
        success: true,
        students,
        classPhoto: base64Image
      };
    } catch (error) {
      console.error('Failed to process class photo:', error);
      throw error;
    }
  };

  const markAttendance = async (date, presentStudents) => {
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can mark attendance.');
    }

    try {
      // Create the main attendance record (class-wide)
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
        className: 'Class Session', // You might want to make this configurable
        createdAt: Timestamp.now()
      };

      // Add the class-wide attendance record
      const docRef = await addDoc(collection(db, 'attendance'), attendanceDoc);
      
      // Create individual student attendance records for easier querying
      const individualRecordPromises = presentStudents.map(student => {
        const studentAttendanceDoc = {
          teacherId: user.uid,
          studentId: student.studentId || student.id,
          date: Timestamp.fromDate(new Date(date)),
          present: true,
          studentName: student.name,
          className: 'Class Session',
          attendanceRecordId: docRef.id, // Reference to the main record
          createdAt: Timestamp.now()
        };
        
        return addDoc(collection(db, 'studentAttendance'), studentAttendanceDoc);
      });
      
      // Wait for all individual records to be created
      await Promise.all(individualRecordPromises);
      
      return { 
        id: docRef.id, 
        ...attendanceDoc,
        date: attendanceDoc.date.toDate() // Convert Timestamp to Date for client use
      };
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      throw error;
    }
  };

  // Function to get records (potentially with filtering, though real-time listener handles most cases)
  const getAttendanceRecords = async (options = {}) => {
    try {
      // If we already have records in state, return those by default
      if (attendanceRecords.length > 0 && !options.forceRefresh) {
        return attendanceRecords;
      }

      // Otherwise, fetch fresh data
      let records = [];
      
      if (user.role === 'teacher') {
        // Teachers get all their records
        const attendanceCol = collection(db, 'attendance');
        const q = query(
          attendanceCol, 
          where('teacherId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          records.push({
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date
          });
        });
      } else if (user.role === 'student') {
        // For students, fetch from both collections
        // 1. Individual student records
        const studentRecords = [];
        const studentAttendanceCol = collection(db, 'studentAttendance');
        const studentQ = query(
          studentAttendanceCol,
          where('studentId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const studentSnapshot = await getDocs(studentQ);
        studentSnapshot.forEach((doc) => {
          const data = doc.data();
          studentRecords.push({
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
            recordType: 'individual'
          });
        });
        
        // 2. Class-wide records
        const classRecords = [];
        const attendanceCol = collection(db, 'attendance');
        const classQ = query(
          attendanceCol,
          orderBy('date', 'desc')
        );
        
        const classSnapshot = await getDocs(classQ);
        classSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Check if this student is included in the class
          if (data.students && Array.isArray(data.students)) {
            const isIncluded = data.students.some(
              s => (s.id === user.uid || s.studentId === user.uid)
            );
            
            if (isIncluded) {
              classRecords.push({
                id: doc.id,
                ...data,
                date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
                recordType: 'class'
              });
            }
          }
        });
        
        // Combine and sort all records
        records = [...studentRecords, ...classRecords]
          .sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      
      return records;
    } catch (error) {
      console.error("Error fetching attendance records: ", error);
      // Return current state as fallback
      return attendanceRecords;
    }
  };

  const getStudents = () => {
      // Usually, components will just consume `students` from state
      return students;
  };

  const addStudentImage = async (studentId, imageFile) => {
    if (!user || user.role !== 'teacher') {
      throw new Error('Only teachers can add student images.');
    }

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(imageFile);
      const base64Image = await base64Promise;

      // Update student document with image
      const studentRef = doc(db, 'users', studentId);
      await updateDoc(studentRef, {
        profileImage: base64Image,
        imageUpdatedAt: Timestamp.now()
      });

      return true;
    } catch (error) {
      console.error('Failed to add student image:', error);
      throw error;
    }
  };

  const getStudentImage = async (studentId) => {
    try {
      const studentRef = doc(db, 'users', studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (studentDoc.exists()) {
        return studentDoc.data().profileImage;
      }
      return null;
    } catch (error) {
      console.error('Failed to get student image:', error);
      throw error;
    }
  };

  // Loading state combines auth, records, and students loading
  const isLoading = authLoading || isLoadingRecords || isLoadingStudents;

  return (
    <AttendanceContext.Provider value={{ 
      attendanceRecords,
      students,
      markAttendance,
      getAttendanceRecords,
      getStudents,
      addStudentImage,
      getStudentImage,
      registerStudent,
      processClassPhoto,
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