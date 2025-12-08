import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginDev: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth) {
      // Firebase Auth
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              picture: firebaseUser.photoURL || undefined,
              role: 'ADMIN' // Default to Admin
          });
        } else {
          setUser(null);
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginDev = () => {
    // No more conditional check. Dev login should always work.
    setUser({
      email: 'dev@local.host',
      name: 'Dev Admin',
      role: 'ADMIN',
      picture: 'https://ui-avatars.com/api/?name=Dev+Admin&background=random'
    });
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
        if (window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }
      } else {
        setUser(null);
      }
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, loginDev, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
