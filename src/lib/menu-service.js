import { supabase } from "./supabase.js";
import { menu as defaultMenu } from "./menu-data.js";

const LOCAL_STORAGE_KEY = "flamebox_custom_menu";

export function getCachedMenuItems() {
  if (typeof window === "undefined") return defaultMenu;
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return defaultMenu;
}

export async function fetchMenuItems() {
  const cached = getCachedMenuItems();

  if (!supabase) return cached;

  try {
    // Quick non-blocking attempt (1 second timeout)
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 1000)
    );

    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*")
          .order("created_at", { ascending: true });

        if (error || !data || data.length === 0) {
          return cached;
        }

        const mapped = data.map((item) => ({
          id: String(item.id),
          name: item.name,
          description: item.description || "",
          price: Number(item.price),
          image: item.image || defaultMenu[0]?.image,
          category: item.category || "Burgers",
          rating: Number(item.rating || 4.8),
          bestseller: Boolean(item.bestseller),
          spicy: Boolean(item.spicy),
          veg: Boolean(item.veg),
          inStock: Boolean(item.in_stock ?? item.inStock ?? true),
        }));

        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mapped));
        }
        return mapped;
      } catch {
        return cached;
      }
    })();

    const result = await Promise.race([fetchPromise, timeoutPromise]);
    if (result && !result.timeout && Array.isArray(result)) {
      return result;
    }
    return cached;
  } catch (err) {
    return cached;
  }
}

export async function saveMenuItemToSupabase(dish) {
  const payload = {
    id: String(dish.id || `dish-${Date.now()}`),
    name: dish.name,
    description: dish.description,
    price: Number(dish.price),
    image: dish.image,
    category: dish.category,
    rating: Number(dish.rating || 4.8),
    bestseller: Boolean(dish.bestseller),
    spicy: Boolean(dish.spicy),
    veg: Boolean(dish.veg),
    in_stock: Boolean(dish.inStock ?? true),
  };

  try {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("menu_items")
      .upsert(payload, { onConflict: "id" })
      .select();

    if (error) {
      console.warn("Supabase upsert menu item:", error.message);
    }
    // Persist the freshest data to localStorage so UI survives reloads
    if (data && typeof window !== "undefined") {
      const fresh = Array.isArray(data) ? data : [data];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fresh));
    }
    return data;
  } catch (err) {
    console.warn("Supabase connection error:", err);
    return null;
  }
}

export async function deleteMenuItemFromSupabase(id) {
  try {
    if (!supabase) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", String(id));
    if (!error) {
      // Update cached menu in localStorage
      const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || "[]");
      const updated = cached.filter((i) => i.id !== String(id));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } else {
      console.warn("Supabase delete error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase connection error:", err);
  }
}

export function subscribeToMenuChanges(onChangeCallback) {
  if (typeof window === "undefined" || !supabase) return () => {};
  try {
    const channel = supabase
      .channel("public:menu_items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        async () => {
          const freshData = await fetchMenuItems();
          onChangeCallback(freshData);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          try {
            supabase.removeChannel(channel);
          } catch {}
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
    };
  } catch (e) {
    return () => {};
  }
}
