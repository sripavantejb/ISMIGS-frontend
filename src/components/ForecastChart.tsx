import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

const tooltipStyle = {
  backgroundColor: "hsl(222 44% 9%)",
  border: "1px solid hsl(222 30% 22%)",
  borderRadius: "8px",
  fontFamily: "JetBrains Mono",
  fontSize: "12px",
};

interface ForecastChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  actualKey: string;
  forecastKey: string;
  actualName: string;
  forecastName: string;
  color?: string;
  historyColor?: string;
  forecastColor?: string;
  historyLength?: number;
  height?: number;
}

const DEFAULT_HISTORY_COLOR = "hsl(217 91% 60%)";
const DEFAULT_FORECAST_COLOR = "hsl(38 92% 50%)";

export function ForecastChart({
  data,
  xKey,
  actualKey,
  forecastKey,
  actualName,
  forecastName,
  color = "hsl(187 92% 50%)",
  historyColor = DEFAULT_HISTORY_COLOR,
  forecastColor = DEFAULT_FORECAST_COLOR,
  historyLength,
  height = 256,
}: ForecastChartProps) {
  const strokeHistory = historyColor ?? color;
  const strokeForecast = forecastColor ?? color;

  if (!data || !data.length) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  const isSameKey = forecastKey === actualKey;
  const hasHistorySplit =
    historyLength != null && historyLength > 0 && data.length > historyLength;

  let chartData = data;
  let historyKey = actualKey;
  let forecastKeyFinal = forecastKey;

  if (isSameKey && hasHistorySplit) {
    historyKey = `${actualKey}_history`;
    forecastKeyFinal = `${actualKey}_forecast`;
    chartData = data.map((d, idx) => {
      const result = { ...d };
      const val = d[actualKey];
      if (idx < historyLength) {
        (result as Record<string, unknown>)[historyKey] = val;
        (result as Record<string, unknown>)[forecastKeyFinal] = null;
      } else {
        (result as Record<string, unknown>)[historyKey] = null;
        (result as Record<string, unknown>)[forecastKeyFinal] = val;
      }
      return result;
    });
  }

  let maxValue = 0;
  chartData.forEach((d) => {
    const hv = d[historyKey] as number;
    const fv = forecastKeyFinal ? (d[forecastKeyFinal] as number) : null;
    if (typeof hv === "number" && Number.isFinite(hv)) maxValue = Math.max(maxValue, hv);
    if (typeof fv === "number" && Number.isFinite(fv)) maxValue = Math.max(maxValue, fv);
  });

  let scale = 1;
  let unitLabel = "";
  if (maxValue >= 1_00_00_000) {
    scale = 1_00_00_000;
    unitLabel = " (₹ crore, approx)";
  } else if (maxValue >= 1_00_000) {
    scale = 1_00_000;
    unitLabel = " (×1e5 units)";
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 24, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
          <XAxis dataKey={xKey} stroke="hsl(215 20% 55%)" fontSize={10} fontFamily="JetBrains Mono" />
          <YAxis
            stroke="hsl(215 20% 55%)"
            fontSize={10}
            fontFamily="JetBrains Mono"
            tickFormatter={(v) =>
              scale === 1 ? v.toLocaleString("en-IN") : (v / scale).toFixed(1)
            }
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: unknown, name: string) => {
              if (typeof value !== "number" || !Number.isFinite(value)) {
                return ["—", name];
              }
              const display =
                scale === 1
                  ? (value as number).toLocaleString("en-IN", { maximumFractionDigits: 2 })
                  : ((value as number) / scale).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    });
              return [display, unitLabel ? `${name}${unitLabel}` : name];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={historyKey}
            name={actualName}
            stroke={strokeHistory}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
          />
          {forecastKeyFinal && (
            <Line
              type="monotone"
              dataKey={forecastKeyFinal}
              name={forecastName}
              stroke={strokeForecast}
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
