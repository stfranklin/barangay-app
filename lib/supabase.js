import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Paste your own values from Supabase: Project Settings > API.
// Use the anon (public) key only. NEVER put the service_role key here.
const SUPABASE_URL = 'PASTE_YOUR_PROJECT_URL_HERE';
const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
