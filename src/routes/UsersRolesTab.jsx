// import React from 'react';
// import { Search, Trash2, Edit, Plus, RefreshCw, Printer, Send, Phone, MapPin, Star } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge';
// export default function UsersRolesTab({
//   users,
//   userRoleFilter,
//   setUserRoleFilter,
//   userSearch,
//   setUserSearch,
//   updatingUserId,
//   setUpdatingUserId,
//   handleUpdateUserRole,
//   toast,
// }) {
//   return (
//     <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
//       <div className="flex flex-wrap items-center justify-between gap-4">
//         <div className="flex flex-wrap items-center gap-2">
//           {["all", "customer", "chef", "admin"].map((role) => (
//             <button
//               key={role}
//               onClick={() => setUserRoleFilter(role)}
//               className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition ${
//                 userRoleFilter === role
//                   ? "bg-foreground text-background font-semibold shadow-sm"
//                   : "bg-secondary text-muted-foreground hover:text-foreground"
//               }`}
//             >
//               {role}
//             </button>
//           ))}
//         </div>
//         <div className="relative w-full sm:w-72">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//           <Input
//             placeholder="Search users..."
//             value={userSearch}
//             onChange={(e) => setUserSearch(e.target.value)}
//             className="pl-9 rounded-full bg-card border-border h-9 text-sm"
//           />
//         </div>
//       </div>

//       <div className="rounded-3xl glass-panel shadow-sm overflow-hidden border border-border">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground border-b border-border">
//               <tr>
//                 <th className="px-6 py-4 font-semibold">User</th>
//                 <th className="px-6 py-4 font-semibold">Role</th>
//                 <th className="px-6 py-4 font-semibold text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-border">
//               {users
//                 .filter((u) => {
//                   const matchesRole = userRoleFilter === "all" || u.role === userRoleFilter;
//                   const matchesSearch =
//                     (u.full_name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
//                     u.email.toLowerCase().includes(userSearch.toLowerCase());
//                   return matchesRole && matchesSearch;
//                 })
//                 .map((user) => (
//                   <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
//                     <td className="px-6 py-4">
//                       <div className="flex flex-col">
//                         <span className="font-semibold">{user.full_name || "N/A"}</span>
//                         <span className="text-xs text-muted-foreground mt-0.5">{user.email}</span>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 capitalize">
//                       <Badge
//                         variant="outline"
//                         className={`${
//                           user.role === "admin" ? "border-brand text-brand bg-brand/10" : ""
//                         } ${
//                           user.role === "chef" ? "border-amber-500 text-amber-600 bg-amber-500/10" : ""
//                         }`}
//                       >
//                         {user.role}
//                       </Badge>
//                     </td>
//                     <td className="px-6 py-4 text-right">
//                       <div className="flex items-center justify-end gap-2">
//                         <select
//                           className="h-8 rounded-lg border-border bg-background text-xs px-2 focus:ring-brand"
//                           defaultValue={user.role}
//                           disabled={updatingUserId === user.id}
//                           onChange={async (e) => {
//                             const newRole = e.target.value;
//                             if (newRole === user.role) return;
//                             if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
//                               e.target.value = user.role;
//                               return;
//                             }
//                             // call parent handler to update role
//                             handleUpdateUserRole(user.id, newRole, user.role)
//                           }}
//                         >
//                           <option value="customer">Customer</option>
//                           <option value="chef">Chef</option>
//                           <option value="admin">Admin</option>
//                         </select>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               {users.length === 0 && (
//                 <tr>
//                   <td colSpan="3" className="px-6 py-8 text-center text-muted-foreground text-sm">
//                     No users found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

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

// 👇 Yahan apni supabase.js file ka sahi path dalein
// import  handler  from "@/lib/user"; 

