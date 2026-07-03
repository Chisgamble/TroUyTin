import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const missingConfigMessage =
  'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env';

if (!supabaseUrl || !supabaseKey) {
  console.warn(missingConfigMessage);
}

const fallbackSupabase = createClient(
  'https://example.supabase.co',
  'public-anon-key'
);

export const supabase: SupabaseClient =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : fallbackSupabase;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

export async function signUp(email: string, password: string) {
  return await supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function resetPassword(email: string, redirectTo: string) {
  return await supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function updatePassword(password: string) {
  return await supabase.auth.updateUser({ password });
}

export async function signInWithGoogle() {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });
}