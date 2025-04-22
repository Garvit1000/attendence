import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useAttendance } from '../hooks/useAttendance';

export default function StudentImageUpload({ studentId, studentName }) {
  const { addStudentImage, getStudentImage } = useAttendance();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file');
      }

      // Check file size (max 1MB for Firestore)
      if (file.size > 1024 * 1024) {
        throw new Error('Image size should be less than 1MB');
      }

      await addStudentImage(studentId, file);
      
      // Refresh the image
      const newImage = await getStudentImage(studentId);
      setImage(newImage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load initial image
  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const img = await getStudentImage(studentId);
        setImage(img);
      } catch (err) {
        console.error('Error loading image:', err);
      }
    };
    loadImage();
  }, [studentId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Image: {studentName}</Text>
      
      {image && (
        <Image 
          source={{ uri: image }} 
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <TouchableOpacity 
        style={styles.uploadButton}
        onPress={() => document.getElementById('imageInput').click()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Uploading...' : 'Upload Image'}
        </Text>
      </TouchableOpacity>

      <input
        id="imageInput"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#5271FF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginTop: 10,
  },
}); 