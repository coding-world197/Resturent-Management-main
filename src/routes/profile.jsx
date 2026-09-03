import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: "", phone: "", avatar_url: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load profile data when user is present
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, avatar_url")
        .eq("id", user.id)
        .single();
      if (error) {
        toast.error("Failed to load profile");
        console.error(error);
      } else {
        setProfile({
          full_name: data.full_name ?? "",
          phone: data.phone ?? "",
          avatar_url: data.avatar_url ?? "",
        });
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
    if (uploadError) {
      toast.error("Avatar upload failed");
      setUploading(false);
      return;
    }
    const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = publicData?.publicUrl;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);
    if (updateError) {
      toast.error("Failed to save avatar URL");
    } else {
      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));
      toast.success("Avatar updated");
    }
    setUploading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq("id", user.id);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-[85vh] items-center justify-center">
        <p className="text-muted-foreground">Please log in to view your profile.</p>
        <Button onClick={() => navigate({ to: "/login" })} className="ml-4">Log In</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <Avatar className="h-24 w-24 mb-4">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Avatar" />
            ) : (
              <AvatarFallback>{profile.full_name?.[0] ?? "U"}</AvatarFallback>
            )}
          </Avatar>
          <label htmlFor="avatar-upload" className="cursor-pointer text-sm text-brand hover:underline">
            {uploading ? "Uploading..." : "Change Avatar"}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="John Doe"
              value={profile.full_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="+1 555‑123‑4567"
              value={profile.phone}
              onChange={handleChange}
            />
          </div>
          <Button type="submit" className="w-full bg-brand text-brand-foreground hover:bg-brand/90" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={signOut} className="w-full">Log Out</Button>
        </div>
      </div>
    </div>
  );
}
