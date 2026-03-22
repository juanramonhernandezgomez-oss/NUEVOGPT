const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Loader2, Zap, TrendingUp, TrendingDown, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function CorrelationMatrix({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    const fetch = async () => {
      setLoading(true);
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Analyze hidden correlations and relationships for ${symbol}. Find non-obvious patterns:

1. Correlation with major assets (DXY, VIX, Gold, Oil, 10Y yield, S&P500, BTC, sector ETF)
2. Hidden correlations with macroeconomic indicators 
3. Seasonal patterns (best/worst months, day of week effects)
4. Lead/lag relationships with other assets
5. Unusual correlations that traders might not know (e.g. correlation with specific commodity, currency pair, or other sector)
6. Correlation breakdown analysis: when does the typical correlation break?
7. Key market regime effects on this asset

For each correlation provide: asset name, correlation coefficient (-1 to 1), strength label, direction, and a brief explanation in Spanish.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            correlations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  asset: { type: "string" },
                  symbol: { type: "string" },
                  coefficient: { type: "number" },
                  strength: { type: "string" },
                  direction: { type: "string", enum: ["positive", "negative", "neutral"] },
                  explanation: { type: "string" },
                  is_hidden: { type: "boolean" }
                }
              }
            },
            seasonal_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  period: { type: "string" },
                  bias: { type: "string" },
                  avg_return: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            lead_lag: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indicator: { type: "string" },
                  lag_days: { type: "number" },
                  explanation: { type: "string" }
                }
              }
            },
            key_insight: { type: "string" }
          }
        }
      });
      setData(result);
      setLoading(false);
    };
    fetch();
  }, [symbol]);

  if (!symbol) return null;
  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Buscando correlaciones ocultas...</p>
      </div>
    </div>
  );
  if (!data) return null;

  const getCorrelationColor = (c) => {
    if (c > 0.6) return "text-green-400";
    if (c > 0.2) return "text-green-300";
    if (c > -0.2) return "text-yellow-400";
    if (c > -0.6) return "text-red-300";
    return "text-red-400";
  };

  const getBarStyle = (c) => {
    const pct = Math.abs(c) * 100;
    return {
      width: `${pct}%`,
      backgroundColor: c > 0 ? "#22c55e" : "#ef4444",
      opacity: 0.7 + Math.abs(c) * 0.3
    };
  };

  return (
    <div className="space-y-6">
      {/* Key Insight */}
      {data.key_insight && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{data.key_insight}</p>
          </div>
        </div>
      )}

      {/* Correlations */}
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Link2 className="h-3 w-3" /> Correlaciones
        </h4>
        <div className="space-y-2">
          {data.correlations?.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl p-3 border transition-all ${item.is_hidden ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/20"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.is_hidden && <Zap className="h-3 w-3 text-primary" />}
                  <span className="text-sm font-semibold text-foreground">{item.asset}</span>
                  <span className="text-[10px] text-muted-foreground">{item.symbol}</span>
                  {item.is_hidden && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">OCULTA</span>}
                </div>
                <span className={`text-base font-bold font-mono ${getCorrelationColor(item.coefficient)}`}>
                  {item.coefficient > 0 ? "+" : ""}{item.coefficient?.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 border-r border-border/50" />
                  </div>
                  <div
                    className={`absolute h-full rounded-full transition-all duration-1000 ${item.coefficient > 0 ? "left-1/2" : "right-1/2"}`}
                    style={{ width: `${Math.abs(item.coefficient) * 50}%`, backgroundColor: item.coefficient > 0 ? "#22c55e" : "#ef4444" }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-20 text-right">{item.strength}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{item.explanation}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Seasonal Patterns */}
      {data.seasonal_patterns?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Patrones Estacionales</h4>
          <div className="grid grid-cols-1 gap-2">
            {data.seasonal_patterns.map((s, i) => (
              <div key={i} className="rounded-xl border border-border bg-secondary/20 p-3 flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${s.bias?.includes("alcista") || s.bias?.includes("bull") ? "bg-green-400" : s.bias?.includes("bajista") || s.bias?.includes("bear") ? "bg-red-400" : "bg-yellow-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{s.period}</span>
                    <span className={`text-xs font-bold ${s.avg_return?.startsWith("+") ? "text-green-400" : s.avg_return?.startsWith("-") ? "text-red-400" : "text-yellow-400"}`}>{s.avg_return}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lead/Lag */}
      {data.lead_lag?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Indicadores Adelantados</h4>
          <div className="space-y-2">
            {data.lead_lag.map((l, i) => (
              <div key={i} className="rounded-xl border border-border bg-secondary/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-foreground">{l.indicator}</span>
                  <span className="text-xs text-primary font-mono">{l.lag_days > 0 ? "+" : ""}{l.lag_days}d lag</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{l.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}