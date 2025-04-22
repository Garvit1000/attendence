import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// This is a replacement for the Camera component that uses ImagePicker as a workaround
export default function CameraView({ onCapture, onClose }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Launch camera immediately when component mounts
    launchCamera();
  }, []);

  const launchCamera = async () => {
    setLoading(true);
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        // No permissions - show UI to let user close
        setLoading(false);
        return;
      }
      
      // Open camera directly
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (result.canceled) {
        // User canceled - close the view
        onClose();
        return;
      }
      
      // Process the captured image
      const photo = result.assets[0];
      const resizedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      // Pass back to parent component
      onCapture(resizedPhoto);
    } catch (error) {
      console.error("Camera error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.message}>
          {loading 
            ? "Opening camera..." 
            : "Camera permission denied. Please grant camera access in your device settings."}
        </Text>
        
        {!loading && (
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0'
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333'
  },
  button: {
    backgroundColor: '#5271FF',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
}); 