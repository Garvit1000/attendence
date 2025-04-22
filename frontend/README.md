# Attendance System with Face Recognition

This application uses facial recognition to automate classroom attendance. Teachers take a photo of the class, and the system automatically identifies students and marks them present.

## Features

- User authentication for teachers and students
- Student registration with facial recognition
- Automated attendance tracking using facial recognition
- Attendance reports and history
- Mobile-friendly UI

## Tech Stack

### Frontend
- React Native / Expo
- Expo Camera for photo capture
- Firebase Authentication
- Axios for API requests

### Backend
- Python Flask API
- OpenCV and face_recognition library for facial detection and recognition
- MongoDB for storing student data and attendance records

## Setup Instructions

### Prerequisites
- Node.js and npm
- Python 3.8+ with pip
- MongoDB
- Firebase account

### Frontend Setup

1. Clone the repository
```
git clone https://github.com/yourusername/attendance-system.git
cd attendance-system
```

2. Install dependencies
```
npm install
```

3. Create a Firebase project and update the Firebase configuration in `config/firebase.js`

4. Update the API URL in the following files to point to your backend server:
   - `app/(app)/teacher/take-attendance.jsx`
   - `app/(app)/teacher/register-student.jsx`

5. Start the development server
```
npm start
```

### Backend Setup

1. Navigate to the backend directory
```
cd backend
```

2. Create a virtual environment
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies
```
pip install -r requirements.txt
```

4. Create a `.env` file based on the provided example

5. Start the Flask server
```
flask run
```

## Usage

1. Teachers create accounts and log in
2. Register students with their photos
3. Take class photos to automatically mark attendance
4. View attendance reports

## Face Recognition Process

1. **Student Registration**: Each student's face is captured and stored as encodings
2. **Attendance Taking**: Teachers capture a photo of the class
3. **Face Detection**: OpenCV detects faces in the image
4. **Face Recognition**: System compares detected faces with registered students
5. **Attendance Marking**: Students with matching faces are marked present

## License

MIT 