import { supabase } from './supabase';

// Helper to check the current session and fetch profile role
export async function checkAdminAuth() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { isAuthenticated: false, user: null };
    }

    // Fetch the user's role from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return { isAuthenticated: false, user: null };
    }

    const rawRole = profile.role || 'customer';
    const role = rawRole.toLowerCase().trim();
    
    // We consider admins, managers, and chefs authenticated for the admin portal
    if (role === 'admin' || role === 'chef' || role === 'manager') {
      return {
        isAuthenticated: true,
        user: { ...session.user, role, originalRole: rawRole }
      };
    }

    return { isAuthenticated: false, user: null };
  } catch (e) {
    console.error('Auth check error:', e);
    return { isAuthenticated: false, user: null };
  }
}

// Login admin using Supabase Auth directly
export async function loginAdmin({ data }) {
  try {
    const { username: email, password } = data; // Form uses 'username' but we need 'email' for Supabase
    
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // After login, verify they are actually an admin or chef
    const authResult = await checkAdminAuth();
    if (!authResult.isAuthenticated) {
      // If they logged in successfully but are just a normal customer, sign them back out
      await supabase.auth.signOut();
      return { success: false, error: "Access denied: Admin/Chef privileges required." };
    }

    return { success: true, role: authResult.user.role };
  } catch (e) {
    console.error('Login admin error', e);
    return { success: false, error: e.message || 'Login failed' };
  }
}

// Logout via Supabase
export async function logoutAdmin() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error('Logout error', e);
    return { success: false, error: e.message };
  }
}
