import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminDecision() {
  const [searchParams] = useSearchParams();
  const result = searchParams.get("result") || "expired";

  const isApproved = result === "approved";
  const isRejected = result === "rejected";
  const isExpired = result === "expired";

  const config = isApproved
    ? {
        icon: CheckCircle2,
        title: "Post approved",
        message: "Publishing initiated.",
        className: "text-emerald-500",
        bg: "bg-emerald-500/10 border-emerald-500/30",
      }
    : isRejected
      ? {
          icon: XCircle,
          title: "Post cancelled",
          message: "No action taken.",
          className: "text-amber-500",
          bg: "bg-amber-500/10 border-amber-500/30",
        }
      : {
          icon: Clock,
          title: "Link expired",
          message: "This link has expired or is invalid.",
          className: "text-muted-foreground",
          bg: "bg-muted/50 border-border",
        };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className={`max-w-md w-full border ${config.bg} bg-zinc-900/80 shadow-xl`}>
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <Icon className={`h-16 w-16 ${config.className}`} />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100">{config.title}</h1>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-zinc-400">{config.message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
