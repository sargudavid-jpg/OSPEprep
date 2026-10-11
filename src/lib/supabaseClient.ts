import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Normalize URL: strip trailing /rest/v1, /rest/v1/, or trailing slashes so @supabase/supabase-js routes properly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const isSupabaseConfigured = Boolean(
  supabaseUrl.length > 0 &&
    supabaseAnonKey.length > 0 &&
    supabaseUrl.startsWith('http')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL or Anon Key is missing or unconfigured. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file. The app will run in offline/empty-slate mode.'
  );
}

// Fallback to a valid placeholder URL format to prevent @supabase/supabase-js validateSupabaseUrl from crashing at top-level module evaluation
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: isSupabaseConfigured,
    autoRefreshToken: isSupabaseConfigured,
  },
});
