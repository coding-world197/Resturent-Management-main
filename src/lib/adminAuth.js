import { supabase } from './supabaseServer.js';

export async function ensureAdmin(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Missing or invalid Authorization header' };
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    throw { status: 401, message: 'Invalid token' };
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  const role = (profile?.role || '').toLowerCase().trim();
  if (profileError || (role !== 'admin' && role !== 'manager')) {
    throw { status: 403, message: 'Admin or Manager role required' };
  }
  return user.id;
}
