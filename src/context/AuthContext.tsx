import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'gym_owner' | 'organizer' | 'user';
  gymId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isOrganizer: boolean;
  canPublishEvents: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapUser(supabaseUser: User): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: meta.name ?? supabaseUser.email ?? '',
    role: meta.role ?? 'user',
    gymId: meta.gym_id ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Warm up from existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(mapUser(session.user));
        setToken(session.access_token);
      }
      setLoading(false);
    });

    // Keep in sync with Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? mapUser(session.user) : null);
      setToken(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: 'user' } },
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, logout,
      isAdmin: user?.role === 'admin',
      isOwner: user?.role === 'gym_owner',
      isOrganizer: user?.role === 'organizer',
      canPublishEvents: ['organizer', 'gym_owner', 'admin'].includes(user?.role ?? ''),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
