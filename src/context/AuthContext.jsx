/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Auth Context
 * ============================================================
 * Manages Firebase Authentication state across the entire app.
 *
 * Provides:
 *  - user         → Firebase User object (null if not signed in)
 *  - loading      → true while Firebase is checking auth state
 *  - signInWithGoogle() → Triggers Google OAuth popup
 *  - signOut()    → Signs out and clears state
 *
 * HOW IT WORKS:
 *  Firebase Auth persists sessions in IndexedDB. When the app
 *  loads, onAuthStateChanged fires once with the current user
 *  (or null). This hook listens to that stream indefinitely,
 *  so if the token expires or the user signs out in another tab,
 *  the state updates automatically everywhere.
 * ============================================================
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import toast from 'react-hot-toast';

// ── Firebase Web SDK initialization ─────────────────────────
// initializeApp is safe to call multiple times — it checks if
// the app is already initialized (important for HMR in development).
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Only initialize if no Firebase apps exist yet
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const googleProvider = new GoogleAuthProvider();

// ── Add Google OAuth scopes ──────────────────────────────────
// 'profile' and 'email' are included by default.
// Add more scopes if needed (e.g., Google Calendar):
// googleProvider.addScope('https://www.googleapis.com/auth/calendar');

// ── Create the context ───────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider component ───────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until Firebase resolves

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    // Cleanup: unsubscribe when the component unmounts
    return () => unsubscribe();
  }, []);

  /**
   * signInWithGoogle
   * Opens a Google sign-in popup. On success, Firebase automatically
   * updates the auth state, triggering onAuthStateChanged above.
   */
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to Aegis! 🚀');
    } catch (error) {
      // User closed the popup — not really an error
      if (error.code === 'auth/popup-closed-by-user') {
        toast('Sign-in cancelled.', { icon: '👋' });
        return;
      }

      console.error('[Auth] Google sign-in failed:', error);
      toast.error('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * signOut
   * Signs out from Firebase. onAuthStateChanged fires with null,
   * which sets user → null and triggers the ProtectedRoute redirect.
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully.');
    } catch (error) {
      console.error('[Auth] Sign-out failed:', error);
      toast.error('Sign-out failed.');
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    // Expose the Firebase auth instance for components that need it
    auth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Custom hook ──────────────────────────────────────────────
/**
 * useAuth
 * Returns the auth context. Must be used inside <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
