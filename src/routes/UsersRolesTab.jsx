import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  UserPlus,
  Shield,
  Loader2,
  Trash2,
  RefreshCw,
  User,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { updateUserRole } from "@/lib/user-service";

const STANDARD_ROLES = ["customer", "cashier", "chef", "manager", "admin"];

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

// ─── Format helper for Role badge ─────────────────────────────────────────────
function formatRoleName(role) {
  if (!role) return "Customer";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UsersRolesTab({
  users = [],
  userRoleFilter = "all",
  setUserRoleFilter,
  userSearch = "",
  setUserSearch,
  updatingUserId,
  setUpdatingUserId,
  toast,
  fetchUsers,
}) {
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "chef",
  });
  const [creatingUser, setCreatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Fetch users on tab mount
  useEffect(() => {
    if (typeof fetchUsers === "function") {
      fetchUsers();
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (typeof fetchUsers === "function") {
        await fetchUsers();
      }
      toast?.success("Users list updated from database.");
    } catch (e) {
      toast?.error("Failed to refresh users list.");
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () =>
    setNewUser({ full_name: "", email: "", password: "", role: "chef" });

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

      toast?.success(`Account created for "${email}" as ${formatRoleName(role)}.`);
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
    const cleanNew = (newRole || "").toLowerCase().trim();
    const cleanOld = (oldRole || "").toLowerCase().trim();
    if (cleanNew === cleanOld) return;

    const confirmed = window.confirm(
      `Change role from "${formatRoleName(cleanOld)}" to "${formatRoleName(cleanNew)}"?`
    );
    if (!confirmed) return;

    if (setUpdatingUserId) setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, cleanNew);
      toast?.success(`Role updated to "${formatRoleName(cleanNew)}".`);
      if (typeof fetchUsers === "function") await fetchUsers();
    } catch (err) {
      console.error("Update role error:", err);
      toast?.error(err.message || "Failed to update role.");
    } finally {
      if (setUpdatingUserId) setUpdatingUserId(null);
    }
  };

  // ── Dynamic Roles Available in Database ────────────────────────────────────
  const dynamicFilterRoles = useMemo(() => {
    const set = new Set(["all"]);
    users.forEach((u) => {
      if (u.role && typeof u.role === "string") {
        set.add(u.role.toLowerCase().trim());
      }
    });
    // Ensure standard roles appear in filter options
    ["admin", "manager", "chef", "customer"].forEach((r) => set.add(r));
    return Array.from(set);
  }, [users]);

  // ── Filtering ───────────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const role = (user?.role || "customer").toLowerCase().trim();
      const currentFilter = (userRoleFilter || "all").toLowerCase().trim();
      const matchesRole = currentFilter === "all" || role === currentFilter;
      const search = (userSearch || "").toLowerCase().trim();
      const fullName = (user?.full_name || "").toLowerCase();
      const email = (user?.email || "").toLowerCase();
      const roleText = role.toLowerCase();
      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        email.includes(search) ||
        roleText.includes(search);

      return matchesRole && matchesSearch;
    });
  }, [users, userRoleFilter, userSearch]);

  const getRoleBadgeStyle = (rawRole) => {
    const role = (rawRole || "").toLowerCase().trim();
    switch (role) {
      case "admin":
        return "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold";
      case "manager":
        return "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold";
      case "chef":
        return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold";
      case "cashier":
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
      default:
        return "border-border bg-secondary/60 text-muted-foreground";
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header Row ─────────────────────────────────────────────────────── */}
      <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {dynamicFilterRoles.map((r) => {
              const active = (userRoleFilter || "all").toLowerCase().trim() === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setUserRoleFilter?.(r)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all ${
                    active
                      ? "bg-foreground text-background font-semibold shadow-sm scale-105"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  {r === "all" ? "All Roles" : formatRoleName(r)}
                </button>
              );
            })}
          </div>

          {/* Search + Refresh + Add User */}
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, role..."
                value={userSearch}
                onChange={(e) => setUserSearch?.(e.target.value)}
                className="h-10 rounded-full bg-card border-border pl-9 text-xs"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-10 rounded-full text-xs font-medium px-4 border-border"
              title="Refresh users list from database"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin text-brand" : ""}`} />
              Refresh
            </Button>

            <Button
              type="button"
              onClick={() => setAddUserOpen(true)}
              className="h-10 rounded-full bg-brand px-5 text-brand-foreground hover:bg-brand/90 text-xs font-semibold shadow-md shadow-brand/20"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* ── Users Table ──────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Registered</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user) => {
                  const rawRole = (user?.role || "customer").toLowerCase().trim();
                  const isUpdating = updatingUserId === user.id;
                  const isDeleting = deletingUserId === user.id;
                  const isActive = user.is_active !== false;

                  // Collect options including any non-standard role
                  const roleOptions = Array.from(
                    new Set([...STANDARD_ROLES, rawRole])
                  );

                  return (
                    <tr key={user.id} className="transition-colors hover:bg-secondary/20">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary border border-border text-xs font-bold text-foreground">
                            {user.full_name
                              ? user.full_name.charAt(0).toUpperCase()
                              : <User className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-tight">
                              {user.full_name || "Valued User"}
                            </p>
                            {user.phone && (
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-muted-foreground selection:bg-brand/20">
                          {user.email || "—"}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-xs ${getRoleBadgeStyle(rawRole)}`}>
                          {formatRoleName(rawRole)}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                          <span className="text-xs font-medium text-foreground">
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground outline-none transition focus:ring-2 focus:ring-brand disabled:opacity-50"
                            value={rawRole}
                            disabled={isUpdating || isDeleting}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value, rawRole)}
                            aria-label={`Change role for ${user.full_name || user.email}`}
                          >
                            {roleOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {formatRoleName(opt)}
                              </option>
                            ))}
                          </select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={isDeleting || isUpdating}
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                            title="Delete user account"
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
                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary">
                          <UserPlus className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-foreground text-base">No users found</p>
                        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                          {userSearch
                            ? `No users match "${userSearch}". Try clearing your search query.`
                            : "No user accounts match the current filter. Add a new user above or refresh the list."}
                        </p>
                        {(userSearch || userRoleFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setUserSearch?.("");
                              setUserRoleFilter?.("all");
                            }}
                            className="mt-4 rounded-full text-xs"
                          >
                            Clear Filters
                          </Button>
                        )}
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in-50 duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brand/15 text-brand shadow-sm">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Create Employee Account</h2>
                  <p className="text-xs text-muted-foreground">Add user credentials and assign their portal role.</p>
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
            <form onSubmit={handleCreateUser} className="space-y-4 p-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <Input
                  name="full_name"
                  type="text"
                  placeholder="e.g. Chef Ahmed"
                  value={newUser.full_name}
                  onChange={handleInputChange}
                  disabled={creatingUser}
                  className="h-11 rounded-xl bg-background text-sm"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address <span className="text-destructive">*</span>
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="chef@restaurant.com"
                  value={newUser.email}
                  onChange={handleInputChange}
                  disabled={creatingUser}
                  required
                  className="h-11 rounded-xl bg-background text-sm"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  className="h-11 rounded-xl bg-background text-sm"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Assigned Role <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    disabled={creatingUser}
                    className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-brand"
                  >
                    <option value="chef">Chef (Kitchen Orders)</option>
                    <option value="manager">Manager (Management Access)</option>
                    <option value="admin">Admin (Full Owner Access)</option>
                    <option value="cashier">Cashier (POS Orders)</option>
                    <option value="customer">Customer (Storefront Only)</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  disabled={creatingUser}
                  className="h-11 flex-1 rounded-xl text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creatingUser}
                  className="h-11 flex-1 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 text-xs font-bold shadow-md shadow-brand/20"
                >
                  {creatingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Account
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