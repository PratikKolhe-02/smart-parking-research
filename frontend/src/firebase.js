// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// YOUR KEYS
const firebaseConfig = {
  apiKey: "AIzaSyB7LVx6JWG_EreCxc2KI_M6KQnHqZXCdw8",
  authDomain: "smart-parking-6f3dc.firebaseapp.com",
  projectId: "smart-parking-6f3dc",
  storageBucket: "smart-parking-6f3dc.firebasestorage.app",
  messagingSenderId: "182559317714",
  appId: "1:182559317714:web:72af8da154b156168f970b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  signInWithPopup(auth, provider).catch((error) => {
    console.error("Login Failed:", error);
  });
};

export const logout = () => {
  signOut(auth);
};