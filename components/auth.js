import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileRequest = useRef(0);
  const authEventRevision = useRef(0);

  const loadProfile = async (uid) => {
    const requestId = ++profileRequest.current;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, address, contact, role, active, created_at')
        .eq('id', uid)
        .maybeSingle();
      if (requestId !== profileRequest.current) return;
      if (error) {
        console.warn('Could not load the user profile:', error.message);
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch (error) {
      if (requestId === profileRequest.current) {
        console.warn('Could not load the user profile:', error?.message || error);
        setProfile(null);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const startupRevision = authEventRevision.current;
    const finishStartup = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!mounted) return;
      authEventRevision.current += 1;
      setSession(s);
      setLoading(false);
      if (s) {
        void loadProfile(s.user.id);
      } else {
        profileRequest.current += 1;
        setProfile(null);
      }
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!mounted || authEventRevision.current !== startupRevision) return;
        if (error) console.warn('Could not restore the saved session:', error.message);
        const nextSession = data?.session || null;
        setSession(nextSession);
        setLoading(false);
        if (nextSession) {
          void loadProfile(nextSession.user.id);
        } else {
          profileRequest.current += 1;
          setProfile(null);
        }
      })
      .catch((error) => {
        if (!mounted || authEventRevision.current !== startupRevision) return;
        console.warn('Could not restore the saved session:', error?.message || error);
        setSession(null);
        setProfile(null);
        setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(finishStartup);
      profileRequest.current += 1;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Each helper returns an error message (or null on success).
  const signIn = async (email, password) =>
    (await supabase.auth.signInWithPassword({ email, password })).error?.message || null;

  const createResident = async (resident) => {
    const { data, error } = await supabase.functions.invoke('create-resident', { body: resident });
    if (!error) return { error: data?.error || null };
    let message = error.message;
    try {
      const details = await error.context?.json?.();
      if (details?.error) message = details.error;
    } catch {
      // Keep the SDK error when the function response has no JSON body.
    }
    return { error: message };
  };

  const updatePassword = async (password) =>
    (await supabase.auth.updateUser({ password })).error?.message || null;

  const resetPassword = async (email) =>
    (await supabase.auth.resetPasswordForEmail(email)).error?.message || null;

  const updateProfile = async (fields) => {
    const { error } = await supabase.from('profiles').update(fields).eq('id', session.user.id);
    if (!error) await loadProfile(session.user.id);
    return error?.message || null;
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <Ctx.Provider value={{ session, profile, loading, signIn, createResident, resetPassword, updateProfile, updatePassword, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
