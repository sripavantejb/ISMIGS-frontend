import { motion } from "framer-motion";
import { Zap, Factory, TrendingUp, Landmark, BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import KPICard from "@/components/KPICard";
import { useSupplyData, useConsumptionData } from "@/hooks/useEnergyData";
import { useWPIData, useIIPAnnual, useNASData } from "@/hooks/useMacroData";

const chartTooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

const Overview = () => {
  const { data: supplyData, isLoading: supplyLoading } = useSupplyData();
  const { data: consumptionData, isLoading: consumptionLoading } = useConsumptionData();
  const { data: wpiData, isLoading: wpiLoading } = useWPIData();
  const { data: iipData, isLoading: iipLoading } = useIIPAnnual();
  const { data: nasData, isLoading: nasLoading } = useNASData(1);

  const isLoading = supplyLoading || consumptionLoading || wpiLoading || iipLoading || nasLoading;

  // Supply KPIs
  const totalSupply = supplyData?.totalPrimarySupply ? Math.round(supplyData.totalPrimarySupply) : 0;
  const totalProduction = supplyData?.totalProduction ? Math.round(supplyData.totalProduction) : 0;
  const totalImports = supplyData?.totalImports ? Math.round(supplyData.totalImports) : 0;
  const importDep = totalSupply > 0 ? Math.round((totalImports / totalSupply) * 100) : 0;

  // Consumption KPIs
  const totalConsumption = consumptionData?.totalFinalConsumption ? Math.round(consumptionData.totalFinalConsumption) : 0;
  const industryConsumption = consumptionData?.totalIndustry ? Math.round(consumptionData.totalIndustry) : 0;
  const transportConsumption = consumptionData?.totalTransport ? Math.round(consumptionData.totalTransport) : 0;

  // Supply by year for chart
  const supplyTrend = supplyData?.byYear
    ? Object.entries(supplyData.byYear)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, d]) => ({ year, production: Math.round(d.production), imports: Math.round(d.imports), supply: Math.round(d.supply) }))
    : [];

  // Consumption by year for chart
  const consumptionTrend = consumptionData?.byYear
    ? Object.entries(consumptionData.byYear)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, value]) => ({ year, consumption: Math.round(value) }))
    : [];

  // Merge trends
  const combinedTrend = supplyTrend.map((s) => {
    const c = consumptionTrend.find((ct) => ct.year === s.year);
    return { ...s, consumption: c?.consumption || 0 };
  });

  // WPI summary
  const wpiCount = wpiData?.length || 0;
  const latestWPI = wpiData && wpiData.length > 0 ? wpiData[0] : null;

  // IIP summary
  const iipCount = iipData?.length || 0;
  const latestIIP = iipData && iipData.length > 0 ? iipData[0] : null;

  // NAS summary
  const nasCount = nasData?.length || 0;

  // Supply by commodity for bar chart
  const commodityData = supplyData?.byCommodity
    ? Object.entries(supplyData.byCommodity)
        .filter(([name]) => name !== "Total")
        .map(([name, d]) => ({ name: name.length > 12 ? name.slice(0, 12) + "…" : name, production: Math.round(d.production), imports: Math.round(d.imports) }))
        .sort((a, b) => (b.production + b.imports) - (a.production + a.imports))
        .slice(0, 8)
    : [];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Macro Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time economic & energy intelligence from MoSPI
          </p>
        </div>
        {isLoading && <Skeleton className="h-5 w-5 rounded" />}
      </motion.div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard label="Total Supply" value={totalSupply} suffix=" PJ" icon={<Zap className="w-4 h-4" />} color="text-primary" delay={0} />
        <KPICard label="Production" value={totalProduction} suffix=" PJ" icon={<BarChart3 className="w-4 h-4" />} color="text-accent" delay={100} trend="up" />
        <KPICard label="Consumption" value={totalConsumption} suffix=" KToE" icon={<Factory className="w-4 h-4" />} color="text-moderate" delay={200} />
        <KPICard label="Import Dep." value={importDep} suffix="%" icon={<TrendingUp className="w-4 h-4" />} color="text-stress" delay={300} />
        <KPICard label="Industry" value={industryConsumption} suffix=" KToE" icon={<Factory className="w-4 h-4" />} color="text-foreground" delay={400} />
        <KPICard label="Transport" value={transportConsumption} suffix=" KToE" icon={<Landmark className="w-4 h-4" />} color="text-foreground" delay={500} />
      </div>

      {/* API Status Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ApiStatusCard label="Energy Supply" count={supplyTrend.length} unit="years" loading={supplyLoading} />
        <ApiStatusCard label="WPI Inflation" count={wpiCount} unit="records" loading={wpiLoading} />
        <ApiStatusCard label="IIP Industrial" count={iipCount} unit="records" loading={iipLoading} />
        <ApiStatusCard label="NAS / GDP" count={nasCount} unit="records" loading={nasLoading} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply vs Consumption trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Energy Supply vs Consumption Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="year" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="supply" stroke="hsl(187 92% 50%)" strokeWidth={2} dot={{ r: 2 }} name="Supply (PJ)" />
                <Line type="monotone" dataKey="consumption" stroke="hsl(160 84% 45%)" strokeWidth={2} dot={{ r: 2 }} name="Consumption (KToE)" />
                <Line type="monotone" dataKey="production" stroke="hsl(38 92% 55%)" strokeWidth={1.5} strokeDasharray="5 5" name="Production (PJ)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Supply by Commodity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Supply by Commodity (PJ)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commodityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" angle={-20} textAnchor="end" height={50} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend />
                <Bar dataKey="production" fill="hsl(187 92% 50%)" name="Production" radius={[3, 3, 0, 0]} />
                <Bar dataKey="imports" fill="hsl(38 92% 55%)" name="Imports" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Sector Consumption Breakdown */}
      {consumptionData?.bySector && Object.keys(consumptionData.bySector).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-5">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
            Consumption by Sector (KToE)
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(consumptionData.bySector)
                  .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + "…" : name, value: Math.round(value) }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 10)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis type="number" stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
                <YAxis dataKey="name" type="category" stroke="hsl(215 20% 55%)" fontSize={9} fontFamily="JetBrains Mono" width={120} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="value" fill="hsl(160 84% 45%)" name="Consumption" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const ApiStatusCard = ({ label, count, unit, loading }: { label: string; count: number; unit: string; loading: boolean }) => (
  <div className="glass-card p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-muted-foreground font-mono uppercase">{label}</p>
      <p className="text-lg font-bold font-mono text-foreground mt-1">
        {loading ? "…" : count}
        <span className="text-xs text-muted-foreground ml-1 font-normal">{unit}</span>
      </p>
    </div>
    {loading ? (
      <Skeleton className="h-4 w-4 rounded" />
    ) : count > 0 ? (
      <ArrowUpRight className="w-4 h-4 text-stable" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
    )}
  </div>
);

export default Overview;
