
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { bootstrap } from '@/utils/firebaseBootstrap';

const FirebaseAuthContext = createContext();

export const useAuth = () => {
  const context = useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useAuth must be used within FirebaseAuthProvider');
  }
  return context;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    console.log("Initializing Auth Listener...");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log("Auth State: User Logged In", firebaseUser.email);
        setUser(firebaseUser);
        
        // Trigger bootstrap to ensure DB docs exist
        try {
          await bootstrap(firebaseUser);
        } catch (e) {
          console.error("Bootstrap failed:", e);
        }
      } else {
        console.log("Auth State: No User");
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful:", userCredential.user.email);
      await bootstrap(userCredential.user);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Login failed:", error);
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email, password, name) => {
    setAuthError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // Explicitly create user doc and settings immediately
      await bootstrap({ ...userCredential.user, displayName: name });
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Signup failed:", error);
      const errorMessage = formatAuthError(error);
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  const formatAuthError = (error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'Email is already registered.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      default:
        return error.message || 'An authentication error occurred.';
    }
  };

  const value = {
    user,
    loading,
    error: authError,
    isAuthenticated: !!user,
    login,
    signUp,
    logout
  };

  return (
    <FirebaseAuthContext.Provider value={value}>
      {children}
    </FirebaseAuthContext.Provider>
  );
};
