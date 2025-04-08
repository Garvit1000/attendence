import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from AsyncStorage on app start
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
        
        // Initialize users array if it doesn't exist
        const usersJson = await AsyncStorage.getItem('users');
        if (!usersJson) {
          // Create some demo users
          const demoUsers = [
            {
              id: '1',
              name: 'Teacher Demo',
              email: 'teacher@example.com',
              password: 'password',
              role: 'teacher',
              createdAt: new Date().toISOString(),
            },
            {
              id: '2',
              name: 'Student Demo',
              email: 'student@example.com',
              password: 'password',
              role: 'student',
              createdAt: new Date().toISOString(),
            }
          ];
          await AsyncStorage.setItem('users', JSON.stringify(demoUsers));
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password, role) => {
    try {
      // In a real app, this would validate against a backend
      // For demo, we'll simulate a successful login
      
      // Check if user exists in our "database"
      const usersJson = await AsyncStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      const foundUser = users.find(u => 
        u.email === email && 
        u.password === password && 
        u.role === role
      );
      
      if (!foundUser) {
        throw new Error('Invalid credentials');
      }
      
      // Remove password from user object before storing in state
      const { password: _, ...userWithoutPassword } = foundUser;
      
      setUser(userWithoutPassword);
      await AsyncStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      // In a real app, this would create a user in a backend
      // For demo, we'll store in AsyncStorage
      
      // Check if user already exists
      const usersJson = await AsyncStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      
      if (users.some(u => u.email === email)) {
        throw new Error('User already exists');
      }
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        role,
        createdAt: new Date().toISOString(),
      };
      
      // Add to users list
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));
      
      // Remove password from user object before storing in state
      const { password: _, ...userWithoutPassword } = newUser;
      
      setUser(userWithoutPassword);
      await AsyncStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      return userWithoutPassword;
    } catch (error) {
      console.error('Signup failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const updateProfile = async (updatedUser) => {
    try {
      // Update in state
      setUser(updatedUser);
      
      // Update in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update in users list
      const usersJson = await AsyncStorage.getItem('users');
      if (usersJson) {
        const users = JSON.parse(usersJson);
        const updatedUsers = users.map(u => 
          u.id === updatedUser.id ? { ...u, ...updatedUser } : u
        );
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      }
    } catch (error) {
      console.error('Profile update failed', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading,
      login,
      signup,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}