export default function UsersRolesTab({
  users = [],
  userRoleFilter,
  setUserRoleFilter,
  userSearch,
  setUserSearch,
  updatingUserId,
  setUpdatingUserId, // Added this to manage loading state for role update
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
  const [deleteUserId, setDeleteUserId] = useState(null);

  const resetForm = () => {
    setNewUser({
      full_name: "",
      email: "",
      password: "",
      role: "customer",
    });
  };

  const closeAddUserModal = () => {
    if (creatingUser) return;
    setAddUserOpen(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // CREATE USER LOGIC (Uses Edge Function)
  // ==========================================
  const handleCreateUser = async (e) => {
    e.preventDefault();

    const fullName = newUser.full_name.trim();
    const email = newUser.email.trim().toLowerCase();
    const password = newUser.password;

    if (!email) {
      toast?.({ title: "Email required", variant: "destructive" });
      return;
    }
    if (!password || password.length < 6) {
      toast?.({ title: "Invalid password", description: "At least 6 characters.", variant: "destructive" });
      return;
    }

    try {
      setCreatingUser(true);

      // 👉 API ki bajaye Supabase Function call kar rahe hain
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { 
          action: 'create', 
          full_name: fullName, 
          email, 
          password, 
          role: newUser.role 
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast?.({
        title: "User created",
        description: `${email} has been added as ${newUser.role}.`,
      });

      setAddUserOpen(false);
      resetForm();

      if (typeof fetchUsers === "function") await fetchUsers();
      
    } catch (error) {
      console.error("Failed to create user:", error);
      toast?.({
        title: "Failed to create user",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // ==========================================
  // DELETE USER LOGIC (Uses Edge Function)
  // ==========================================
  const handleDeleteUser = async (userId) => {
    if (!userId) return;

    const confirmed = window.confirm("Are you sure you want to delete this user?");
    if (!confirmed) return;

    try {
      setDeleteUserId(userId);

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', userId: userId },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast?.({
        title: "User deleted",
        description: "The user has been removed successfully.",
      });

      if (typeof fetchUsers === "function") await fetchUsers();

    } catch (error) {
      console.error("Failed to delete user:", error);
      toast?.({
        title: "Failed to delete user",
        description: error?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDeleteUserId(null);
    }
  };

  // ==========================================
  // UPDATE ROLE LOGIC (Direct DB Call)
  // ==========================================
  const handleUpdateUserRole = async (userId, newRole, oldRole) => {
    try {
      if (setUpdatingUserId) setUpdatingUserId(userId);
      
      // Admin policy in SQL allows this direct update
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast?.({
        title: "Role updated",
        description: `User role changed to ${newRole}.`,
      });

      if (typeof fetchUsers === "function") await fetchUsers();
      
    } catch (error) {
      console.error("Failed to update role:", error);
      toast?.({
        title: "Failed to update role",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      if (setUpdatingUserId) setUpdatingUserId(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const role = user?.role || "customer";
    const matchesRole = userRoleFilter === "all" || role === userRoleFilter;
    const search = userSearch.toLowerCase().trim();
    const fullName = (user?.full_name || "").toLowerCase();
    const email = (user?.email || "").toLowerCase();
    const matchesSearch = !search || fullName.includes(search) || email.includes(search);
    return matchesRole && matchesSearch;
  });

  return (
    <>
      <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {["all", "customer", "chef", "admin"].map((role) => {
              const active = userRoleFilter === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRoleFilter(role)}
                  className={`rounded-full px-4 py-2 text-xs font-medium capitalize transition ${
                    active
                      ? "bg-foreground text-background font-semibold shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {role}
                </button>
              );
            })}
          </div>

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
                  const isDeleting = deleteUserId === user.id;

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
                        <Badge
                          variant="outline"
                          className={
                            role === "admin"
                              ? "border-brand bg-brand/10 text-brand"
                              : role === "chef"
                              ? "border-amber-500 bg-amber-500/10 text-amber-500"
                              : "border-border text-muted-foreground"
                          }
                        >
                          {role}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            className="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-brand"
                            value={role}
                            disabled={isUpdating || isDeleting}
                            onChange={async (e) => {
                              const newRole = e.target.value;
                              if (newRole === role) return;
                              const confirmed = window.confirm(
                                `Change this user's role to ${newRole}?`
                              );
                              if (!confirmed) return;
                              await handleUpdateUserRole(user.id, newRole, role);
                            }}
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
                            onClick={() => handleDeleteUser(user.id)}
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
                          Try changing your search or role filter.
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

      {addUserOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAddUserModal();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
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
                onClick={closeAddUserModal}
                disabled={creatingUser}
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-5 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
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

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeAddUserModal}
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
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" /> Create User</>
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