import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
