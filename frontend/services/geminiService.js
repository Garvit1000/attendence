import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with the API key from environment variables
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to convert an image to base64
const imageToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Content = base64data.split(',')[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Function to detect faces in an image
export const detectFaces = async (imageUri) => {
  try {
    const base64Image = await imageToBase64(imageUri);
    
    // Get the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prepare the prompt
    const prompt = "Analyze this image and detect all faces. For each face, determine its position in the image (top, bottom, left, right coordinates as percentages of image dimensions). Return the data in JSON format with an array called 'faces' containing objects with coordinates for each face.";
    
    // Create image part for the request
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    
    // Generate content with the image
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    // The response might contain markdown code blocks, so we need to extract just the JSON part
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
      return JSON.parse(jsonString);
    } else {
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    }
  } catch (error) {
    console.error('Error in detectFaces:', error);
    throw error;
  }
};

// Function to recognize students in a class photo
export const recognizeStudents = async (imageUri, registeredStudents) => {
  try {
    const base64Image = await imageToBase64(imageUri);
    
    // Get the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Create a more detailed prompt with student information for accurate recognition
    let studentPrompt = "I need to identify students in this classroom photo based on a database of registered students. Here are the registered students' details:\n\n";
    
    // Create a detailed student list with all available information
    registeredStudents.forEach((student, index) => {
      studentPrompt += `Student ${index + 1}:\n`;
      studentPrompt += `- ID: ${student.studentId || student.id}\n`;
      studentPrompt += `- Name: ${student.name}\n`;
      if (student.email) studentPrompt += `- Email: ${student.email}\n`;
      studentPrompt += '\n';
    });
    
    studentPrompt += "\nAnalyze the class photo and identify which registered students are present. For each recognized student, ALWAYS include both their ID (matching exactly with one of the IDs I provided) and name. Return the data in JSON format with an array called 'detectedStudents' containing objects with these properties for each recognized student:\n";
    studentPrompt += "- id: The student's ID that EXACTLY matches one from my list\n";
    studentPrompt += "- studentId: Same as id, for compatibility\n";
    studentPrompt += "- name: The student's name\n";
    studentPrompt += "- confidence: A value between 0 and 1 indicating recognition confidence\n";
    
    // Create image part for the request
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    
    // Generate content with the image
    const result = await model.generateContent([studentPrompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    
    let parsedResult;
    if (jsonMatch) {
      const jsonString = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
      parsedResult = JSON.parse(jsonString);
    } else {
      try {
        parsedResult = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    }
    
    // Ensure each detected student has proper ID matching with database
    if (parsedResult && parsedResult.detectedStudents) {
      // Create a lookup map for faster student matching
      const studentMap = {};
      registeredStudents.forEach(student => {
        const studentId = student.studentId || student.id;
        if (studentId) {
          studentMap[studentId.toString()] = student;
        }
        // Also map by name for fallback matching
        if (student.name) {
          studentMap[student.name.toLowerCase()] = student;
        }
      });
      
      // Process detected students with better matching
      parsedResult.detectedStudents = parsedResult.detectedStudents.map(detected => {
        // Standardize ID handling
        let detectedId = detected.id || detected.studentId;
        
        // Try to find exact match by ID
        if (detectedId && studentMap[detectedId.toString()]) {
          const dbStudent = studentMap[detectedId.toString()];
          return {
            id: dbStudent.id,
            studentId: dbStudent.studentId || dbStudent.id,
            name: dbStudent.name,
            confidence: detected.confidence || 0.85
          };
        }
        
        // If no ID match, try name match as fallback
        if (detected.name && studentMap[detected.name.toLowerCase()]) {
          const dbStudent = studentMap[detected.name.toLowerCase()];
          return {
            id: dbStudent.id,
            studentId: dbStudent.studentId || dbStudent.id,
            name: dbStudent.name,
            confidence: detected.confidence || 0.7 // Lower confidence for name-only matches
          };
        }
        
        // If still no match, try fuzzy name matching (comparing lowercase and trimmed)
        if (detected.name) {
          const normalizedDetectedName = detected.name.toLowerCase().trim();
          for (const student of registeredStudents) {
            if (student.name && student.name.toLowerCase().trim() === normalizedDetectedName) {
              return {
                id: student.id,
                studentId: student.studentId || student.id,
                name: student.name,
                confidence: detected.confidence || 0.6 // Even lower confidence for fuzzy matches
              };
            }
          }
        }
        
        // If we get here, we couldn't reliably match this student to our database
        // Just return the detected data with a flag
        return {
          ...detected,
          id: detected.id || detected.studentId || `unknown-${Math.random().toString(36).substring(7)}`,
          matchConfidence: 'low',
          confidence: detected.confidence || 0.5
        };
      });
    } else {
      // If no detectedStudents property exists, initialize with empty array
      parsedResult = parsedResult || {};
      parsedResult.detectedStudents = [];
    }
    
    return parsedResult;
  } catch (error) {
    console.error('Error in recognizeStudents:', error);
    throw error;
  }
};

// Function to compare a face with registered students
export const validateFace = async (faceImageUri) => {
  try {
    const base64Image = await imageToBase64(faceImageUri);
    
    // Get the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prepare the prompt
    const prompt = "Analyze this image and determine if there is a clear, well-lit face suitable for recognition. Check if: 1) A single face is present and centered, 2) The face is well-lit and in focus, 3) The face is looking directly at the camera. Return a JSON with 'faceDetected' (boolean), 'qualityScore' (0-1), and 'message' explaining the result.";
    
    // Create image part for the request
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ];
    
    // Generate content with the image
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*?}/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1];
      return {
        success: true,
        ...JSON.parse(jsonString)
      };
    } else {
      try {
        return {
          success: true,
          ...JSON.parse(text)
        };
      } catch (e) {
        console.error('Failed to parse Gemini response:', text);
        throw new Error('Invalid response format from Gemini');
      }
    }
  } catch (error) {
    console.error('Error in validateFace:', error);
    throw error;
  }
};

export default {
  detectFaces,
  recognizeStudents,
  validateFace
}; 