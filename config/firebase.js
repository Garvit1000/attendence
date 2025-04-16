import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoJekua988BHMf92kkwjFWf91hfSC9NNA",
  authDomain: "open-cv-bafbf.firebaseapp.com",
  projectId: "open-cv-bafbf",
  storageBucket: "open-cv-bafbf.firebasestorage.app",
  messagingSenderId: "854095030580",
  appId: "1:854095030580:web:078dbc0ae02fad1249dd61"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };
