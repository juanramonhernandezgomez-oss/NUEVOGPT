const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { Loader2, Brain, Target, Clock, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from "recharts";

export default function AIPrediction({ symbol, currentPrice }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    const fetch = async () => {
      setLoading(true);
      const result = await db.integrations.Core.InvokeLLM({
        prompt: `Generate an AI-powered price prediction and trading signals for ${symbol} with current price reference around ${currentPrice || "current market price"}.

Provide:
1. Short-term prediction (1-5 days): target price, probability %, range (bull/bear case)
2. Medium-term prediction (1-4 weeks): target price, probability %, range
3. Long-term prediction (1-3 months): target, probability, key factors
4. AI confidence score (0-100)
5. Top 3 strongest buy signals right now
6. Top 3 strongest sell/risk signals
7. Optimal entry zone and stop loss
8. Risk/Reward ratio
9. Prediction based on: technical pattern + macro + sentiment + positioning synthesis

Generate 10 future price points for a prediction curve (dates and predicted prices with bull/bear/base scenarios).

All text in Spanish.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            ai_confidence: { type: "number" },
            short_term: {
              type: "object",
              properties: {
                days: { type: "string" },
                base_target: { type: "string" },
                bull_target: { type: "string" },
                bear_target: { type: "string" },
                probability_up: { type: "number" },
                probability_down: { type: "number" }
              }
            },
            medium_term: {
              type: "object",
              properties: {
                period: { type: "string" },
                base_target: { type: "string" },
                bull_target: { type: "string" },
                bear_target: { type: "string" },
                probability_up: { type: "number" }
              }
            },
            long_term: {
              type: "object",
              properties: {
                period: { type: "string" },
                base_target: { type: "string" },
                key_factors: { type: "string" }
              }
            },
            buy_signals: {
              type: "array",
              items: { type: "object", properties: { signal: { type: "string" }, strength: { type: "number" }, explanation: { type: "string" } } }
            },
            sell_signals: {
              type: "array",
              items: { type: "object", properties: { signal: { type: "string" }, strength: { type: "number" }, explanation: { type: "string" } } }
            },
            entry_zone: { type: "string" },
            stop_loss: { type: "string" },
            risk_reward: { type: "string" },
            prediction_curve: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  base: { type: "number" },
                  bull: { type: "number" },
                  bear: { type: "number" }
                }
              }
            }
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
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="relative mx-auto w-12 h-12 mb-3">
          <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
          <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <Brain className="absolute inset-2 h-8 w-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">IA generando predicciones...</p>
      </div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* AI Confidence */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Confianza IA</span>
          </div>
          <span className="text-2xl font-bold text-primary">{data.ai_confidence}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.ai_confidence}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
          />
        </div>
      </div>

      {/* Prediction Curve */}
      {data.prediction_curve?.length > 0 && (
        <div className="rounded-xl border border-border bg-secondary/10 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Curva de Predicción</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data.prediction_curve} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2530" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={50} />
              <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", fontSize: "11px" }} />
              <Area type="monotone" dataKey="bull" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              <Area type="monotone" dataKey="bear" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              <Area type="monotone" dataKey="base" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-blue-400" /><span className="text-[10px] text-muted-foreground">Base</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-green-400" /><span className="text-[10px] text-muted-foreground">Alcista</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-red-400" /><span className="text-[10px] text-muted-foreground">Bajista</span></div>
          </div>
        </div>
      )}

      {/* Time Targets */}
      <div className="space-y-3">
        {data.short_term && (
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Corto Plazo ({data.short_term.days})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-[9px] text-red-400">Bajista</p>
                <p className="text-sm font-bold text-red-400">{data.short_term.bear_target}</p>
              </div>
              <div className="text-center rounded-lg bg-blue-500/10 border border-blue-500/20 p-2">
                <p className="text-[9px] text-blue-400">Base</p>
                <p className="text-sm font-bold text-blue-400">{data.short_term.base_target}</p>
              </div>
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-[9px] text-green-400">Alcista</p>
                <p className="text-sm font-bold text-green-400">{data.short_term.bull_target}</p>
              </div>
            </div>
            <div className="flex justify-between text-[10px] mt-2">
              <span className="text-green-400">↑ Prob: {data.short_term.probability_up}%</span>
              <span className="text-red-400">↓ Prob: {data.short_term.probability_down}%</span>
            </div>
          </div>
        )}

        {data.medium_term && (
          <div className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Medio Plazo ({data.medium_term.period})</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-[9px] text-red-400">Bajista</p>
                <p className="text-sm font-bold text-red-400">{data.medium_term.bear_target}</p>
              </div>
              <div className="text-center rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2">
                <p className="text-[9px] text-yellow-400">Base</p>
                <p className="text-sm font-bold text-yellow-400">{data.medium_term.base_target}</p>
              </div>
              <div className="text-center rounded-lg bg-secondary/50 p-2">
                <p className="text-[9px] text-green-400">Alcista</p>
                <p className="text-sm font-bold text-green-400">{data.medium_term.bull_target}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buy & Sell Signals */}
      <div className="grid grid-cols-1 gap-3">
        {data.buy_signals?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" /> Señales de Compra
            </h4>
            <div className="space-y-2">
              {data.buy_signals.map((s, i) => (
                <div key={i} className="rounded-xl bg-green-500/5 border border-green-500/15 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-green-400">{s.signal}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${j < Math.round(s.strength / 20) ? "bg-green-400" : "bg-secondary"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.sell_signals?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Señales de Riesgo
            </h4>
            <div className="space-y-2">
              {data.sell_signals.map((s, i) => (
                <div key={i} className="rounded-xl bg-red-500/5 border border-red-500/15 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-red-400">{s.signal}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${j < Math.round(s.strength / 20) ? "bg-red-400" : "bg-secondary"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{s.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entry & Risk */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 text-center">
          <p className="text-[9px] text-muted-foreground">Zona Entrada</p>
          <p className="text-xs font-bold text-green-400 mt-1">{data.entry_zone}</p>
        </div>
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-center">
          <p className="text-[9px] text-muted-foreground">Stop Loss</p>
          <p className="text-xs font-bold text-red-400 mt-1">{data.stop_loss}</p>
        </div>
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 text-center">
          <p className="text-[9px] text-muted-foreground">Risk/Reward</p>
          <p className="text-xs font-bold text-blue-400 mt-1">{data.risk_reward}</p>
        </div>
      </div>
    </div>
  );
}