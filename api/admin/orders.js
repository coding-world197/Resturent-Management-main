import { supabase } from '../../src/lib/supabaseServer.js';
import { createClient } from '@supabase/supabase-js';

// We need a helper to check the auth token using the regular anon key, 
// and then use the service_role key to bypass RLS or fetch profiles.
// Actually, supabaseServer.js uses SUPABASE_SERVICE_ROLE_KEY.
// We can use it to verify the JWT by using supabase.auth.getUser(token).

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

    // Check role in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'chef'].includes(profile.role)) {
      return res.status(403).json({ error: 'Forbidden: Admin or Chef role required' });
    }

    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });

    if (ordersError) {
      console.error('Failed to fetch orders:', ordersError);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
