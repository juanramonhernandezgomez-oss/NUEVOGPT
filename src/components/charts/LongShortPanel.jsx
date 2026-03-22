const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { RadialBarChart, RadialBar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2, TrendingUp, TrendingDown, Users, DollarSign, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function LongShortPanel({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    const fetch = async () => {
      setLoading(true);
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Provide detailed long/short positioning data for ${symbol}:
1. Retail trader positioning: % long vs % short (from brokers like IG, OANDA, CMC)
2. Institutional positioning (COT report or equivalent): net long/short contracts
3. Short interest: shares shorted, % float, days to cover, change vs last month
4. Options flow: total call volume, total put volume, unusual large bets
5. Dark pool activity: estimated dark pool volume %, institutional buying/selling
6. Smart money indicators: insider buying/selling last 30 days
7. Margin debt trend
8. Overall positioning signal and interpretation in Spanish

Use real current data where available.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            retail_long_pct: { type: "number" },
            retail_short_pct: { type: "number" },
            retail_signal: { type: "string" },
            institutional_net: { type: "string" },
            institutional_trend: { type: "string" },
            short_interest_pct: { type: "number" },
            short_interest_change: { type: "string" },
            days_to_cover: { type: "number" },
            short_squeeze_risk: { type: "string" },
            call_volume: { type: "string" },
            put_volume: { type: "string" },
            call_put_ratio: { type: "number" },
            unusual_options: { type: "string" },
            dark_pool_pct: { type: "string" },
            dark_pool_trend: { type: "string" },
            insider_activity: { type: "string" },
            insider_net_30d: { type: "string" },
            margin_debt_trend: { type: "string" },
            overall_positioning: { type: "string", enum: ["bullish", "bearish", "neutral", "mixed"] },
            positioning_summary: { type: "string" },
            contrarian_signal: { type: "string" }
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

  const pieData = [
    { name: "Long", value: data.retail_long_pct || 50, color: "#22c55e" },
    { name: "Short", value: data.retail_short_pct || 50, color: "#ef4444" },
  ];

  const positioningColor = {
    bullish: "text-green-400",
    bearish: "text-red-400",
    neutral: "text-yellow-400",
    mixed: "text-blue-400"
  }[data.overall_positioning] || "text-yellow-400";

  return (
    <div className="space-y-4">
      {/* Overall Signal */}
      <div className={`rounded-xl border p-4 ${
        data.overall_positioning === "bullish" ? "border-green-500/30 bg-green-500/5" :
        data.overall_positioning === "bearish" ? "border-red-500/30 bg-red-500/5" :
        "border-yellow-500/30 bg-yellow-500/5"
      }`}>
        <p className={`text-xs uppercase tracking-widest font-bold ${positioningColor}`}>
          Posicionamiento: {data.overall_positioning?.toUpperCase()}
        </p>
        <p className="text-sm text-foreground mt-1 leading-relaxed">{data.positioning_summary}</p>
        {data.contrarian_signal && (
          <div className="flex items-start gap-2 mt-2">
            <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-400">{data.contrarian_signal}</p>
          </div>
        )}
      </div>

      {/* Retail Long/Short */}
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="h-3 w-3" /> Posicionamiento Retail
        </p>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={42} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-muted-foreground">Long</span>
              </div>
              <span className="text-sm font-bold text-green-400">{data.retail_long_pct?.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${data.retail_long_pct}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-muted-foreground">Short</span>
              </div>
              <span className="text-sm font-bold text-red-400">{data.retail_short_pct?.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${data.retail_short_pct}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground">{data.retail_signal}</p>
          </div>
        </div>
      </div>

      {/* Short Interest */}
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Short Interest</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">% Float Corto</p>
            <p className="text-lg font-bold text-red-400">{data.short_interest_pct?.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">{data.short_interest_change}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Días Para Cubrir</p>
            <p className="text-lg font-bold text-foreground">{data.days_to_cover?.toFixed(1)}</p>
            <p className={`text-[10px] ${data.short_squeeze_risk?.includes("alto") || data.short_squeeze_risk?.includes("high") ? "text-orange-400" : "text-muted-foreground"}`}>
              {data.short_squeeze_risk}
            </p>
          </div>
        </div>
      </div>

      {/* Options Flow */}
      <div className="rounded-xl border border-border bg-secondary/20 p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Flujo de Opciones</p>
        <div className="grid grid-cols-3 gap-3 mb-2">
          <div>
            <p className="text-[10px] text-muted-foreground">Calls</p>
            <p className="text-sm font-bold text-green-400">{data.call_volume}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Puts</p>
            <p className="text-sm font-bold text-red-400">{data.put_volume}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Ratio C/P</p>
            <p className={`text-sm font-bold ${(data.call_put_ratio || 1) > 1 ? "text-green-400" : "text-red-400"}`}>{data.call_put_ratio?.toFixed(2)}</p>
          </div>
        </div>
        {data.unusual_options && (
          <p className="text-[10px] text-yellow-400 border-t border-border pt-2 mt-2">{data.unusual_options}</p>
        )}
      </div>

      {/* Dark Pool & Insiders */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-secondary/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Dark Pool</p>
          <p className="text-base font-bold text-foreground">{data.dark_pool_pct}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{data.dark_pool_trend}</p>
        </div>
        <div className="rounded-xl border border-border bg-secondary/20 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Insiders 30D</p>
          <p className="text-base font-bold text-foreground">{data.insider_net_30d}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{data.insider_activity}</p>
        </div>
      </div>
    </div>
  );
}