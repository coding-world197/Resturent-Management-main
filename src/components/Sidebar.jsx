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

/**
 * Sidebar component for the Admin Dashboard.
 * Displays navigation tabs (Overview, Live Orders, Menu & Dishes, Users & Roles, Store Settings)
 * and a logout button at the bottom.
 *
 * Props:
 *   activeTab: string – current active tab identifier
 *   setActiveTab: (tab: string) => void – function to change active tab
 *   onClose: () => void – optional handler for closing the drawer on mobile
 */
export default function Sidebar({ activeTab, setActiveTab, onClose }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Live Orders', icon: ShoppingBag },
    { id: 'menu', label: 'Menu & Dishes', icon: ChefHat },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <aside
      className="hidden sm:block fixed inset-y-0 left-0 z-30 w-64 h-screen overflow-y-auto bg-card border-r border-border shadow-sm lg:static lg:w-64"
      aria-label="Admin navigation"
    >
      <div className="flex h-full flex-col p-4">
        {/* Brand logo */}
        <Link to="/" className="mb-8 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground shadow-md transition-transform hover:scale-105">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground shadow-md transition-transform group-hover:scale-105">
              <Flame className="h-5 w-5" />
            </span>
            {/* You can replace with a logo component */}

            {/* <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l9 21H3L12 2z" />
            </svg> */}
          </span>
          <span className="font-display text-xl tracking-wide text-foreground">
            FLAME<span className="text-brand">BOX</span>
          </span>
        </Link>

        {/* Navigation links */}
        <nav className="flex flex-col gap-1 mt-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
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
