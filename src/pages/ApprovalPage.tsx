import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

type ApprovalState = "loading" | "ready" | "submitting" | "done" | "error";

type FetchPayload = {
  post_content: string;
  sector_key: string;
  recipient: string;
};

export default function ApprovalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<ApprovalState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<FetchPayload | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing approval token in the link.");
      setState("error");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/approve/${encodeURIComponent(token)}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Invalid or expired approval link");
        }
        const data: FetchPayload = await res.json();
        if (!cancelled) {
          setPost(data);
          setState("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load approval request");
          setState("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const submit = async (approved: boolean) => {
    if (!token || state !== "ready") return;
    setState("submitting");
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/approve/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResultMessage(approved
        ? "Thank you. This post has been approved and will be submitted for publishing."
        : "You have rejected this post. It will not be stored or published.");
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setState("ready");
    }
  };

  if (state === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
        <a href="/" className="mt-4 inline-block text-primary underline hover:text-primary/90">Return to Home</a>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-800 dark:text-green-200">
          <p className="font-medium">Done</p>
          <p className="mt-1 text-sm">{resultMessage}</p>
        </div>
        <a href="/" className="mt-4 inline-block text-primary underline hover:text-primary/90">Return to Home</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-xl font-semibold">ISMIGS – LinkedIn post approval</h1>
      <p className="mb-2 text-sm text-muted-foreground">This is the LinkedIn post we are considering. Please approve or reject below.</p>
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <pre className="whitespace-pre-wrap font-sans text-sm">{post?.post_content ?? ""}</pre>
      </div>
      {post?.sector_key && (
        <p className="mt-2 text-xs text-muted-foreground">Sector: {post.sector_key}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={state === "submitting"}
          onClick={() => submit(true)}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {state === "submitting" ? "Submitting…" : "Approve (Yes)"}
        </button>
        <button
          type="button"
          disabled={state === "submitting"}
          onClick={() => submit(false)}
          className="rounded-md border border-input bg-background px-4 py-2 hover:bg-accent disabled:opacity-50"
        >
          Reject (No)
        </button>
      </div>
    </div>
  );
}
