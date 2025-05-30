
"use client";

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, googleAuthProvider } from '@/lib/firebase';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      toast({ title: "Signed in successfully!" });
      // setLoading(false) will be handled by onAuthStateChanged if sign-in is successful
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      let toastTitle = "Sign In Failed";
      let toastDescription = error.message || "Could not sign in with Google. Please try again.";
      let currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'your application domain';

      if (error.code === 'auth/unauthorized-domain') {
        toastTitle = "Unauthorized Domain";
        toastDescription = `The domain "${currentOrigin}" is not authorized. Please add this exact domain to 'Authorized domains' in your Firebase project (Authentication -> Settings tab) and refresh.`;
      } else if (error.code === 'auth/popup-closed-by-user') {
        toastTitle = "Sign In Cancelled";
        toastDescription = "The sign-in popup was closed before completing the process. If you didn't close it, please check your browser's pop-up blocker settings or try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        toastTitle = "Sign In Interrupted";
        toastDescription = "The sign-in process was interrupted, possibly by another popup or browser action. Please try again.";
      }
      // For any error during sign-in attempt, reset loading state.
      // onAuthStateChanged will handle successful sign-ins.
      setLoading(false);

      toast({
        variant: "destructive",
        title: toastTitle,
        description: toastDescription,
        duration: 9000, 
      });
    }
  };

  const signOutUser = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      toast({ title: "Signed out successfully." });
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: error.message || "Could not sign out. Please try again.",
      });
    } finally {
      // setLoading(false) will be handled by onAuthStateChanged
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
