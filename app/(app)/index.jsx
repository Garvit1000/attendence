import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Upload, Users, UserCheck, FileText, UserPlus, BarChart3 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAttendance } from '@/hooks/useAttendance';
import * as ImagePicker from 'expo-image-picker';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { markAttendance, getStudents } = useAttendance();
  const [students, setStudents] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    const loadStudents = async () => {
      const studentList = await getStudents();
      setStudents(studentList);
    };
    
    loadStudents();
  }, []);

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

  const simulateCapture = async () => {
    // In a real app, this would use the camera
    // For this demo, we'll just use a placeholder image
    setSelectedImage('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1471&auto=format&fit=crop');
  };

  const recognizeFaces = async () => {
    if (!selectedImage) return;
    
    setRecognizing(true);
    
    // Simulate face recognition process
    setTimeout(() => {
      // Randomly select some students as "recognized"
      const recognized = students
        .filter(() => Math.random() > 0.3) // Randomly select ~70% of students
        .map(student => ({
          ...student,
          confidence: (Math.random() * 30 + 70).toFixed(1) // Random confidence between 70-100%
        }));
      
      setRecognizedStudents(recognized);
      setRecognizing(false);
      
      // Mark attendance for recognized students
      recognized.forEach(student => {
        markAttendance(student.id, new Date());
      });
    }, 2000);
  };

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
          <Text style={styles.statValue}>{isTeacher ? '12' : '3'}</Text>
          <Text style={styles.statLabel}>{isTeacher ? 'Classes' : 'Absences'}</Text>
        </View>
      </View>
      
      {isTeacher && (
        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Take Attendance</Text>
          
          <View style={styles.imageContainer}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Users size={40} color="#9CA3AF" />
                <Text style={styles.placeholderText}>No image selected</Text>
              </View>
            )}
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.actionButton} onPress={simulateCapture}>
              <Camera size={20} color="#5271FF" />
              <Text style={styles.actionButtonText}>Capture</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <Upload size={20} color="#5271FF" />
              <Text style={styles.actionButtonText}>Upload</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.recognizeButton,
              (!selectedImage || recognizing) && styles.disabledButton
            ]}
            onPress={recognizeFaces}
            disabled={!selectedImage || recognizing}
          >
            <UserCheck size={20} color="#FFFFFF" />
            <Text style={styles.recognizeButtonText}>
              {recognizing ? 'Recognizing...' : 'Recognize Faces'}
            </Text>
          </TouchableOpacity>
          
          {recognizedStudents.length > 0 && (
            <View style={styles.recognizedContainer}>
              <Text style={styles.recognizedTitle}>Recognized Students</Text>
              {recognizedStudents.map((student) => (
                <View key={student.id} style={styles.studentItem}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentId}>ID: {student.id}</Text>
                  </View>
                  <Text style={styles.confidence}>{student.confidence}%</Text>
                </View>
              ))}
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
              
              <TouchableOpacity style={styles.quickActionButton}>
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
});