/**
 * Flamebox RBAC — Role-Based Access Control
 *
 * Central source of truth for which roles can access which
 * Admin Portal tabs / features.
 *
 * Roles stored in the Supabase `profiles.role` column:
 *   - admin    → Full access (restaurant owner / administrator)
 *   - manager  → Administrative management (orders, menu, users, settings)
 *   - chef     → Kitchen-oriented access (orders)
 *   - cashier  → POS and order management
 *   - customer → Storefront ordering only (no admin portal access)
 */

// ── Tab definitions with role-based visibility ──────────────────────────────
export const ALL_ADMIN_TABS = [
  { id: "overview",  label: "Overview",        icon: "TrendingUp",  roles: ["admin", "manager"] },
  { id: "orders",    label: "Live Orders",     icon: "ShoppingBag", roles: ["admin", "chef", "manager"] },
  { id: "menu",      label: "Menu & Dishes",   icon: "ChefHat",     roles: ["admin", "manager"] },
  { id: "users",     label: "Users & Roles",   icon: "Users",       roles: ["admin", "manager"] },
  { id: "settings",  label: "Store Settings",  icon: "Settings",    roles: ["admin", "manager"] },
];

/**
 * Returns the tabs visible to a given role (case-insensitive).
 * @param {string} role — e.g. "admin", "chef", "manager"
 * @returns {Array} subset of ALL_ADMIN_TABS
 */
export function getTabsForRole(role) {
  if (!role) return [];
  const normalized = role.toLowerCase().trim();
  return ALL_ADMIN_TABS.filter((tab) => tab.roles.includes(normalized));
}

/**
 * Returns whether a given role is allowed to view a specific tab (case-insensitive).
 * @param {string} role
 * @param {string} tabId
 * @returns {boolean}
 */
export function canAccessTab(role, tabId) {
  const normalized = (role || "").toLowerCase().trim();
  const tab = ALL_ADMIN_TABS.find((t) => t.id === tabId);
  if (!tab) return false;
  return tab.roles.includes(normalized);
}

/**
 * Returns the default landing tab for a given role.
 * @param {string} role
 * @returns {string} tab id
 */
export function getDefaultTab(role) {
  const normalized = (role || "").toLowerCase().trim();
  if (normalized === "chef") return "orders";
  return "overview";
}

/**
 * The roles permitted to access the admin portal at all.
 */
export const PORTAL_ROLES = ["admin", "chef", "manager"];

/**
 * All predefined roles supported by the system.
 */
export const ALL_ROLES = ["customer", "cashier", "chef", "manager", "admin"];
