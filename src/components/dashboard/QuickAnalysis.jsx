const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const signalConfig = {
  strong_buy: { label: "COMPRA FUERTE", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  buy: { label: "COMPRA", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
  hold: { label: "MANTENER", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  sell: { label: "VENTA", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  strong_sell: { label: "VENTA FUERTE", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

export default function QuickAnalysis() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analyze = async () => {
    if (!symbol.trim()) return;
    setLoading(true);
    setResult(null);

    const data = await db.integrations.Core.InvokeLLM({
      prompt: `Perform a comprehensive real-time financial analysis for the asset: ${symbol.toUpperCase()}.

Include:
1. Current price and daily change
2. Technical indicators: RSI (14), MACD signal, 50-day and 200-day moving averages, Bollinger Band position
3. Support and resistance levels
4. Volume analysis
5. Overall signal: strong_buy, buy, hold, sell, or strong_sell
6. Confidence score 0-100
7. Short summary explaining the recommendation in Spanish
8. Key risk factors

Be as accurate as possible with current real data.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          name: { type: "string" },
          asset_type: { type: "string" },
          current_price: { type: "string" },
          daily_change_pct: { type: "number" },
          technical: {
            type: "object",
            properties: {
              rsi: { type: "number" },
              rsi_signal: { type: "string" },
              macd_signal: { type: "string" },
              ma_50: { type: "string" },
              ma_200: { type: "string" },
              ma_signal: { type: "string" },
              bollinger_position: { type: "string" },
              volume_trend: { type: "string" }
            }
          },
          support: { type: "string" },
          resistance: { type: "string" },
          signal: { type: "string", enum: ["strong_buy", "buy", "hold", "sell", "strong_sell"] },
          score: { type: "number" },
          summary: { type: "string" },
          risk_factors: { type: "array", items: { type: "string" } }
        }
      }
    });

    setResult(data);

    // Save to history
    await db.entities.AnalysisHistory.create({
      symbol: data.symbol || symbol.toUpperCase(),
      asset_type: data.asset_type || "stock",
      analysis_data: JSON.stringify(data),
      signal: data.signal || "hold",
      score: data.score || 50,
    });

    setLoading(false);
  };

  const sig = result ? signalConfig[result.signal] || signalConfig.hold : null;

  return (
    <div className="rounded-2xl border border-border bg-card/50 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Análisis Rápido</h2>
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Ingresa un ticker (AAPL, BTC, TSLA...)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && analyze()}
          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
        />
        <Button onClick={analyze} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 px-6">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {result && sig && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Signal Header */}
            <div className={`rounded-xl ${sig.bg} border ${sig.border} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{result.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{result.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{result.current_price}</p>
                  <p className={`text-sm font-medium ${result.daily_change_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {result.daily_change_pct >= 0 ? "+" : ""}{result.daily_change_pct?.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${sig.color}`}>{sig.label}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{ width: `${result.score}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-foreground">{result.score}/100</span>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "RSI (14)", value: result.technical?.rsi?.toFixed(1), sub: result.technical?.rsi_signal },
                { label: "MACD", value: result.technical?.macd_signal },
                { label: "MA 50", value: result.technical?.ma_50, sub: result.technical?.ma_signal },
                { label: "Volumen", value: result.technical?.volume_trend },
              ].map((ind) => (
                <div key={ind.label} className="rounded-xl bg-secondary/50 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{ind.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{ind.value || "N/A"}</p>
                  {ind.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{ind.sub}</p>}
                </div>
              ))}
            </div>

            {/* Support & Resistance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3">
                <p className="text-[10px] text-green-400 uppercase tracking-wider">Soporte</p>
                <p className="text-sm font-semibold text-foreground mt-1">{result.support || "N/A"}</p>
              </div>
              <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3">
                <p className="text-[10px] text-red-400 uppercase tracking-wider">Resistencia</p>
                <p className="text-sm font-semibold text-foreground mt-1">{result.resistance || "N/A"}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl bg-secondary/30 border border-border p-4">
              <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>
            </div>

            {/* Risk Factors */}
            {result.risk_factors?.length > 0 && (
              <div className="rounded-xl bg-secondary/30 border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Factores de Riesgo</p>
                <ul className="space-y-1">
                  {result.risk_factors.map((risk, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}