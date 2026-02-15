import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Calculator, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoanEstimatorConfig } from "../hooks/useLoanEstimatorConfig";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function emi(P: number, annualRatePct: number, years: number): { emi: number; totalInterest: number } {
  if (P <= 0 || years <= 0) return { emi: 0, totalInterest: 0 };
  const r = annualRatePct / 100 / 12;
  const n = years * 12;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalInterest = emi * n - P;
  return { emi, totalInterest };
}

export default function Loans() {
  const [landAcres, setLandAcres] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [tenureYears, setTenureYears] = useState("3");
  const [ratePct, setRatePct] = useState("7");
  const hasSetDefaultRate = useRef(false);
  const { perAcreLimitLakhs, banksAndRates, loading: loanConfigLoading, error: loanConfigError, refetch: refetchLoanConfig } = useLoanEstimatorConfig();

  useEffect(() => {
    if (hasSetDefaultRate.current || !banksAndRates.length) return;
    const first = banksAndRates[0];
    if (first?.ratePct != null) {
      setRatePct(String(first.ratePct));
      hasSetDefaultRate.current = true;
    }
  }, [banksAndRates]);

  const estLimitLakhs = useMemo(() => {
    const a = parseFloat(landAcres);
    if (Number.isNaN(a) || a <= 0) return null;
    return (a * perAcreLimitLakhs).toFixed(2);
  }, [landAcres, perAcreLimitLakhs]);

  const emiInputs = useMemo(() => {
    const P = parseFloat(loanAmount) * 1_00_000; // lakhs to rupees
    const rate = parseFloat(ratePct);
    const years = parseFloat(tenureYears);
    if (Number.isNaN(P) || P <= 0 || Number.isNaN(rate) || rate < 0 || Number.isNaN(years) || years <= 0)
      return null;
    return emi(P, rate, years);
  }, [loanAmount, tenureYears, ratePct]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl w-full min-w-0">
      <Card className="agri-card">
        <CardHeader>
          <CardTitle className="text-base">Eligible limit (indicative)</CardTitle>
          <CardDescription>Based on landholding; actual limit depends on bank norms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loanConfigError && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-200 mb-2">
              <span>Could not load latest rates. Showing cached/default values.</span>
              <Button variant="outline" size="sm" className="shrink-0 border-amber-700 text-amber-200 hover:bg-amber-900/30" onClick={() => refetchLoanConfig()}>Retry</Button>
            </div>
          )}
          <Label htmlFor="land-acres">Land area (acres)</Label>
          <Input
            id="land-acres"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 2"
            value={landAcres}
            onChange={(e) => setLandAcres(e.target.value)}
            className="w-full sm:max-w-[140px]"
          />
          {estLimitLakhs != null && (
            <p className="text-sm font-mono text-emerald-400">
              Estimated limit: <strong>₹ {estLimitLakhs} lakh</strong> (approx.)
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="agri-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-400" />
            EMI calculator
          </CardTitle>
          <CardDescription>Loan amount in lakhs, tenure in years, and annual interest rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="loan-amount">Loan amount (₹ lakh)</Label>
              <Input
                id="loan-amount"
                type="number"
                min="0"
                step="0.5"
                placeholder="e.g. 5"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tenure">Tenure (years)</Label>
              <Input
                id="tenure"
                type="number"
                min="1"
                max="20"
                value={tenureYears}
                onChange={(e) => setTenureYears(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="rate">Interest rate (% p.a.)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.1"
                placeholder="7"
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
              />
            </div>
          </div>
          {emiInputs != null && (
            <div className="rounded-lg border border-emerald-900/40 bg-background/40 p-4 space-y-1">
              <p className="text-sm text-muted-foreground">Monthly EMI</p>
              <p className="text-lg font-mono font-semibold text-foreground">
                ₹ {emiInputs.emi.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-muted-foreground">Total interest payable</p>
              <p className="font-mono text-foreground">
                ₹ {emiInputs.totalInterest.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="agri-card">
        <CardHeader className="space-y-1.5">
          <CardTitle className="text-lg flex items-center gap-2 font-semibold tracking-tight">
            <Building2 className="h-5 w-5 text-emerald-400 shrink-0" />
            Banks & interest rates (indicative)
          </CardTitle>
          <CardDescription className="text-xs">
            Rates and processing fees may vary. Visit the bank website to apply. Not a commitment.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 pt-0 sm:px-6">
          {loanConfigLoading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold text-foreground">Bank</TableHead>
                    <TableHead className="font-semibold text-foreground">Scheme</TableHead>
                    <TableHead className="text-right font-semibold text-foreground w-[88px]">Rate %</TableHead>
                    <TableHead className="font-semibold text-foreground w-[120px]">Processing fee</TableHead>
                    <TableHead className="text-right font-semibold text-foreground w-[100px]">Apply</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banksAndRates.map((row, i) => (
                    <TableRow key={i} className="border-border/60">
                      <TableCell className="font-medium text-foreground">{row.bank}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">{row.scheme}</span>
                          {row.notes && (
                            <span className="text-xs text-muted-foreground/80">{row.notes}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-foreground">
                        {row.ratePct}%
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {row.processingFee === "—" ? "—" : (row.processingFee ?? "—")}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={row.applicationLink ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Visit bank website"
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                            "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10",
                            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                          )}
                        >
                          Apply Now
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
