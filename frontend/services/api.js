import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Update this with your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Teacher API endpoints
export const teacherApi = {
  // Process attendance from class photo
  processAttendance: async (formData) => {
    try {
      const response = await api.post('/process-attendance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to process attendance' };
    }
  },

  // Register a new student
  registerStudent: async (formData) => {
    try {
      const response = await api.post('/register-student', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to register student' };
    }
  },

  // Save attendance records
  saveAttendance: async (data) => {
    try {
      const response = await api.post('/save-attendance', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to save attendance' };
    }
  },

  // Get attendance history
  getAttendanceHistory: async (teacherId) => {
    try {
      const response = await api.get(`/attendance-history/${teacherId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attendance history' };
    }
  },

  // Get student list
  getStudents: async (teacherId) => {
    try {
      const response = await api.get(`/students/${teacherId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch students' };
    }
  },
};

export default api; 