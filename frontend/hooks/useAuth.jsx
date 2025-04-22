import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // First check AsyncStorage
        const storedUser = await AsyncStorage.getItem('@auth_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (isMounted) {
            setUser(parsedUser);
            
            // Fetch user data from Firestore
            const userDocRef = doc(db, 'users', parsedUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const fetchedData = userDocSnap.data();
              setUserData(fetchedData);
            }
          }
        }
      } catch (error) {
        console.error("[AuthProvider] Error initializing auth:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;
      
      if (firebaseUser) {
        try {
          // Store user in AsyncStorage
          await AsyncStorage.setItem('@auth_user', JSON.stringify(firebaseUser));
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const fetchedData = userDocSnap.data();
            setUserData(fetchedData);
            setUser(firebaseUser);
          } else {
            setUser(null);
            setUserData(null);
            await AsyncStorage.removeItem('@auth_user');
          }
        } catch (error) {
          console.error("[AuthProvider] Error handling auth state change:", error);
          setUser(null);
          setUserData(null);
          await AsyncStorage.removeItem('@auth_user');
        }
      } else {
        setUser(null);
        setUserData(null);
        await AsyncStorage.removeItem('@auth_user');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password, role) => {
    console.log("[Login] Attempting login for:", email, "Role:", role);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Login] Auth success. User UID:", userCredential.user.uid);
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        await signOut(auth);
        throw new Error('User profile not found. Please contact support.');
      }
      
      const userData = userDocSnap.data();
      console.log("[Login] User data from Firestore:", userData);
      
      if (!userData.role) {
        await signOut(auth);
        throw new Error('User role is missing. Please contact support.');
      }
      
      if (userData.role !== role) {
        await signOut(auth);
        throw new Error(`Please login as a ${role}. Your account is registered as a ${userData.role}.`);
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('[Login] Failed:', error.message, error.code);
      throw error;
    }
  };

  const signup = async (name, email, password, role) => {
    console.log("[Signup] Attempting signup for:", email, "Name:", name, "Role:", role);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("[Signup] Auth user created successfully. UID:", firebaseUser.uid);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const newUser = {
        uid: firebaseUser.uid,
        name, 
        email,
        role,
        createdAt: new Date().toISOString(),
      };
      
      console.log("[Signup] Attempting to save user data to Firestore path:", userDocRef.path);
      console.log("[Signup] Data to save:", newUser);
      
      await setDoc(userDocRef, newUser);
      console.log("[Signup] Firestore user data SAVED successfully.");
      
      setUser(firebaseUser);
      setUserData(newUser);

      return firebaseUser;
    } catch (error) {
      console.error('[Signup] Failed:', error.message);
      throw error;
    }
  };

  const logout = async () => {
    console.log("[Logout] Attempting Firebase signOut...");
    try {
      // First clear local state to avoid any race conditions
      setUser(null);
      setUserData(null);
      
      // Clear from AsyncStorage before Firebase logout
      await AsyncStorage.removeItem('@auth_user');
      console.log("[Logout] Cleared user from AsyncStorage");
      
      // Add a short delay to give components time to respond to the user state change
      // before the Firebase logout completes
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Now sign out from Firebase
      await signOut(auth);
      console.log("[Logout] Firebase signOut successful.");
      
      // Return a resolved promise to indicate success
      return Promise.resolve();
    } catch (error) {
      console.error('[Logout] Firebase signOut failed:', error.message, error.code);
      // Even if Firebase logout fails, we should still clear local state
      setUser(null);
      setUserData(null);
      await AsyncStorage.removeItem('@auth_user');
      
      // But we should throw the error for proper handling
      return Promise.reject(error);
    }
  };

  const updateProfile = async (updatedData) => {
    if (!user) {
      console.log("[UpdateProfile] User not logged in, skipping.");
      return; 
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      console.log("[UpdateProfile] Attempting to update Firestore path:", userDocRef.path);
      console.log("[UpdateProfile] Data to merge:", updatedData);
      
      await setDoc(userDocRef, updatedData, { merge: true }); 
      
      console.log("[UpdateProfile] Firestore update successful. Updating local state...");
      setUserData(prevData => {
        const newData = { ...prevData, ...updatedData };
        console.log("[UpdateProfile] New local userData:", newData);
        return newData;
      });

    } catch (error) {
      console.error('[UpdateProfile] Failed to update Firestore:', error.message, error.code);
      throw error;
    }
  };
  
  const combinedUser = user ? { ...user, ...userData } : null; 

  return (
    <AuthContext.Provider value={{ 
      user: combinedUser, 
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
