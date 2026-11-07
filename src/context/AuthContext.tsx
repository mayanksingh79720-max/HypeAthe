import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';
import { FirestoreUserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: FirestoreUserProfile | null;
  loading: boolean;
  actionLoading: boolean;
  authError: string | null;
  clearAuthMessages: () => void;
  signInWithGoogle: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  updateProfileData: (data: Partial<FirestoreUserProfile>) => Promise<void>;
  isGoogleAuthenticated: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FirestoreUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const clearAuthMessages = () => {
    setAuthError(null);
  };

  // Helper to sync user profile with Firestore
  const syncFirestoreProfile = async (firebaseUser: User): Promise<FirestoreUserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      const now = new Date().toISOString();

      if (userDocSnap.exists()) {
        const existingData = userDocSnap.data() as FirestoreUserProfile;
        await updateDoc(userDocRef, {
          updatedAt: now,
          email: firebaseUser.email || existingData.email,
          displayName: firebaseUser.displayName || existingData.displayName || 'Athlete',
          photoURL: firebaseUser.photoURL || existingData.photoURL || ''
        });
        const updated: FirestoreUserProfile = {
          ...existingData,
          displayName: firebaseUser.displayName || existingData.displayName || 'Athlete',
          photoURL: firebaseUser.photoURL || existingData.photoURL || '',
          updatedAt: now
        };
        setProfile(updated);
        return updated;
      } else {
        const newProfile: FirestoreUserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'Athlete',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || '',
          createdAt: now,
          updatedAt: now,
          preferredUnits: 'km',
          privacySettings: {
            profilePublic: true,
            shareActivities: true
          }
        };

        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('Could not sync user profile in Firestore:', err);
      // Fallback local profile if offline or restricted
      const fallback: FirestoreUserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Athlete',
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferredUnits: 'km',
        privacySettings: {
          profilePublic: true,
          shareActivities: true
        }
      };
      setProfile(fallback);
      return fallback;
    }
  };

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncFirestoreProfile(currentUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Google Sign-In with popup
  const signInWithGoogle = async (): Promise<boolean> => {
    setActionLoading(true);
    clearAuthMessages();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      await syncFirestoreProfile(result.user);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        return false;
      }
      console.warn('Google Sign-In Notice:', error?.code || error?.message);
      const msg = error?.message || 'Google authentication could not be completed. Please try again.';
      setAuthError(msg);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // Sign Out
  const signOutUser = async (): Promise<void> => {
    setActionLoading(true);
    clearAuthMessages();
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthError(error.message || 'Failed to sign out.');
    } finally {
      setActionLoading(false);
    }
  };

  // Update Profile Data
  const updateProfileData = async (data: Partial<FirestoreUserProfile>): Promise<void> => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updated = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, updated, { merge: true });
      setProfile(prev => (prev ? { ...prev, ...updated } : null));
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        actionLoading,
        authError,
        clearAuthMessages,
        signInWithGoogle,
        signOutUser,
        updateProfileData,
        isGoogleAuthenticated: Boolean(user),
        showAuthModal,
        setShowAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
