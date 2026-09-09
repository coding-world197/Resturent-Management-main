import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  ShoppingBag,
  ChefHat,
  Flame,
  LogOut,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { checkAdminAuth, logoutAdmin } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/chef")({
  beforeLoad: async ({ location }) => {
    const auth = await checkAdminAuth();
    if (!auth.isAuthenticated || (auth.user?.role !== "chef" && auth.user?.role !== "admin")) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href },
      });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "Chef Dashboard — Flamebox" },
      {
        name: "description",
        content: "Manage live orders for the kitchen.",
      },
    ],
  }),
  component: ChefDashboard,
});

function ChefDashboard() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      toast.success("Logged out successfully.");
      if (typeof window !== "undefined" && window.__tanstack_router) {
        window.__tanstack_router.invalidate();
      }
      navigate({ to: "/admin/login", replace: true });
    } catch (err) {
      toast.error("An error occurred during logout.");
    }
  };

  const fetchOrders = async () => {
    try {
      let fetchedOrders = null;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        
        const resp = await fetch('/api/admin/orders', {
          method: 'GET',
          headers,
          credentials: 'omit',
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.orders)) {
            fetchedOrders = data.orders;
          }
        }
      } catch (apiErr) {
        console.warn("Chef API fetch warning:", apiErr);
      }

      if (!fetchedOrders && supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          fetchedOrders = data;
        }
      }

      if (fetchedOrders) {
        const normalized = fetchedOrders.map((o) => ({
          ...o,
          paymentMethod: o.payment_method || o.paymentMethod || "card",
          payment_method: o.payment_method || o.paymentMethod || "card",
          createdAt: o.created_at || o.createdAt || new Date().toISOString(),
          created_at: o.created_at || o.createdAt || new Date().toISOString(),
          subtotal: Number(o.subtotal || 0),
          delivery: Number(o.delivery || 0),
          tax: Number(o.tax || 0),
          total: Number(o.total || 0),
          customer: typeof o.customer === "string" ? JSON.parse(o.customer) : (o.customer || {}),
          items: Array.isArray(o.items) ? o.items : (typeof o.items === "string" ? JSON.parse(o.items) : []),
        }));
        setOrders(normalized);
      }
    } catch (e) {
      console.error('Network error while fetching orders:', e);
    }
  };

  useEffect(() => {
    fetchOrders();

    let orderChannel = null;
    if (supabase) {
      orderChannel = supabase
        .channel("public:orders-chef")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchOrders();
          }
        )
        .subscribe();
    }

    const interval = setInterval(fetchOrders, 10000);
    return () => {
      clearInterval(interval);
      if (orderChannel && supabase) {
        try {
          supabase.removeChannel(orderChannel);
        } catch {}
      }
    };
  }, []);

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    // Optimistic update
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: nextStatus });
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from("orders")
          .update({ status: nextStatus })
          .eq("id", orderId);

        if (error) {
          console.error("Failed to update status in Supabase:", error);
          toast.error(`Database error: ${error.message}`);
          fetchOrders();
          return;
        }
      }
      toast.success(`Order ${orderId} updated to "${nextStatus}"`);
    } catch (err) {
      console.error("Failed to update order status:", err);
      toast.error("Failed to update order status in database");
      fetchOrders();
    }
  };

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const preparingCount = orders.filter((o) => o.status === "Preparing").length;
  const activeCount = pendingCount + preparingCount;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status.toLowerCase() === orderFilter.toLowerCase();
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Pending</Badge>;
      case "Preparing":
        return <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/30">Preparing 🔥</Badge>;
      case "Out for Delivery":
        return <Badge className="bg-purple-500/15 text-purple-600 border-purple-500/30">On Way 🛵</Badge>;
      case "Delivered":
        return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Delivered</Badge>;
      case "Cancelled":
        return <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-foreground shadow-md transition-transform group-hover:scale-105">
                <Flame className="h-5 w-5" />
              </span>
              <span className="font-display text-2xl tracking-wide">
                FLAME<span className="text-brand">BOX</span>
              </span>
            </Link>
            <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
              Chef Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid h-9 w-9 place-items-center rounded-full bg-secondary border border-border transition hover:bg-muted"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="rounded-full text-rose-500 hover:text-rose-600 gap-1.5 font-medium"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="flex overflow-x-auto gap-2 border-b border-border pb-3 scrollbar-none">
          {[
            { id: "orders", label: `Live Orders (${activeCount})`, icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand text-brand-foreground shadow-sm shadow-brand/20 font-semibold"
                    : "bg-transparent border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === "orders" && (
          <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-panel p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5">
                {["all", "pending", "preparing", "out for delivery", "delivered", "cancelled"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
                        orderFilter === status
                          ? "bg-foreground text-background font-semibold"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {status}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {filteredOrders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                    <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
                    <h3 className="text-sm font-semibold">No orders found</h3>
                    <p className="text-xs text-muted-foreground mt-1">Try changing the filter.</p>
                  </div>
                )}
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer rounded-2xl border transition-all overflow-hidden ${
                      selectedOrder?.id === order.id
                        ? "border-brand shadow-md shadow-brand/10 bg-brand/5"
                        : "border-border bg-card hover:border-brand/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-lg font-bold">#{order.id.slice(-4)}</span>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium text-foreground">
                              {item.qty}x {item.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden lg:block relative">
                <div className="sticky top-24">
                  {selectedOrder ? (
                    <div className="rounded-3xl border border-border bg-card shadow-lg overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
                      <div className="bg-secondary/40 p-5 border-b border-border flex items-center justify-between">
                        <div>
                          <h2 className="font-display text-2xl font-bold">
                            Order #{selectedOrder.id.slice(-4)}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(selectedOrder.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {getStatusBadge(selectedOrder.status)}
                      </div>

                      <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Items Ordered
                          </h4>
                          <div className="space-y-3">
                            {selectedOrder.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-start justify-between p-3 rounded-xl bg-secondary/20 border border-border/50"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-background font-bold shadow-sm text-xs">
                                    {item.qty}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm leading-tight">{item.name}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 bg-secondary/20 border-t border-border">
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 font-semibold h-11"
                            variant={selectedOrder.status === "Pending" ? "default" : "outline"}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, "Preparing")}
                            disabled={selectedOrder.status === "Preparing"}
                          >
                            Mark Preparing
                          </Button>
                          <Button
                            className="flex-1 font-semibold h-11"
                            variant={selectedOrder.status === "Preparing" ? "default" : "outline"}
                            onClick={() => handleUpdateOrderStatus(selectedOrder.id, "Out for Delivery")}
                            disabled={selectedOrder.status === "Out for Delivery" || selectedOrder.status === "Delivered"}
                          >
                            Mark Ready
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-border bg-card/30 p-8">
                      <ChefHat className="h-12 w-12 text-muted-foreground/30 mb-4" />
                      <h3 className="font-display text-xl">No order selected</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                        Select an order from the list to view its details and manage status.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
