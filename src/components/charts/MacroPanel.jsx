const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Loader2, Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

export default function MacroPanel({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    const fetch = async () => {
      setLoading(true);
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Provide macro environment analysis for ${symbol}:
1. DXY (Dollar Index): current value, trend, impact on ${symbol}
2. VIX: current value, trend, impact
3. 10Y Treasury Yield: current, trend, impact
4. WTI Oil: current, trend, impact
5. Gold: current, trend, impact  
6. Federal Reserve stance: current policy, next meeting, expected impact
7. Sector rotation: which sectors are hot/cold, where does ${symbol} fit
8. Risk-on/Risk-off assessment with score from -100 (risk-off) to +100 (risk-on)
9. Overall macro environment impact on ${symbol}: bullish, bearish, or neutral

All data in Spanish.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "number" },
            macro_signal: { type: "string", enum: ["bullish", "bearish", "neutral"] },
            dxy: { type: "object", properties: { value: { type: "string" }, trend: { type: "string" }, impact: { type: "string" }, impact_direction: { type: "string" } } },
            vix: { type: "object", properties: { value: { type: "string" }, trend: { type: "string" }, impact: { type: "string" }, impact_direction: { type: "string" } } },
            yield_10y: { type: "object", properties: { value: { type: "string" }, trend: { type: "string" }, impact: { type: "string" }, impact_direction: { type: "string" } } },
            oil: { type: "object", properties: { value: { type: "string" }, trend: { type: "string" }, impact: { type: "string" }, impact_direction: { type: "string" } } },
            gold: { type: "object", properties: { value: { type: "string" }, trend: { type: "string" }, impact: { type: "string" }, impact_direction: { type: "string" } } },
            fed_stance: { type: "string" },
            sector_rotation: { type: "string" },
            macro_summary: { type: "string" }
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
      <Loader2 className="h-6 w-6 text-primary animate-spin" />
    </div>
  );
  if (!data) return null;

  const macroItems = [
    { label: "DXY", item: data.dxy },
    { label: "VIX", item: data.vix },
    { label: "10Y Yield", item: data.yield_10y },
    { label: "WTI Oil", item: data.oil },
    { label: "Gold", item: data.gold },
  ];

  const impactColor = (dir) => {
    if (!dir) return "text-muted-foreground";
    const d = dir.toLowerCase();
    if (d.includes("pos") || d.includes("bull") || d.includes("alcista") || d.includes("positiv")) return "text-green-400";
    if (d.includes("neg") || d.includes("bear") || d.includes("bajista") || d.includes("negativ")) return "text-red-400";
    return "text-yellow-400";
  };

  const riskScore = data.risk_score || 0;
  const riskPct = ((riskScore + 100) / 200) * 100;

  return (
    <div className="space-y-4">
      {/* Risk Score */}
      <div className={`rounded-xl border p-4 ${
        data.macro_signal === "bullish" ? "border-green-500/30 bg-green-500/5" :
        data.macro_signal === "bearish" ? "border-red-500/30 bg-red-500/5" :
        "border-yellow-500/30 bg-yellow-500/5"
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ambiente Macro</span>
          </div>
          <span className={`text-sm font-bold ${
            data.macro_signal === "bullish" ? "text-green-400" :
            data.macro_signal === "bearish" ? "text-red-400" : "text-yellow-400"
          }`}>{data.macro_signal?.toUpperCase()}</span>
        </div>
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>RISK OFF</span>
            <span className="font-mono font-bold text-foreground">{riskScore > 0 ? "+" : ""}{riskScore}</span>
            <span>RISK ON</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30 rounded-full" />
            <div
              className="absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white shadow-lg transition-all duration-1000"
              style={{ left: `calc(${riskPct}% - 6px)` }}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{data.macro_summary}</p>
      </div>

      {/* Macro Indicators */}
      <div className="grid grid-cols-1 gap-2">
        {macroItems.map(({ label, item }) => item && (
          <div key={label} className="rounded-xl border border-border bg-secondary/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12">
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                  <p className="text-sm font-bold text-foreground">{item.value}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="capitalize">{item.trend}</span>
                </div>
              </div>
              <div className="text-right flex-1 ml-3">
                <p className={`text-xs font-medium ${impactColor(item.impact_direction)}`}>
                  {item.impact}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fed & Sector */}
      {data.fed_stance && (
        <div className="rounded-xl border border-border bg-secondary/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Fed / Banco Central</p>
          <p className="text-xs text-foreground">{data.fed_stance}</p>
        </div>
      )}
      {data.sector_rotation && (
        <div className="rounded-xl border border-border bg-secondary/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rotación Sectorial</p>
          <p className="text-xs text-foreground">{data.sector_rotation}</p>
        </div>
      )}
    </div>
  );
}