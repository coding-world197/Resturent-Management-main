import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";

const Ctx = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user ? `shopping_cart_${user.id}` : "shopping_cart_guest";
  const [lines, setLines] = useState([]);

  const [open, setOpen] = useState(false);

  // Sync cart to localStorage using the user‑specific key
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      try {
        const cleanLines = lines.map((l) => ({
          ...l,
          item: {
            ...l.item,
            image:
              typeof l.item.image === "string" && l.item.image.length > 50000
                ? ""
                : l.item.image,
          },
        }));
        localStorage.setItem(storageKey, JSON.stringify(cleanLines));
      } catch (e) {
        console.warn("Could not sync cart to localStorage:", e);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [lines, storageKey]);

  const add = (item) => {
    setLines((prev) => {
      const found = prev.find((l) => l.item.id === item.id);
      if (found) {
        return prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { item, qty: 1 }];
    });
    setOpen(true);
  };

  const inc = (id) =>
    setLines((p) => p.map((l) => (l.item.id === id ? { ...l, qty: l.qty + 1 } : l)));

  const dec = (id) =>
    setLines((p) =>
      p.flatMap((l) => (l.item.id === id ? (l.qty > 1 ? [{ ...l, qty: l.qty - 1 }] : []) : [l]))
    );

  const remove = (id) => setLines((p) => p.filter((l) => l.item.id !== id));
  const clear = () => setLines([]);

  const { count, subtotal } = useMemo(() => {
    let c = 0,
      s = 0;
    for (const l of lines) {
      c += l.qty;
      s += l.qty * Number(l.item.price || 0);
    }
    return { count: c, subtotal: s };
  }, [lines]);

  // Load cart when user changes (login/logout)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (user) {
      try {
        const saved = localStorage.getItem(storageKey);
        setLines(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setLines([]);
      }
    } else {
      // Guest or logged out – clear cart
      setLines([]);
    }
  }, [user, storageKey]);

  return (
    <Ctx.Provider value={{ lines, add, inc, dec, remove, clear, count, subtotal, open, setOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
