// ═══════════════════════════════════════════════════════════════
// DATABASE — the only file that talks to Firestore
//
// SHARING RULE (very simple):
//   - Owner saves data → Firestore document ID = "main"
//   - Share link = yoursite.com/?gift=main
//   - Panther opens link → reads "main" from Firestore
//   - Works on ANY device. No localStorage. No account state.
// ═══════════════════════════════════════════════════════════════
import { db, auth } from './firebase-config.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js';
import { signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js';

const DOC_ID = 'main';

// File uploads (photos, songs, voice notes) go to Cloudinary instead of
// Firebase Storage — Storage requires the paid Blaze plan just to create a
// bucket at all, while Cloudinary's free tier (25GB storage/bandwidth, no
// card required) supports unsigned browser-direct uploads out of the box.
// Firestore (all the actual gift data) is unaffected by this.
const CLOUDINARY_CLOUD_NAME = 'qoaudhnb';
const CLOUDINARY_UPLOAD_PRESET = 'forpanther';

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

// A hung upload (blocked request, flaky network, a browser extension
// silently dropping the request, etc.) would otherwise leave the UI
// spinning on "Uploading..." forever with no error and no way out. This
// races the real upload against a timeout so it always settles one way or
// the other within 25s.
function withUploadTimeout(promise, seconds = 25) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(
      `Upload timed out after ${seconds}s — check your internet connection and try again.`
    )), seconds * 1000)),
  ]);
}

// "auto" lets Cloudinary detect image vs audio/video itself, so the same
// endpoint handles photos, songs, and voice notes.
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await withUploadTimeout(fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
    { method: 'POST', body: formData }
  ));
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${errBody || res.statusText}`);
  }
  const data = await res.json();
  return data.secure_url;
}

export async function uploadMusicFile(file) {
  return uploadToCloudinary(file);
}

export async function uploadMixtapeSong(file) {
  return uploadToCloudinary(file);
}

export async function uploadMemoryFile(file, kind) {
  return uploadToCloudinary(file);
}

export async function uploadGalleryPhoto(file) {
  return uploadToCloudinary(file);
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
