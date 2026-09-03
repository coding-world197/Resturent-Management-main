import { createFileRoute, useNavigate, useSearch, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Flame, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { checkAdminAuth, loginAdmin } from "@/lib/auth";

export const Route = createFileRoute("/admin_/login")({
  beforeLoad: async ({ search }) => {
    const auth = await checkAdminAuth();
    if (auth.isAuthenticated) {
      if (auth.user?.role === "admin") {
        throw redirect({
          to: search?.redirect || "/admin",
        });
      } else if (auth.user?.role === "chef") {
        throw redirect({
          to: search?.redirect || "/chef",
        });
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Admin Login — Flamebox" },
      {
        name: "description",
        content: "Secure portal for Flamebox kitchen and store administration.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdmin({ data: { username, password } });

      if (res.success) {
        toast.success("Welcome back! Redirecting...");
        const targetRoute = res.role === "chef" ? "/chef" : "/admin";
        window.location.href = search?.redirect || targetRoute;
      } else {
        setErrorMessage(res.error || "Invalid username or password.");
        toast.error(res.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast.error("An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-8 shadow-xl shadow-black/5">
          {/* Top Decorative Banner */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand/10 blur-3xl pointer-events-none" />

          {/* Logo & Header */}
          <div className="text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Flame className="h-8 w-8 animate-pulse" />
            </div>
            <h1 className="mt-4 font-display text-3xl tracking-wide">
              FLAME<span className="text-brand">BOX</span> ADMIN
            </h1>
            <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Authorized personnel portal
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-center text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                {errorMessage}
              </div>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Email
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  type="email"
                  placeholder="Enter admin email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11 rounded-xl border-border bg-background focus:bg-background transition-all text-foreground focus:ring-2 focus:ring-brand"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl border-border bg-background focus:bg-background transition-all text-foreground focus:ring-2 focus:ring-brand"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-sm transition-all shadow-lg shadow-brand/20 hover:shadow-brand/30 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-foreground border-t-transparent" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
            <p>Protected by Flamebox Server Authorization</p>
          </div>
        </div>
      </div>
    </div>
  );
}
