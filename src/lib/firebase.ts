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
  setLogLevel,
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
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  (self as any).FIREBASE_APPCHECK_EXECUTE_IN__DEV__ = true;
  try {
    const siteKey = firebaseConfigJson.recaptchaSiteKey || (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && typeof siteKey === 'string' && siteKey.trim().length > 0) {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(siteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  } catch(e) { console.warn("App Check failed to initialize", e); }
}

// Suppress Firestore verbose backend connection warning spam when operating in offline/preview sandbox
setLogLevel('error');

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
