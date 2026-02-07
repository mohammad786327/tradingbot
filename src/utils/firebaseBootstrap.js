
import { doc, getDoc, setDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { initializeRolePermissions } from './rolePermissionsDefaults';

/**
 * Checks if a user document exists in Firestore and creates one if it doesn't.
 * 
 * SECURITY NOTE:
 * This function only stores public profile information (email, name, role).
 * PASSWORDS ARE NEVER STORED IN FIRESTORE.
 * Passwords are managed securely and exclusively by Firebase Authentication.
 * 
 * @param {string} uid - Firebase Auth User UID
 * @param {string} email - User email
 * @param {string} name - User display name
 */
export const checkAndCreateUserDocument = async (uid, email, name) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Determine role: First user is Admin, others are Viewers
      const usersRef = collection(db, 'users');
      const q = query(usersRef, limit(1));
      const querySnapshot = await getDocs(q);
      const isFirstUser = querySnapshot.empty;
      
      const role = isFirstUser ? 'Admin' : 'Viewer';

      // Define standard user document structure
      const userData = {
        uid,
        email,
        name: name || email.split('@')[0],
        role,
        status: 'Active',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
        // Note: No sensitive auth data (like password hashes) is stored here.
      };

      await setDoc(userRef, userData);
      return userData;
    } else {
      // Update last login
      await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
      return userSnap.data();
    }
  } catch (error) {
    console.error("Error creating user document:", error);
    throw error;
  }
};

export const checkAndCreateSettings = async (uid) => {
  try {
    const settingsRef = doc(db, 'settings', uid);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      const defaultSettings = {
        theme: 'dark',
        soundEnabled: true,
        soundVolume: 50,
        selectedSound: 'bell',
        notifications: {
          email: true,
          browser: true
        },
        updatedAt: new Date().toISOString()
      };

      await setDoc(settingsRef, defaultSettings);
    }
  } catch (error) {
    console.error("Error creating settings document:", error);
  }
};

export const bootstrap = async (user) => {
  if (!user) return;

  try {
    // 1. Initialize global role permissions if missing
    await initializeRolePermissions();

    // 2. Ensure user document exists (without sensitive data)
    await checkAndCreateUserDocument(user.uid, user.email, user.displayName);

    // 3. Ensure user settings exist
    await checkAndCreateSettings(user.uid);
    
    console.log("Firebase bootstrap completed successfully");
  } catch (error) {
    console.error("Firebase bootstrap failed:", error);
  }
};
