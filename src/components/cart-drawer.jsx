import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
export function CartDrawer() {
  const { lines, inc, dec, remove, subtotal, open, setOpen, count } = useCart();
  const navigate = useNavigate();
  const delivery = subtotal > 0 ? 2.99 : 0;
  const total = subtotal + delivery;
  const checkout = () => {
    setOpen(false);
    navigate({ to: "/checkout" });
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b p-6">
          <SheetTitle className="flex items-center gap-2 font-display text-2xl">
            <ShoppingBag className="h-5 w-5" /> Your Cart ({count})
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <ShoppingBag className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add something delicious to get started.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <ul className="space-y-3">
                {lines.map((l) => (
                  <li
                    key={l.item.id}
                    className="flex gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <img
                      src={l.item.image}
                      alt={l.item.name}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      loading="lazy"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold">{l.item.name}</p>
                        <button
                          onClick={() => remove(l.item.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-brand font-bold">${l.item.price.toFixed(2)}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-border">
                          <button
                            onClick={() => dec(l.item.id)}
                            className="grid h-8 w-8 place-items-center hover:bg-secondary"
                            aria-label="Decrease"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                          <button
                            onClick={() => inc(l.item.id)}
                            className="grid h-8 w-8 place-items-center hover:bg-secondary"
                            aria-label="Increase"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold">
                          ${(l.qty * l.item.price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t bg-secondary/40 p-6">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>${delivery.toFixed(2)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-brand">${total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                onClick={checkout}
                className="mt-4 h-12 w-full rounded-full bg-brand text-brand-foreground text-base font-semibold hover:bg-brand/90"
              >
                Proceed to Checkout
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
