// ═══════════════════════════════════════════════════════════════
// DATABASE — the only file that talks to Firestore
//
// SHARING RULE (very simple):
//   - Owner saves data → Firestore document ID = "main"
//   - Share link = yoursite.com/?gift=main
//   - Panther opens link → reads "main" from Firestore
//   - Works on ANY device. No localStorage. No account state.
// ═══════════════════════════════════════════════════════════════
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SiteData } from '../types';

const DOC_ID = 'main'; // the single Firestore document that holds everything

export async function loadData(): Promise<SiteData | null> {
  try {
    const snap = await getDoc(doc(db, 'forpanther', DOC_ID));
    if (snap.exists()) {
      console.log('✅ Firestore: data loaded');
      return snap.data() as SiteData;
    }
    console.warn('⚠️ Firestore: no document found');
    return null;
  } catch (e) {
    console.error('❌ Firestore load error:', e);
    return null;
  }
}

export async function saveData(data: SiteData): Promise<boolean> {
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
