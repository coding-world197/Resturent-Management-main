import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  ChefHat,
  Users,
  Settings,
  X,
  Flame,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { getTabsForRole } from '@/lib/permissions';

// Icon lookup — maps the string icon names in permissions.js to real components
const ICON_MAP = {
  TrendingUp,
  ShoppingBag,
  ChefHat,
  Users,
  Settings,
};

/**
 * Sidebar component for the Admin Dashboard.
 * Displays navigation tabs filtered by the current user's role,
 * and a logout button at the bottom.
 *
 * Props:
 *   activeTab: string – current active tab identifier
 *   setActiveTab: (tab: string) => void – function to change active tab
 *   userRole: string – current user role ("admin" | "chef")
 *   onClose: () => void – optional handler for closing the drawer on mobile
 */
export default function Sidebar({ activeTab, setActiveTab, userRole, onClose }) {
  const visibleTabs = getTabsForRole(userRole || 'admin');

  return (
    <aside
      className="hidden sm:block fixed inset-y-0 left-0 z-30 w-64 h-screen overflow-y-auto bg-card border-r border-border shadow-sm lg:static lg:w-64"
      aria-label="Admin navigation"
    >
      <div className="flex h-full flex-col p-4">
        {/* Brand logo */}
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground shadow-md transition-transform hover:scale-105">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-xl tracking-wide text-foreground">
            FLAME<span className="text-brand">BOX</span>
          </span>
        </Link>

        {/* Role indicator */}
        {userRole && (
          <div className="mb-4 rounded-full bg-secondary px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {userRole === 'admin' ? '👑 Admin Portal' : '👨‍🍳 Chef Portal'}
          </div>
        )}

        {/* Navigation links — filtered by role permissions */}
        <nav className="flex flex-col gap-1 mt-2">
          {visibleTabs.map((tab) => {
            const Icon = ICON_MAP[tab.icon] || TrendingUp;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (onClose) onClose();
                }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${active
                  ? 'bg-brand text-brand-foreground font-semibold'
                  : 'bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Logout button */}
        <button
          onClick={() => {
            const event = new CustomEvent('admin-logout');
            window.dispatchEvent(event);
            if (onClose) onClose();
          }}
          className="mt-auto flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10"
        >
          <X className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
