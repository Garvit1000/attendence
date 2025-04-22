# Attendance Management System with Gemini AI Integration

This project is an attendance management system that uses Google's Gemini AI for face detection and recognition instead of traditional face recognition libraries.

## Why Gemini AI?

The traditional face recognition libraries like `dlib` and `face_recognition` have compatibility issues with Python 3.12. Instead of downgrading Python, we've integrated Google's Gemini AI, which provides powerful computer vision capabilities through its API.

## Setup

### Backend

The backend is built with Flask and provides APIs for storing and retrieving attendance records. It uses MongoDB for data storage.

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend

The frontend is built with React Native and Expo. It integrates with Gemini AI for face recognition.

```bash
cd frontend
npm install
```

### Gemini API Setup

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add your API key to `frontend/.env`:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Running the Application

### Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python app.py
```

### Frontend
```bash
cd frontend
npx expo start
```

## Features

- **Student Registration**: Register students with their names, IDs, and facial images
- **Face Detection**: Validate that uploaded photos contain valid faces using Gemini AI
- **Attendance Taking**: Take classroom photos and use Gemini AI to recognize students
- **Attendance Records**: View and manage attendance records

## How It Works

1. **Face Validation**: When registering a student, the system uses Gemini AI to validate that the photo contains a clear face.
2. **Student Recognition**: When taking attendance, the system captures a photo of the classroom and sends it to Gemini AI, which identifies students based on their registered faces.
3. **Attendance Records**: The system records attendance data and provides reports.

## Architecture

The system has a dual architecture:
- **Backend API**: Flask server that handles data storage and retrieval using MongoDB
- **Frontend AI Processing**: React Native application that integrates with Gemini AI for face detection and recognition

## Limitations

- The accuracy of face recognition depends on the quality of Gemini's vision capabilities
- Need to maintain an active internet connection for AI processing
- Requires a valid Gemini API key with sufficient quota

## Future Improvements

- Implement more sophisticated prompts for Gemini to improve recognition accuracy
- Add face embedding storage for better comparison
- Implement batch processing for large classrooms
- Add offline fallback mechanisms 