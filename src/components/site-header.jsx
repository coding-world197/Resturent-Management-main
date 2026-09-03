import { Link, useRouteContext } from "@tanstack/react-router";
import { ShoppingBag, Flame, Menu as MenuIcon, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const baseNav = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/about", label: "About" },
];

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const context = useRouteContext({ strict: false });
  const { user, signOut } = useAuth();

  const isAdmin = Boolean(context?.auth?.isAuthenticated && context?.auth?.user?.role === "admin");
  const navItems = isAdmin ? [...baseNav, { to: "/admin", label: "Admin" }] : baseNav;

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl tracking-wide">
            FLAME<span className="text-brand">BOX</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary border border-border transition hover:bg-muted"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary border border-border transition hover:bg-muted"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 border border-brand/20 transition hover:bg-brand/20 text-brand font-bold"
                  aria-label="User profile"
                >
                  {user.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="text-muted-foreground">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" className="rounded-full">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col p-2">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
