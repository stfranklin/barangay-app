import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id); else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Each helper returns an error message (or null on success).
  const signIn = async (email, password) =>
    (await supabase.auth.signInWithPassword({ email, password })).error?.message || null;

  const signUp = async (email, password, meta) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: meta } });
    return { error: error?.message || null, needsConfirm: !error && !data.session };
  };

  const resetPassword = async (email) =>
    (await supabase.auth.resetPasswordForEmail(email)).error?.message || null;

  const updateProfile = async (fields) => {
    const { error } = await supabase.from('profiles').update(fields).eq('id', session.user.id);
    if (!error) await loadProfile(session.user.id);
    return error?.message || null;
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <Ctx.Provider value={{ session, profile, loading, signIn, signUp, resetPassword, updateProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
