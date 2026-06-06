// Contexto global de autenticación basado en Supabase Auth.
// Expone: user, session, profile, loading, signUp, signIn, signOut, refreshProfile.

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil desde la tabla `profiles` para el usuario actual
  const loadProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null);
      return null;
    }
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
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) return loadProfile(user.id);
    return null;
  }, [user, loadProfile]);

  // Inicialización: leer sesión actual y suscribirse a cambios
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfile(currentUser.id);
      }
      setLoading(false);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
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

  // Registro: crea usuario en Auth y un row en profiles
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
      // Insertar/actualizar perfil. Si confirm email está activado,
      // puede que no haya sesión aún; el insert respeta RLS porque
      // usamos id = auth.uid() del usuario recién creado.
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
        // No bloqueamos el flujo: el usuario fue creado en Auth.
        // eslint-disable-next-line no-console
        console.warn('[AuthContext] No se pudo crear el perfil:', profileError.message);
      }
    }

    return data;
  }, []);

  // Login email + password
  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email || '').trim().toLowerCase(),
      password
    });
    if (error) throw error;
    return data;
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const value = {
    session,
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: profile?.role === 'admin',
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
