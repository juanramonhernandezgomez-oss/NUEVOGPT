import { useState, useEffect } from "react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from "recharts";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCandles } from '@/services/marketDataService';

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "6M", "1Y"];

export default function CandlestickChart({ symbol }) {
  const [tf, setTf] = useState("1M");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [indicators, setIndicators] = useState({ ma20: true, ma50: true, bb: true });

  const load = async () => {
    if (!symbol) return;
    setLoading(true);
    try { setData(await fetchCandles(symbol, tf)); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [symbol, tf]);
  if (!symbol) return <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">Busca un activo para ver la gráfica</div>;

  return <div className="h-full"><div className="flex items-center justify-between mb-3"><div className="flex gap-1">{TIMEFRAMES.map((t) => <button key={t} onClick={() => setTf(t)} className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${tf === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>{t}</button>)}</div><div className="flex items-center gap-2"><button onClick={() => setIndicators((p) => ({ ...p, ma20: !p.ma20 }))} className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${indicators.ma20 ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-muted-foreground border border-border"}`}>MA20</button><button onClick={() => setIndicators((p) => ({ ...p, ma50: !p.ma50 }))} className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${indicators.ma50 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "text-muted-foreground border border-border"}`}>MA50</button><button onClick={() => setIndicators((p) => ({ ...p, bb: !p.bb }))} className={`text-[10px] px-2 py-1 rounded font-medium transition-all ${indicators.bb ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-muted-foreground border border-border"}`}>BB</button><Button variant="ghost" size="icon" onClick={load} className="h-7 w-7 text-muted-foreground"><RefreshCw className="h-3 w-3" /></Button></div></div>{loading ? <div className="h-72 flex items-center justify-center"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div> : <><ResponsiveContainer width="100%" height={320}><ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#1e2530" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 9, fill: "#4b5563" }} tickLine={false} axisLine={false} width={55} domain={["auto", "auto"]} /><Tooltip contentStyle={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 12 }} />{indicators.bb && <><Area dataKey="bb_upper" fill="#7c3aed" fillOpacity={0.03} stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 2" dot={false} /><Area dataKey="bb_lower" fill="#7c3aed" fillOpacity={0.03} stroke="#7c3aed" strokeWidth={1} strokeDasharray="3 2" dot={false} /></>}{indicators.ma20 && <Line type="monotone" dataKey="ma20" stroke="#3b82f6" strokeWidth={1.5} dot={false} />}{indicators.ma50 && <Line type="monotone" dataKey="ma50" stroke="#f97316" strokeWidth={1.5} dot={false} />}<Bar dataKey="close" fill="#22c55e" opacity={0.6} /></ComposedChart></ResponsiveContainer><ResponsiveContainer width="100%" height={60}><ComposedChart data={data}><XAxis dataKey="date" hide /><YAxis hide /><Bar dataKey="volume" fill="#3b82f6" opacity={0.35} radius={[1,1,0,0]} /></ComposedChart></ResponsiveContainer></>}</div>;
}
