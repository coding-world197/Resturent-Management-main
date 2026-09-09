import { supabase, hasServiceRoleKey, createSignupClient } from '../../../src/lib/supabaseServer.js';

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

const VALID_ROLES = ['customer', 'chef', 'admin'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase server client not initialized. Check your environment variables.' });
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
      return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
    }

    // Verify requester is admin
    const { data: requesterProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', requestingUser.id)
      .single();

    if (profileError || !requesterProfile || requesterProfile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin privileges required to create employee accounts.' });
    }

    // ── 2. Parse and validate the request body ────────────────────────────
    const body = await parseJson(req);
    const { full_name, email, password, role } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const assignedRole = VALID_ROLES.includes(role) ? role : 'customer';

    let newUserId = null;

    // ── 3. Create the user account ─────────────────────────────────────────
    if (hasServiceRoleKey) {
      // Best path: Admin API with service role key (auto-confirms email, instant active)
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: (full_name || '').trim(),
        },
      });

      if (createError) {
        console.error('Auth user creation error:', createError);
        if (
          createError.message?.toLowerCase().includes('already registered') ||
          createError.message?.toLowerCase().includes('already exists') ||
          createError.code === '23505'
        ) {
          return res.status(409).json({ error: `A user with email "${email}" already exists.` });
        }
        return res.status(400).json({ error: createError.message || 'Failed to create user.' });
      }

      newUserId = newAuthUser.user?.id;
    } else {
      // Fallback path: Client SignUp with isolated client (works even without service_role key)
      const signupClient = createSignupClient();
      if (!signupClient) {
        return res.status(500).json({ error: 'Could not create auth client.' });
      }

      const { data: signupData, error: signupError } = await signupClient.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: (full_name || '').trim(),
            role: assignedRole,
          },
        },
      });

      if (signupError) {
        console.error('Signup error:', signupError);
        if (
          signupError.message?.toLowerCase().includes('already registered') ||
          signupError.message?.toLowerCase().includes('already exists')
        ) {
          return res.status(409).json({ error: `A user with email "${email}" already exists.` });
        }
        return res.status(400).json({ error: signupError.message || 'Failed to sign up user.' });
      }

      newUserId = signupData.user?.id;
    }

    if (!newUserId) {
      return res.status(500).json({ error: 'User was created but no ID was returned.' });
    }

    // ── 4. Upsert profile record with the selected role ────────────────────
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({
        id: newUserId,
        full_name: (full_name || '').trim(),
        email: email.toLowerCase().trim(),
        role: assignedRole,
      }, { onConflict: 'id' });

    if (profileUpsertError) {
      console.warn('Profile upsert note:', profileUpsertError);
    }

    return res.status(201).json({
      success: true,
      userId: newUserId,
      email: email.toLowerCase().trim(),
      role: assignedRole,
    });
  } catch (error) {
    console.error('Users create API error:', error);
    return res.status(error.status || 500).json({ error: error.message || 'Internal Server Error' });
  }
}
