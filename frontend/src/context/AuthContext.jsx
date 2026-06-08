// Contexto global de autenticación basado en Supabase Auth.
//
// Expone:
//   - session
//   - user                  (supabase.auth user)
//   - profile               (row de la tabla `profiles`)
//   - role                  (profile.role o null)
//   - userWithProfile       ({ ...user, profile, role })
//   - loading               (true mientras NO sabemos si hay sesión)
//   - profileLoading        (true mientras se está consultando profiles)
//   - isAuthenticated, isAdmin
//   - signUp, signIn, signOut, refreshProfile
//
// Bug previo: `loading` solo cubría la sesión inicial. Cuando el usuario
// se autenticaba, `onAuthStateChange` disparaba `loadProfile` de forma
// asíncrona y los consumidores (p.ej. ProtectedRoute adminOnly) leían
// `profile = null` aunque el rol en BD fuera 'admin' y redirigían a '/'.
// Solución: añadimos `profileLoading` y lo activamos SIEMPRE que haya
// usuario y aún no tengamos perfil cargado. ProtectedRoute debe esperar
// a que `profileLoading` sea false antes de decidir el acceso.

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Cargar perfil desde la tabla `profiles` para el usuario actual.
  // Hace SELECT id, role, ... WHERE id = uid.
  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, phone, department, city, role, created_at')
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
      // 1) Obtener sesión y usuario actuales desde Supabase Auth.
      const { data: sessionRes } = await supabase.auth.getSession();
      const currentSession = sessionRes?.session ?? null;

      // Usamos también getUser() para asegurarnos de tener el user "fresco".
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

      // 2) Si hay usuario, cargar perfil ANTES de marcar loading=false,
      //    para que los consumidores nunca lean un estado intermedio
      //    (user presente, profile null) en el primer render.
      if (currentUser?.id) {
        await loadProfile(currentUser.id);
      } else {
        setProfile(null);
      }

      if (!mounted) return;
      setLoading(false);
    })();

    // 3) Suscripción a cambios de auth (login, logout, refresh token, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (nextUser?.id) {
        // Activamos profileLoading inmediatamente para que ProtectedRoute
        // no decida con `profile = null` durante la transición.
        setProfileLoading(true);
        await loadProfile(nextUser.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  // Registro: crea usuario en Auth y un row en profiles.
  const signUp = useCallback(async ({ name, email, password, phone, department, city }) => {
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
        console.warn('[AuthContext] No se pudo crear el perfil:', profileError.message);
      }
    }

    return data;
  }, []);

  // Login email + password.
  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim().toLowerCase(),
      password
    });
    if (error) throw error;

    // Forzamos la recarga del perfil tras el login para que `role`
    // esté disponible inmediatamente, sin esperar al evento.
    if (data?.user?.id) {
      await loadProfile(data.user.id);
    }
    return data;
  }, [loadProfile]);

  // Logout.
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  // role expuesto explícitamente, según requisito.
  const role = profile?.role ?? null;

  // userWithProfile: combinación útil para consumidores.
  const userWithProfile = useMemo(() => {
    if (!user) return null;
    return { ...user, profile, role };
  }, [user, profile, role]);

  const value = {
    session,
    user,
    profile,
    role,
    userWithProfile,
    loading,
    profileLoading,
    isAuthenticated: Boolean(user),
    isAdmin: role === 'admin',
    signUp,
    signIn,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
