// ═══════════════════════════════════════════════════════════════
// DATABASE — the only file that talks to Firestore
//
// SHARING RULE (very simple):
//   - Owner saves data → Firestore document ID = "main"
//   - Share link = yoursite.com/?gift=main
//   - Panther opens link → reads "main" from Firestore
//   - Works on ANY device. No localStorage. No account state.
// ═══════════════════════════════════════════════════════════════
import { db, auth, storage } from './firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js';

const DOC_ID = 'main';

// Called once the owner types the correct PIN. Firestore rules require
// request.auth != null to write, so this is what unlocks saving.
export async function signInOwner() {
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
    return true;
  } catch (e) {
    console.error('❌ Firebase auth error:', e);
    return false;
  }
}

export async function loadData() {
  try {
    const snap = await getDoc(doc(db, 'forpanther', DOC_ID));
    if (snap.exists()) {
      console.log('✅ Firestore: data loaded');
      return snap.data();
    }
    console.warn('⚠️ Firestore: no document found');
    return null;
  } catch (e) {
    console.error('❌ Firestore load error:', e);
    return null;
  }
}

// Background music files are too big for a Firestore document (1MB doc
// limit), so they go to Firebase Storage instead — only the small download
// URL gets stored in Firestore.
export async function uploadMusicFile(file) {
  const path = `music/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function saveData(data) {
  try {
    await setDoc(doc(db, 'forpanther', DOC_ID), {
      ...data,
      savedAt: new Date().toISOString(),
    });
    console.log('✅ Firestore: data saved');
    return true;
  } catch (e) {
    console.error('❌ Firestore save error:', e);
    return false;
  }
}
