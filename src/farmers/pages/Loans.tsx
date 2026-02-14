import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, ExternalLink, Calculator } from "lucide-react";

const PER_ACRE_LIMIT_LAKHS = 1.6;

/** Indicative KCC/agri loan rates; processing fee and links for reference only. */
const LOAN_BANKS_AND_RATES: {
  bank: string;
  scheme: string;
  ratePct: number;
  processingFee: string;
  applicationLink: string;
  notes?: string;
}[] = [
  { bank: "SBI", scheme: "KCC (crop loan)", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm", notes: "With interest subvention" },
  { bank: "SBI", scheme: "KCC (beyond subvention)", ratePct: 9.5, processingFee: "—", applicationLink: "https://www.onlinesbi.sbi/sbicollect/icollecthome.htm" },
  { bank: "HDFC Bank", scheme: "Kisan Credit Card", ratePct: 8.5, processingFee: "0.5%", applicationLink: "https://www.hdfcbank.com/personal/borrow/personal-loan/agriculture-loan" },
  { bank: "ICICI Bank", scheme: "KCC / Agri term", ratePct: 9, processingFee: "—", applicationLink: "https://www.icicibank.com/agriculture" },
  { bank: "Bank of Baroda", scheme: "KCC", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.bankofbaroda.in/agriculture-banking.htm" },
  { bank: "PNB", scheme: "KCC", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.pnbbank.in/agriculture.html" },
  { bank: "Canara Bank", scheme: "KCC", ratePct: 7, processingFee: "—", applicationLink: "https://canarabank.com/agriculture" },
  { bank: "Union Bank", scheme: "KCC", ratePct: 7, processingFee: "Nil", applicationLink: "https://www.unionbankofindia.co.in/english/agriculture.aspx" },
  { bank: "NABARD (via banks)", scheme: "Refinance-backed crop loans", ratePct: 7, processingFee: "—", applicationLink: "https://www.nabard.org/" },
  { bank: "Regional Rural Banks", scheme: "KCC / short-term crop", ratePct: 7, processingFee: "—", applicationLink: "#" },
];

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

  const estLimitLakhs = useMemo(() => {
    const a = parseFloat(landAcres);
    if (Number.isNaN(a) || a <= 0) return null;
    return (a * PER_ACRE_LIMIT_LAKHS).toFixed(2);
  }, [landAcres]);

  const emiInputs = useMemo(() => {
    const P = parseFloat(loanAmount) * 1_00_000; // lakhs to rupees
    const rate = parseFloat(ratePct);
    const years = parseFloat(tenureYears);
    if (Number.isNaN(P) || P <= 0 || Number.isNaN(rate) || rate < 0 || Number.isNaN(years) || years <= 0)
      return null;
    return emi(P, rate, years);
  }, [loanAmount, tenureYears, ratePct]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-400" />
          Loan estimator & bank comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estimate your eligible limit from land area, compare bank schemes, and calculate EMI.
        </p>
      </div>

      <Card className="border-emerald-900/40 bg-card">
        <CardHeader>
          <CardTitle className="text-base">Eligible limit (indicative)</CardTitle>
          <CardDescription>Based on landholding; actual limit depends on bank norms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="land-acres">Land area (acres)</Label>
          <Input
            id="land-acres"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 2"
            value={landAcres}
            onChange={(e) => setLandAcres(e.target.value)}
            className="max-w-[140px]"
          />
          {estLimitLakhs != null && (
            <p className="text-sm font-mono text-emerald-400">
              Estimated limit: <strong>₹ {estLimitLakhs} lakh</strong> (approx.)
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-900/40 bg-card">
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

      <Card className="border-emerald-900/40 bg-card">
        <CardHeader>
          <CardTitle className="text-base">Banks & interest rates (indicative)</CardTitle>
          <CardDescription>Rates and processing fees may vary. Visit bank website to apply.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-emerald-900/40">
                <th className="text-left py-2 pr-4 font-medium text-foreground">Bank</th>
                <th className="text-left py-2 pr-4 font-medium text-foreground">Scheme</th>
                <th className="text-right py-2 pr-4 font-medium text-foreground">Rate %</th>
                <th className="text-left py-2 pr-4 font-medium text-foreground">Processing fee</th>
                <th className="text-right py-2 font-medium text-foreground">Apply</th>
              </tr>
            </thead>
            <tbody>
              {LOAN_BANKS_AND_RATES.map((row, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-foreground">{row.bank}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{row.scheme}</td>
                  <td className="py-2 pr-4 text-right font-mono">{row.ratePct}%</td>
                  <td className="py-2 pr-4 text-muted-foreground">{row.processingFee}</td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-400 hover:text-emerald-300"
                      asChild
                    >
                      <a href={row.applicationLink} target="_blank" rel="noopener noreferrer" title="Visit bank website">
                        Apply Now <ExternalLink className="h-3 w-3 ml-1 inline" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
