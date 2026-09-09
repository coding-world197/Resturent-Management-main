import { supabase, hasServiceRoleKey } from '../../../src/lib/supabaseServer.js';

function parseJson(req) {
  let raw = '';
  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        const err = new Error('Invalid JSON payload');
        err.status = 400;
        reject(err);
      }
    });
    req.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Database client not initialized.' });
  }

  try {
    // ── 1. Authenticate the requesting admin ──────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];

    const { data: { user: requestingUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !requestingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (profileError || !requesterProfile || requesterProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin role required' });
    }

    // ── 2. Parse request body ─────────────────────────────────────────────
    const body = await parseJson(req);
    const { userId } = body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Prevent admin from deleting themselves
    if (userId === requestingUser.id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    // ── 3. Delete the auth user if service role key is available ───────────
    if (hasServiceRoleKey) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.warn('Auth user deletion warning:', deleteError);
      }
    }

    // ── 4. Remove the profile row ─────────────────────────────────────────
    const { error: profileDeleteError } = await supabase.from('profiles').delete().eq('id', userId);
    if (profileDeleteError) {
      return res.status(500).json({ error: profileDeleteError.message || 'Failed to delete user profile' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Users delete API error:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
  }
}
