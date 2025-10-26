// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDFqU6ldwyhYnD1DFGBohkR4p1B2yy3rK4",
  authDomain: "it-portal-aa1f7.firebaseapp.com",
  projectId: "it-portal-aa1f7",
  storageBucket: "it-portal-aa1f7.firebasestorage.app",
  messagingSenderId: "24322635718",
  appId: "1:24322635718:web:017f2d8e047b5224f6a4c7",
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const auth = getAuth(app);