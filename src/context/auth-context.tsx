
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
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      let toastTitle = "Sign In Failed";
      let toastDescription = error.message || "Could not sign in with Google. Please try again.";

      if (error.code === 'auth/unauthorized-domain') {
        toastTitle = "Unauthorized Domain";
        let currentOrigin = 'your application domain (e.g., localhost or your-project.firebasestudio.com)';
        if (typeof window !== 'undefined') {
          currentOrigin = window.location.origin;
        }
        toastDescription = `The domain "${currentOrigin}" is not authorized for this Firebase project. Please add this exact domain to the 'Authorized domains' list in your Firebase project settings (Authentication -> Settings tab). After adding, refresh this page.`;
      } else if (error.code === 'auth/popup-closed-by-user') {
        toastTitle = "Sign In Cancelled";
        toastDescription = "The sign-in popup was closed before completing the sign-in process.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        toastTitle = "Sign In Cancelled";
        toastDescription = "Multiple sign-in popups were opened. Please try again.";
      }


      toast({
        variant: "destructive",
        title: toastTitle,
        description: toastDescription,
        duration: 9000, // Give more time to read the detailed message
      });
      setLoading(false);
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
