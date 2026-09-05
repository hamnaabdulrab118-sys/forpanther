import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

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
export const auth = getAuth(app);
export const storage = getStorage(app);
