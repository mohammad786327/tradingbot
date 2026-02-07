
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCaEEwHOOdv3pxgpR_86gntqUB9FEsxPrM",
  authDomain: "tradingbot-5b948.firebaseapp.com",
  projectId: "tradingbot-5b948",
  storageBucket: "tradingbot-5b948.firebasestorage.app",
  messagingSenderId: "1031272974868",
  appId: "1:1031272974868:web:037d57db662e79c8f3b501",
  measurementId: "G-WNB8NVMJDK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
// Note: Persistence can sometimes cause issues in dev with hot reload, but is good for prod
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence not supported by browser');
    }
  });
} catch (e) {
  console.warn("Persistence initialization error:", e);
}

export { auth, db, storage, firebaseConfig };
