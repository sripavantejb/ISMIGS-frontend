import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface CostRevenueChartProps {
  totalInvestment: number;
  grossRevenue: number;
  netProfit: number;
}

const CHART_COLORS = {
  totalInvestment: "hsl(0 70% 50%)",   // red-ish for cost
  grossRevenue: "hsl(160 84% 39%)",    // emerald for revenue
  netProfit: "hsl(160 84% 39%)",       // emerald for profit (or amber if negative)
};

export function CostRevenueChart({ totalInvestment, grossRevenue, netProfit }: CostRevenueChartProps) {
  const data = [
    { name: "Total investment", value: totalInvestment, fill: CHART_COLORS.totalInvestment },
    { name: "Gross revenue", value: grossRevenue, fill: CHART_COLORS.grossRevenue },
    { name: "Net profit", value: netProfit, fill: netProfit >= 0 ? CHART_COLORS.netProfit : "hsl(0 70% 50%)" },
  ].filter((d) => d.value !== 0 || d.name === "Net profit");

  if (data.every((d) => d.value === 0)) return null;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} layout="vertical" className="[&_.recharts-cartesian-grid-horizontal]:stroke-border/50">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `₹ ${(v / 1000).toFixed(0)}k`} style={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: number) => [`₹ ${value.toLocaleString("en-IN")}`, ""]}
            contentStyle={{ backgroundColor: "hsl(222 44% 9%)", border: "1px solid hsl(222 30% 22%)", borderRadius: "8px", fontSize: "12px" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={48}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
