import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnOMLIGMymh6t91Go1b9HP4HcYjY_qTH4",
  authDomain: "qrcodescamdetector.firebaseapp.com",
  projectId: "qrcodescamdetector",
  storageBucket: "qrcodescamdetector.firebasestorage.app",
  messagingSenderId: "194938568519",
  appId: "1:194938568519:web:86ea1ac770eb6372c61662",
  measurementId: "G-47B3E3KT0H"
};
// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services without persistence
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Export the initialized services
export { auth, db };
