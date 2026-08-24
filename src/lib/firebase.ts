import { initializeAppCheck, AppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  measurementId: firebaseConfigJson.measurementId,
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);

export let appCheck: AppCheck | null = null;
export let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  try {
    const siteKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch(e) { console.warn("App Check failed to initialize", e); }
}

// Initialize analytics if supported in the browser environment
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Use custom firestore database if configured
export const db: Firestore = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);


export {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
};
export type { Unsubscribe };
