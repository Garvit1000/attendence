import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAttendance } from '../hooks/useAttendance';
import CameraView from './CameraView';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import geminiService from '../services/geminiService';
import { useAuth } from '@/hooks/useAuth';

// Backend API URL - replace with your actual backend URL
const API_URL = 'http://localhost:5000/api';

export default function RegisterStudent({ onSuccess }) {
  const { registerStudent } = useAttendance();
  const { user } = useAuth();
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    studentId: ''
  });
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validatingFace, setValidatingFace] = useState(false);
  const [faceValid, setFaceValid] = useState(null);

  const handleCapture = async (photo) => {
    try {
      setPhotoUri(photo.uri);
      setShowCamera(false);
      validateFace(photo.uri);
    } catch (error) {
      console.error('Error processing photo:', error);
      Alert.alert('Error', 'Failed to process photo');
    }
  };

  const validateFace = async (uri) => {
    setValidatingFace(true);
    setFaceValid(null);
    
    try {
      // Use Gemini service to validate the face
      const result = await geminiService.validateFace(uri);
      
      if (result.success) {
        setFaceValid(result.faceDetected);
        
        if (!result.faceDetected) {
          Alert.alert(
            'No Face Detected', 
            'We couldn\'t detect a clear face in the image. Please take another photo with a clearer view of your face.'
          );
        }
      } else {
        throw new Error(result.message || 'Failed to validate face');
      }
    } catch (error) {
      console.error('Face validation error:', error);
      Alert.alert('Validation Error', 'Could not validate the face image. Please try again.');
      setFaceValid(false);
    } finally {
      setValidatingFace(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      validateFace(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!studentData.name || !studentData.email || !studentData.studentId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Please take a photo first');
      return;
    }
    
    if (faceValid === false) {
      Alert.alert('Error', 'The photo does not contain a valid face. Please take another photo.');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('faceImage', {
        uri: photoUri,
        name: 'face.jpg',
        type: 'image/jpeg'
      });
      formData.append('name', studentData.name);
      formData.append('email', studentData.email);
      formData.append('studentId', studentData.studentId);
      formData.append('teacherId', user.uid);
      
      // First, try the backend API
      try {
        // Make API request to register student using the backend
        const response = await axios.post(`${API_URL}/register-student`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.data.success) {
          Alert.alert('Success', 'Student registered successfully');
          setPhotoUri(null);
          setStudentData({
            name: '',
            email: '',
            studentId: ''
          });
          setFaceValid(null);
          onSuccess?.();
          return;
        }
      } catch (apiError) {
        console.warn('Backend API failed, falling back to frontend registration:', apiError);
      }
      
      // If backend fails, fall back to the frontend registration
      try {
        console.log("[RegisterStudent] Creating file object from URI:", photoUri);
        // Create a file object from the URI
        const response = await fetch(photoUri);
        const blob = await response.blob();
        
        // Convert blob to File object
        const photoFile = new Blob([blob], { type: 'image/jpeg' });
        photoFile.name = 'student-photo.jpg';
        
        console.log("[RegisterStudent] File object created, size:", photoFile.size);
        console.log("[RegisterStudent] Registering student with data:", JSON.stringify(studentData, null, 2));
        
        // Register the student using frontend registerStudent method
        await registerStudent(studentData, photoFile);
        
        Alert.alert('Success', 'Student registered successfully');
        setPhotoUri(null);
        setStudentData({
          name: '',
          email: '',
          studentId: ''
        });
        setFaceValid(null);
        onSuccess?.();
      } catch (frontendError) {
        console.error("[RegisterStudent] Frontend registration error details:", frontendError);
        throw frontendError;
      }
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Error', error.message || 'Failed to register student');
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Register New Student</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Student Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={studentData.name}
            onChangeText={text => setStudentData({ ...studentData, name: text })}
          />
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            value={studentData.email}
            onChangeText={text => setStudentData({ ...studentData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Text style={styles.label}>Student ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter student ID"
            value={studentData.studentId}
            onChangeText={text => setStudentData({ ...studentData, studentId: text })}
          />

          <Text style={styles.label}>Student Photo</Text>
          {photoUri ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              
              {validatingFace && (
                <View style={styles.validatingContainer}>
                  <ActivityIndicator size="large" color="#5271FF" />
                  <Text style={styles.validatingText}>Validating face with Gemini AI...</Text>
                </View>
              )}
              
              {faceValid === true && (
                <View style={styles.validFaceContainer}>
                  <Text style={styles.validFaceText}>✓ Valid face detected</Text>
                </View>
              )}
              
              <View style={styles.photoButtons}>
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => setShowCamera(true)}
                >
                  <Text style={styles.buttonText}>Take Another Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.galleryButton}
                  onPress={pickImage}
                >
                  <Text style={styles.buttonText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => setShowCamera(true)}
              >
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickImage}
              >
                <Text style={styles.buttonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton, 
              (!photoUri || loading || validatingFace || faceValid === false) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!photoUri || loading || validatingFace || faceValid === false}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Registering...' : 'Register Student'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1A1A1A',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#4B5563',
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  photoButtons: {
    marginVertical: 16,
  },
  cameraButton: {
    backgroundColor: '#5271FF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  galleryButton: {
    backgroundColor: '#4B5563',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoContainer: {
    marginTop: 8,
    marginBottom: 24,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  validatingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  validatingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  validFaceContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
    alignItems: 'center',
  },
  validFaceText: {
    color: '#10B981',
    fontWeight: '600',
  },
  retakeButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#5271FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 