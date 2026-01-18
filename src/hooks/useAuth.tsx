/**
 * Auth Context - Skyworth Mundial 2026
 */
import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'seller' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  rolesLoaded: boolean;
  rolesError: string | null;
  roles: UserRole[];
  isAdmin: boolean;
  isSeller: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const AUTH_CONTEXT_KEY = "__SKYWORTH_AUTH_CONTEXT__";
const AuthContext = ((globalThis as any)[AUTH_CONTEXT_KEY] ??
  createContext<AuthContextType | undefined>(undefined)) as ReturnType<typeof createContext<AuthContextType | undefined>>;
(globalThis as any)[AUTH_CONTEXT_KEY] = AuthContext;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);

  const ROLES_TIMEOUT_MS = 8000;

  const fetchRoles = useCallback(async (userId: string): Promise<{ roles: UserRole[]; error: string | null }> => {
    try {
      const { data, error } = await Promise.race([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), ROLES_TIMEOUT_MS)
        ),
      ]);

      if (error) {
        console.error('Error fetching roles:', error);
        return { roles: [], error: `Error al cargar permisos: ${error.message}` };
      }

      return {
        roles: (data?.map((r) => r.role as UserRole)) || [],
        error: null,
      };
    } catch (err) {
      const message =
        err instanceof Error && err.message === 'timeout'
          ? 'Tiempo de espera agotado cargando permisos. Reintenta.'
          : 'Error de conexión al cargar permisos';

      console.error('Error in fetchRoles:', err);
      return { roles: [], error: message };
    }
  }, []);

  const rolesRequestIdRef = useRef(0);

  const loadRolesForUser = useCallback(
    async (userId: string) => {
      const reqId = ++rolesRequestIdRef.current;
      setRolesLoaded(false);
      setRolesError(null);

      const result = await fetchRoles(userId);

      if (rolesRequestIdRef.current !== reqId) return;

      setRoles(result.roles);
      setRolesError(result.error);
      setRolesLoaded(true);
    },
    [fetchRoles]
  );

  const refreshRoles = useCallback(async () => {
    if (!user) return;
    await loadRolesForUser(user.id);
  }, [user, loadRolesForUser]);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      const nextUser = newSession?.user ?? null;
      setUser(nextUser);
      setLoading(false);

      // If signed out, unblock protected routes immediately
      if (!nextUser) {
        setRoles([]);
        setRolesError(null);
        setRolesLoaded(true);
        return;
      }

      // If signed in, (re)load roles.
      setRolesLoaded(false);
      setRolesError(null);

      // IMPORTANT: defer backend calls out of the auth callback
      setTimeout(() => {
        if (!mounted) return;
        void loadRolesForUser(nextUser.id);
      }, 0);
    });

    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(currentSession);
        const nextUser = currentSession?.user ?? null;
        setUser(nextUser);

        if (!nextUser) {
          setRoles([]);
          setRolesError(null);
          setRolesLoaded(true);
        } else {
          setRolesLoaded(false);
          setRolesError(null);
          void loadRolesForUser(nextUser.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setRoles([]);
          setRolesLoaded(true);
          setRolesError('Error al inicializar autenticación');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadRolesForUser]);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setRolesError(null);
      setRolesLoaded(true);
      return;
    }
    void loadRolesForUser(user.id);
  }, [user?.id, loadRolesForUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setRolesLoaded(false);
    setRolesError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
      setSession(data.session ?? null);
      setUser(data.user ?? data.session?.user ?? null);
    } else {
      setRolesLoaded(true);
    }

    return { error: error as Error | null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });

    const needsEmailConfirmation = !error && data?.user && !data?.session;
    return { error: error as Error | null, needsEmailConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    try {
      setRoles([]);
      setUser(null);
      setSession(null);
      setRolesLoaded(true);
      setRolesError(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    loading,
    rolesLoaded,
    rolesError,
    roles,
    isAdmin: roles.includes('admin'),
    isSeller: roles.includes('seller'),
    signIn,
    signUp,
    signOut,
    refreshRoles,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
