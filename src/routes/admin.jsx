import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  ShoppingBag,
  ChefHat,
  Settings,
  X,
  Phone,
  MapPin,
  Star,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  Printer,
  Send,
  Moon,
  Sun,
  Users,
  Flame,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCheck,
  Check,
  Clock,
  ArrowRight,
  FileText,
  Copy,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { menu as defaultMenu, categories as defaultCategories } from "@/lib/menu-data";
import { checkAdminAuth, logoutAdmin } from "@/lib/auth";
import {
  fetchMenuItems,
  saveMenuItemToSupabase,
  deleteMenuItemFromSupabase,
  subscribeToMenuChanges,
} from "@/lib/menu-service";
import OverviewTab from "./OverviewTab";
import LiveOrdersTab from "./LiveOrdersTab";
import MenuManagementTab from "./MenuManagementTab";
import UsersRolesTab from "./UsersRolesTab";
import { useTheme } from "@/components/theme-provider";
import { PORTAL_ROLES, canAccessTab, getDefaultTab } from "@/lib/permissions";
import { fetchProfiles, subscribeToProfilesChanges } from "@/lib/user-service";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const auth = await checkAdminAuth();
    if (!auth.isAuthenticated || !PORTAL_ROLES.includes(auth.user?.role)) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href },
      });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Flamebox" },
      {
        name: "description",
        content: "Manage live orders, menu items, restaurant settings and sales analytics.",
      },
    ],
  }),
  component: AdminDashboard,
});

// Dual-tone restaurant notification chime using Web Audio API
function playOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2: 880.00 Hz (A5 chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.22, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn("Audio chime playback blocked or unavailable:", err);
  }
}

