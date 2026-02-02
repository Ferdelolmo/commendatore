import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
  });
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsGuest(false);
        setAuthState({
          isAuthenticated: true,
          role: 'admin',
          userEmail: session.user.email
        });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsGuest(false);
        setAuthState({
          isAuthenticated: true,
          role: 'admin',
          userEmail: session.user.email
        });
      } else if (!isGuest) {
        setAuthState({
          isAuthenticated: false,
          role: null,
          userEmail: null
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [isGuest]);

  // Effect to handle guest state updates
  useEffect(() => {
    if (isGuest) {
      setAuthState({
        isAuthenticated: true,
        role: 'coordinator',
        userEmail: null
      });
    } else {
      // If not guest and no session (handled by auth listener), verified there.
      supabase.auth.getSession().then(({ data: { session } }) => {
        setAuthState({
          isAuthenticated: !!session,
          role: session ? 'admin' : null,
          userEmail: session?.user.email || null
        });
      });
    }
  }, [isGuest]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) return false;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials');
      return false;
    }

    setIsGuest(false);
    toast.success('Welcome back!');
    return true;
  };

  const loginAsGuest = () => {
    setIsGuest(true);
  };

  const logout = async () => {
    if (isGuest) {
      setIsGuest(false);
    } else {
      await supabase.auth.signOut();
    }
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, loginAsGuest, logout }}>
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
