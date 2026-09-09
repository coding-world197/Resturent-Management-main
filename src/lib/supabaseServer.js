import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function loadEnvFile() {
  const env = {};
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const k = trimmed.slice(0, idx).trim();
          const v = trimmed.slice(idx + 1).trim();
          env[k] = v;
        }
      });
    }
  } catch {}
  return env;
}

const fileEnv = loadEnvFile();
const getEnv = (key) => process.env[key] || fileEnv[key] || '';

export const supabaseUrl =
  getEnv('SUPABASE_URL') ||
  getEnv('VITE_SUPABASE_URL') ||
  getEnv('NEXT_PUBLIC_SUPABASE_URL');

export const rawServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

export const hasServiceRoleKey =
  !!rawServiceRoleKey &&
  rawServiceRoleKey !== 'your_service_role_key_here' &&
  !rawServiceRoleKey.includes('your_service_role_key');

export const anonKey =
  getEnv('SUPABASE_ANON_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  getEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

// Use service role key if available, otherwise use anon key for general server queries
const activeKey = hasServiceRoleKey ? rawServiceRoleKey : anonKey;

export const supabase =
  supabaseUrl && activeKey
    ? createClient(supabaseUrl, activeKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

// Create an isolated client for user signup that doesn't share session
export function createSignupClient() {
  if (!supabaseUrl || !anonKey) return null;
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
