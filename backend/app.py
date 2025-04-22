from flask import Flask, request, jsonify
import numpy as np
import cv2
import face_recognition
import os
import json
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid
import pymongo
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'attendance_system')

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Set up storage directories
UPLOAD_FOLDER = 'uploads'
STUDENT_FACES_FOLDER = os.path.join(UPLOAD_FOLDER, 'student_faces')
CLASS_PHOTOS_FOLDER = os.path.join(UPLOAD_FOLDER, 'class_photos')

# Create directories if they don't exist
os.makedirs(STUDENT_FACES_FOLDER, exist_ok=True)
os.makedirs(CLASS_PHOTOS_FOLDER, exist_ok=True)

# Configure Flask app
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit to 16MB

# Helper function to save uploaded images
def save_uploaded_file(file, folder):
    if not file:
        return None
    
    filename = secure_filename(file.filename)
    # Create unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{uuid.uuid4().hex}_{filename}"
    
    filepath = os.path.join(folder, unique_filename)
    file.save(filepath)
    return filepath

# Process face detection
def detect_face(image_path):
    """Detect faces in the image and return face locations."""
    try:
        logger.info(f"Detecting faces in {image_path}")
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Failed to read image at {image_path}")
            return False, [], None
            
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Find all faces in the image
        face_locations = face_recognition.face_locations(rgb_image)
        
        logger.info(f"Found {len(face_locations)} faces in {image_path}")
        return len(face_locations) > 0, face_locations, rgb_image
    except Exception as e:
        logger.error(f"Error detecting face: {str(e)}")
        return False, [], None

# Extract face encoding
def get_face_encoding(image_path):
    """Get face encoding from an image."""
    has_face, face_locations, rgb_image = detect_face(image_path)
    
    if not has_face:
        return None
    
    # Get the first face encoding
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
    
    if face_encodings:
        return face_encodings[0].tolist()
    
    return None

