import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "number-push-test.firebaseapp.com",
  projectId: "number-push-test",
  storageBucket: "number-push-test.firebasestorage.app",
  messagingSenderId: "111105349250",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
// Initialize Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app);
