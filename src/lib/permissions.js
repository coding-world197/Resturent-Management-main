/**
 * Flamebox RBAC — Role-Based Access Control
 *
 * Central source of truth for which roles can access which
 * Admin Portal tabs / features.
 *
 * Roles stored in the Supabase `profiles.role` column:
 *   - admin   → Full access (restaurant owner / manager)
 *   - chef    → Kitchen-oriented access (orders, menu viewing)
 *   - customer → No admin portal access (redirected to login)
 */

// ── Tab definitions with role-based visibility ──────────────────────────────
// `id` must match the tab identifiers used in admin.jsx / Sidebar.jsx
export const ALL_ADMIN_TABS = [
  { id: "overview",  label: "Overview",        icon: "TrendingUp",  roles: ["admin"] },
  { id: "orders",    label: "Live Orders",     icon: "ShoppingBag", roles: ["admin", "chef"] },
  { id: "menu",      label: "Menu & Dishes",   icon: "ChefHat",     roles: ["admin"] },
  { id: "users",     label: "Users & Roles",   icon: "Users",       roles: ["admin"] },
  { id: "settings",  label: "Store Settings",  icon: "Settings",    roles: ["admin"] },
];

/**
 * Returns the tabs visible to a given role.
 * @param {string} role — e.g. "admin" or "chef"
 * @returns {Array} subset of ALL_ADMIN_TABS
 */
export function getTabsForRole(role) {
  if (!role) return [];
  return ALL_ADMIN_TABS.filter((tab) => tab.roles.includes(role));
}

/**
 * Returns whether a given role is allowed to view a specific tab.
 * @param {string} role
 * @param {string} tabId
 * @returns {boolean}
 */
export function canAccessTab(role, tabId) {
  const tab = ALL_ADMIN_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  return tab.roles.includes(role);
}

/**
 * Returns the default landing tab for a given role.
 * @param {string} role
 * @returns {string} tab id
 */
export function getDefaultTab(role) {
  if (role === "chef") return "orders";
  return "overview";
}

/**
 * The roles permitted to access the admin portal at all.
 */
export const PORTAL_ROLES = ["admin", "chef"];

/**
 * All roles supported by the system.
 */
export const ALL_ROLES = ["customer", "chef", "admin"];
