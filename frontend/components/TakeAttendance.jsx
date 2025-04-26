import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Check, X } from 'lucide-react-native';
import CameraView from './CameraView';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import geminiService from '../services/geminiService';
import { useAttendance } from '@/hooks/useAttendance';

// Backend API URL - replace with your actual backend URL
const API_URL = 'http://localhost:5000/api';

export default function TakeAttendance({ onSuccess }) {
  const { user } = useAuth();
  const { getStudents, markAttendance } = useAttendance();
  const [students, setStudents] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load students when the component mounts
    const loadStudents = async () => {
      try {
        const studentsList = await getStudents();
        setStudents(studentsList);
      } catch (error) {
        console.error('Failed to load students:', error);
      }
    };
    
    loadStudents();
  }, []);

  const handleCapture = (photo) => {
    setPhotoUri(photo.uri);
    setShowCamera(false);
    processAttendance(photo.uri);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      processAttendance(result.assets[0].uri);
    }
  };

  const processAttendance = async (imageUri) => {
    setProcessing(true);
    try {
      // Use Gemini service to recognize students
      const result = await geminiService.recognizeStudents(imageUri, students);
      
      if (result && result.detectedStudents) {
        // Show initial recognition message
        if (result.detectedStudents.length > 0) {
          alert(`Successfully recognized ${result.detectedStudents.length} students in the image!`);
        }
        
        // Format the response to match the expected structure and ensure it has unique IDs
        const formattedStudents = result.detectedStudents.map((student, index) => {
          // Find matching student in database by ID
          const dbStudent = students.find(s =>
            s.studentId === student.studentId ||
            s.id === student.id ||
            s.id === student.studentId ||
            s.studentId === student.id
          );
          
          const formattedStudent = {
            // Use database ID if found, otherwise create a unique ID
            id: dbStudent?.id || student.id || `temp-id-${index}`,
            name: dbStudent?.name || student.name,
            studentId: dbStudent?.studentId || student.studentId || student.id,
            confidence: student.confidence || 0.8
          };
          
          // Show immediate recognition alert
          alert(`✅ Recognized Student!\nName: ${formattedStudent.name}\nID: ${formattedStudent.studentId}`);
          
          return formattedStudent;
        });
        
        setRecognizedStudents(formattedStudents);
        
        if (formattedStudents.length === 0) {
          alert('No students recognized in the photo. Try taking another photo with better lighting and positioning.');
        }
      } else {
        throw new Error('Failed to process attendance: Invalid response from Gemini');
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      alert('Failed to process attendance: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const saveAttendance = async () => {
    if (recognizedStudents.length === 0) {
      alert('No students detected to mark attendance');
      return;
    }

    setSaving(true);
    try {
      // Format the attendance data for saving
      const attendanceData = {
        teacherId: user.uid,
        students: recognizedStudents.map(student => ({
          id: student.id,
          studentId: student.studentId || student.id,
          name: student.name,
          confidence: student.confidence || 0.8
        })),
        date: new Date().toISOString(),
        className: 'Class Session', // You might want to make this configurable
        createdAt: new Date().toISOString()
      };
      
      console.log("[TakeAttendance] Saving attendance to Firebase:", attendanceData);
      
      // First, try to save attendance via the useAttendance hook (which uses Firebase)
      try {
        const result = await markAttendance(new Date(), recognizedStudents);
        console.log("[TakeAttendance] Successfully saved attendance to Firebase:", result);
        alert(`Attendance saved successfully for ${recognizedStudents.length} students`);
        
        // Clear state and call success callback
        setPhotoUri(null);
        setRecognizedStudents([]);
        onSuccess?.();
        return;
      } catch (firebaseError) {
        console.error("[TakeAttendance] Error saving to Firebase:", firebaseError);
        // Continue to try the API method
      }
      
      // Fallback to API if Firebase fails
      console.log("[TakeAttendance] Trying to save via API");
      // Try to use the backend API to save the attendance records
      const response = await axios.post(`${API_URL}/save-attendance`, attendanceData);
      
      if (response.data.success) {
        console.log("[TakeAttendance] Successfully saved via API");
        // Save individual records for each student to make querying easier
        await Promise.all(recognizedStudents.map(async (student) => {
          try {
            await axios.post(`${API_URL}/save-student-attendance`, {
              teacherId: user.uid,
              studentId: student.studentId || student.id,
              date: new Date().toISOString(),
              present: true
            });
          } catch (err) {
            console.error('[TakeAttendance] Error saving individual student record:', err);
            // Continue with other students even if one fails
          }
        }));
        
        alert(`Attendance saved successfully for ${recognizedStudents.length} students`);
        
        // Clear state and call success callback
        setPhotoUri(null);
        setRecognizedStudents([]);
        onSuccess?.();
      } else {
        throw new Error(response.data.message || 'Failed to save attendance');
      }
    } catch (error) {
      console.error('[TakeAttendance] Error saving attendance:', error);
      
      // Fallback to manual Firebase save if both methods above fail
      try {
        console.log("[TakeAttendance] Attempting direct Firebase save as final fallback");
        const { db } = await import('../config/firebase');
        const { collection, addDoc, Timestamp } = await import('firebase/firestore');
        
        // Create the main attendance record
        const attendanceCollection = collection(db, 'attendance');
        const attendanceDoc = {
          teacherId: user.uid,
          students: recognizedStudents.map(student => ({
            id: student.id,
            studentId: student.studentId || student.id,
            name: student.name,
            present: true,
            confidence: student.confidence || 0.8
          })),
          date: Timestamp.fromDate(new Date()),
          className: 'Class Session',
          createdAt: Timestamp.now()
        };
        
        // Add the class-wide attendance record
        const docRef = await addDoc(attendanceCollection, attendanceDoc);
        console.log("[TakeAttendance] Successfully saved attendance to Firebase directly:", docRef.id);
        
        // Create individual student attendance records for easier querying
        const studentAttendanceCollection = collection(db, 'studentAttendance');
        await Promise.all(recognizedStudents.map(student => {
          const studentAttendanceDoc = {
            teacherId: user.uid,
            studentId: student.studentId || student.id,
            studentName: student.name,
            date: Timestamp.fromDate(new Date()),
            present: true,
            className: 'Class Session',
            attendanceRecordId: docRef.id,
            createdAt: Timestamp.now()
          };
          
          return addDoc(studentAttendanceCollection, studentAttendanceDoc);
        }));
        
        alert(`Attendance saved successfully for ${recognizedStudents.length} students`);
        setPhotoUri(null);
        setRecognizedStudents([]);
        onSuccess?.();
      } catch (firebaseError) {
        console.error('[TakeAttendance] All saving methods failed. Final error:', firebaseError);
        alert('Failed to save attendance: ' + error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (showCamera) {
    return (
      <CameraView 
        onCapture={handleCapture}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Take Attendance</Text>
          
          {photoUri ? (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <TouchableOpacity 
            style={styles.retakeButton}
            onPress={() => setShowCamera(true)}
          >
            <Text style={styles.buttonText}>Retake Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cameraOptions}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => setShowCamera(true)}
          >
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>OR</Text>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={pickImage}
          >
            <Text style={styles.buttonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}

      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#5271FF" />
          <Text style={styles.processingText}>Processing classroom photo with Gemini AI...</Text>
        </View>
      ) : recognizedStudents.length > 0 ? (
       <View style={styles.mainContainer}>
         <View style={[styles.recognitionContainer, { marginBottom: 8 }]}>
           <Text style={styles.recognitionTitle}>Recently Recognized Students:</Text>
           {recognizedStudents.map((student, index) => (
             <Text key={index} style={styles.recognitionText}>
               • {student.name || 'Unknown'} (ID: {student.studentId || 'N/A'})
             </Text>
           ))}
         </View>

         <Text style={styles.sectionTitle}>
           Recognized Students ({recognizedStudents.length})
         </Text>
         
         {recognizedStudents.map((item) => (
           <View
             key={(item.id || item.studentId || `temp-${Math.random()}`).toString()}
             style={styles.studentItem}
           >
             <View style={styles.studentInfo}>
               <Text style={styles.studentName}>Name: {item.name || 'Unknown'}</Text>
               <Text style={styles.studentId}>Student ID: {item.studentId || 'N/A'}</Text>
             </View>
             <View style={styles.confidenceContainer}>
               <Text style={styles.confidenceLabel}>Match</Text>
               <Text style={styles.confidence}>
                 {Math.round(item.confidence * 100)}%
               </Text>
             </View>
           </View>
         ))}
       </View>
      ) : photoUri ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            No students recognized in the photo. Try taking another photo with better lighting and positioning.
          </Text>
          </View>
        ) : null}
        </View>
      </ScrollView>
      {recognizedStudents.length > 0 && (
        <View style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveAttendance}
            disabled={saving}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Saving...' : 'Save Attendance Record'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  cameraOptions: {
    marginVertical: 20,
  },
  cameraButton: {
    backgroundColor: '#5271FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  orText: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#6B7280',
  },
  galleryButton: {
    backgroundColor: '#4B5563',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoContainer: {
    marginVertical: 20,
  },
  photoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  processingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  mainContainer: {
    marginBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
    color: '#1A1A1A',
  },
  studentsList: {
    marginBottom: 16,
  },
  studentsListContent: {
    paddingBottom: 16,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderRadius: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  studentId: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  confidence: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    backgroundColor: '#5271FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  recognitionContainer: {
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  recognitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  recognitionText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 24,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 