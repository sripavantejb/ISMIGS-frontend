import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { FarmProfileForm } from "../components/FarmProfileForm";
import { useFarmProfile } from "../hooks/useFarmProfile";

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
    <div className="p-4 sm:p-6 space-y-6 bg-background max-w-4xl w-full min-w-0">
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
