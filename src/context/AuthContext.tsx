import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  logOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User,
  setCachedGoogleAccessToken,
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

// Default CloMec administrator identity eliminating the need for a password login gate
export const defaultCloMecAdmin: User = {
  uid: 'clomec-admin-user',
  email: 'manutencaolaminor@gmail.com',
  displayName: 'CloMec Metalmecânica',
  emailVerified: true,
  isAnonymous: false,
  metadata: {} as any,
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
  photoURL: null,
  providerId: 'firebase',
};

const AuthContext = createContext<AuthContextType>({
  user: defaultCloMecAdmin,
  loading: false,
  isAdmin: true,
  loginGoogle: async () => {},
  loginEmail: async () => {},
  sendPasswordReset: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultCloMecAdmin);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(defaultCloMecAdmin);
        setCachedGoogleAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    try {
      const loggedUser = await signInWithGoogle();
      setUser(loggedUser);
    } catch (err) {
      console.warn('Google sign in error:', err);
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
    } catch (err: any) {
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
        email.toLowerCase().trim() === 'manutencaolaminor@gmail.com'
      ) {
        try {
          const newRes = await createUserWithEmailAndPassword(auth, email, pass);
          setUser(newRes.user);
          return;
        } catch {
          throw err;
        }
      }
      throw err;
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const signOutUser = async () => {
    try {
      await logOut();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    // Maintain direct operational access for CloMec administrator
    setUser(defaultCloMecAdmin);
  };

  // Operational admin is always enabled for CloMec system
  const isAdmin = true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        loginGoogle,
        loginEmail,
        sendPasswordReset,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
