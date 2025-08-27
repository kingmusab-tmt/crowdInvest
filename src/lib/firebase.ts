
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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
