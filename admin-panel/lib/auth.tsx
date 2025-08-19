'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { authAPI } from './api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await authAPI.firebaseLogin({ idToken });
          
          // Check if user is admin
          if (response.data.user.role !== 'admin') {
            toast.error('Access denied. Admin privileges required.');
            await signOut(auth);
            setUser(null);
            return;
          }
          
          localStorage.setItem('admin_token', response.data.access_token);
          localStorage.setItem('admin_user', JSON.stringify(response.data.user));
          setUser(response.data.user);
        } catch (error) {
          console.error('Error during Firebase auth:', error);
          setUser(null);
        }
      } else {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Additional check via API to verify admin role
      const idToken = await userCredential.user.getIdToken();
      const response = await authAPI.firebaseLogin({ idToken });
      
      if (response.data.user.role !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
      
      toast.success('Admin login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Additional check via API to verify admin role
      const idToken = await result.user.getIdToken();
      const response = await authAPI.firebaseLogin({ idToken });
      
      if (response.data.user.role !== 'admin') {
        await signOut(auth);
        throw new Error('Access denied. Admin privileges required.');
      }
      
      toast.success('Admin login successful!');
    } catch (error: any) {
      toast.error(error.message || 'Google login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Logout failed');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};