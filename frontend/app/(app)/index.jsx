import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Alert, Modal, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera as CameraIcon, Upload, Users, UserCheck, FileText, UserPlus, BarChart3, User, Mail, Check, XIcon, ArrowLeft, RotateCw, Calendar } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import * as ImagePicker from 'expo-image-picker';
import { teacherApi } from '@/services/api';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import RegisterStudent from '@/components/RegisterStudent';
import TakeAttendance from '@/components/TakeAttendance';
import CameraView from '@/components/CameraView';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { markAttendance, getStudents, getAttendanceRecords } = useAttendance();
  const [students, setStudents] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState("back");
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegisterStudent, setShowRegisterStudent] = useState(false);
  const [showTakeAttendance, setShowTakeAttendance] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  
  const isTeacher = user?.role === 'teacher';
  const cameraRef = useRef(null);

  const loadStudents = async () => {
    try {
      const response = await teacherApi.getStudents(user.uid);
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      // Call the async version of getAttendanceRecords with forceRefresh option
      console.log("[Dashboard] Requesting attendance records for user:", user?.id || user?.uid);
      const records = await getAttendanceRecords({ forceRefresh: true });
      console.log("[Dashboard] Got attendance records:", records?.length || 0);
      
      setAttendanceRecords(records || []);
      
      // For students, filter only their own attendance
      if (!isTeacher && user) {
        console.log('[Dashboard] Student user ID:', user.id || user.uid);
        console.log('[Dashboard] Total records:', records?.length || 0);
        
        // Log record structure to debug
        if (records && records.length > 0) {
          console.log('[Dashboard] Record structure example:', JSON.stringify(records[0], null, 2));
        }
        
        // Handle potentially undefined records
        if (!records || records.length === 0) {
          console.log('[Dashboard] No attendance records found');
          setRecentAttendance([]);
          return;
        }
        
        const studentID = user.id || user.uid;
        console.log('[Dashboard] Using student ID for filtering:', studentID);
        
        const studentRecords = records.filter(record => {
          if (!record) return false;
          
          // For individual records
          if (record.studentId === studentID) {
            return true;
          }
          
          // For class records
          if (record.students && Array.isArray(record.students)) {
            return record.students.some(s => 
              (s && s.id && s.id === studentID) || 
              (s && s.studentId && s.studentId === studentID)
            );
          }
          
          return false;
        });
        
        console.log('[Dashboard] Filtered student records:', studentRecords.length);
        
        // Sort by date - most recent first
        const sortedRecords = studentRecords.sort((a, b) => {
          const dateA = a.date instanceof Date ? a.date : new Date(a.date);
          const dateB = b.date instanceof Date ? b.date : new Date(b.date);
          return dateB - dateA;
        });
        
        // Get the 5 most recent records
        setRecentAttendance(sortedRecords.slice(0, 5));
      }
    } catch (error) {
      console.error('[Dashboard] Error loading attendance records:', error);
      // Show empty state
      setAttendanceRecords([]);
      setRecentAttendance([]);
    }
  };

  useEffect(() => {
    if (isTeacher) {
      loadStudents();
    }
    loadAttendanceRecords();
  }, [isTeacher, user?.uid, user?.id]);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        const resizedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setSelectedImage(resizedPhoto);
        processAttendance(resizedPhoto.uri);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to capture image");
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const processAttendance = async (imageUri) => {
    setRecognizing(true);
    try {
      const formData = new FormData();
      formData.append('classPhoto', {
        uri: imageUri,
        name: 'class-photo.jpg',
        type: 'image/jpeg'
      });
      formData.append('teacherId', user.uid);

      const response = await teacherApi.processAttendance(formData);
      if (response.success) {
        setRecognizedStudents(response.detectedStudents);
      } else {
        Alert.alert("Error", response.message || "Failed to process attendance");
      }
    } catch (error) {
      console.error("Error processing attendance:", error);
      Alert.alert("Error", "Failed to process attendance");
    } finally {
      setRecognizing(false);
    }
  };

  const saveAttendance = async () => {
    try {
      const response = await teacherApi.saveAttendance({
        teacherId: user.uid,
        students: recognizedStudents,
        date: new Date().toISOString()
      });
      
      if (response.success) {
        Alert.alert("Success", `Attendance recorded for ${recognizedStudents.length} students`);
        setShowCamera(false);
        setSelectedImage(null);
        setRecognizedStudents([]);
      } else {
        Alert.alert("Error", response.message || "Failed to save attendance");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      Alert.alert("Error", "Failed to save attendance");
    }
  };

  const registerStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.studentId || !selectedImage) {
      Alert.alert("Error", "Please fill in all fields and take a photo");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('faceImage', {
        uri: selectedImage.uri,
        name: 'face-photo.jpg',
        type: 'image/jpeg'
      });
      formData.append('name', newStudent.name);
      formData.append('email', newStudent.email);
      formData.append('studentId', newStudent.studentId);
      formData.append('teacherId', user.uid);

      const response = await teacherApi.registerStudent(formData);
      if (response.success) {
        Alert.alert("Success", `Student ${newStudent.name} registered successfully`);
        setShowRegisterForm(false);
        setNewStudent({ name: '', email: '', studentId: '' });
        setSelectedImage(null);
        // Refresh students list
        loadStudents();
      } else {
        Alert.alert("Error", response.message || "Failed to register student");
      }
    } catch (error) {
      console.error("Error registering student:", error);
      Alert.alert("Error", "Failed to register student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCameraType = () => {
    setCameraType(current => current === "back" ? "front" : "back");
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const formatAttendanceDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.attendanceItem}>
      <View style={styles.attendanceDate}>
        <Calendar size={16} color="#5271FF" />
        <Text style={styles.dateText}>{formatAttendanceDate(item.date)}</Text>
      </View>
      <View style={styles.statusIndicator}>
        <Check size={16} color="#FFFFFF" />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}</Text>
        <Text style={styles.role}>{user?.role === 'teacher' ? 'Teacher' : 'Student'}</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{isTeacher ? students.length : 1}</Text>
          <Text style={styles.statLabel}>{isTeacher ? 'Students' : 'Classes'}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{isTeacher ? '85%' : '92%'}</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{isTeacher ? '12' : recentAttendance.length}</Text>
          <Text style={styles.statLabel}>{isTeacher ? 'Classes' : 'Attendances'}</Text>
        </View>
      </View>
      
      {isTeacher && (
        <>
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Teacher Actions</Text>
            
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowRegisterStudent(true)}
              >
                <View style={styles.actionIcon}>
                  <UserPlus size={24} color="#5271FF" />
                </View>
                <Text style={styles.actionText}>Register Student</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => setShowTakeAttendance(true)}
              >
                <View style={styles.actionIcon}>
                  <CameraIcon size={24} color="#5271FF" />
                </View>
                <Text style={styles.actionText}>Take Attendance</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Register Student Modal */}
          <Modal
            visible={showRegisterStudent}
            animationType="slide"
            onRequestClose={() => setShowRegisterStudent(false)}
          >
            <RegisterStudent 
              onSuccess={() => {
                setShowRegisterStudent(false);
                // Call the loadStudents function to refresh the list
                loadStudents();
              }}
            />
          </Modal>

          {/* Take Attendance Modal */}
          <Modal
            visible={showTakeAttendance}
            animationType="slide"
            onRequestClose={() => setShowTakeAttendance(false)}
          >
            <TakeAttendance 
              onSuccess={() => {
                setShowTakeAttendance(false);
                // If there's a loadAttendanceRecords function, make sure it's defined
                if (typeof loadAttendanceRecords === 'function') {
                  loadAttendanceRecords();
                }
              }}
            />
          </Modal>
        </>
      )}
      
      {!isTeacher && (
        <View style={styles.studentAttendanceSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/attendance')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentAttendance.length > 0 ? (
            <FlatList
              data={recentAttendance}
              renderItem={renderAttendanceItem}
              keyExtractor={(item, index) => `attendance-${index}`}
              scrollEnabled={false}
              style={styles.attendanceList}
            />
          ) : (
            <View style={styles.emptyAttendance}>
              <Text style={styles.emptyText}>No recent attendance records</Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => router.push('/(app)/attendance')}
          >
            <View style={styles.actionIcon}>
              <BarChart3 size={24} color="#5271FF" />
            </View>
            <Text style={styles.quickActionText}>View Attendance</Text>
          </TouchableOpacity>
          
          {isTeacher && (
            <>
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={styles.actionIcon}>
                  <FileText size={24} color="#5271FF" />
                </View>
                <Text style={styles.quickActionText}>Generate Report</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => setShowRegisterForm(true)}
              >
                <View style={styles.actionIcon}>
                  <UserPlus size={24} color="#5271FF" />
                </View>
                <Text style={styles.quickActionText}>Add Student</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  role: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5271FF',
  },
  recognizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5271FF',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    opacity: 0.7,
  },
  recognizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recognizedContainer: {
    marginTop: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  recognizedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  studentId: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  confidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  quickActions: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  quickActionButton: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cameraTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(82, 113, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  registerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  registerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  registerForm: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 8,
  },
  idIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    width: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  takePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F4FF',
    borderWidth: 1,
    borderColor: '#5271FF',
    borderRadius: 8,
    paddingVertical: 20,
    marginVertical: 10,
  },
  takePictureText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#5271FF',
    marginLeft: 12,
  },
  photoContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
  },
  facePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#5271FF',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#FF4D4D',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#5271FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  studentAttendanceSection: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#5271FF',
    fontWeight: '500',
  },
  attendanceList: {
    marginTop: 8,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  attendanceDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAttendance: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  }
});