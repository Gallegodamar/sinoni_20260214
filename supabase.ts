import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const FALLBACK_SUPABASE_URL = 'https://ixomccijzghtghqmqtma.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'sb_publishable_r1WBXKqC-MUCo3ilFM9Xsg_6v78aqAG';

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
  console.error(
    '[Config] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Configure them in Vercel project settings.'
  );
}

export const supabase = createClient(
  supabaseUrl || FALLBACK_SUPABASE_URL,
  supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY,
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
