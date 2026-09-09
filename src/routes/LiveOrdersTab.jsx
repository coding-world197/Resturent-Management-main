import React from 'react';
import { Search, Badge, Trash2, Edit, Plus, RefreshCw, Printer, Send, Phone, MapPin, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LiveOrdersTab({
  orders,
  filteredOrders,
  orderFilter,
  setOrderFilter,
  activeCount,
  handleUpdateOrderStatus,
  handleToggleStock,
  handleSendWhatsAppSlip,
  setPrintingOrder,
  handleOpenAddDish,
  saveOrders,
  toast,
  getStatusBadge,
  fetchOrders,
}) {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    if (fetchOrders) {
      setRefreshing(true);
      await fetchOrders();
      setRefreshing(false);
      toast.success("Orders refreshed from database");
    }
  };

  return (
    <div className="mt-6 space-y-6 animate-in fade-in-50 duration-300">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl glass-panel p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {["all", "pending", "preparing", "out for delivery", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setOrderFilter(status)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${orderFilter === status
                  ? "bg-foreground text-background font-semibold"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {fetchOrders && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full text-xs gap-1.5"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Orders Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted-foreground">
            {/* <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" /> */}
            <h3 className="font-display text-xl">No orders found</h3>
            <p className="text-sm mt-1">No orders matching the status filter "{orderFilter}".</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const customer = typeof order.customer === "string" ? JSON.parse(order.customer) : (order.customer || {});
            const items = Array.isArray(order.items) ? order.items : (typeof order.items === "string" ? JSON.parse(order.items) : []);
            const orderDate = order.createdAt || order.created_at;
            const payMethod = (order.paymentMethod || order.payment_method || "card").toUpperCase();
            const orderTotal = Number(order.total || 0).toFixed(2);

            return (
              <div
                key={order.id}
                className="flex flex-col justify-between rounded-3xl glass-panel p-5 shadow-sm hover:border-brand/40 transition"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div>
                      <span className="font-display text-lg font-bold">{order.id}</span>
                      <p className="text-xs text-muted-foreground">
                        {orderDate ? new Date(orderDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Customer Info */}
                  <div className="my-3 space-y-1 text-xs">
                    <p className="font-semibold text-foreground">{customer.name || "Guest Customer"}</p>
                    {customer.phone && (
                      <p className="text-muted-foreground flex items-center gap-1 truncate">
                        <Phone className="h-3 w-3 shrink-0" /> {customer.phone}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-muted-foreground flex items-start gap-1">
                        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{customer.address}</span>
                      </p>
                    )}
                  </div>

                  {/* Ordered Items */}
                  <div className="rounded-2xl bg-secondary/40 p-3 text-xs space-y-1.5 my-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span>
                          <strong className="text-brand">{item.qty}x</strong> {item.name}
                        </span>
                        <span className="text-muted-foreground">${(Number(item.price || 0) * Number(item.qty || 1)).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-1.5 flex justify-between font-bold text-sm">
                      <span>Total ({payMethod})</span>
                      <span className="text-brand font-display text-base">${orderTotal}</span>
                    </div>
                  </div>

                  {customer.notes && (
                    <p className="text-xs italic text-muted-foreground bg-amber-5/5 p-2 rounded-xl border border-amber-500/20 mb-3">
                      📝 Note: {customer.notes}
                    </p>
                  )}
                </div>

              {/* Quick Status Action Buttons */}
              <div className="pt-2 border-t border-border/60">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                  Update Status:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {order.status === "Pending" && (
                    <>
                      <Button
                        size="sm"
                        className="w-full h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-xs text-white"
                        onClick={() => handleUpdateOrderStatus(order.id, "Preparing")}
                      >
                        🔥 Start Cooking
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 rounded-full text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                        onClick={() => handleUpdateOrderStatus(order.id, "Cancelled")}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {order.status === "Preparing" && (
                    <Button
                      size="sm"
                      className="w-full h-8 rounded-full bg-purple-600 hover:bg-purple-700 text-xs text-white col-span-2"
                      onClick={() => handleUpdateOrderStatus(order.id, "Out for Delivery")}
                    >
                      🛵 Send with Driver
                    </Button>
                  )}
                  {order.status === "Out for Delivery" && (
                    <Button
                      size="sm"
                      className="w-full h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-xs text-white col-span-2"
                      onClick={() => handleUpdateOrderStatus(order.id, "Delivered")}
                    >
                      ✅ Mark Delivered
                    </Button>
                  )}
                  {(order.status === "Delivered" || order.status === "Cancelled") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 rounded-full text-xs col-span-2"
                      onClick={() => handleUpdateOrderStatus(order.id, "Pending")}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Reopen Order
                    </Button>
                  )}
                </div>
              </div>

              {/* Print & Send Receipt Slip Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-dashed border-border flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="flex-1 h-8 rounded-full text-xs font-semibold gap-1.5 hover:bg-brand hover:text-brand-foreground transition"
                  onClick={() => setPrintingOrder(order)}
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Slip</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 rounded-full text-xs font-semibold gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 transition"
                  onClick={() => handleSendWhatsAppSlip(order)}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>WhatsApp</span>
                </Button>
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
}
