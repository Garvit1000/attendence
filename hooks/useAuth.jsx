import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase'; // Import Firebase config

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase user object
  const [userData, setUserData] = useState(null); // User data from Firestore
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("Setting up onAuthStateChanged listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[Auth State Change] Started. Firebase User UID:", firebaseUser?.uid);
      setIsLoading(true); // Set loading true at the start of handling change
      if (firebaseUser) {
        console.log("[Auth State Change] User is signed IN. Fetching Firestore data...");
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const fetchedData = userDocSnap.data();
            console.log("[Auth State Change] Firestore data FOUND:", fetchedData);
            setUserData(fetchedData);
          } else {
            // This case might happen if signup Firestore write failed previously
            console.warn("[Auth State Change] Firestore data NOT FOUND for UID:", firebaseUser.uid);
            setUserData(null); 
          }
        } catch (error) {
          // Check for permissions error specifically
          if (error.code === 'permission-denied') {
             console.error("[Auth State Change] Firestore Permission Error: Check Firestore Rules for reading '/users/", firebaseUser.uid, "'", error);
          } else {
             console.error("[Auth State Change] Error fetching user data from Firestore:", error);
          }
          setUserData(null);
        }
        setUser(firebaseUser); // Set the Firebase user object
      } else {
        // User is signed out
        console.log("[Auth State Change] User is signed OUT.");
        setUser(null);
        setUserData(null);
      }
      console.log("[Auth State Change] Finished processing. Setting loading to false.");
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
        console.log("Cleaning up onAuthStateChanged listener.");
        unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    console.log("[Login] Attempting login for:", email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("[Login] Success. User UID:", userCredential.user.uid);
      // onAuthStateChanged should handle the rest
      return userCredential.user; 
    } catch (error) {
      console.error('[Login] Failed:', error.message, error.code);
      throw error; // Rethrow for UI handling
    }
  };

  const signup = async (name, email, password, role) => {
    console.log("[Signup] Attempting signup for:", email, " Name:", name, " Role:", role);
    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("[Signup] Auth user created successfully. UID:", firebaseUser.uid);

      // 2. Store additional user data in Firestore
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
      
      try {
          await setDoc(userDocRef, newUser);
          console.log("[Signup] Firestore user data SAVED successfully.");
      } catch (firestoreError) {
          console.error("[Signup] FAILED to save user data to Firestore:", firestoreError.message, firestoreError.code);
          // Optionally: delete the auth user if firestore write fails? (complex recovery)
          // await firebaseUser.delete(); 
          // console.log("[Signup] Deleted Auth user due to Firestore failure.");
          throw new Error("Failed to save user details after signup. " + firestoreError.message); // Throw specific error
      }
      
      // 3. Manually set state immediately after successful signup + Firestore write
      console.log("[Signup] Manually setting user state locally.");
      setUser(firebaseUser);
      setUserData(newUser);

      return firebaseUser;
    } catch (error) {
      // Catch errors from Auth creation OR the re-thrown Firestore error
      console.error('[Signup] Failed:', error.message);
      throw error; // Rethrow for UI handling
    }
  };

  const logout = async () => {
    console.log("[Logout] Attempting Firebase signOut...");
    try {
      await signOut(auth);
      console.log("[Logout] Firebase signOut successful. onAuthStateChanged should handle state clearing.");
      // State clearing (setUser(null), setUserData(null)) is now handled by onAuthStateChanged listener
    } catch (error) {
      console.error('[Logout] Firebase signOut failed:', error.message, error.code);
      throw error; // Rethrow for profile screen handling
    }
  };

  // UpdateProfile remains the same as the previous version with logging

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
  
  // Combine Firebase user and Firestore data for consumers
  const combinedUser = user ? { ...user, ...userData } : null; 

  // Add a log to see when the context value changes
  // console.log("[AuthProvider] Rendering with isLoading:", isLoading, "Combined User:", combinedUser);

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
