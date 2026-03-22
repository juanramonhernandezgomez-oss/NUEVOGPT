const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Loader2, Triangle, Eye, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ChartPatterns({ symbol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    const fetch = async () => {
      setLoading(true);
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Analyze chart patterns and technical setups for ${symbol} right now. Look for:

1. Classic chart patterns (Head & Shoulders, Double Top/Bottom, Cup & Handle, Triangle, Wedge, Flag, Pennant, Channel)
2. Candlestick patterns (Doji, Hammer, Engulfing, Harami, Morning/Evening Star, etc.)
3. Hidden divergences in RSI or MACD
4. Key chart formations forming or recently completed
5. Elliott Wave current count if applicable
6. Pattern completion probability and expected price target
7. Current trend structure (higher highs/lows, etc.)

For each pattern: name, type (bullish/bearish/neutral), reliability score (0-100), expected price target, stop loss level, and explanation in Spanish.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            active_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                  timeframe: { type: "string" },
                  reliability: { type: "number" },
                  status: { type: "string" },
                  target: { type: "string" },
                  stop_loss: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            candlestick_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string", enum: ["bullish", "bearish", "neutral"] },
                  strength: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            divergences: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  indicator: { type: "string" },
                  type: { type: "string" },
                  explanation: { type: "string" }
                }
              }
            },
            trend_structure: { type: "string" },
            elliott_wave: { type: "string" },
            overall_pattern_signal: { type: "string" }
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
        <p className="text-xs text-muted-foreground">Detectando patrones ocultos...</p>
      </div>
    </div>
  );
  if (!data) return null;

  const typeColor = { bullish: "text-green-400", bearish: "text-red-400", neutral: "text-yellow-400" };
  const typeBg = { bullish: "bg-green-500/10 border-green-500/20", bearish: "bg-red-500/10 border-red-500/20", neutral: "bg-yellow-500/10 border-yellow-500/20" };
  const typeIcon = { bullish: "▲", bearish: "▼", neutral: "◆" };

  return (
    <div className="space-y-5">
      {/* Trend Structure */}
      {data.trend_structure && (
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Estructura de Tendencia</p>
          <p className="text-sm text-foreground font-medium">{data.trend_structure}</p>
        </div>
      )}

      {/* Active Chart Patterns */}
      {data.active_patterns?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye className="h-3 w-3" /> Patrones Activos
          </h4>
          <div className="space-y-3">
            {data.active_patterns.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-xl border p-4 ${typeBg[p.type]}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${typeColor[p.type]}`}>{typeIcon[p.type]}</span>
                      <span className="text-sm font-bold text-foreground">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">{p.timeframe}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.status}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <span className="text-[10px] text-muted-foreground">Fiabilidad</span>
                      <span className={`text-xs font-bold ${p.reliability >= 70 ? "text-green-400" : p.reliability >= 50 ? "text-yellow-400" : "text-red-400"}`}>{p.reliability}%</span>
                    </div>
                    <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${p.reliability}%` }} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{p.explanation}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-2 py-1">
                    <p className="text-[9px] text-muted-foreground">Target</p>
                    <p className="text-xs font-bold text-green-400">{p.target}</p>
                  </div>
                  <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1">
                    <p className="text-[9px] text-muted-foreground">Stop Loss</p>
                    <p className="text-xs font-bold text-red-400">{p.stop_loss}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Candlestick Patterns */}
      {data.candlestick_patterns?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Patrones de Velas</h4>
          <div className="space-y-2">
            {data.candlestick_patterns.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 p-3">
                <span className={`text-base ${typeColor[p.type]}`}>{typeIcon[p.type]}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{p.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${typeBg[p.type]} ${typeColor[p.type]}`}>{p.strength}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{p.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divergences */}
      {data.divergences?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="h-3 w-3 text-yellow-400" /> Divergencias
          </h4>
          <div className="space-y-2">
            {data.divergences.map((d, i) => (
              <div key={i} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-yellow-400">{d.indicator}</span>
                  <span className="text-[10px] text-muted-foreground">{d.type}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{d.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Elliott Wave */}
      {data.elliott_wave && (
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Elliott Wave</p>
          <p className="text-sm text-foreground">{data.elliott_wave}</p>
        </div>
      )}
    </div>
  );
}