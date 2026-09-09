import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  UserPlus,
  Shield,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

const VALID_ROLES = ["customer", "chef", "admin"];

// ─── Helper: get auth token ───────────────────────────────────────────────────
async function getAuthToken() {
  if (!supabase) throw new Error("Supabase client not initialised");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated. Please log in again.");
  return session.access_token;
}

// ─── Helper: call an admin REST endpoint ─────────────────────────────────────
async function adminFetch(path, body) {
  const token = await getAuthToken();
  const resp = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  let json;
  try {
    json = await resp.json();
  } catch {
    throw new Error(`Server returned ${resp.status} with no JSON body`);
  }

  if (!resp.ok) {
    throw new Error(json?.error || `Request failed with status ${resp.status}`);
  }

  return json;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UsersRolesTab({
  users = [],
  userRoleFilter,
  setUserRoleFilter,
  userSearch,
  setUserSearch,
  updatingUserId,
  setUpdatingUserId,
  toast,
  fetchUsers,
}) {
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "customer",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const resetForm = () =>
    setNewUser({ full_name: "", email: "", password: "", role: "customer" });

  const closeModal = () => {
    if (creatingUser) return;
    setAddUserOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  // ── CREATE USER ─────────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();

    const fullName = newUser.full_name.trim();
    const email = newUser.email.trim().toLowerCase();
    const { password, role } = newUser;

    if (!email) {
      toast?.error("Email is required.");
      return;
    }
    if (!password || password.length < 6) {
      toast?.error("Password must be at least 6 characters.");
      return;
    }

    setCreatingUser(true);
    try {
      await adminFetch("/api/admin/users/create", { full_name: fullName, email, password, role });

      toast?.success(`User "${email}" created as ${role}.`);
      setAddUserOpen(false);
      resetForm();
      if (typeof fetchUsers === "function") await fetchUsers();
    } catch (err) {
      console.error("Create user error:", err);
      toast?.error(err.message || "Failed to create user.");
    } finally {
      setCreatingUser(false);
    }
  };

  // ── DELETE USER ─────────────────────────────────────────────────────────────
  const handleDeleteUser = async (userId, userEmail) => {
    if (!userId) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${userEmail || userId}"?`
    );
    if (!confirmed) return;

    setDeletingUserId(userId);
    try {
      await adminFetch("/api/admin/users/delete", { userId });
      toast?.success("User deleted successfully.");
      if (typeof fetchUsers === "function") await fetchUsers();
    } catch (err) {
      console.error("Delete user error:", err);
      toast?.error(err.message || "Failed to delete user.");
    } finally {
      setDeletingUserId(null);
    }
  };

  // ── UPDATE ROLE ─────────────────────────────────────────────────────────────
  const handleUpdateRole = async (userId, newRole, oldRole) => {
    if (newRole === oldRole) return;
    if (!VALID_ROLES.includes(newRole)) {
      toast?.error("Invalid role selected.");
      return;
    }
    const confirmed = window.confirm(`Change this user's role to "${newRole}"?`);
    if (!confirmed) return;

    if (setUpdatingUserId) setUpdatingUserId(userId);
    try {
      // Reuse the existing /api/admin/users/update endpoint
      const token = await getAuthToken();
      const resp = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, newRole }),
      });

      let json;
      try { json = await resp.json(); } catch { json = {}; }
      if (!resp.ok) throw new Error(json?.error || `Failed with status ${resp.status}`);

      toast?.success(`Role updated to "${newRole}".`);
      if (typeof fetchUsers === "function") await fetchUsers();
    } catch (err) {
      console.error("Update role error:", err);
      toast?.error(err.message || "Failed to update role.");
    } finally {
      if (setUpdatingUserId) setUpdatingUserId(null);
    }
  };

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filteredUsers = users.filter((user) => {
    const role = user?.role || "customer";
    const matchesRole = userRoleFilter === "all" || role === userRoleFilter;
    const search = (userSearch || "").toLowerCase().trim();
    const fullName = (user?.full_name || "").toLowerCase();
    const email = (user?.email || "").toLowerCase();
    const matchesSearch = !search || fullName.includes(search) || email.includes(search);
    return matchesRole && matchesSearch;
  });

  const roleBadgeClass = (role) => {
    if (role === "admin") return "border-brand bg-brand/10 text-brand";
    if (role === "chef") return "border-amber-500 bg-amber-500/10 text-amber-500";
    return "border-border text-muted-foreground";
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header Row ─────────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {["all", "customer", "chef", "admin"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setUserRoleFilter(r)}
                className={`rounded-full px-4 py-2 text-xs font-medium capitalize transition ${
                  userRoleFilter === r
                    ? "bg-foreground text-background font-semibold shadow-sm"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Search + Add User */}
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-10 rounded-full bg-card border-border pl-9 text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={() => setAddUserOpen(true)}
              className="h-10 rounded-full bg-brand px-5 text-brand-foreground hover:bg-brand/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* ── Users Table ──────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const role = user?.role || "customer";
                  const isUpdating = updatingUserId === user.id;
                  const isDeleting = deletingUserId === user.id;

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-secondary/20">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {user.full_name || "N/A"}
                          </span>
                          <span className="mt-0.5 text-xs text-muted-foreground">
                            {user.email || "No email"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 capitalize">
                        <Badge variant="outline" className={roleBadgeClass(role)}>
                          {role}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand"
                            value={role}
                            disabled={isUpdating || isDeleting}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value, role)}
                          >
                            <option value="customer">Customer</option>
                            <option value="chef">Chef</option>
                            <option value="admin">Admin</option>
                          </select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting || isUpdating}
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="h-9 w-9 text-rose-500 hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary">
                          <UserPlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-foreground">No users found</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Try changing your search or role filter, or add a new user above.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Add User Modal ──────────────────────────────────────────────────── */}
      {addUserOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Add New User</h2>
                  <p className="text-xs text-muted-foreground">Create a user and assign their role.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={creatingUser}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="space-y-5 p-6">
              {/* Full Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Full Name
                </label>
                <Input
                  name="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={newUser.full_name}
                  onChange={handleInputChange}
                  disabled={creatingUser}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={handleInputChange}
                  disabled={creatingUser}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password <span className="text-destructive">*</span>
                </label>
                <Input
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newUser.password}
                  onChange={handleInputChange}
                  disabled={creatingUser}
                  minLength={6}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">User Role</label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    disabled={creatingUser}
                    className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-brand"
                  >
                    <option value="customer">Customer</option>
                    <option value="chef">Chef</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={creatingUser}
                  className="h-11 flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingUser}
                  className="h-11 flex-1 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}