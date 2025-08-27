// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
const db = getFirestore(app);

export { app, db };