function AdminDashboard() {
  const navigate = useNavigate();
  const { auth } = Route.useRouteContext();
  const userRole = auth?.user?.role || "admin";
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(() => getDefaultTab(userRole));

  // Enforce role-based tab restrictions
  useEffect(() => {
    if (!canAccessTab(userRole, activeTab)) {
      setActiveTab(getDefaultTab(userRole));
    }
  }, [userRole, activeTab]);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Notification & Sound State
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("flamebox_notifications") || "[]");
    } catch {
      return [];
    }
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem("flamebox_sound_enabled") !== "false";
    } catch {
      return true;
    }
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const soundEnabledRef = useRef(soundEnabled);
  const processedOrderIdsRef = useRef(new Set());
  const isInitialLoadDone = useRef(false);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Unlock browser audio restrictions on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          ctx.resume().then(() => ctx.close()).catch(() => {});
        }
      } catch {}
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEnabledRef.current = next;
    try {
      localStorage.setItem("flamebox_sound_enabled", String(next));
    } catch {}
    if (next) {
      playOrderChime();
      toast.info("Order notification sound enabled 🔔");
    } else {
      toast.info("Order notification sound muted 🔕");
    }
  };

  const markAsRead = (notifId) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      try {
        localStorage.setItem("flamebox_notifications", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem("flamebox_notifications", JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast.success("All notifications marked as read");
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem("flamebox_notifications");
    } catch {}
    toast.info("Notifications cleared");
  };

  const handleIncomingOrder = (newRawOrder) => {
    if (!newRawOrder || !newRawOrder.id) return;
    if (processedOrderIdsRef.current.has(newRawOrder.id)) return;
    processedOrderIdsRef.current.add(newRawOrder.id);

    const normalized = {
      ...newRawOrder,
      paymentMethod: newRawOrder.payment_method || newRawOrder.paymentMethod || "card",
      payment_method: newRawOrder.payment_method || newRawOrder.paymentMethod || "card",
      createdAt: newRawOrder.created_at || newRawOrder.createdAt || new Date().toISOString(),
      created_at: newRawOrder.created_at || newRawOrder.createdAt || new Date().toISOString(),
      subtotal: Number(newRawOrder.subtotal || 0),
      delivery: Number(newRawOrder.delivery || 0),
      tax: Number(newRawOrder.tax || 0),
      total: Number(newRawOrder.total || 0),
      customer: typeof newRawOrder.customer === "string" ? JSON.parse(newRawOrder.customer) : (newRawOrder.customer || {}),
      items: Array.isArray(newRawOrder.items) ? newRawOrder.items : (typeof newRawOrder.items === "string" ? JSON.parse(newRawOrder.items) : []),
    };

    // Prepend to existing orders state immediately
    setOrders((prev) => [normalized, ...prev.filter((o) => o.id !== normalized.id)]);

    // Only notify if this arrived in real-time after initial load
    if (isInitialLoadDone.current) {
      const customerName = normalized.customer?.name || "Valued Customer";
      const newNotif = {
        id: `notif-${normalized.id}-${Date.now()}`,
        orderId: normalized.id,
        customerName,
        total: normalized.total,
        time: new Date().toISOString(),
        read: false,
      };

      setNotifications((prev) => {
        const updated = [newNotif, ...prev.filter((n) => n.orderId !== normalized.id)];
        try {
          localStorage.setItem("flamebox_notifications", JSON.stringify(updated.slice(0, 50)));
        } catch {}
        return updated;
      });

      // Play audio chime if sound is enabled
      if (soundEnabledRef.current) {
        playOrderChime();
      }

      // Show real-time order toast
      toast.success(`🔥 New Order #${normalized.id} Received!`, {
        description: `${customerName} • $${normalized.total.toFixed(2)} (${normalized.items.length} items)`,
        action: {
          label: "View Order",
          onClick: () => setActiveTab("orders"),
        },
        duration: 8000,
      });
    }
  };

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
  const [menuItems, setMenuItems] = useState(defaultMenu);
  const [orderFilter, setOrderFilter] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Add/Edit Dish Modal State
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Burgers",
    rating: 4.8,
    image: "",
    spicy: false,
    veg: false,
    bestseller: false,
    inStock: true,
  });

  // Settings State
  const [settings, setSettings] = useState({
    storeOpen: true,
    deliveryFee: "2.99",
    taxRate: "8.0",
    estimatedPrepTime: "25-35",
    announcement: "🔥 Weekend Special: Free drink on orders above $30!",
  });

  // Load Initial Data from backend API and poll for updates
  // Listen for logout events from Sidebar
  useEffect(() => {
    const handleSidebarLogout = () => {
      handleLogout();
    };
    window.addEventListener("admin-logout", handleSidebarLogout);
    return () => window.removeEventListener("admin-logout", handleSidebarLogout);
  }, []);

  const fetchOrders = async () => {
    try {
      let fetchedOrders = null;

      // 1. Try backend API first
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const headers = { "Content-Type": "application/json" };
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch("/api/admin/orders", {
          method: "GET",
          headers,
          credentials: "omit",
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.orders)) {
            fetchedOrders = data.orders;
          }
        }
      } catch (apiErr) {
        console.warn("API orders fetch warning, falling back to direct Supabase query:", apiErr);
      }

      // 2. Direct Supabase query as robust fallback / direct source
      if (!fetchedOrders && supabase) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          fetchedOrders = data;
        } else if (error) {
          console.error("Direct Supabase orders fetch error:", error);
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

        normalized.forEach((o) => {
          if (o.id) processedOrderIdsRef.current.add(o.id);
        });
        isInitialLoadDone.current = true;

        setOrders(normalized);
        localStorage.setItem("flamebox_orders", JSON.stringify(normalized));
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    }
  };

  // Fetch users directly from Supabase profiles table
  const fetchUsers = async () => {
    try {
      const profiles = await fetchProfiles();
      if (Array.isArray(profiles)) {
        setUsers(profiles);
      }
    } catch (e) {
      console.error("Failed to fetch users:", e);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchUsers();

    // Subscribe to real-time changes in Supabase orders
    let orderChannel = null;
    if (supabase) {
      orderChannel = supabase
        .channel("public:orders-admin-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            if (payload.new) {
              handleIncomingOrder(payload.new);
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders" },
          (payload) => {
            if (payload.new) {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === payload.new.id
                    ? {
                        ...o,
                        ...payload.new,
                        status: payload.new.status,
                        paymentMethod: payload.new.payment_method || payload.new.paymentMethod || o.paymentMethod,
                      }
                    : o
                )
              );
            }
          }
        )
        .subscribe((status) => {
          console.log("Supabase Realtime orders subscription status:", status);
        });
    }

    const interval = setInterval(fetchOrders, 10000);

    // Subscribe to real-time profiles updates (e.g. role changes in Supabase dashboard)
    const unsubscribeProfiles = subscribeToProfilesChanges((payload) => {
      if (payload.eventType === "UPDATE" && payload.new) {
        setUsers((prev) =>
          prev.map((u) => (u.id === payload.new.id ? { ...u, ...payload.new } : u))
        );
      } else if (payload.eventType === "INSERT" && payload.new) {
        setUsers((prev) => [payload.new, ...prev.filter((u) => u.id !== payload.new.id)]);
      } else if (payload.eventType === "DELETE" && payload.old) {
        setUsers((prev) => prev.filter((u) => u.id !== payload.old.id));
      }
    });

    return () => {
      clearInterval(interval);
      if (typeof unsubscribeProfiles === "function") {
        unsubscribeProfiles();
      }
      if (orderChannel && supabase) {
        try {
          supabase.removeChannel(orderChannel);
        } catch {}
      }
    };
  }, []);

  // Ensure fresh user profiles are loaded whenever navigating to the users tab
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const updateMenu = (items) => {
      if (isMounted && Array.isArray(items) && items.length > 0) {
        setMenuItems(items);
      }
    };

    const loadMenu = async () => {
      updateMenu(await fetchMenuItems());
      if (!isMounted) return;

      unsubscribe = subscribeToMenuChanges(updateMenu);
    };

    loadMenu();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const saveOrders = (updated) => {
    setOrders(updated);
    localStorage.setItem("flamebox_orders", JSON.stringify(updated));
  };

  const saveMenu = (updated) => {
    setMenuItems(updated);
    localStorage.setItem("flamebox_custom_menu", JSON.stringify(updated));
  };

  const [printingOrder, setPrintingOrder] = useState(null);
  const [copiedSlipId, setCopiedSlipId] = useState(null);

  // Receipt & Slip Helpers
  const getWhatsAppSlipText = (order) => {
    const itemsList = (order.items || [])
      .map((i) => `• ${i.qty}x ${i.name} - $${(i.price * i.qty).toFixed(2)}`)
      .join("\n");

    const sub = order.subtotal || order.total - (order.delivery || 0) - (order.tax || 0);

    return (
      `🔥 *FLAMEBOX FAST-FOOD RECEIPT* 🔥\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📋 *Order ID:* #${order.id}\n` +
      `👤 *Customer:* ${order.customer?.name || "Valued Customer"}\n` +
      `📞 *Phone:* ${order.customer?.phone || "N/A"}\n` +
      `📍 *Address:* ${order.customer?.address || "Store Pickup"}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🍔 *ITEMS ORDERED:*\n${itemsList}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💵 *Subtotal:* $${Number(sub || 0).toFixed(2)}\n` +
      `🛵 *Delivery Fee:* $${Number(order.delivery || 0).toFixed(2)}\n` +
      `🏷️ *Tax:* $${Number(order.tax || 0).toFixed(2)}\n` +
      `💰 *TOTAL AMOUNT:* $${Number(order.total || 0).toFixed(2)}\n` +
      `💳 *Payment Method:* ${(order.paymentMethod || "CARD").toUpperCase()}\n` +
      `⚡ *Order Status:* ${order.status}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Thank you for ordering with Flamebox! Fresh, Fast, Flame-Grilled! 🔥`
    );
  };

  const handleSendWhatsAppSlip = (order) => {
    const text = getWhatsAppSlipText(order);
    const cleanPhone = (order.customer?.phone || "").replace(/[^0-9]/g, "");
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp with order receipt slip...");
  };

  const handleCopySlipText = (order) => {
    const text = getWhatsAppSlipText(order);
    navigator.clipboard.writeText(text);
    setCopiedSlipId(order.id);
    toast.success("Receipt slip copied to clipboard!");
    setTimeout(() => setCopiedSlipId(null), 3000);
  };

  // Status Change handler - persists directly to Supabase and updates UI
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    setOrders(updated);
    saveOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: nextStatus });
    }
    if (printingOrder && printingOrder.id === orderId) {
      setPrintingOrder({ ...printingOrder, status: nextStatus });
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
      console.error("Error updating order status:", err);
      toast.error("Error updating order status in database");
      fetchOrders();
    }
  };

  const availableCategories = useMemo(() => {
    const set = new Set(defaultCategories);
    menuItems.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [menuItems]);

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setDishForm((prev) => ({ ...prev, image: reader.result }));
        toast.success("Local image file attached!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Menu Management Handlers
  const handleOpenAddDish = () => {
    setEditingDish(null);
    setDishForm({
      name: "",
      description: "",
      price: "",
      category: "Burgers",
      rating: 4.8,
      image: defaultMenu[0]?.image || "",
      spicy: false,
      veg: false,
      bestseller: false,
      inStock: true,
    });
    setDishModalOpen(true);
  };

  const handleOpenEditDish = (dish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      category: dish.category,
      rating: dish.rating || 4.8,
      image: dish.image || "",
      spicy: !!dish.spicy,
      veg: !!dish.veg,
      bestseller: !!dish.bestseller,
      inStock: dish.inStock !== false,
    });
    setDishModalOpen(true);
  };

  const handleSaveDish = async (e) => {
    e.preventDefault();
    if (!dishForm.name || !dishForm.price || !dishForm.description) {
      toast.error("Please fill in name, price and description");
      return;
    }

    const priceNum = parseFloat(dishForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid positive price");
      return;
    }

    if (editingDish) {
      const updatedDish = {
        ...editingDish,
        ...dishForm,
        price: priceNum,
      };
      const updated = menuItems.map((item) => (item.id === editingDish.id ? updatedDish : item));
      saveMenu(updated);
      await saveMenuItemToSupabase(updatedDish);
      toast.success(`"${dishForm.name}" updated successfully!`);
    } else {
      const newDish = {
        id: `dish-${Date.now()}`,
        ...dishForm,
        price: priceNum,
        image: dishForm.image || defaultMenu[0]?.image,
      };
      const updated = [newDish, ...menuItems];
      saveMenu(updated);
      await saveMenuItemToSupabase(newDish);
      toast.success(`"${dishForm.name}" added to menu!`);
    }
    setDishModalOpen(false);
  };

  const handleDeleteDish = async (dishId, dishName) => {
    if (confirm(`Are you sure you want to remove "${dishName}" from the menu?`)) {
      const updated = menuItems.filter((i) => i.id !== dishId);
      saveMenu(updated);
      await deleteMenuItemFromSupabase(dishId);
      toast.success(`"${dishName}" deleted.`);
    }
  };

  const handleToggleStock = async (dishId) => {
    const updated = menuItems.map((item) =>
      item.id === dishId ? { ...item, inStock: !item.inStock } : item,
    );
    saveMenu(updated);
    const dish = updated.find((d) => d.id === dishId);
    if (dish) {
      await saveMenuItemToSupabase(dish);
    }
    toast.info(`${dish?.name} is now ${dish?.inStock ? "In Stock" : "Sold Out"}`);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("flamebox_settings", JSON.stringify(settings));
    toast.success("Restaurant settings updated successfully!");
  };

  // Calculations
  const totalRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const preparingCount = orders.filter((o) => o.status === "Preparing").length;
  const activeCount = pendingCount + preparingCount;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    return o.status.toLowerCase() === orderFilter.toLowerCase();
  });

  const filteredMenu = menuItems.filter((dish) => {
    const matchesCategory = selectedCategory === "All" || dish.category === selectedCategory;
    const matchesSearch =
      dish.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      dish.description.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-amber-500/30">
            Pending
          </Badge>
        );
      case "Preparing":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/20 border-blue-500/30">
            Preparing 🔥
          </Badge>
        );
      case "Out for Delivery":
        return (
          <Badge className="bg-purple-500/15 text-purple-600 hover:bg-purple-500/20 border-purple-500/30">
            On Way 🛵
          </Badge>
        );
      case "Delivered":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">
            Delivered
          </Badge>
        );
      case "Cancelled":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/20 border-rose-500/30">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleUpdateUserRole = async (userId, newRole, oldRole) => {
    if (newRole === oldRole) {
      toast.info("Role unchanged.");
      return;
    }
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    setUpdatingUserId(userId);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Not authenticated. Please log in again.");
        return;
      }
      const response = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ userId, newRole }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || "Failed to update user role");
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success("User role updated successfully");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Error updating user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userRole} />
      <main className="flex-1 overflow-auto p-4">
        {/* Top Header */}
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
              <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand">
                {userRole === "chef" ? "Chef Portal" : "Admin Portal"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs">
                <span
                  className={`h-2 w-2 rounded-full ${settings.storeOpen ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                />
                <span className="font-medium">
                  {settings.storeOpen ? "Kitchen Accepting Orders" : "Kitchen Offline"}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full">
                <Link to="/">View Storefront</Link>
              </Button>

              {/* Notification Bell with Real-Time Unread Badge & Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative grid h-9 w-9 place-items-center rounded-full bg-secondary border border-border transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand"
                  aria-label="Notifications"
                >
                  {notifications.filter((n) => !n.read).length > 0 ? (
                    <BellRing className="h-4.5 w-4.5 text-brand animate-bounce" />
                  ) : (
                    <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                  )}
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-background">
                      {notifications.filter((n) => !n.read).length > 99
                        ? "99+"
                        : notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl p-4 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-base font-bold">Notifications</h4>
                        {notifications.filter((n) => !n.read).length > 0 && (
                          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                            {notifications.filter((n) => !n.read).length} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleSound}
                          className={`grid h-7 w-7 place-items-center rounded-lg border transition ${
                            soundEnabled
                              ? "border-brand/30 bg-brand/10 text-brand"
                              : "border-border bg-secondary text-muted-foreground"
                          }`}
                          title={soundEnabled ? "Mute notification sound" : "Enable notification sound"}
                        >
                          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                        </button>
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="flex items-center gap-1 rounded-lg border border-border bg-secondary/50 px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground"
                            title="Mark all as read"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Mark all read</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notifications List */}
                    <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          <Bell className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                          <p className="font-medium">No notifications yet</p>
                          <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                            New orders will appear here automatically
                          </p>
                        </div>
                      ) : (
                        notifications.slice(0, 30).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              setActiveTab("orders");
                              setNotifOpen(false);
                            }}
                            className={`group flex items-start justify-between gap-3 rounded-xl p-3 text-xs transition cursor-pointer border ${
                              !n.read
                                ? "bg-brand/5 border-brand/25 hover:bg-brand/10"
                                : "bg-secondary/30 border-transparent hover:bg-secondary/60 text-muted-foreground"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0 flex-1">
                              <div
                                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${
                                  !n.read ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <ShoppingBag className="h-3.5 w-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground">
                                    Order #{n.orderId}
                                  </span>
                                  {!n.read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                                  )}
                                </div>
                                <p className="truncate text-muted-foreground">
                                  {n.customerName} • <strong className="text-foreground">${Number(n.total || 0).toFixed(2)}</strong>
                                </p>
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(n.time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            {!n.read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(n.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-background transition text-muted-foreground hover:text-foreground"
                                title="Mark as read"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={clearAllNotifications}
                          className="text-muted-foreground hover:text-destructive text-[11px] transition"
                        >
                          Clear all
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("orders");
                            setNotifOpen(false);
                          }}
                          className="text-brand font-semibold text-[11px] hover:underline flex items-center gap-1"
                        >
                          <span>View Live Orders</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="grid h-9 w-9 place-items-center rounded-full bg-secondary border border-border transition hover:bg-muted"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && canAccessTab(userRole, "overview") && (
          <OverviewTab
            totalRevenue={totalRevenue}
            orders={orders}
            activeCount={activeCount}
            settings={settings}
            menuItems={menuItems}
            setActiveTab={setActiveTab}
            getStatusBadge={getStatusBadge}
          />
        )}

        {/* TAB 2: LIVE ORDERS */}
        {activeTab === "orders" && canAccessTab(userRole, "orders") && (
          <LiveOrdersTab
            orders={orders}
            filteredOrders={filteredOrders}
            orderFilter={orderFilter}
            setOrderFilter={setOrderFilter}
            activeCount={activeCount}
            handleUpdateOrderStatus={handleUpdateOrderStatus}
            handleToggleStock={handleToggleStock}
            handleSendWhatsAppSlip={handleSendWhatsAppSlip}
            setPrintingOrder={setPrintingOrder}
            handleOpenAddDish={handleOpenAddDish}
            saveOrders={saveOrders}
            toast={toast}
            getStatusBadge={getStatusBadge}
            fetchOrders={fetchOrders}
          />
        )}

        {/* TAB 3: MENU MANAGEMENT */}
        {activeTab === "menu" && canAccessTab(userRole, "menu") && (
          <MenuManagementTab
            filteredMenu={filteredMenu}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            availableCategories={availableCategories}
            menuSearch={menuSearch}
            setMenuSearch={setMenuSearch}
            handleOpenAddDish={handleOpenAddDish}
            editingDish={editingDish}
            dishForm={dishForm}
            setDishForm={setDishForm}
            handleImageFileUpload={handleImageFileUpload}
            handleToggleStock={handleToggleStock}
            handleDeleteDish={handleDeleteDish}
            handleSaveDish={handleSaveDish}
            toast={toast}
            handleOpenEditDish={handleOpenEditDish}
          />
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && canAccessTab(userRole, "settings") && (
          <div className="mt-6 max-w-2xl mx-auto rounded-3xl border border-border bg-card p-6 shadow-sm animate-in fade-in-50 duration-300">
            <h2 className="font-display text-2xl">Store & Kitchen Settings</h2>
            <p className="text-xs text-muted-foreground mb-6">
              Configure restaurant operational parameters and fees
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="flex items-center justify-between rounded-2xl border border-border p-4 bg-secondary/30">
                <div>
                  <h4 className="font-semibold text-sm">Store Accepting Orders</h4>
                  <p className="text-xs text-muted-foreground">
                    Toggle offline to stop accepting new orders during rush hours.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.storeOpen}
                  onChange={(e) => setSettings({ ...settings, storeOpen: e.target.checked })}
                  className="h-5 w-5 rounded border-border text-brand focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="deliveryFee" className="text-xs">
                    Standard Delivery Fee ($)
                  </Label>
                  <Input
                    id="deliveryFee"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="taxRate" className="text-xs">
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="taxRate"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="prepTime" className="text-xs">
                  Estimated Preparation Time (Minutes)
                </Label>
                <Input
                  id="prepTime"
                  value={settings.estimatedPrepTime}
                  onChange={(e) => setSettings({ ...settings, estimatedPrepTime: e.target.value })}
                  placeholder="e.g. 25-35"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="announcement" className="text-xs">
                  Header Announcement Message
                </Label>
                <Textarea
                  id="announcement"
                  value={settings.announcement}
                  onChange={(e) => setSettings({ ...settings, announcement: e.target.value })}
                  rows={2}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  type="submit"
                  className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90 px-6"
                >
                  Save Settings
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 6: USERS & ROLES */}
        {activeTab === "users" && canAccessTab(userRole, "users") && (
          <UsersRolesTab
            users={users}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            updatingUserId={updatingUserId}
            setUpdatingUserId={setUpdatingUserId}
            fetchUsers={fetchUsers}
            toast={toast}
          />
        )}

        {/* ADD / EDIT DISH MODAL */}
        {dishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-display text-2xl">
                  {editingDish ? "Edit Dish" : "Add New Dish"}
                </h3>
                <button
                  onClick={() => setDishModalOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDish} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Dish Name</Label>
                  <Input
                    value={dishForm.name}
                    onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                    placeholder="e.g. Smoky BBQ Bacon Burger"
                    className="rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Category</Label>
                    <Input
                      list="category-suggestions"
                      value={dishForm.category}
                      onChange={(e) => setDishForm({ ...dishForm, category: e.target.value })}
                      placeholder="e.g. Burgers, Wraps, Deals..."
                      className="rounded-xl text-xs"
                      required
                    />
                    <datalist id="category-suggestions">
                      {availableCategories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={dishForm.price}
                      onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                      placeholder="9.99"
                      className="rounded-xl"
                      required
                    />
                  </div>
                </div>

                {/* Image Input & Upload */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Dish Image</Label>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="dish-image-file"
                        className="hidden"
                        onChange={handleImageFileUpload}
                      />
                      <label
                        htmlFor="dish-image-file"
                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/50 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                      >
                        <Upload className="h-4 w-4 text-brand" />
                        <span>Choose Image File from Computer</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="shrink-0 text-[11px]">or Image URL:</span>
                      <Input
                        value={dishForm.image}
                        onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                        placeholder="https://example.com/photo.jpg"
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>

                    {/* Live Image Preview */}
                    {dishForm.image && (
                      <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-2">
                        <img
                          src={dishForm.image}
                          alt="Preview"
                          className="h-14 w-14 rounded-xl object-cover border border-border bg-card"
                        />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-semibold text-foreground truncate">
                            Selected Picture
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {dishForm.image.startsWith("data:")
                              ? "Uploaded Local Image File"
                              : dishForm.image}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDishForm({ ...dishForm, image: "" })}
                          className="grid h-7 w-7 place-items-center rounded-full hover:bg-destructive/20 text-destructive text-xs"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Description</Label>
                  <Textarea
                    value={dishForm.description}
                    onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                    placeholder="Describe ingredients, taste and toppings..."
                    rows={2}
                    className="rounded-xl text-xs"
                    required
                  />
                </div>

                {/* Tags toggles */}
                <div className="rounded-2xl bg-secondary/30 p-3 border border-border/80">
                  <Label className="text-xs font-semibold block mb-2">Item Tags & Badges</Label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dishForm.bestseller}
                        onChange={(e) => setDishForm({ ...dishForm, bestseller: e.target.checked })}
                        className="rounded text-brand"
                      />
                      <span>Bestseller</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dishForm.spicy}
                        onChange={(e) => setDishForm({ ...dishForm, spicy: e.target.checked })}
                        className="rounded text-brand"
                      />
                      <span>🌶️ Spicy</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dishForm.veg}
                        onChange={(e) => setDishForm({ ...dishForm, veg: e.target.checked })}
                        className="rounded text-brand"
                      />
                      <span>🌱 Veg</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDishModalOpen(false)}
                    className="rounded-full text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90 text-xs px-6"
                  >
                    {editingDish ? "Save Changes" : "Create Dish"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PRINTABLE ORDER SLIP / RECEIPT MODAL */}
        {printingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-50 duration-200">
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-y-auto max-h-[95vh] text-foreground">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-brand" />
                  <h3 className="font-display text-xl font-bold">Order Receipt Slip</h3>
                </div>
                <button
                  onClick={() => setPrintingOrder(null)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary text-muted-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Printable Thermal Slip Canvas */}
              <div
                id="printable-order-slip"
                className="rounded-2xl border-2 border-dashed border-border bg-background p-5 font-mono text-xs text-foreground space-y-3 shadow-inner"
              >
                {/* Header */}
                <div className="text-center pb-3 border-b border-dashed border-border space-y-1">
                  <div className="font-display text-2xl font-bold tracking-wider text-brand">
                    FLAMEBOX FAST-FOOD
                  </div>
                  <p className="text-[11px] text-muted-foreground">Fresh · Fast · Flame-Grilled</p>
                  <p className="text-[10px] text-muted-foreground">
                    Tel: +1 (555) 019-2834 · www.flamebox.com
                  </p>
                </div>

                {/* Order Meta */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-border">
                  <div className="flex justify-between">
                    <span className="font-bold">Order ID:</span>
                    <span className="font-bold text-brand">#{printingOrder.id}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Date & Time:</span>
                    <span>{new Date(printingOrder.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-semibold uppercase">
                      {printingOrder.paymentMethod || "CARD"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-emerald-500">{printingOrder.status}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-border bg-secondary/30 p-2.5 rounded-xl">
                  <p className="font-bold text-foreground">Customer Details:</p>
                  <p className="text-foreground font-medium">{printingOrder.customer?.name}</p>
                  <p className="text-muted-foreground">📞 {printingOrder.customer?.phone}</p>
                  <p className="text-muted-foreground">📍 {printingOrder.customer?.address}</p>
                  {printingOrder.customer?.notes && (
                    <p className="text-amber-500/90 italic pt-1 text-[10px]">
                      Note: {printingOrder.customer?.notes}
                    </p>
                  )}
                </div>

                {/* Items List */}
                <div className="space-y-2 pb-3 border-b border-dashed border-border">
                  <div className="flex justify-between font-bold text-[11px] text-muted-foreground uppercase border-b border-border pb-1">
                    <span>Item / Qty</span>
                    <span>Amount</span>
                  </div>
                  {printingOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div>
                        <span className="font-bold text-brand mr-1">{item.qty}x</span>
                        <span className="font-medium text-foreground">{item.name}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          @ ${Number(item.price).toFixed(2)} each
                        </span>
                      </div>
                      <span className="font-bold text-foreground">
                        ${(Number(item.price) * Number(item.qty)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Totals */}
                <div className="space-y-1.5 text-xs pb-3 border-b border-dashed border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>
                      $
                      {Number(
                        printingOrder.subtotal ||
                          printingOrder.total -
                            (printingOrder.delivery || 0) -
                            (printingOrder.tax || 0),
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee:</span>
                    <span>${Number(printingOrder.delivery || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax:</span>
                    <span>${Number(printingOrder.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-display text-lg font-bold text-brand pt-1 border-t border-border">
                    <span>TOTAL DUE:</span>
                    <span>${Number(printingOrder.total).toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center pt-2 text-[10px] text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">Thank you for dining with us!</p>
                  <p>Have questions? Call or reply on WhatsApp.</p>
                  <div className="tracking-widest font-mono text-[9px] pt-1 opacity-70">
                    ||| | |||| || ||||| |||| ||| ||||
                  </div>
                </div>
              </div>

              {/* Modal Bottom Actions */}
              <div className="mt-5 flex flex-col gap-2 pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => window.print()}
                    className="h-10 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs gap-1.5 shadow-md shadow-brand/20"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Receipt</span>
                  </Button>
                  <Button
                    onClick={() => handleSendWhatsAppSlip(printingOrder)}
                    className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send to WhatsApp</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCopySlipText(printingOrder)}
                    className="h-9 rounded-xl text-xs gap-1.5"
                  >
                    {copiedSlipId === printingOrder.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Slip Text</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPrintingOrder(null)}
                    className="h-9 rounded-xl text-xs"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default AdminDashboard;
