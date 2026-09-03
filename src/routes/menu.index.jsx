import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { FoodCard } from "@/components/food-card";
import { menu, categories } from "@/lib/menu-data";
import { fetchMenuItems, subscribeToMenuChanges } from "@/lib/menu-service";

export const Route = createFileRoute("/menu/")({
  head: () => ({
    meta: [
      { title: "Menu — Flamebox" },
      {
        name: "description",
        content:
          "Browse our full menu: burgers, wood-fired pizza, wings, sides, drinks and desserts.",
      },
      { property: "og:title", content: "Full Menu — Flamebox" },
      {
        property: "og:description",
        content: "Explore every flame-grilled favorite on the Flamebox menu.",
      },
    ],
  }),
  component: MenuPage,
});
const filters = ["All", ...categories];

function MenuPage() {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [priceMax, setPriceMax] = useState(20);
  const [menuItems, setMenuItems] = useState(menu);

  useEffect(() => {
    let unsubscribe = () => {};
    const load = async () => {
      const fetched = await fetchMenuItems();
      setMenuItems(fetched);
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

  const filters = useMemo(() => ["All", ...availableCategories], [availableCategories]);

  const items = useMemo(
    () =>
      menuItems.filter((m) => {
        if (filter !== "All" && m.category !== filter) return false;
        if (m.price > priceMax) return false;
        if (query && !`${m.name} ${m.description}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [menuItems, filter, query, priceMax],
  );
  return (
    <>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-brand">Full menu</p>
          <h1 className="mt-2 font-display text-5xl sm:text-6xl">Explore the menu</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            From flame-grilled burgers to wood-fired pizza — every craving, sorted.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div>
              <label className="text-sm font-semibold">Search</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search food..."
                  className="h-11 rounded-full pl-9"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Max price</label>
                <span className="text-sm font-bold text-brand">${priceMax}</span>
              </div>
              <Slider
                value={[priceMax]}
                onValueChange={(v) => setPriceMax(v[0])}
                max={20}
                min={2}
                step={1}
                className="mt-4"
              />
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    "rounded-full px-4 py-2 text-sm font-semibold transition " +
                    (filter === f
                      ? "bg-ink text-cream"
                      : "bg-secondary text-foreground hover:bg-accent")
                  }
                >
                  {f}
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border p-16 text-center">
                <p className="font-display text-2xl">Nothing matches</p>
                <p className="mt-1 text-sm text-muted-foreground">Try widening your filters.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((m) => (
                  <FoodCard key={m.id} item={m} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
