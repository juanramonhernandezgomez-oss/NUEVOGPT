import { useState, useEffect } from "react";
import { RefreshCw, BarChart2, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_DASHBOARD_DATA } from "@/lib/mockMarketData";
import { fetchDashboardData } from "@/services/marketDataService";
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
    try {
      const result = await fetchDashboardData();
      setDashData(result);
      setIsLive(true);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar datos gratuitos en vivo. Mostrando datos demo.");
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 md:px-6 py-2 border-b border-border bg-card/30 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {isLive ? <><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /><span className="font-semibold text-green-400">LIVE</span></> : <><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" /><span className="font-semibold text-yellow-400">DEMO</span></>}
          </div>
          <span className="text-muted-foreground hidden sm:inline">InvestPro Terminal v2.0 · Free APIs</span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-400 text-[10px] hidden md:inline">{error}</span>}
          <Button variant="ghost" size="sm" onClick={fetchLiveData} disabled={loading} className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground gap-1">
            {loading ? <RefreshCw className="h-3 w-3 animate-spin" /> : isLive ? <Wifi className="h-3 w-3 text-green-400" /> : <WifiOff className="h-3 w-3" />}
            {loading ? "Cargando..." : isLive ? "Actualizar" : "Cargar datos en vivo"}
          </Button>
          <span className="text-foreground font-medium">{time.toLocaleTimeString()}</span>
        </div>
      </div>

      <MarketTickerBar tickers={dashData?.tickers} />

      <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" /> Terminal de Mercados
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{isLive ? `Datos gratuitos en vivo · ${dashData?.session || "Sesión activa"}` : "Datos de muestra · Haz clic en 'Cargar datos en vivo' para actualizar"}</p>
          </div>
        </div>

        {!isLive && (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-yellow-400">Mostrando datos de muestra. Haz clic en <strong>"Cargar datos en vivo"</strong> para obtener datos reales desde Yahoo Finance free tier.</p>
            <Button size="sm" onClick={fetchLiveData} disabled={loading} className="flex-shrink-0 h-7 text-xs">
              {loading ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Wifi className="h-3 w-3 mr-1" />} Actualizar
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
