import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/update-password")({
  component: UpdatePassword,
});

function UpdatePassword() {
  const { updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    // Supabase redirects here with a hash in the URL containing the access token.
    // If there is no hash or session, we shouldn't be here.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setErrorState("Invalid or expired password reset link. Please try requesting a new one.");
      }
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      
      toast.success("Password updated successfully!");
      router.navigate({ to: "/" });
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (errorState) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg text-center">
          <h1 className="font-display text-2xl font-bold text-destructive mb-4">Link Expired</h1>
          <p className="text-muted-foreground">{errorState}</p>
          <Button onClick={() => router.navigate({ to: "/login" })} className="mt-6">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground mb-4">
            <Flame className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold">New Password</h1>
          <p className="text-muted-foreground mt-2 text-sm text-center">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 mt-2" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
