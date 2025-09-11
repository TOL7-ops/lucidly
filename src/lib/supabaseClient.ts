import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Clean UTF-8 file providing Supabase clients

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client for API routes (adds Authorization header when provided)
export function createServerSupabaseClient(accessToken?: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  });
}

export interface Sentiment {
  label?: string;
  score?: number;
}

export interface Dream {
  id: string;
  user_id: string;
  content: string;
  transcript?: string;
  summary?: string;
  sentiment?: Sentiment;
  interpretation?: string;
  audio_url?: string;
  audio_path?: string;
  created_at: string;
}