
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "crowd-invest-835s9",
  "appId": "1:1015186708913:web:350bf70c39bdbd1085c590",
  "storageBucket": "crowd-invest-835s9.firebasestorage.app",
  "apiKey": "AIzaSyB7uWtDRa741techaT0lQ7fuMOJH3cp2qM",
  "authDomain": "crowd-invest-835s9.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1015186708913"
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);

// Initialize Firestore as a singleton
let db: Firestore;

if (typeof window !== 'undefined') {
  // Client-side
  db = initializeFirestore(app, {});
  try {
    enableIndexedDbPersistence(db);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const errorCode = (error as { code: string }).code;
      if (errorCode == 'failed-precondition') {
        console.warn('Firebase persistence failed: Multiple tabs open');
      } else if (errorCode == 'unimplemented') {
        console.warn('Firebase persistence failed: Browser does not support it');
      }
    } else {
      console.error('An unexpected error occurred with Firebase persistence:', error);
    }
  }
} else {
  // Server-side
  db = getFirestore(app);
}


export { app, db, auth };
