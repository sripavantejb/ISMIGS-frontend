import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSectorAdminPosts,
  postSectorAdminDecision,
  type SectorAdminPostRow,
} from "@/services/sectorApi";

function PostCard({
  row,
  onRespond,
  isResponding,
}: {
  row: SectorAdminPostRow;
  onRespond: (id: string, action: "approve" | "reject") => void;
  isResponding: string | null;
}) {
  const isPending = row.status === "pending";
  const canRespond = isPending;

  return (
    <Card className="border-zinc-800 bg-zinc-900/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base text-zinc-100">
            {row.commodity || "LinkedIn post"}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {row.created_at
              ? new Date(row.created_at).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "—"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-zinc-800/50 p-3 text-sm text-zinc-300 whitespace-pre-wrap">
          {row.post_content || "—"}
        </div>
        {Array.isArray(row.hashtags) && row.hashtags.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Hashtags: {row.hashtags.join(" ")}
          </p>
        )}
        {isPending && (
          <div className="flex items-center gap-2 pt-2">
            {canRespond ? (
              <>
                <Button
                  size="sm"
                  onClick={() => onRespond(row.id, "approve")}
                  disabled={isResponding !== null}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isResponding === row.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onRespond(row.id, "reject")}
                  disabled={isResponding !== null}
                >
                  {isResponding === row.id ? null : (
                    <>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </>
                  )}
                </Button>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Already responded</span>
            )}
          </div>
        )}
        {row.status === "approved" && (
          <p className="text-sm text-emerald-500 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Approved
          </p>
        )}
        {row.status === "rejected" && (
          <p className="text-sm text-amber-500 flex items-center gap-1">
            <XCircle className="h-4 w-4" /> Rejected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function SectorApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sector_admin_posts"],
    queryFn: () => fetchSectorAdminPosts({ limit: 50 }),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) =>
      postSectorAdminDecision(id, action),
    onSuccess: (result, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["sector_admin_posts"] });
      toast({
        title: action === "approve" ? "Approved" : "Rejected",
        description:
          action === "approve"
            ? result.webhook_sent
              ? "Post data has been sent to the connected webhook. The workflow will receive the LinkedIn post JSON."
              : "The post will be sent to LinkedIn via the connected workflow."
            : "No action taken.",
      });
    },
    onError: (e: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || "Failed to submit response.",
      });
    },
    onSettled: () => setRespondingId(null),
  });

  const handleRespond = (id: string, action: "approve" | "reject") => {
    setRespondingId(id);
    respondMutation.mutate({ id, action });
  };

  const items = (data?.items ?? []) as SectorAdminPostRow[];
  const pending = items.filter((r) => r.status === "pending");

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error ? error.message : "Failed to load decisions."}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              You may need to sign in again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-zinc-100">LinkedIn post approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {pending.length > 0
            ? `${pending.length} pending. Approve to send the post to the connected workflow.`
            : "No pending posts. New posts will appear here when your admin sends sector emails."}
        </p>
      </div>
      {items.length === 0 ? (
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No decisions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When your admin sends a test email or energy disclosure for your sector, posts will appear here for approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((row) => (
            <PostCard
              key={row.id}
              row={row}
              onRespond={handleRespond}
              isResponding={respondingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
