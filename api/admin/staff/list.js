import { supabase } from '../../src/lib/supabaseServer.js';
import { ensureAdmin } from '../../src/lib/adminAuth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    await ensureAdmin(req);
    const { data: staff, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active, created_at')
      .in('role', ['admin', 'chef'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ staff });
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Server error' });
  }
}