# API route for validating face in photo
@app.route('/api/validate-face', methods=['POST'])
def validate_face():
    try:
        logger.info("Validating face")
        if 'faceImage' not in request.files:
            return jsonify({"success": False, "message": "No image uploaded"}), 400
        
        file = request.files['faceImage']
        if file.filename == '':
            return jsonify({"success": False, "message": "No image selected"}), 400
        
        temp_path = save_uploaded_file(file, app.config['UPLOAD_FOLDER'])
        
        has_face, face_locations, _ = detect_face(temp_path)
        
        # Additional validation - check face size and quality
        quality_score = 0
        if has_face and face_locations:
            # Get the first face location
            top, right, bottom, left = face_locations[0]
            face_width = right - left
            face_height = bottom - top
            
            # Check if face is big enough (at least 100x100 pixels)
            if face_width >= 100 and face_height >= 100:
                quality_score += 0.5
                
            # Calculate center of the image
            image = cv2.imread(temp_path)
            img_height, img_width = image.shape[:2]
            img_center_x = img_width // 2
            img_center_y = img_height // 2
            
            # Calculate face center
            face_center_x = (left + right) // 2
            face_center_y = (top + bottom) // 2
            
            # Check if face is centered
            x_distance = abs(face_center_x - img_center_x) / img_width
            y_distance = abs(face_center_y - img_center_y) / img_height
            
            if x_distance < 0.2 and y_distance < 0.2:
                quality_score += 0.5
        
        # Delete temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return jsonify({
            "success": True,
            "faceDetected": has_face,
            "qualityScore": quality_score if has_face else 0,
            "message": "Face detected successfully" if has_face else "No face detected in the image"
        })
    
    except Exception as e:
        logger.error(f"Error in validate_face: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# API route for registering a student
@app.route('/api/register-student', methods=['POST'])
def register_student():
    try:
        logger.info("Registering new student")
        if 'faceImage' not in request.files:
            return jsonify({"success": False, "message": "No face image uploaded"}), 400
        
        # Get form data
        name = request.form.get('name')
        email = request.form.get('email')
        student_id = request.form.get('studentId')
        teacher_id = request.form.get('teacherId')
        
        if not all([name, email, student_id]):
            return jsonify({"success": False, "message": "Missing required fields"}), 400
        
        file = request.files['faceImage']
        if file.filename == '':
            return jsonify({"success": False, "message": "No image selected"}), 400
        
        # Save the face image
        face_image_path = save_uploaded_file(file, STUDENT_FACES_FOLDER)
        
        # Extract face encoding
        face_encoding = get_face_encoding(face_image_path)
        
        if face_encoding is None:
            # Delete the saved image if no face was detected
            if os.path.exists(face_image_path):
                os.remove(face_image_path)
            return jsonify({"success": False, "message": "No face detected in the image"}), 400
        
        # Check if student with this ID already exists
        existing_student = db.students.find_one({"studentId": student_id})
        if existing_student:
            # Update existing student
            db.students.update_one(
                {"studentId": student_id},
                {"$set": {
                    "name": name,
                    "email": email,
                    "teacherId": teacher_id,
                    "faceImagePath": face_image_path,
                    "faceEncoding": face_encoding,
                    "updatedAt": datetime.now()
                }}
            )
            return jsonify({
                "success": True,
                "studentId": student_id,
                "message": "Student updated successfully"
            })
        
        # Store student data in MongoDB
        student_data = {
            "name": name,
            "email": email,
            "studentId": student_id,
            "teacherId": teacher_id,
            "faceImagePath": face_image_path,
            "faceEncoding": face_encoding,
            "createdAt": datetime.now()
        }
        
        result = db.students.insert_one(student_data)
        
        return jsonify({
            "success": True,
            "studentId": student_id,
            "message": "Student registered successfully"
        })
    
    except Exception as e:
        logger.error(f"Error in register_student: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# API route for processing class attendance
@app.route('/api/process-attendance', methods=['POST'])
def process_attendance():
    try:
        logger.info("Processing attendance")
        if 'classPhoto' not in request.files:
            return jsonify({"success": False, "message": "No class photo uploaded"}), 400
        
        # Get form data
        teacher_id = request.form.get('teacherId')
        class_name = request.form.get('className', 'Default Class')
        
        if not teacher_id:
            return jsonify({"success": False, "message": "Teacher ID is required"}), 400
        
        file = request.files['classPhoto']
        if file.filename == '':
            return jsonify({"success": False, "message": "No image selected"}), 400
        
        # Save the class photo
        class_photo_path = save_uploaded_file(file, CLASS_PHOTOS_FOLDER)
        
        # Detect faces in the class photo
        has_faces, face_locations, rgb_image = detect_face(class_photo_path)
        
        if not has_faces:
            return jsonify({"success": True, "detectedStudents": [], "message": "No faces detected in the image"})
        
        # Get face encodings for all detected faces
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        # Get all registered students for this teacher
        students = list(db.students.find({"teacherId": teacher_id}))
        
        # Convert ObjectId to string for JSON serialization
        for student in students:
            student['_id'] = str(student['_id'])
        
        # Check each detected face against registered students
        detected_students = []
        
        for face_encoding in face_encodings:
            best_match = None
            best_confidence = 0
            
            for student in students:
                # Skip students without face encodings
                if 'faceEncoding' not in student or not student['faceEncoding']:
                    continue
                
                # Compare face encodings
                student_encoding = np.array(student['faceEncoding'])
                face_distances = face_recognition.face_distance([student_encoding], face_encoding)
                
                # Convert distance to confidence (1 - distance)
                confidence = 1 - float(face_distances[0])
                
                # Consider it a match if confidence is above threshold
                if confidence > 0.6 and confidence > best_confidence:
                    best_confidence = confidence
                    best_match = student
            
            if best_match:
                # Check if student is already in detected_students
                is_duplicate = False
                for detected in detected_students:
                    if detected["id"] == best_match["_id"]:
                        # Keep the detection with higher confidence
                        if best_confidence > detected["confidence"]:
                            detected["confidence"] = best_confidence
                        is_duplicate = True
                        break
                
                if not is_duplicate:
                    detected_students.append({
                        "id": best_match["_id"],
                        "name": best_match["name"],
                        "studentId": best_match["studentId"],
                        "confidence": best_confidence
                    })
        
        # Sort by confidence
        detected_students.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Save this processed attendance to a temporary collection for retrieval
        attendance_data = {
            "teacherId": teacher_id,
            "className": class_name,
            "classPhotoPath": class_photo_path,
            "processedAt": datetime.now(),
            "detectedStudents": detected_students,
            "totalFaces": len(face_locations)
        }
        
        # Store in a temp collection that expires after 1 hour
        db.temp_attendance.insert_one(attendance_data)
        
        return jsonify({
            "success": True,
            "detectedStudents": detected_students,
            "totalFaces": len(face_locations),
            "matchedFaces": len(detected_students),
            "classPhotoPath": class_photo_path
        })
    
    except Exception as e:
        logger.error(f"Error in process_attendance: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# API route for saving attendance records
@app.route('/api/save-attendance', methods=['POST'])
def save_attendance():
    try:
        logger.info("Saving attendance")
        data = request.json
        
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400
        
        teacher_id = data.get('teacherId')
        students = data.get('students', [])
        date = data.get('date', datetime.now().isoformat())
        
        if not teacher_id:
            return jsonify({"success": False, "message": "Teacher ID is required"}), 400
        
        # Convert date string to datetime object
        if isinstance(date, str):
            date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        
        # Create attendance record
        attendance_record = {
            "teacherId": teacher_id,
            "date": date,
            "createdAt": datetime.now(),
            "students": []
        }
        
        # Process student attendance
        for student in students:
            attendance_record["students"].append({
                "studentId": student["id"],
                "name": student["name"],
                "confidence": student["confidence"]
            })
        
        # Save attendance record to database
        result = db.attendance.insert_one(attendance_record)
        
        return jsonify({
            "success": True,
            "attendanceId": str(result.inserted_id),
            "message": f"Attendance saved for {len(students)} students"
        })
    
    except Exception as e:
        logger.error(f"Error in save_attendance: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# API route for getting students by teacher
@app.route('/api/students/<teacher_id>', methods=['GET'])
def get_students(teacher_id):
    try:
        logger.info(f"Getting students for teacher {teacher_id}")
        students = list(db.students.find({"teacherId": teacher_id}))
        
        # Convert ObjectId to string for JSON serialization
        for student in students:
            student['_id'] = str(student['_id'])
            # Remove the large face encoding from the response
            if 'faceEncoding' in student:
                del student['faceEncoding']
        
        return jsonify({
            "success": True,
            "students": students
        })
    
    except Exception as e:
        logger.error(f"Error in get_students: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# API route for getting attendance records
@app.route('/api/attendance/<teacher_id>', methods=['GET'])
def get_attendance(teacher_id):
    try:
        logger.info(f"Getting attendance for teacher {teacher_id}")
        attendance_records = list(db.attendance.find({"teacherId": teacher_id}).sort("date", -1))
        
        # Convert ObjectId to string for JSON serialization
        for record in attendance_records:
            record['_id'] = str(record['_id'])
            record['date'] = record['date'].isoformat()
            record['createdAt'] = record['createdAt'].isoformat()
        
        return jsonify({
            "success": True,
            "attendance": attendance_records
        })
    
    except Exception as e:
        logger.error(f"Error in get_attendance: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 