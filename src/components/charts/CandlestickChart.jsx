const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area
} from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y"];

function CandleBar(props) {
  const { x, y, width, height, open, close, low, high, index } = props;
  if (!open || !close) return null;
  const isGreen = close >= open;
  const color = isGreen ? "#22c55e" : "#ef4444";
  const barX = x + width * 0.2;
  const barW = width * 0.6;
  const bodyTop = Math.min(y, y + height);
  const bodyH = Math.abs(height);
  return (
    <g>
      <line x1={barX + barW / 2} y1={props.wickTop} x2={barX + barW / 2} y2={bodyTop} stroke={color} strokeWidth={1} />
      <rect x={barX} y={bodyTop} width={barW} height={Math.max(bodyH, 1)} fill={color} opacity={0.9} rx={1} />
      <line x1={barX + barW / 2} y1={bodyTop + Math.max(bodyH, 1)} x2={barX + barW / 2} y2={props.wickBottom} stroke={color} strokeWidth={1} />
    </g>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 text-xs shadow-2xl">
      <p className="text-[#8b949e] mb-2 font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-[#8b949e]">O:</span><span className="text-white font-mono">{d?.open?.toFixed(2)}</span>
        <span className="text-[#8b949e]">H:</span><span className="text-green-400 font-mono">{d?.high?.toFixed(2)}</span>
        <span className="text-[#8b949e]">L:</span><span className="text-red-400 font-mono">{d?.low?.toFixed(2)}</span>
        <span className="text-[#8b949e]">C:</span><span className="text-white font-mono">{d?.close?.toFixed(2)}</span>
        <span className="text-[#8b949e]">Vol:</span><span className="text-blue-400 font-mono">{d?.volume?.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default function CandlestickChart({ symbol }) {
  const [tf, setTf] = useState("1M");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState({ ma20: true, ma50: true, bb: true });

  const fetchData = async () => {
    if (!symbol) return;
    setLoading(true);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Generate realistic OHLCV (candlestick) data for ${symbol} for the last ${tf === "1D" ? "24 hours (24 data points)" : tf === "1W" ? "7 days (30 data points)" : tf === "1M" ? "30 days (30 data points)" : tf === "3M" ? "90 days (45 data points)" : tf === "6M" ? "180 days (60 data points)" : "365 days (60 data points)"}. 

Use the real current price of ${symbol} as reference and generate historically accurate OHLC data with realistic price movements, volume, and volatility patterns. Include a 20-period MA, 50-period MA, and Bollinger Band values for each point.

The data should look like real market data with proper candlestick patterns.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          current_price: { type: "number" },
          candles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string" },
                open: { type: "number" },
                high: { type: "number" },
                low: { type: "number" },
                close: { type: "number" },
                volume: { type: "number" },
                ma20: { type: "number" },
                ma50: { type: "number" },
                bb_upper: { type: "number" },
                bb_lower: { type: "number" }
              }
            }
          }
        }
      }
    });
    setData(result?.candles || []);
    setLoading(false);
  };

  useEffect(() => { if (symbol) fetchData(); }, [symbol, tf]);

  const priceColor = (d) => d?.close >= d?.open ? "#22c55e" : "#ef4444";

  const CustomCandleBar = (props) => {
    const { x, y, width, payload } = props;
    if (!payload) return null;
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? "#22c55e" : "#ef4444";
    const allPrices = data.map(d => [d.high, d.low]).flat().filter(Boolean);
    const maxP = Math.max(...allPrices);
    const minP = Math.min(...allPrices);
    const range = maxP - minP || 1;
    const chartH = 300;
    const toY = (p) => chartH - ((p - minP) / range) * chartH;
    const bodyTop = Math.min(toY(open), toY(close));
    const bodyBot = Math.max(toY(open), toY(close));
    const bodyH = Math.max(bodyBot - bodyTop, 1);
    const cx = x + width / 2;
    return (
      <g>
        <line x1={cx} y1={toY(high)} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1} />
        <rect x={x + 2} y={bodyTop} width={Math.max(width - 4, 1)} height={bodyH} fill={color} opacity={0.85} />
        <line x1={cx} y1={bodyBot} x2={cx} y2={toY(low)} stroke={color} strokeWidth={1} />
      </g>
    );
  };

  if (!symbol) return (
    <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
      Busca un activo para ver la gráfica
    </div>
  );

  return (
    <div className="h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIndicators(p => ({ ...p, ma20: !p.ma20 }))} className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${indicators.ma20 ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-muted-foreground border border-border"}`}>MA20</button>
          <button onClick={() => setIndicators(p => ({ ...p, ma50: !p.ma50 }))} className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${indicators.ma50 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-muted-foreground border border-border"}`}>MA50</button>
          <button onClick={() => setIndicators(p => ({ ...p, bb: !p.bb }))} className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${indicators.bb ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-muted-foreground border border-border"}`}>BB</button>
          <Button variant="ghost" size="icon" onClick={fetchData} className="h-7 w-7 text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2530" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} width={55} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v?.toFixed(1)} />
            <Tooltip content={<CustomTooltip />} />

            {indicators.bb && data[0]?.bb_upper && (
              <>
                <Area dataKey="bb_upper" fill="#7c3aed" fillOpacity={0.03} stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 2" dot={false} />
                <Area dataKey="bb_lower" fill="#7c3aed" fillOpacity={0.03} stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 2" dot={false} />
              </>
            )}
            {indicators.ma20 && <Line type="monotone" dataKey="ma20" stroke="#3b82f6" strokeWidth={1.5} dot={false} />}
            {indicators.ma50 && <Line type="monotone" dataKey="ma50" stroke="#f97316" strokeWidth={1.5} dot={false} />}

            <Bar dataKey="close" shape={(props) => {
              const { x, y, width, height, payload } = props;
              if (!payload) return null;
              const { open, high, low, close } = payload;
              const isGreen = close >= open;
              const color = isGreen ? "#22c55e" : "#ef4444";
              const allPrices = data.flatMap(d => [d.high, d.low]).filter(Boolean);
              const maxP = Math.max(...allPrices);
              const minP = Math.min(...allPrices);
              const totalRange = maxP - minP || 1;
              const chartHeight = 310;
              const toPixel = (p) => (1 - (p - minP) / totalRange) * chartHeight;
              const bodyTop = Math.min(toPixel(open), toPixel(close));
              const bodyBot = Math.max(toPixel(open), toPixel(close));
              const bodyH = Math.max(bodyBot - bodyTop, 1);
              const cx = x + width / 2;
              return (
                <g key={`candle-${x}`}>
                  <line x1={cx} y1={toPixel(high)} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1.5} />
                  <rect x={x + 1} y={bodyTop} width={Math.max(width - 2, 2)} height={bodyH} fill={color} opacity={0.9} rx={1} />
                  <line x1={cx} y1={bodyBot} x2={cx} y2={toPixel(low)} stroke={color} strokeWidth={1.5} />
                </g>
              );
            }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Volume bars */}
      {!loading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={60}>
          <ComposedChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Bar dataKey="volume" fill="#3b82f6" opacity={0.4} radius={[1,1,0,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}