import { useEffect, useRef } from "react";
import { useOpenAI, SectorData } from "@/hooks/useOpenAI";
import { Button } from "@/components/ui/button";

interface OutlookSummaryProps {
  sectorName: string;
  context: SectorData;
  /** When true, request outlook automatically on mount (e.g. for energy commodity pages) */
  autoGenerate?: boolean;
}

export function OutlookSummary({ sectorName, context, autoGenerate = false }: OutlookSummaryProps) {
  const { loading, error, summary, requestOutlook } = useOpenAI();
  const requestedKeyRef = useRef<string | null>(null);

  const contextKey = JSON.stringify(context);
  useEffect(() => {
    if (!autoGenerate || !sectorName) return;
    const key = `${sectorName}:${contextKey}`;
    if (requestedKeyRef.current === key) return;
    requestedKeyRef.current = key;
    requestOutlook({ sectorName, ...context });
  }, [autoGenerate, sectorName, contextKey, requestOutlook]);

  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        What’s happening with {sectorName}
      </h3>
      <p className="text-xs text-muted-foreground">
        In simple terms: supply, use, and how you can use less.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          disabled={loading}
          onClick={() => requestOutlook({ sectorName, ...context })}
        >
          {loading ? "Generating…" : "Refresh outlook"}
        </Button>
        {error && (
          <p className="text-xs text-critical max-w-md">
            {error.startsWith("Outlook generation is not configured") ||
            error.startsWith("OpenAI API key is invalid")
              ? error
              : `Error: ${error}`}
          </p>
        )}
      </div>
      {summary && (
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground">
          {summary}
        </div>
      )}
    </div>
  );
}
