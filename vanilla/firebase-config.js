import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

// File uploads (photos/songs/voice notes) go through Cloudinary now, not
// Firebase Storage — see db.js. Firestore is still Firebase, just data.
const firebaseConfig = {
  apiKey: "AIzaSyDZJ5NCrX_9b7kPPSMCaXNlm26OqIHNvPA",
  authDomain: "for-panther.firebaseapp.com",
  projectId: "for-panther",
  messagingSenderId: "114281816146",
  appId: "1:114281816146:web:0d44cbe5a4a8aeed523f8b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
