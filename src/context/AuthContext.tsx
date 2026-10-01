import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updatePassword,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  limit,
  query
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  setupInitialAdmin: (name: string, email: string, pass: string) => Promise<void>;
  hasAnyUsers: boolean;
  checkHasUsers: () => Promise<boolean>;
  createUserByAdmin: (name: string, email: string, pass: string, role: UserRole) => Promise<{ success: boolean; mode: string; message: string }>;
  changeMyPassword: (newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAnyUsers, setHasAnyUsers] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (currentUser) {
      inactivityTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  };

  const handleAutoLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setAppUser(null);
      alert('You have been logged out due to 30 minutes of inactivity.');
    } catch (err) {
      console.error('Auto logout error:', err);
    }
  };

  // Activity listeners for 30 min idle timer
  useEffect(() => {
    if (!currentUser) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    resetInactivityTimer();
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [currentUser]);

  const checkHasUsers = async (): Promise<boolean> => {
    try {
      const q = query(collection(db, 'users'), limit(1));
      const snap = await getDocs(q);
      const exists = !snap.empty;
      setHasAnyUsers(exists);
      return exists;
    } catch (err) {
      console.warn('Error checking existing users:', err);
      return true;
    }
  };

  const fetchAppUserProfile = async (user: FirebaseUser): Promise<AppUser | null> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const data = userSnap.data() as AppUser;
        return { ...data, uid: user.uid };
      }
      return null;
    } catch (err) {
      console.error('Error fetching user role:', err);
      return null;
    }
  };

  useEffect(() => {
    checkHasUsers();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await fetchAppUserProfile(user);
        setAppUser(profile);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const profile = await fetchAppUserProfile(cred.user);
    if (!profile) {
      // If user doc doesn't exist, sign out
      await signOut(auth);
      throw new Error('Your user profile has not been assigned a role by the Admin. Please contact Admin.');
    }
    setAppUser(profile);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    let profile = await fetchAppUserProfile(cred.user);
    if (!profile) {
      const userEmail = cred.user.email?.toLowerCase();

      // Check if user was pre-authorized by Admin under /users by their email
      const usersSnap = await getDocs(collection(db, 'users'));
      let matchedUserDoc: AppUser | null = null;
      let matchedDocId: string | null = null;
      usersSnap.forEach((docSnap) => {
        const u = docSnap.data() as AppUser;
        if (u.email && u.email.toLowerCase() === userEmail) {
          matchedUserDoc = u;
          matchedDocId = docSnap.id;
        }
      });

      if (matchedUserDoc) {
        // Link pre-authorized user to their Firebase Auth UID
        const matched = matchedUserDoc as AppUser;
        profile = {
          ...matched,
          uid: cred.user.uid,
          name: matched.name || cred.user.displayName || 'Partner',
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        if (matchedDocId && matchedDocId !== cred.user.uid) {
          try {
            await deleteDoc(doc(db, 'users', matchedDocId));
          } catch (_) {}
        }
      } else {
        // Check if this is the first user or matches owner's email
        const isFirst = !(await checkHasUsers());
        const isOwnerEmail = userEmail === 'anandharajanbu7@gmail.com';
        if (isFirst || isOwnerEmail) {
          profile = {
            uid: cred.user.uid,
            name: cred.user.displayName || 'Admin',
            email: cred.user.email || '',
            role: 'admin',
            createdAt: new Date().toISOString(),
            createdBy: 'Google Sign-In Initial Admin',
          };
          await setDoc(doc(db, 'users', cred.user.uid), profile);
          setHasAnyUsers(true);
        } else {
          await signOut(auth);
          throw new Error('Your email is not authorized by the Admin. Please ask the Admin to add your email in Settings.');
        }
      }
    }
    setAppUser(profile);
  };

  const logout = async () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    await signOut(auth);
    setCurrentUser(null);
    setAppUser(null);
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // First time setup - first user becomes Admin
  const setupInitialAdmin = async (name: string, email: string, pass: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const adminProfile: AppUser = {
      uid: cred.user.uid,
      name: name.trim(),
      email: email.trim(),
      role: 'admin',
      createdAt: new Date().toISOString(),
      createdBy: 'Self Setup',
    };
    await setDoc(doc(db, 'users', cred.user.uid), adminProfile);
    setAppUser(adminProfile);
    setHasAnyUsers(true);
  };

  // Admin creating another user without losing their current admin session!
  const createUserByAdmin = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole
  ): Promise<{ success: boolean; mode: string; message: string }> => {
    if (!appUser || appUser.role !== 'admin') {
      throw new Error('Only Admin can create users.');
    }

    const secondaryAppName = `AdminCreateUser_${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    let authUserCreated = false;
    let newUid: string | null = null;

    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), pass);
      newUid = cred.user.uid;
      authUserCreated = true;
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
    } catch (err: any) {
      try {
        await deleteApp(secondaryApp);
      } catch (_) {}

      // If Email/Password provider is disabled in Firebase Console:
      if (err.code === 'auth/operation-not-allowed') {
        // Authorize user in Firestore directly!
        const newDocRef = doc(collection(db, 'users'));
        const newUserDoc: AppUser = {
          uid: newDocRef.id,
          name: name.trim(),
          email: email.trim(),
          role,
          createdAt: new Date().toISOString(),
          createdBy: appUser.name,
        };
        await setDoc(newDocRef, newUserDoc);
        return {
          success: true,
          mode: 'pre_authorized',
          message: `User "${name}" (${email.trim()}) authorized as ${role.toUpperCase()}! They can now log in instantly via "Continue with Google". (To enable email+password login, turn on Email/Password in Firebase Console).`,
        };
      }
      throw err;
    }

    if (newUid) {
      const newUserDoc: AppUser = {
        uid: newUid,
        name: name.trim(),
        email: email.trim(),
        role,
        createdAt: new Date().toISOString(),
        createdBy: appUser.name,
      };
      await setDoc(doc(db, 'users', newUid), newUserDoc);
      return {
        success: true,
        mode: 'auth_created',
        message: `User "${name}" (${email.trim()}) created successfully as ${role.toUpperCase()}! They can now log in.`,
      };
    }

    return {
      success: true,
      mode: 'created',
      message: `User "${name}" created successfully.`,
    };
  };

  const changeMyPassword = async (newPass: string) => {
    if (!currentUser) throw new Error('Not logged in');
    await updatePassword(currentUser, newPass);
  };

  const role = appUser?.role;
  const isAdmin = role === 'admin';
  const isPartner = role === 'partner';
  const isViewer = role === 'viewer';

  // Role permissions:
  // Admin: can add, edit, delete everything, open settings
  // Partner: can add and edit works, expenses, drivers, machine care (cannot delete, cannot open settings)
  // Viewer: read-only
  const canEdit = isAdmin || isPartner;
  const canDelete = isAdmin;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        appUser,
        loading,
        isAdmin,
        isPartner,
        isViewer,
        canEdit,
        canDelete,
        login,
        loginWithGoogle,
        logout,
        sendResetEmail,
        setupInitialAdmin,
        hasAnyUsers,
        checkHasUsers,
        createUserByAdmin,
        changeMyPassword,
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
