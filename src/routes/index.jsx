import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Search, Truck, Sparkles, ShieldCheck, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FoodCard } from "@/components/food-card";
import { menu, categories } from "@/lib/menu-data";
import { fetchMenuItems, subscribeToMenuChanges } from "@/lib/menu-service";
import heroImg from "@/assets/hero-burger.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flamebox — Fresh, Fast, Flame-Grilled Fast Food" },
      {
        name: "description",
        content:
          "Craving something bold? Order flame-grilled burgers, wood-fired pizza, wings and more. Delivered hot in 30 minutes.",
      },
      { property: "og:title", content: "Flamebox — Fresh, Fast, Flame-Grilled" },
      {
        property: "og:description",
        content:
          "Order flame-grilled burgers, wood-fired pizza and more, delivered hot in 30 minutes.",
      },
    ],
  }),
  component: Home,
});
const catIcons = {
  Burgers: "🍔",
  Pizza: "🍕",
  Sides: "🍟",
  Beverages: "🥤",
  Desserts: "🍰",
};
const reviews = [
  {
    name: "Sarah M.",
    text: "Best burger in town, hands down. Delivery was faster than I expected!",
    rating: 5,
  },
  {
    name: "James R.",
    text: "The wings are legendary. Perfectly crispy and packed with flavor.",
    rating: 5,
  },
  {
    name: "Priya K.",
    text: "Fresh ingredients, big portions, and the packaging is spot on.",
    rating: 5,
  },
];

function Home() {
  const [menuItems, setMenuItems] = useState(menu);

  useEffect(() => {
    let unsubscribe = () => {};
    const load = async () => {
      const items = await fetchMenuItems();
      setMenuItems(items);
      unsubscribe = subscribeToMenuChanges((fresh) => setMenuItems(fresh));
    };
    load();
    return () => unsubscribe();
  }, []);

  const availableCategories = useMemo(() => {
    const set = new Set(categories);
    menuItems.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [menuItems]);

  const bestsellers = menuItems.filter((m) => m.bestseller);
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-black text-white min-h-[85vh] flex items-center">
        <img
          src={heroImg}
          alt="Premium food"
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          width={1600}
          height={1200}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand">
              <Sparkles className="h-3.5 w-3.5" /> Authentic Flavors • Premium Experience
            </span>
            <h1 className="mt-6 font-display text-5xl leading-tight sm:text-6xl md:text-7xl lg:text-[5rem] tracking-tight text-white">
              Good Food.<br />
              <span className="text-brand">Beautiful Moments.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-white/80 leading-relaxed font-medium">
              Fresh ingredients, unforgettable flavors, and an experience made for every occasion.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-brand px-8 text-base font-bold text-brand-foreground hover:bg-brand/90 shadow-lg shadow-brand/20 transition-all hover:scale-[1.02]"
              >
                <Link to="/menu">
                  Order Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-border bg-card/10 backdrop-blur-md px-8 text-base font-bold text-white hover:bg-card/20 hover:text-white transition-all"
              >
                <Link to="/menu">Explore Menu</Link>
              </Button>
            </div>

            <div className="mt-12 flex max-w-md items-center gap-2 rounded-2xl bg-card/10 p-1.5 backdrop-blur-md border border-white/10">
              <Search className="ml-3 h-5 w-5 text-white/70" />
              <Input
                placeholder="Search premium dishes..."
                className="h-11 flex-1 border-0 bg-transparent text-white placeholder:text-white/50 focus-visible:ring-0 text-base"
              />
              <Button className="h-11 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Search
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-8 text-sm font-medium text-white/80">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-warm" /> 30-min delivery
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-warm" /> Best hygiene
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-warm text-warm" /> 4.9 · 12k reviews
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand">Browse</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl">Pick your craving</h2>
          </div>
          <Link
            to="/menu"
            className="hidden text-sm font-semibold text-brand hover:underline sm:inline"
          >
            See all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {availableCategories.map((c) => (
            <Link
              key={c}
              to="/menu"
              className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
            >
              <span className="text-4xl transition-transform duration-300 group-hover:scale-110">
                {catIcons[c] || "🔥"}
              </span>
              <span className="font-semibold text-lg">{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand">
                Hot right now
              </p>
              <h2 className="mt-2 font-display text-4xl sm:text-5xl">Best Sellers</h2>
            </div>
            <Link
              to="/menu"
              className="hidden text-sm font-semibold text-brand hover:underline sm:inline"
            >
              See all →
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((m) => (
              <FoodCard key={m.id} item={m} />
            ))}
          </div>
        </div>
      </section>

      {/* OFFER BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 p-10 sm:p-14 border border-border shadow-2xl">
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-[100px]" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center text-white">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-brand">Limited time</p>
              <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl text-white">
                Get 20% off your first order
              </h2>
              <p className="mt-3 max-w-lg text-white/70">
                Use code{" "}
                <span className="rounded-md border border-brand/30 bg-brand/20 px-2 py-0.5 font-bold text-brand">FLAME20</span> at
                checkout. Applies to any order over $15.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-12 justify-self-start rounded-xl bg-brand px-8 text-base font-bold text-brand-foreground hover:bg-brand/90 md:justify-self-end shadow-lg"
            >
              <Link to="/menu">Claim Offer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Loved by locals</p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl">What our customers say</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-0.5 text-warm">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-warm" />
                ))}
              </div>
              <blockquote className="mt-4 text-base leading-relaxed">"{r.text}"</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 font-bold text-brand text-lg">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">Verified customer</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
