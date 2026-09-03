import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star, Flame, Leaf, Plus, Minus, ArrowLeft, Timer, ShieldCheck, Truck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { menu } from "@/lib/menu-data";
import { fetchMenuItems } from "@/lib/menu-service";
import { useCart } from "@/lib/cart-context";
import { FoodCard } from "@/components/food-card";

export const Route = createFileRoute("/menu/$id")({
  loader: async ({ params }) => {
    const items = await fetchMenuItems();
    const item = items.find((m) => String(m.id) === String(params.id));
    if (!item) throw notFound();
    return { item, items };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.item.name} — Flamebox` },
          { name: "description", content: loaderData.item.description },
          { property: "og:title", content: `${loaderData.item.name} — Flamebox` },
          { property: "og:description", content: loaderData.item.description },
        ]
      : [{ title: "Not found — Flamebox" }, { name: "robots", content: "noindex" }],
  }),
  component: ItemDetail,
});

function ItemDetail() {
  const { item, items = [] } = Route.useLoaderData();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const related = items
    .filter((m) => m.category === item.category && String(m.id) !== String(item.id))
    .slice(0, 4);
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </Link>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-start">
        <div className="relative overflow-hidden rounded-[2rem] bg-secondary">
          <img
            src={item.image}
            alt={item.name}
            className="aspect-square w-full object-cover"
            width={800}
            height={800}
          />
          <div className="absolute left-4 top-4 flex gap-2">
            {item.spicy && (
              <span className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground">
                <Flame className="h-3 w-3" /> Spicy
              </span>
            )}
            {item.veg && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                <Leaf className="h-3 w-3" /> Veg
              </span>
            )}
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand">{item.category}</p>
          <h1 className="mt-2 font-display text-5xl leading-[1] sm:text-6xl">{item.name}</h1>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 fill-warm text-warm" /> {item.rating}
            </span>
            <span className="text-muted-foreground">· 320+ reviews</span>
          </div>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{item.description}</p>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-5xl text-brand">
              ${(item.price * qty).toFixed(2)}
            </span>
            {qty > 1 && (
              <span className="text-sm text-muted-foreground">(${item.price.toFixed(2)} each)</span>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-12 w-12 place-items-center hover:bg-secondary"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid h-12 w-12 place-items-center hover:bg-secondary"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              onClick={() => {
                for (let i = 0; i < qty; i++) add(item);
              }}
              className="h-12 flex-1 rounded-full bg-brand px-8 text-base font-bold text-brand-foreground hover:bg-brand/90 sm:flex-none"
            >
              Add {qty} to Cart
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: Timer, label: "30-min delivery" },
              { icon: ShieldCheck, label: "Fresh & hygienic" },
              { icon: Truck, label: "Free over $25" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center"
              >
                <Icon className="h-5 w-5 text-brand" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          <h2 className="font-display text-3xl sm:text-4xl">You might also like</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((m) => (
              <FoodCard key={m.id} item={m} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
