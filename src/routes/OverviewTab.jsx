import React from 'react';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Phone,
  MapPin,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OverviewTab({
  totalRevenue = 0,
  orders = [],
  activeCount = 0,
  settings = {},
  menuItems = [],
  setActiveTab,
  getStatusBadge,
}) {
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

  // Recent 6 orders
  const recentOrders = orders.slice(0, 6);

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

      {/* Real-Time Live Incoming Orders Feed */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <h3 className="font-display text-xl font-bold">Live Incoming Orders</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live updates directly synced from Supabase Realtime
            </p>
          </div>
          {setActiveTab && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full text-xs gap-1.5"
              onClick={() => setActiveTab('orders')}
            >
              <span>Manage All ({orders.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="font-display text-base">No orders yet</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              When customers place orders on your website, they will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentOrders.map((order) => {
              const customer = typeof order.customer === 'string' ? JSON.parse(order.customer) : (order.customer || {});
              const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
              const orderDate = order.createdAt || order.created_at;
              const payMethod = (order.paymentMethod || order.payment_method || 'card').toUpperCase();

              return (
                <div
                  key={order.id}
                  onClick={() => setActiveTab && setActiveTab('orders')}
                  className="group flex flex-col justify-between rounded-2xl border border-border bg-secondary/20 p-4 transition hover:border-brand/50 hover:bg-secondary/40 cursor-pointer shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-foreground">
                          {order.id}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {orderDate ? new Date(orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </div>
                      {getStatusBadge ? (
                        getStatusBadge(order.status)
                      ) : (
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                          {order.status}
                        </span>
                      )}
                    </div>

                    <div className="my-2.5 space-y-1 text-xs">
                      <p className="font-semibold text-foreground">{customer.name || 'Guest Customer'}</p>
                      {customer.phone && (
                        <p className="text-muted-foreground flex items-center gap-1 truncate text-[11px]">
                          <Phone className="h-3 w-3 shrink-0" /> {customer.phone}
                        </p>
                      )}
                      {customer.address && (
                        <p className="text-muted-foreground flex items-start gap-1 truncate text-[11px]">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="truncate">{customer.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl bg-background/60 p-2.5 text-xs space-y-1 border border-border/40">
                      {items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px]">
                          <span className="truncate max-w-[180px]">
                            <strong className="text-brand">{item.qty}x</strong> {item.name}
                          </span>
                          <span className="text-muted-foreground shrink-0 font-medium">
                            ${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-[10px] text-muted-foreground italic">
                          +{items.length - 3} more item{items.length - 3 === 1 ? '' : 's'}...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">
                        Total ({payMethod})
                      </span>
                      <p className="font-display text-base font-bold text-brand">
                        ${Number(order.total || 0).toFixed(2)}
                      </p>
                    </div>
                    <span className="text-xs text-brand group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
                      <span>View</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


