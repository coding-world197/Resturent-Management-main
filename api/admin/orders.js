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

    if (!supabase) {
      console.error('Supabase server client not initialized. Check environment variables.');
      return res.status(500).json({ error: 'Database client not initialized' });
    }

    // Fetch all orders
    let { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Fallback if created_at column fails for any reason
    if (ordersError && ordersError.message?.includes('created_at')) {
      const fallback = await supabase.from('orders').select('*');
      orders = fallback.data;
      ordersError = fallback.error;
    }

    if (ordersError) {
      console.error('Failed to fetch orders:', ordersError);
      return res.status(500).json({ error: 'Failed to fetch orders', details: ordersError.message });
    }

    const normalizedOrders = (orders || []).map((o) => ({
      ...o,
      paymentMethod: o.payment_method || o.paymentMethod || 'card',
      payment_method: o.payment_method || o.paymentMethod || 'card',
      createdAt: o.created_at || o.createdAt || new Date().toISOString(),
      created_at: o.created_at || o.createdAt || new Date().toISOString(),
      subtotal: Number(o.subtotal || 0),
      delivery: Number(o.delivery || 0),
      tax: Number(o.tax || 0),
      total: Number(o.total || 0),
      customer: typeof o.customer === 'string' ? JSON.parse(o.customer) : (o.customer || {}),
      items: Array.isArray(o.items) ? o.items : (typeof o.items === 'string' ? JSON.parse(o.items) : []),
    }));

    return res.status(200).json({ orders: normalizedOrders });
  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
