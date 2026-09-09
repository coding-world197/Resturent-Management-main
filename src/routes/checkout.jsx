import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Truck, CreditCard, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — FlameBite" },
      {
        name: "description",
        content: "Complete your FlameBite order — fast delivery, secure checkout.",
      },
      { property: "og:title", content: "Checkout — FlameBite" },
      {
        property: "og:description",
        content: "Complete your FlameBite order — fast delivery, secure checkout.",
      },
    ],
  }),
  component: CheckoutPage,
});
function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [payment, setPayment] = useState("card");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    notes: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });
  const delivery = subtotal > 0 ? 2.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + delivery + tax;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!form.name || !form.email || !form.phone || !form.address || !form.city || !form.zip) {
      toast.error("Please fill in all delivery details");
      return;
    }
    if (payment === "card" && (!form.cardNumber || !form.expiry || !form.cvc)) {
      toast.error("Please fill in your card details");
      return;
    }

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const newOrder = {
      id: orderId,
      customer: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: `${form.address.trim()}, ${form.city.trim()} ${form.zip.trim()}`,
        notes: form.notes?.trim() || "",
      },
      items: lines.map((l) => ({
        id: String(l.item.id),
        name: l.item.name,
        price: Number(l.item.price),
        qty: Number(l.qty),
        image: l.item.image || "",
      })),
      payment_method: payment,
      subtotal: Number(subtotal.toFixed(2)),
      delivery: Number(delivery.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      total: Number(total.toFixed(2)),
      status: "Pending",
      created_at: new Date().toISOString(),
    };

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Please check your environment variables.");
      }

      const { error } = await supabase.from("orders").insert(newOrder);
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      // Keep client-side cache updated after successful Supabase save
      try {
        const existing = JSON.parse(localStorage.getItem("flamebox_orders") || "[]");
        localStorage.setItem("flamebox_orders", JSON.stringify([newOrder, ...existing]));
      } catch (cacheErr) {
        console.warn("Client localStorage cache error:", cacheErr);
      }

      setPlaced(true);
      clear();
      toast.success("Order placed! Your food is on its way 🔥");
    } catch (err) {
      console.error("Failed to place order:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
    }
  };
  if (placed) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* <SiteHeader /> */}
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand/10">
              <CheckCircle2 className="h-9 w-9 text-brand" />
            </div>
            <h1 className="font-display text-3xl">Order Confirmed!</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you {form.name || "friend"} — your delicious meal is being prepared and will
              arrive in 25–35 minutes.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                asChild
                className="h-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Link to="/menu">Order More</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </main>
        {/* <SiteFooter /> */}
      </div>
    );
  }
  if (lines.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="text-center">
            <h1 className="font-display text-3xl">Your cart is empty</h1>
            <p className="mt-2 text-muted-foreground">Add something delicious first.</p>
            <Button
              asChild
              className="mt-6 h-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Link to="/menu">Browse Menu</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      {/* <SiteHeader /> */}
      <main className="flex-1 bg-secondary/30 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <button
            onClick={() => navigate({ to: "/menu" })}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to menu
          </button>
          <h1 className="font-display text-4xl md:text-5xl">Checkout</h1>
          <p className="mt-1 text-muted-foreground">Complete your order in a few quick steps.</p>

          <form onSubmit={onSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              {/* Delivery */}
              <section className="rounded-3xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-brand" />
                  <h2 className="font-display text-2xl">Delivery Details</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Eman Khan"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+1 555 123 4567"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={set("address")}
                      placeholder="123 Flavor Street"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={set("city")}
                      placeholder="Foodville"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={form.zip}
                      onChange={set("zip")}
                      placeholder="12345"
                      className="mt-1.5"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="notes">Delivery Notes (optional)</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={set("notes")}
                      placeholder="Ring the bell twice…"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </section>

              {/* Payment */}
              <section className="rounded-3xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-brand" />
                  <h2 className="font-display text-2xl">Payment Method</h2>
                </div>
                <RadioGroup
                  value={payment}
                  onValueChange={setPayment}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${payment === "card" ? "border-brand bg-brand/5" : "border-border"}`}
                  >
                    <RadioGroupItem value="card" id="pm-card" />
                    <CreditCard className="h-5 w-5" />
                    <span className="font-medium">Credit / Debit Card</span>
                  </label>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${payment === "cod" ? "border-brand bg-brand/5" : "border-border"}`}
                  >
                    <RadioGroupItem value="cod" id="pm-cod" />
                    <Wallet className="h-5 w-5" />
                    <span className="font-medium">Cash on Delivery</span>
                  </label>
                </RadioGroup>

                {payment === "card" && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="card">Card Number</Label>
                      <Input
                        id="card"
                        value={form.cardNumber}
                        onChange={set("cardNumber")}
                        placeholder="1234 5678 9012 3456"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input
                        id="expiry"
                        value={form.expiry}
                        onChange={set("expiry")}
                        placeholder="MM/YY"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvc">CVC</Label>
                      <Input
                        id="cvc"
                        value={form.cvc}
                        onChange={set("cvc")}
                        placeholder="123"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                )}
              </section>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-display text-2xl">Order Summary</h2>
                <ul className="mt-4 space-y-3 max-h-72 overflow-y-auto">
                  {lines.map((l) => (
                    <li key={l.item.id} className="flex gap-3">
                      <img
                        src={l.item.image}
                        alt={l.item.name}
                        className="h-14 w-14 rounded-xl object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{l.item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty {l.qty}</p>
                      </div>
                      <p className="text-sm font-bold">${(l.qty * l.item.price).toFixed(2)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-1 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span>${delivery.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>
                    <span className="text-brand">${total.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="mt-5 h-12 w-full rounded-full bg-brand text-brand-foreground text-base font-semibold hover:bg-brand/90"
                >
                  Place Order · ${total.toFixed(2)}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  🔒 Secure checkout · Estimated delivery 25–35 min
                </p>
              </div>
            </aside>
          </form>
        </div>
      </main>
      {/* <SiteFooter /> */}
    </div>
  );
}
