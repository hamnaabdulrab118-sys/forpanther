import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDZJ5NCrX_9b7kPPSMCaXNlm26OqIHNvPA",
  authDomain: "for-panther.firebaseapp.com",
  projectId: "for-panther",
  storageBucket: "for-panther.firebasestorage.app",
  messagingSenderId: "114281816146",
  appId: "1:114281816146:web:0d44cbe5a4a8aeed523f8b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
