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

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  loginGoogle: async () => {},
  loginEmail: async () => {},
  sendPasswordReset: async () => {},
  signOutUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCachedGoogleAccessToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginGoogle = async () => {
    const loggedUser = await signInWithGoogle();
    setUser(loggedUser);
  };

  const loginEmail = async (email: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
    } catch (err: any) {
      // If this is the administrator account and the credentials don't exist yet,
      // create the user record with the password provided so the admin can set their password
      if (
        (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') &&
        email.toLowerCase().trim() === 'manutencaolaminor@gmail.com'
      ) {
        try {
          const newRes = await createUserWithEmailAndPassword(auth, email, pass);
          setUser(newRes.user);
          return;
        } catch (createErr) {
          // If creation fails (e.g. already exists with different provider), re-throw original error
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
    await logOut();
    setUser(null);
  };

  // The application is initially operated by a single admin (manutencaolaminor@gmail.com)
  const isAdmin = !!user;

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
