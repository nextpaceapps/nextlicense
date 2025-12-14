import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { setDevLoginState } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDevLogin: boolean;
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
  const [isDevLogin, setIsDevLogin] = useState(false);

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
          setIsDevLogin(false); // Reset dev login when Firebase user is present
          setDevLoginState(false); // Update API client
        } else {
          setUser(null);
          setIsDevLogin(false);
          setDevLoginState(false); // Update API client
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginDev = () => {
    // Dev login only available in development on localhost
    const isProduction = import.meta.env.PROD;
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname === '';
    
    if (isProduction || !isLocalhost) {
      console.warn('Dev login is only available in development on localhost');
      return;
    }
    
    setIsDevLogin(true);
    setDevLoginState(true); // Update API client dev login state
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
      setIsDevLogin(false);
      setDevLoginState(false); // Update API client
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isDevLogin, loginDev, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
