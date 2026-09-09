import React from 'react';
import { DollarSign, ShoppingBag, Clock, Star, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function OverviewTab({ totalRevenue = 0, orders = [], activeCount = 0, settings = {}, menuItems = [] }) {
  // Real database metrics calculation
  const validOrders = orders.filter((o) => o.status !== 'Cancelled');
  const revenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Live orders (open, not delivered or cancelled)
  const liveOrders = orders.filter((o) => o.status !== 'Cancelled' && o.status !== 'Delivered');

  // Calculate real average rating from database menu items if available
  const ratedItems = (menuItems || []).filter((item) => item.rating && !isNaN(Number(item.rating)));
  const avgRating = ratedItems.length > 0
    ? (ratedItems.reduce((acc, curr) => acc + Number(curr.rating), 0) / ratedItems.length).toFixed(1)
    : null;

  return (
    <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">${revenue.toFixed(2)}</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{validOrders.length} valid order{validOrders.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Live Orders */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Live Orders</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">{liveOrders.length}</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-brand font-semibold">{activeCount}</span> active in kitchen
            </div>
          </div>
        </div>

        {/* Avg. Prep Time */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Avg. Prep Time</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">{settings?.estimatedPrepTime || '25-35'} min</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Standard kitchen estimate</span>
            </div>
          </div>
        </div>

        {/* Store Rating */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Store Rating</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            {avgRating ? (
              <>
                <span className="font-display text-3xl tracking-tight">{avgRating} / 5.0</span>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Based on {ratedItems.length} menu items</span>
                </div>
              </>
            ) : (
              <>
                <span className="font-display text-2xl tracking-tight">No reviews yet</span>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Awaiting customer reviews</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

