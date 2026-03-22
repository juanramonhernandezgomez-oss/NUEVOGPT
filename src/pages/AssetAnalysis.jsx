const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Loader2, TrendingUp, BarChart3, Target, Shield,
  Activity, Brain, Link2, Eye, Users, Globe, Zap, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CandlestickChart from "../components/charts/CandlestickChart";
import LongShortPanel from "../components/charts/LongShortPanel";
import CorrelationMatrix from "../components/charts/CorrelationMatrix";
import ChartPatterns from "../components/charts/ChartPatterns";
import MacroPanel from "../components/charts/MacroPanel";
import AIPrediction from "../components/charts/AIPrediction";
import TechnicalPanel from "../components/analysis/TechnicalPanel";
import FundamentalPanel from "../components/analysis/FundamentalPanel";
import OptionsPanel from "../components/analysis/OptionsPanel";

const signalConfig = {
  strong_buy: { label: "COMPRA FUERTE", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  buy: { label: "COMPRA", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  hold: { label: "MANTENER", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  sell: { label: "VENTA", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
  strong_sell: { label: "VENTA FUERTE", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
};

export default function AssetAnalysis() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlSymbol = urlParams.get("symbol");
  const [inputSymbol, setInputSymbol] = useState(urlSymbol || "");
  const [activeSymbol, setActiveSymbol] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rightTab, setRightTab] = useState("ai");
  const [bottomTab, setBottomTab] = useState("technical");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const autoLoaded = useRef(false);

  const analyzeAssetWithSymbol = async (sym) => {
    const s = sym?.trim().toUpperCase();
    if (!s) return;
    setLoading(true);
    setData(null);
    setError(null);
    setActiveSymbol(s);

    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Comprehensive real-time financial analysis for ${s}. 

TECHNICAL: current price, open, high, low, prev_close, RSI(14), MACD(12,26,9) with signal+histogram, MA20/50/100/200 with golden/death cross, Bollinger Bands upper/middle/lower + position, Stochastic K&D, ATR, volume current vs 20d avg, 3 support levels, 3 resistance levels, fibonacci, technical signal.

FUNDAMENTAL: market cap, P/E, Forward P/E, PEG, EPS TTM, Revenue TTM, profit margin, debt/equity, dividend yield, 52w high/low, analyst buy/hold/sell count, avg price target, sector, industry, fundamental signal.

OPTIONS: implied volatility, IV percentile, put/call ratio, options volume, ATM delta/gamma/theta/vega, max pain, unusual activity.

OVERALL: combined signal (strong_buy/buy/hold/sell/strong_sell), score 0-100, summary in Spanish, catalysts array, risk_factors array.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          symbol: { type: "string" },
          name: { type: "string" },
          asset_type: { type: "string" },
          current_price: { type: "string" },
          current_price_num: { type: "number" },
          daily_change_pct: { type: "number" },
          market_cap: { type: "string" },
          volume_24h: { type: "string" },
          technical: {
            type: "object",
            properties: {
              open: { type: "string" }, high: { type: "string" }, low: { type: "string" }, prev_close: { type: "string" },
              rsi: { type: "number" }, rsi_signal: { type: "string" },
              macd: { type: "string" }, macd_signal_line: { type: "string" }, macd_histogram: { type: "string" }, macd_interpretation: { type: "string" },
              ma_20: { type: "string" }, ma_50: { type: "string" }, ma_100: { type: "string" }, ma_200: { type: "string" }, ma_signal: { type: "string" },
              bb_upper: { type: "string" }, bb_middle: { type: "string" }, bb_lower: { type: "string" }, bb_position: { type: "string" },
              stochastic_k: { type: "number" }, stochastic_d: { type: "number" }, atr: { type: "string" },
              volume_current: { type: "string" }, volume_avg_20d: { type: "string" }, volume_signal: { type: "string" },
              support_1: { type: "string" }, support_2: { type: "string" }, support_3: { type: "string" },
              resistance_1: { type: "string" }, resistance_2: { type: "string" }, resistance_3: { type: "string" },
              fibonacci_levels: { type: "string" }, technical_signal: { type: "string" }
            }
          },
          fundamental: {
            type: "object",
            properties: {
              market_cap: { type: "string" }, pe_ratio: { type: "string" }, forward_pe: { type: "string" }, peg_ratio: { type: "string" },
              eps: { type: "string" }, revenue: { type: "string" }, profit_margin: { type: "string" }, debt_to_equity: { type: "string" },
              dividend_yield: { type: "string" }, week_52_high: { type: "string" }, week_52_low: { type: "string" },
              analyst_buy: { type: "number" }, analyst_hold: { type: "number" }, analyst_sell: { type: "number" },
              avg_price_target: { type: "string" }, sector: { type: "string" }, industry: { type: "string" }, fundamental_signal: { type: "string" }
            }
          },
          options: {
            type: "object",
            properties: {
              implied_volatility: { type: "string" }, iv_percentile: { type: "string" }, put_call_ratio: { type: "string" },
              options_volume: { type: "string" }, delta: { type: "string" }, gamma: { type: "string" },
              theta: { type: "string" }, vega: { type: "string" }, max_pain: { type: "string" }, unusual_activity: { type: "string" }
            }
          },
          signal: { type: "string", enum: ["strong_buy", "buy", "hold", "sell", "strong_sell"] },
          score: { type: "number" },
          summary: { type: "string" },
          catalysts: { type: "array", items: { type: "string" } },
          risk_factors: { type: "array", items: { type: "string" } }
        }
      }
    });

    setData(result);
    await db.entities.AnalysisHistory.create({
      symbol: result.symbol || s,
      asset_type: result.asset_type || "stock",
      analysis_data: JSON.stringify(result),
      signal: result.signal || "hold",
      score: result.score || 50,
    });
    setLoading(false);
  };

  const analyzeAssetSafe = async (sym) => {
    try {
      await analyzeAssetWithSymbol(sym);
    } catch (err) {
      setLoading(false);
      setError(err?.message?.includes("limit") 
        ? "Has alcanzado el límite de integraciones de este mes. Por favor, actualiza tu plan para continuar."
        : "Error al obtener datos. Intenta de nuevo más tarde.");
    }
  };

  const analyzeAsset = () => analyzeAssetSafe(inputSymbol);

  useEffect(() => {
    if (urlSymbol && !autoLoaded.current) {
      autoLoaded.current = true;
      setInputSymbol(urlSymbol);
      analyzeAssetSafe(urlSymbol);
    }
  }, []);

  const sig = data ? (signalConfig[data.signal] || signalConfig.hold) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center gap-2 px-3 md:px-5 py-2.5 border-b border-border bg-card/30">
        <div className="flex gap-2 flex-1 max-w-lg">
          <Input
            placeholder="Ticker: AAPL, TSLA, BTC, ETH, AMZN..."
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && analyzeAsset()}
            className="bg-secondary border-border text-foreground h-9 font-mono text-sm placeholder:text-muted-foreground placeholder:font-sans"
          />
          <Button onClick={analyzeAsset} disabled={loading} className="bg-primary text-primary-foreground h-9 px-5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Asset Header (when loaded) */}
        {data && sig && (
          <div className="flex items-center gap-3 ml-2">
            <div className="hidden md:flex items-center gap-3 border-l border-border pl-3">
              <span className="text-base font-bold text-foreground font-mono">{data.symbol}</span>
              <span className="text-xl font-bold text-foreground font-mono">{data.current_price}</span>
              <span className={`text-sm font-semibold ${(data.daily_change_pct || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(data.daily_change_pct || 0) >= 0 ? "+" : ""}{data.daily_change_pct?.toFixed(2)}%
              </span>
            </div>
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border ${sig.bg}`}>
              <span className={`text-xs font-bold ${sig.color}`}>{sig.label}</span>
              <span className="text-xs text-muted-foreground">{data.score}/100</span>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-2 border-secondary rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-foreground font-medium">Analizando {inputSymbol}...</p>
          <p className="text-xs text-muted-foreground mt-1">Obteniendo datos en tiempo real</p>
          <div className="flex gap-4 mt-4 text-[10px] text-muted-foreground">
            <span>✓ Técnico</span><span>✓ Fundamental</span><span>✓ Opciones</span><span>✓ Macro</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && !data && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-base font-semibold text-foreground mb-2">Error de integración</h2>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !data && !error && (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <BarChart3 className="h-10 w-10 text-primary/60" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Terminal de Análisis</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Ingresa cualquier ticker para obtener análisis completo: gráfico de velas, Long/Short, correlaciones ocultas, patrones, macro y predicción IA
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-6 text-xs text-muted-foreground max-w-sm">
            {["Candlestick Chart", "Long/Short Data", "Correlaciones IA", "Patrones Ocultos", "Análisis Macro", "Predicción IA"].map(f => (
              <div key={f} className="flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2 py-1.5">
                <span className="w-1 h-1 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Terminal Layout */}
      {data && !loading && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Mobile Signal Bar */}
          <div className={`md:hidden flex items-center justify-between px-3 py-2 border-b border-border ${sig?.bg}`}>
            <span className="text-sm font-bold text-foreground font-mono">{data.symbol} · {data.current_price}</span>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${sig?.color}`}>{sig?.label}</span>
              <span className={`text-xs ${(data.daily_change_pct || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                {(data.daily_change_pct || 0) >= 0 ? "+" : ""}{data.daily_change_pct?.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Chart + Right Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 border-b border-border">
              {/* Candlestick Chart - takes 2 cols */}
              <div className="xl:col-span-2 p-4 border-r border-border">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gráfico de Precios</span>
                  <span className="text-xs text-muted-foreground">· {data.name}</span>
                </div>
                <CandlestickChart symbol={activeSymbol} />
              </div>

              {/* Right panel - tabs */}
              <div className="overflow-y-auto max-h-[500px] xl:max-h-none">
                <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border z-10">
                  <Tabs value={rightTab} onValueChange={setRightTab}>
                    <TabsList className="w-full rounded-none bg-transparent h-9 border-0 gap-0 p-0">
                      {[
                        { value: "ai", label: "IA", icon: Brain },
                        { value: "positioning", label: "L/S", icon: Users },
                        { value: "macro", label: "Macro", icon: Globe },
                      ].map(t => (
                        <TabsTrigger
                          key={t.value}
                          value={t.value}
                          className="flex-1 rounded-none h-9 text-xs border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary gap-1"
                        >
                          <t.icon className="h-3 w-3" />{t.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
                <div className="p-3">
                  {rightTab === "ai" && <AIPrediction symbol={activeSymbol} currentPrice={data.current_price} />}
                  {rightTab === "positioning" && <LongShortPanel symbol={activeSymbol} />}
                  {rightTab === "macro" && <MacroPanel symbol={activeSymbol} />}
                </div>
              </div>
            </div>

            {/* Bottom Tabs - Technical, Fundamental, Options, Patterns, Correlations */}
            <div>
              <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border z-10 overflow-x-auto">
                <Tabs value={bottomTab} onValueChange={setBottomTab}>
                  <TabsList className="rounded-none bg-transparent h-10 border-0 gap-0 p-0 w-full min-w-max">
                    {[
                      { value: "technical", label: "Técnico", icon: Activity },
                      { value: "fundamental", label: "Fundamental", icon: BarChart3 },
                      { value: "options", label: "Opciones", icon: Target },
                      { value: "patterns", label: "Patrones", icon: Eye },
                      { value: "correlations", label: "Correlaciones", icon: Link2 },
                    ].map(t => (
                      <TabsTrigger
                        key={t.value}
                        value={t.value}
                        className="rounded-none h-10 text-xs border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary gap-1.5 px-4 whitespace-nowrap"
                      >
                        <t.icon className="h-3.5 w-3.5" />{t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="p-4">
                {/* Score bar */}
                <div className={`rounded-xl border p-4 mb-4 ${sig?.bg}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`text-lg font-bold ${sig?.color}`}>{sig?.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{data.summary?.slice(0, 120)}...</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-foreground">{data.score}</div>
                      <div className="text-xs text-muted-foreground">/100</div>
                      <div className="w-16 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${data.score}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {bottomTab === "technical" && <TechnicalPanel data={data.technical} />}
                {bottomTab === "fundamental" && <FundamentalPanel data={data.fundamental} />}
                {bottomTab === "options" && <OptionsPanel data={data.options} />}
                {bottomTab === "patterns" && <ChartPatterns symbol={activeSymbol} />}
                {bottomTab === "correlations" && <CorrelationMatrix symbol={activeSymbol} />}

                {/* Catalysts & Risks */}
                {(bottomTab === "technical" || bottomTab === "fundamental") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {data.catalysts?.length > 0 && (
                      <div className="rounded-xl border border-border bg-card/50 p-4">
                        <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" /> Catalizadores
                        </h3>
                        <ul className="space-y-1.5">
                          {data.catalysts.map((c, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">▸</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {data.risk_factors?.length > 0 && (
                      <div className="rounded-xl border border-border bg-card/50 p-4">
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Shield className="h-3.5 w-3.5" /> Riesgos
                        </h3>
                        <ul className="space-y-1.5">
                          {data.risk_factors.map((r, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">▸</span>{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}