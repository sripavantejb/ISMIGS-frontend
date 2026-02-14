import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FarmProfileForm } from "../components/FarmProfileForm";
import { useFarmProfile } from "../hooks/useFarmProfile";
import { User } from "lucide-react";

export default function FarmProfile() {
  const { profile, loading, error, save } = useFarmProfile();
  const [saving, setSaving] = useState(false);

  const handleSave = async (data: Parameters<typeof save>[0]) => {
    setSaving(true);
    try {
      await save(data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-background">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6 text-emerald-400" />
          <h1 className="text-xl font-semibold text-foreground">Farm Profile</h1>
        </div>
        <p className="text-sm text-muted-foreground">Set your location, land, crops, and irrigation so other tools can tailor advice.</p>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {loading ? (
        <Skeleton className="h-64 w-full max-w-2xl rounded-xl" />
      ) : (
        <FarmProfileForm initial={profile} onSave={handleSave} saving={saving} />
      )}
    </div>
  );
}
