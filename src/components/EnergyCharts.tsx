import { useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { StateData } from "@/data/statesData";

interface EnergyChartsProps {
  state: StateData;
}

const COLORS = ["#00d4ff", "#22c55e", "#facc15", "#a855f7", "#f97316", "#64748b"];

const EnergyCharts = ({ state }: EnergyChartsProps) => {
  const [view, setView] = useState<"supply" | "consumption" | "balance">("supply");

  const views = ["supply", "consumption", "balance"] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">📈 Supply vs Consumption Analytics</h3>
        <div className="flex gap-1 bg-secondary/50 rounded-lg p-1">
          {views.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs rounded-md transition-all capitalize font-medium ${
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={state.yearlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
            <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={11} fontFamily="JetBrains Mono" />
            <YAxis stroke="hsl(215 20% 55%)" fontSize={11} fontFamily="JetBrains Mono" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222 44% 9%)",
                border: "1px solid hsl(222 30% 22%)",
                borderRadius: "8px",
                fontFamily: "JetBrains Mono",
                fontSize: "12px",
              }}
            />
            <Legend />
            {(view === "supply" || view === "balance") && (
              <Line type="monotone" dataKey="supply" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3 }} name="Supply" />
            )}
            {(view === "consumption" || view === "balance") && (
              <Line type="monotone" dataKey="consumption" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Consumption" />
            )}
            {view === "supply" && (
              <>
                <Line type="monotone" dataKey="production" stroke="#facc15" strokeWidth={1.5} strokeDasharray="5 5" name="Production" />
                <Line type="monotone" dataKey="imports" stroke="#f97316" strokeWidth={1.5} strokeDasharray="5 5" name="Imports" />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sector breakdown pie */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">Sector Breakdown</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={state.sectorBreakdown} dataKey="share" nameKey="sector" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {state.sectorBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 44% 9%)",
                    border: "1px solid hsl(222 30% 22%)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">Sector Details</h4>
          {state.sectorBreakdown.map((s, i) => (
            <div key={s.sector} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-foreground/80 flex-1">{s.sector}</span>
              <span className="font-mono text-muted-foreground">{s.share}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EnergyCharts;
