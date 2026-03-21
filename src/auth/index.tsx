'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '../utils/supabase/client';
import type { User } from '@supabase/supabase-js';

// Re-export what the app expects
export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const AuthContext = createContext<UserHookResult | undefined>(undefined);

export function SupabaseClientProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const value = useMemo(() => ({ user, isUserLoading: loading, userError: null }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useUser = (): UserHookResult => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a SupabaseClientProvider');
  }
  return context;
};

// Dummy hook for compatibility with older code while we transition
export const useAuth = () => {
  return createClient().auth;
};

export const useFirestore = () => {
  return null; // We are removing firestore, this will break if still used but we will remove it where needed.
}
