import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'owner' | 'organizer' | 'user';
  avatarUrl: string | null;
  gymId?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isOrganizer: boolean;
  canPublishEvents: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Profile loader ────────────────────────────────────────────────────────────

interface ProfileRow { role: string; name: string | null; avatar_url: string | null }

async function fetchProfile(userId: string, retries = 4): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from('profiles')
    .select('role, name, avatar_url')
    .eq('id', userId)
    .single();

  // Trigger may not have run yet right after OAuth redirect — retry briefly
  if (!data && retries > 0) {
    await new Promise((r) => setTimeout(r, 400));
    return fetchProfile(userId, retries - 1);
  }
  return data as ProfileRow | null;
}

function buildUser(session: Session, profile: ProfileRow | null): AuthUser {
  const meta = session.user.user_metadata ?? {};
  return {
    id:        session.user.id,
    email:     session.user.email ?? '',
    name:      profile?.name ?? meta.name ?? meta.full_name ?? session.user.email ?? '',
    role:      (profile?.role ?? 'user') as AuthUser['role'],
    avatarUrl: profile?.avatar_url ?? meta.avatar_url ?? null,
    gymId:     meta.gym_id ?? null,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Warm up from existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser(buildUser(session, profile));
        setToken(session.access_token);
      }
      setLoading(false);
    });

    // React to login / logout / token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id);
        setUser(buildUser(session, profile));
        setToken(session.access_token);
      } else {
        setUser(null);
        setToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth actions ─────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const register = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
  };

  const signInWithGoogle = async () => {
    const isNative = !!(window as unknown as { Capacitor?: { isNative?: boolean } }).Capacitor?.isNative;

    const redirectTo = isNative
      ? 'com.bjjspain.finder://auth/callback'
      : `${window.location.origin}/auth/callback`;

    if (isNative) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw new Error(error.message);
      if (data.url) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: data.url });
      }
    } else {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (error) throw new Error(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, signInWithGoogle, logout,
      isAdmin:           user?.role === 'admin',
      isOwner:           user?.role === 'owner',
      isOrganizer:       user?.role === 'organizer',
      canPublishEvents:  ['organizer', 'owner', 'admin'].includes(user?.role ?? ''),
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
