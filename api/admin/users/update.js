import { supabase } from '../../../src/lib/supabaseServer.js';

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

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user's token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Token verification failed:', userError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Ensure the requester is an admin or manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const requesterRole = (profile?.role || '').toLowerCase().trim();
    if (profileError || (requesterRole !== 'admin' && requesterRole !== 'manager')) {
      return res.status(403).json({ error: 'Forbidden: Admin or Manager role required' });
    }

    // Parse request body
    const body = await parseJson(req);
    const { userId, newRole } = body;

    if (!userId || !newRole || typeof newRole !== 'string') {
      return res.status(400).json({ error: 'Valid user ID and role are required' });
    }

    const cleanRole = newRole.toLowerCase().trim();

    // Update the user's role in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: cleanRole })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user role:', updateError);
      return res.status(500).json({ error: updateError.message || 'Failed to update role' });
    }

    return res.status(200).json({ success: true, role: cleanRole });
  } catch (error) {
    console.error('Users API update error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
