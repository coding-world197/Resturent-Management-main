import React from 'react';
import { DollarSign, ShoppingBag, Clock, Star, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function OverviewTab({ totalRevenue, orders, activeCount, settings }) {
  return (
    <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">${totalRevenue.toFixed(2)}</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+14.8% from yesterday</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Live Orders</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">{orders.length}</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-brand font-semibold">{activeCount}</span> active in kitchen
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Avg. Prep Time</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">{settings.estimatedPrepTime} min</span>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>On schedule</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Store Rating</span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
              <Star className="h-5 w-5 fill-amber-500" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl tracking-tight">4.9 / 5.0</span>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <span>Based on 320+ customer reviews</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
