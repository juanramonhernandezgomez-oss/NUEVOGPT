const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { RefreshCw, BarChart2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_DASHBOARD_DATA } from "@/lib/mockMarketData";
import MarketTickerBar from "../components/dashboard/MarketTickerBar";
import MarketOverviewCards from "../components/dashboard/MarketOverviewCards";
import FearGreedGauge from "../components/dashboard/FearGreedGauge";
import TopMovers from "../components/dashboard/TopMovers";
import MarketNews from "../components/dashboard/MarketNews";
import LiveSignalsFeed from "../components/dashboard/LiveSignalsFeed";

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [dashData, setDashData] = useState(MOCK_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Provide a comprehensive real-time market dashboard snapshot for today (${new Date().toDateString()}). Include ALL of the following in a single response:

1. TICKERS: Current price and daily % change for SPY, QQQ, BTC, ETH, AAPL, TSLA, NVDA, GOLD, DXY, VIX.
2. MARKET ASSETS (8 cards): S&P 500, Nasdaq, Bitcoin, Gold, DXY, WTI Oil, 10Y US Yield, VIX — with value, 1d change %, 1w change %, sparkline (8 values 0-100).
3. FEAR & GREED: Current index value (0-100), label, VIX value, brief sentiment summary in Spanish.
4. TOP MOVERS: Top 5 gaining and top 5 losing stocks/assets today with symbol, name, price, change %.
5. NEWS: 5 most important financial headlines today with title, summary (Spanish), sentiment (positive/negative/neutral), source, time_ago.
6. SIGNALS: 8 actionable AI trading signals across asset classes with symbol, name, asset_type, action (BUY/SELL/WATCH), price, target, stop, strength (0-100), reason (Spanish), timeframe, pattern.
7. MARKET STATUS: Overall market bias and session info.

Use real current market data.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          tickers: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, price: { type: "string" }, change: { type: "number" } } } },
          assets: { type: "array", items: { type: "object", properties: { name: { type: "string" }, symbol: { type: "string" }, value: { type: "string" }, change_1d: { type: "number" }, change_1w: { type: "number" }, sparkline: { type: "array", items: { type: "number" } } } } },
          fear_greed: { type: "object", properties: { value: { type: "number" }, label: { type: "string" }, vix: { type: "number" }, summary: { type: "string" } } },
          gainers: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, name: { type: "string" }, price: { type: "string" }, change_pct: { type: "number" } } } },
          losers: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, name: { type: "string" }, price: { type: "string" }, change_pct: { type: "number" } } } },
          headlines: { type: "array", items: { type: "object", properties: { title: { type: "string" }, summary: { type: "string" }, sentiment: { type: "string" }, source: { type: "string" }, time_ago: { type: "string" } } } },
          signals: { type: "array", items: { type: "object", properties: { symbol: { type: "string" }, name: { type: "string" }, asset_type: { type: "string" }, action: { type: "string" }, price: { type: "string" }, target: { type: "string" }, stop: { type: "string" }, strength: { type: "number" }, reason: { type: "string" }, timeframe: { type: "string" }, pattern: { type: "string" } } } },
          market_bias: { type: "string" },
          session: { type: "string" }
        }
      }
    }).catch((err) => {
      setError("Límite de integraciones alcanzado. Mostrando datos de muestra.");
      setIsLive(false);
      return null;
    });

    if (result) {
      setDashData(result);
      setIsLive(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-border bg-card/30 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isLive ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold text-green-400">LIVE</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                <span className="font-semibold text-yellow-400">DEMO</span>
              </>
            )}
          </div>
          <span className="text-muted-foreground hidden sm:inline">InvestPro Terminal v2.0</span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-400 text-[10px] hidden md:inline">{error}</span>}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLiveData}
            disabled={loading}
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1"
          >
            {loading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isLive ? (
              <Wifi className="h-3 w-3 text-green-400" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {loading ? "Cargando..." : isLive ? "Actualizar" : "Cargar datos en vivo"}
          </Button>
          <span className="text-foreground font-medium">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Ticker Bar */}
      <MarketTickerBar tickers={dashData?.tickers} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Terminal de Mercados
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isLive ? `Datos en vivo · ${dashData?.session || "Sesión activa"}` : "Datos de muestra · Haz clic en 'Cargar datos en vivo' para actualizar"}
            </p>
          </div>
        </div>

        {!isLive && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-yellow-400">
              Mostrando datos de muestra. Haz clic en <strong>"Cargar datos en vivo"</strong> para obtener datos reales del mercado (consume 1 crédito de integración).
            </p>
            <Button size="sm" onClick={fetchLiveData} disabled={loading} className="flex-shrink-0 h-7 text-xs">
              {loading ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Wifi className="h-3 w-3 mr-1" />}
              Actualizar
            </Button>
          </div>
        )}

        <MarketOverviewCards assets={dashData?.assets} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <LiveSignalsFeed signals={dashData?.signals} marketBias={dashData?.market_bias} />
            <MarketNews headlines={dashData?.headlines} />
          </div>
          <div className="space-y-4">
            <FearGreedGauge data={dashData?.fear_greed} />
            <TopMovers gainers={dashData?.gainers} losers={dashData?.losers} />
          </div>
        </div>
      </div>
    </div>
  );
}