
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with a check for the browser environment for persistence
const db = initializeFirestore(app, {});

if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        if ((error as { code: string }).code == 'failed-precondition') {
            console.warn('Firebase persistence failed: Multiple tabs open');
        } else if ((error as { code: string }).code == 'unimplemented') {
            console.warn('Firebase persistence failed: Browser does not support it');
        }
    } else {
        console.error('An unexpected error occurred with Firebase persistence:', error);
    }
  }
}

export { app, db };
