import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: '***REMOVED***',
  authDomain: '***REMOVED***.firebaseapp.com',
  projectId: '***REMOVED***',
  storageBucket: '***REMOVED***.firebasestorage.app',
  messagingSenderId: '***REMOVED***',
  appId: '1:***REMOVED***:web:d52cd068c4a2fd870a8145',
};

// Firebase初期化
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
