import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSectorList } from "@/hooks/useSectorList";
import { sendSectorTestEmail, sendTestToAllSectors } from "@/services/adminApi";
import {
  adminPanelCardClass,
  adminPanelCardHeaderClass,
  adminPanelCardContentClass,
  adminPanelLabelClass,
  adminPanelInputClass,
  adminPanelPageTitleClass,
  adminPanelPageSubtitleClass,
} from "@/lib/adminPanelStyles";

function parseLines(value: string): string[] {
  return value
    .trim()
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminDigest() {
  const { toast } = useToast();
  const groups = useSectorList();
  const [insightsText, setInsightsText] = useState("");
  const [warningsText, setWarningsText] = useState("");
  const [sectorKey, setSectorKey] = useState<string>("all");
  const [sending, setSending] = useState(false);

  const allSectors = groups.flatMap((g) => g.sectors);

  const handleSend = async () => {
    const insights = parseLines(insightsText);
    const warnings = parseLines(warningsText);
    if (insights.length === 0 && warnings.length === 0) {
      toast({
        variant: "destructive",
        title: "Add content",
        description: "Enter at least one top insight or critical warning.",
      });
      return;
    }
    setSending(true);
    try {
      if (sectorKey === "all") {
        const { sent, failed } = await sendTestToAllSectors({ insights, warnings });
        toast({
          title: "Digest sent",
          description: `LinkedIn-style digest sent to ${sent} recipient(s).${failed > 0 ? ` ${failed} failed.` : ""}`,
        });
      } else {
        const { sent } = await sendSectorTestEmail(sectorKey, undefined, { insights, warnings });
        toast({
          title: "Digest sent",
          description: `LinkedIn-style digest sent to ${sent} recipient(s).`,
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: e instanceof Error ? e.message : "Failed to send digest",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 min-w-0 w-full">
      <div className="min-w-0">
        <h1 className={adminPanelPageTitleClass}>Email digest</h1>
        <p className={adminPanelPageSubtitleClass}>
          Send top insights and critical warnings as a LinkedIn-style post. Content is generated via OpenAI and sent to sector recipients.
        </p>
      </div>

      <Card className={adminPanelCardClass}>
        <CardHeader className={adminPanelCardHeaderClass}>
          <CardTitle className="text-zinc-100 text-base">Top insights & critical warnings</CardTitle>
          <CardDescription className="text-zinc-400">One item per line. Backend will format this as a professional LinkedIn-style post using OpenAI.</CardDescription>
        </CardHeader>
        <CardContent className={adminPanelCardContentClass + " space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="digest-insights" className={adminPanelLabelClass}>Top insights</Label>
            <textarea
              id="digest-insights"
              className={adminPanelInputClass + " w-full min-h-[100px] px-3 py-2 text-sm"}
              placeholder="e.g. GDP growth at 7.2% YoY&#10;Energy balance ratio improved in Q3&#10;WPI inflation easing in major groups"
              value={insightsText}
              onChange={(e) => setInsightsText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="digest-warnings" className={adminPanelLabelClass}>Critical warnings</Label>
            <textarea
              id="digest-warnings"
              className={adminPanelInputClass + " w-full min-h-[100px] px-3 py-2 text-sm"}
              placeholder="e.g. Industrial stress: 3 consecutive months of negative IIP growth&#10;WPI inflation above 6% in fuel group"
              value={warningsText}
              onChange={(e) => setWarningsText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="digest-sector" className={adminPanelLabelClass}>Send to</Label>
            <select
              id="digest-sector"
              className={adminPanelInputClass}
              value={sectorKey}
              onChange={(e) => setSectorKey(e.target.value)}
            >
              <option value="all">All sectors</option>
              {allSectors.map((s) => (
                <option key={s.sectorKey} value={s.sectorKey}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleSend} disabled={sending} className="rounded-lg w-full sm:w-auto">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2">Generate & send</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
