import { Star, Plus, Flame, Leaf } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
export function FoodCard({ item }) {
  const { add } = useCart();
  const itemId = String(item.id);
  const priceFormatted = Number(item.price || 0).toFixed(2);
  const imageSrc = item.image || "/assets/food-burger.jpg";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-lg hover:border-brand/30">
      <Link
        to="/menu/$id"
        params={{ id: itemId }}
        className="relative block aspect-square overflow-hidden bg-secondary"
      >
        <img
          src={imageSrc}
          alt={item.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {item.spicy && (
            <span className="flex items-center gap-1 rounded-full bg-brand px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-brand-foreground shadow-sm">
              <Flame className="h-3 w-3" /> Spicy
            </span>
          )}
          {item.veg && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-white shadow-sm">
              <Leaf className="h-3 w-3" /> Veg
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1 text-[10px] font-bold text-foreground backdrop-blur shadow-sm border border-border">
          <Star className="h-3 w-3 fill-brand text-brand" /> {item.rating || 4.8}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to="/menu/$id" params={{ id: itemId }} className="hover:text-brand transition-colors">
          <h3 className="font-display text-xl leading-tight">{item.name}</h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="font-semibold text-lg text-foreground">${priceFormatted}</span>
          <Button
            size="sm"
            onClick={() => add(item)}
            className="h-9 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-medium px-4 shadow-sm"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>
    </article>
  );
}
