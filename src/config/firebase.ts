import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJbfe1VLri5dDTSmIykP8tCQhT0kdcryk",
  authDomain: "debt-manager-e671b.firebaseapp.com",
  projectId: "debt-manager-e671b",
  storageBucket: "debt-manager-e671b.firebasestorage.app",
  messagingSenderId: "1021348035171",
  appId: "1:1021348035171:web:9b5a673a480feee1a61656",
  measurementId: "G-PW9JYQVLDP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider for better UX
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;