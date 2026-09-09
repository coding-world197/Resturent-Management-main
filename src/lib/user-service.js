import { supabase } from "./supabase.js";

/**
 * Fetch all profiles directly from Supabase profiles table,
 * with a fallback to the server API if needed.
 */
export async function fetchProfiles() {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active, created_at, phone, address")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
      if (error) {
        console.warn("Direct Supabase profiles query warning:", error.message);
      }
    }

    // Fallback to server API endpoint
    if (supabase) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const resp = await fetch("/api/admin/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (resp.ok) {
          const json = await resp.json();
          if (Array.isArray(json.users)) {
            return json.users;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error fetching profiles:", err);
  }
  return [];
}

/**
 * Subscribe to real-time changes on the profiles table
 * (e.g. when role is modified directly in Supabase Dashboard).
 */
export function subscribeToProfilesChanges(onPayload) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel("public:profiles-admin-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      (payload) => {
        if (typeof onPayload === "function") {
          onPayload(payload);
        }
      }
    )
    .subscribe();

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch {}
  };
}

/**
 * Update user role in profiles table.
 */
export async function updateUserRole(userId, newRole) {
  if (!userId || !newRole) throw new Error("userId and newRole are required");
  const cleanRole = newRole.toLowerCase().trim();

  // 1. Try direct Supabase update
  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: cleanRole })
      .eq("id", userId)
      .select();

    if (!error && Array.isArray(data) && data.length > 0) {
      return { success: true };
    }
    console.warn("Direct profile update notice, checking API fallback");
  }

  // 2. Try server API update
  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      const resp = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, newRole: cleanRole }),
      });

      if (resp.ok) return { success: true };
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Server returned ${resp.status}`);
    }
  }

  return { success: true };
}
