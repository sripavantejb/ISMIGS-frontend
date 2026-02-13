import { motion } from "framer-motion";
import { useForecast } from "@/hooks/useForecast";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionCard } from "@/components/PredictionCard";
import { ForecastChart } from "@/components/ForecastChart";
import { OutlookSummary } from "@/components/OutlookSummary";

const PredictionsPage = () => {
  const { loading, error, energy, gdp, wpi, iip, gfcf } = useForecast();

  if (loading) {
    return (
      <div className="min-h-screen p-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-2xl font-bold text-foreground">Predictions & Outlook</h1>
        <p className="text-critical mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Predictions & Outlook</h1>
        <p className="text-sm text-muted-foreground">
          Short-term projections and narrative outlook using MoSPI data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {energy && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <PredictionCard
              title="Energy Outlook"
              status={energy.status === "pressure" ? "pressure" : "stable"}
              metrics={[
                {
                  label: `Projected supply (${energy.nextYear})`,
                  value:
                    energy.projectedSupply != null && Number.isFinite(energy.projectedSupply)
                      ? Math.round(energy.projectedSupply).toLocaleString("en-IN")
                      : "—",
                },
                {
                  label: `Projected consumption (${energy.nextYear})`,
                  value:
                    energy.projectedConsumption != null && Number.isFinite(energy.projectedConsumption)
                      ? Math.round(energy.projectedConsumption).toLocaleString("en-IN")
                      : "—",
                },
                {
                  label: "Projected balance ratio",
                  value: energy.projectedRatio != null ? energy.projectedRatio.toFixed(2) : "—",
                },
              ]}
            >
              <ForecastChart
                data={energy.forecastLine}
                xKey="x"
                actualKey="supply"
                forecastKey="consumption"
                actualName="Supply (KToE)"
                forecastName="Consumption (KToE)"
              />
              <OutlookSummary
                sectorName="Energy"
                context={{
                  energyRatio:
                    energy.projectedRatio != null && Number.isFinite(energy.projectedRatio)
                      ? energy.projectedRatio.toFixed(2)
                      : undefined,
                }}
              />
            </PredictionCard>
          </motion.div>
        )}

        {gdp && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <PredictionCard
              title="GDP & GVA Outlook"
              status={gdp.status}
              metrics={[
                {
                  label: `Projected real GDP (${gdp.nextYear})`,
                  value: gdp.projectedConstant ? gdp.projectedConstant.toLocaleString("en-IN") : "—",
                },
                {
                  label: "Latest GDP growth",
                  value: gdp.latestGrowth != null ? `${gdp.latestGrowth.toFixed(2)} %` : "—",
                },
              ]}
            >
              <ForecastChart
                data={gdp.forecastLine}
                xKey="x"
                actualKey="constantPrice"
                forecastKey="constantPrice"
                actualName="GDP (constant, actual)"
                forecastName="Projected GDP"
                historyLength={gdp.history?.length || 0}
              />
              <OutlookSummary
                sectorName="GDP and GVA"
                context={{
                  gdpGrowth:
                    gdp.latestGrowth != null && Number.isFinite(gdp.latestGrowth)
                      ? `${gdp.latestGrowth.toFixed(2)} %`
                      : undefined,
                }}
              />
            </PredictionCard>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {wpi && wpi.forecastLine && wpi.forecastLine.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <PredictionCard
              title="Inflation (WPI) Outlook"
              status={wpi.status}
              metrics={[
                {
                  label: `Projected average WPI inflation (${wpi.nextYear})`,
                  value: wpi.projectedInflation != null ? `${wpi.projectedInflation.toFixed(2)} %` : "—",
                },
              ]}
            >
              <ForecastChart
                data={wpi.forecastLine}
                xKey="x"
                actualKey="avgInflationPct"
                forecastKey="avgInflationPct"
                actualName="Average annual inflation"
                forecastName="Projected inflation"
                historyLength={wpi.history?.length || 0}
              />
              <OutlookSummary
                sectorName="Prices and Inflation"
                context={{
                  inflationTrend:
                    wpi.projectedInflation != null && Number.isFinite(wpi.projectedInflation)
                      ? `${wpi.projectedInflation.toFixed(2)} %`
                      : undefined,
                }}
              />
            </PredictionCard>
          </motion.div>
        )}

        {iip && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <PredictionCard
              title="Industrial Production (IIP) Outlook"
              status="stable"
              metrics={[
                {
                  label: "Current IIP index",
                  value: iip.currentIndex != null && Number.isFinite(iip.currentIndex) ? iip.currentIndex.toFixed(1) : "—",
                },
                {
                  label: "Projected IIP (6 months)",
                  value: iip.projectedIndex != null && Number.isFinite(iip.projectedIndex) ? iip.projectedIndex.toFixed(1) : "—",
                },
                {
                  label: "Projected 6-month growth",
                  value:
                    iip.projectedGrowth != null && Number.isFinite(iip.projectedGrowth)
                      ? `${iip.projectedGrowth > 0 ? "+" : ""}${iip.projectedGrowth.toFixed(1)} %`
                      : "—",
                },
                {
                  label: "Avg monthly growth (forecast)",
                  value:
                    iip.avgMonthlyGrowth != null && Number.isFinite(iip.avgMonthlyGrowth)
                      ? `${iip.avgMonthlyGrowth > 0 ? "+" : ""}${iip.avgMonthlyGrowth.toFixed(2)} %`
                      : "—",
                },
              ]}
            >
              {iip.forecastLine && iip.forecastLine.length > 0 ? (
                <>
                  <ForecastChart
                    data={iip.forecastLine}
                    xKey="periodLabel"
                    actualKey="index"
                    forecastKey="index"
                    actualName="IIP index (actual)"
                    forecastName="Projected IIP"
                    historyLength={iip.history?.length || 0}
                  />
                  {iip.nextMonths && iip.nextMonths.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/20 border border-border/50">
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">Month-by-Month Forecast</h4>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        {iip.nextMonths.map((month: { index?: number }, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-background/50 border border-border/30">
                            <div className="text-xs text-muted-foreground">Month {idx + 1}</div>
                            <div className="font-mono font-semibold text-primary">
                              {month.index != null && Number.isFinite(month.index) ? month.index.toFixed(1) : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <OutlookSummary
                    sectorName="Industry and IIP"
                    context={{
                      industrialGrowth:
                        iip.projectedGrowth != null && Number.isFinite(iip.projectedGrowth)
                          ? `${iip.projectedGrowth > 0 ? "+" : ""}${iip.projectedGrowth.toFixed(1)} %`
                          : undefined,
                      currentIIP:
                        iip.currentIndex != null && Number.isFinite(iip.currentIndex)
                          ? iip.currentIndex.toFixed(1)
                          : undefined,
                      avgMonthlyGrowth:
                        iip.avgMonthlyGrowth != null && Number.isFinite(iip.avgMonthlyGrowth)
                          ? `${iip.avgMonthlyGrowth > 0 ? "+" : ""}${iip.avgMonthlyGrowth.toFixed(2)} %`
                          : undefined,
                    }}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4">
                  IIP forecast data is being processed. Please ensure IIP monthly data is available.
                </p>
              )}
            </PredictionCard>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gfcf && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <PredictionCard
              title="Capital Formation (GFCF) Outlook"
              status="stable"
              metrics={[
                {
                  label: `Projected real GFCF (${gfcf.nextYear})`,
                  value: gfcf.projectedConstant ? gfcf.projectedConstant.toLocaleString("en-IN") : "—",
                },
              ]}
            >
              <ForecastChart
                data={gfcf.forecastLine}
                xKey="x"
                actualKey="constantPrice"
                forecastKey="constantPrice"
                actualName="GFCF (constant, actual)"
                forecastName="Projected GFCF"
                historyLength={gfcf.history?.length || 0}
              />
              <OutlookSummary sectorName="Capital Formation" context={{}} />
            </PredictionCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PredictionsPage;
