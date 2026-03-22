import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Loader2, BarChart3 } from "lucide-react";
import CandlestickChart from "../components/charts/CandlestickChart";
import LongShortPanel from "../components/charts/LongShortPanel";
import CorrelationMatrix from "../components/charts/CorrelationMatrix";
import ChartPatterns from "../components/charts/ChartPatterns";
import MacroPanel from "../components/charts/MacroPanel";
import AIPrediction from "../components/charts/AIPrediction";
import TechnicalPanel from "../components/analysis/TechnicalPanel";
import FundamentalPanel from "../components/analysis/FundamentalPanel";
import OptionsPanel from "../components/analysis/OptionsPanel";
import { analyzeAsset } from '@/services/marketDataService';
import { db } from '@/api/localClient';

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

  const analyzeAssetSafe = async (sym) => {
    const s = sym?.trim().toUpperCase();
    if (!s) return;
    try {
      setLoading(true);
      setData(null);
      setError(null);
      setActiveSymbol(s);
      const result = await analyzeAsset(s);
      setData(result);
      await db.entities.AnalysisHistory.create({ symbol: result.symbol, asset_type: result.asset_type || 'stock', analysis_data: JSON.stringify(result), signal: result.signal, score: result.score });
    } catch (err) {
      console.error(err);
      setError("Error al obtener datos gratuitos. Verifica el ticker e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlSymbol && !autoLoaded.current) {
      autoLoaded.current = true;
      analyzeAssetSafe(urlSymbol);
    }
  }, []);

  const sig = data ? (signalConfig[data.signal] || signalConfig.hold) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 md:px-5 py-2.5 border-b border-border bg-card/30">
        <div className="flex gap-2 flex-1 max-w-lg">
          <Input placeholder="Ticker: AAPL, TSLA, BTC-USD, ETH-USD..." value={inputSymbol} onChange={(e) => setInputSymbol(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && analyzeAssetSafe(inputSymbol)} className="bg-secondary border-border text-foreground h-9 font-mono text-sm placeholder:text-muted-foreground placeholder:font-sans" />
          <Button onClick={() => analyzeAssetSafe(inputSymbol)} disabled={loading} className="bg-primary text-primary-foreground h-9 px-5">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
        </div>
        {data && sig && <div className="flex items-center gap-3 ml-2"><div className="hidden md:flex items-center gap-3 border-l border-border pl-3"><span className="text-base font-bold text-foreground font-mono">{data.symbol}</span><span className="text-xl font-bold text-foreground font-mono">{data.current_price}</span><span className={`text-sm font-semibold ${(data.daily_change_pct || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{(data.daily_change_pct || 0) >= 0 ? "+" : ""}{data.daily_change_pct?.toFixed(2)}%</span></div><div className={`hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg border ${sig.bg}`}><span className={`text-xs font-bold ${sig.color}`}>{sig.label}</span><span className="text-xs text-muted-foreground">{data.score}/100</span></div></div>}
      </div>

      {loading && <div className="flex flex-col items-center justify-center flex-1"><div className="relative mb-4"><div className="w-16 h-16 border-2 border-secondary rounded-full" /><div className="absolute inset-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div><p className="text-sm text-foreground font-medium">Analizando {inputSymbol}...</p><p className="text-xs text-muted-foreground mt-1">Usando Yahoo Finance free tier y cálculos locales.</p></div>}
      {!loading && error && !data && <div className="flex flex-col items-center justify-center flex-1 text-center px-4"><div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4"><span className="text-2xl">⚠️</span></div><h2 className="text-base font-semibold text-foreground mb-2">Error de datos</h2><p className="text-sm text-muted-foreground max-w-sm">{error}</p></div>}
      {!loading && !data && !error && <div className="flex flex-col items-center justify-center flex-1 text-center px-4"><div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4"><BarChart3 className="h-10 w-10 text-primary/60" /></div><h2 className="text-lg font-semibold text-foreground mb-2">Terminal de Análisis</h2><p className="text-sm text-muted-foreground max-w-sm">Ingresa cualquier ticker para obtener análisis técnico, fundamental, macro y de posicionamiento sin Base44.</p></div>}

      {data && !loading && <div className="flex-1 overflow-hidden flex flex-col">
        <div className={`md:hidden flex items-center justify-between px-3 py-2 border-b border-border ${sig?.bg}`}><span className="text-sm font-bold text-foreground font-mono">{data.symbol} · {data.current_price}</span><div className="flex items-center gap-2"><span className={`text-xs font-bold ${sig?.color}`}>{sig?.label}</span><span className={`text-xs ${(data.daily_change_pct || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>{data.daily_change_pct?.toFixed(2)}%</span></div></div>
        <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 rounded-xl border border-border bg-card/50 p-4"><CandlestickChart symbol={activeSymbol || data.symbol} /></div>
            <div className="rounded-xl border border-border bg-card/50 p-4"><Tabs value={rightTab} onValueChange={setRightTab}><TabsList className="grid grid-cols-3 w-full"><TabsTrigger value="ai">IA</TabsTrigger><TabsTrigger value="positioning">Posicionamiento</TabsTrigger><TabsTrigger value="macro">Macro</TabsTrigger></TabsList><TabsContent value="ai"><AIPrediction symbol={data.symbol} currentPrice={data.current_price_num} /></TabsContent><TabsContent value="positioning"><LongShortPanel symbol={data.symbol} /></TabsContent><TabsContent value="macro"><MacroPanel symbol={data.symbol} /></TabsContent></Tabs></div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4"><Tabs value={bottomTab} onValueChange={setBottomTab}><TabsList className="grid grid-cols-4 w-full"><TabsTrigger value="technical">Technical</TabsTrigger><TabsTrigger value="fundamental">Fundamental</TabsTrigger><TabsTrigger value="options">Options</TabsTrigger><TabsTrigger value="patterns">Patterns/Correlations</TabsTrigger></TabsList><TabsContent value="technical"><TechnicalPanel data={data.technical} /></TabsContent><TabsContent value="fundamental"><FundamentalPanel data={data.fundamental} /></TabsContent><TabsContent value="options"><OptionsPanel data={data.options} /></TabsContent><TabsContent value="patterns"><div className="grid xl:grid-cols-2 gap-4"><ChartPatterns symbol={data.symbol} /><CorrelationMatrix symbol={data.symbol} /></div></TabsContent></Tabs></div>
          <div className="grid md:grid-cols-2 gap-4"><div className="rounded-xl border border-border bg-card/50 p-4"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Catalizadores</p><ul className="space-y-2">{data.catalysts?.map((item) => <li key={item} className="text-sm text-foreground">• {item}</li>)}</ul></div><div className="rounded-xl border border-border bg-card/50 p-4"><p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Factores de Riesgo</p><ul className="space-y-2">{data.risk_factors?.map((item) => <li key={item} className="text-sm text-foreground">• {item}</li>)}</ul></div></div>
        </div>
      </div>}
    </div>
  );
}
