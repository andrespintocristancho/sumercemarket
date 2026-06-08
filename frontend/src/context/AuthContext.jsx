// Contexto global de autenticación basado en Supabase Auth.
//
// Expone (según contrato fijado):
//   - user            (supabase.auth user)
//   - profile         (row completo de public.profiles)
//   - role            (profile?.role || null)
//   - isAdmin         (profile?.role === 'admin')
//   - loading         (true mientras no sabemos si hay sesión)
//   - profileLoading  (true mientras se consulta profiles)
//
// También expone helpers usados por el resto de la app:
//   session, isAuthenticated, userWithProfile,
//   signUp, signIn, signOut, refreshProfile.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

// Flag de desarrollo para los console.log de debug.
const IS_DEV =
  (typeof import.meta !== 'undefined' && import.meta?.env?.DEV) === true;

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Carga el perfil desde Supabase con el contrato pedido:
  //   from('profiles').select('*').eq('id', user.id).maybeSingle()
  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (error) {
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] No se pudo cargar el perfil:', error.message);
        setProfile(null);
        return null;
      }

      setProfile(data || null);
      return data || null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) return loadProfile(user.id);
    return null;
  }, [user, loadProfile]);

  // Inicialización: leer sesión actual y suscribirse a cambios.
  useEffect(() => {
    let mounted = true;

    (async () => {
      // 1) Sesión actual
      const { data: sessionRes } = await supabase.auth.getSession();
      const currentSession = sessionRes?.session ?? null;

      // Reforzamos con getUser() para tener el usuario "fresco".
      let currentUser = currentSession?.user ?? null;
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user) currentUser = userRes.user;
      } catch {
        // ignorar: si falla, conservamos el de la sesión
      }

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentUser);

      // 2) Cargar profile ANTES de marcar loading=false para evitar
      //    el estado intermedio (user presente, profile null) que
      //    hacía que ProtectedRoute decidiera mal.
      if (currentUser?.id) {
        await loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (!mounted) return;
      setLoading(false);
    })();

    // 3) Cambios de auth (login, logout, refresh token, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);

        if (nextUser?.id) {
          setProfileLoading(true);
          await loadProfile(nextUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  // ---------------- Auth actions ----------------

  const signUp = useCallback(
    async ({ name, email, password, phone, department, city }) => {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanName = String(name || '').trim();
      const cleanPhone = String(phone || '').trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            phone: cleanPhone,
            department: department || '',
            city: city || ''
          }
        }
      });
      if (error) throw error;

      const newUser = data?.user;
      if (newUser?.id) {
        const profileRow = {
          id: newUser.id,
          name: cleanName,
          phone: cleanPhone,
          department: department || '',
          city: city || '',
          role: 'user'
        };
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileRow, { onConflict: 'id' });

        if (profileError) {
          // eslint-disable-next-line no-console
          console.warn(
            '[AuthContext] No se pudo crear el perfil:',
            profileError.message
          );
        }
      }

      return data;
    },
    []
  );

  const signIn = useCallback(
    async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(email || '').trim().toLowerCase(),
        password
      });
      if (error) throw error;

      // Cargamos el perfil inmediatamente para que `role` y `isAdmin`
      // estén disponibles sin esperar al evento onAuthStateChange.
      if (data?.user?.id) {
        await loadProfile(data.user.id);
      }
      return data;
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  // ---------------- Derivados ----------------

  const role = profile?.role || null;
  const isAdmin = profile?.role === 'admin';

  const userWithProfile = useMemo(() => {
    if (!user) return null;
    return { ...user, profile, role };
  }, [user, profile, role]);

  // Debug solo en desarrollo.
  useEffect(() => {
    if (!IS_DEV) return;
    if (loading || profileLoading) return;
    // eslint-disable-next-line no-console
    console.log('AUTH DEBUG', {
      userId: user?.id,
      profile,
      role,
      isAdmin
    });
  }, [user, profile, role, isAdmin, loading, profileLoading]);

  const value = {
    session,
    user,
    profile,
    role,
    isAdmin,
    isAuthenticated: Boolean(user),
    userWithProfile,
    loading,
    profileLoading,
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
