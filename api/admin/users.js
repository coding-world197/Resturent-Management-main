import { supabase } from '../../src/lib/supabaseServer.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the user's token using the Supabase server client
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Token verification failed:', userError);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check role in profiles table to ensure they are an admin or manager
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = (profile?.role || '').toLowerCase().trim();
    if (profileError || (userRole !== 'admin' && userRole !== 'manager')) {
      return res.status(403).json({ error: 'Forbidden: Admin or Manager role required' });
    }

    // Fetch all profiles from Supabase
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active, created_at, phone, address')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Failed to fetch users:', usersError);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }

    return res.status(200).json({ users: users || [] });
  } catch (error) {
    console.error('Users API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
