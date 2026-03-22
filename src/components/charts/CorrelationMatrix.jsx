import { useState, useEffect } from "react";
import { buildCorrelationData } from '@/services/panelDataService';

export default function CorrelationMatrix({ symbol }) {
  const [data, setData] = useState(null);
  useEffect(() => { if (!symbol) return; buildCorrelationData(symbol).then(setData); }, [symbol]);
  if (!symbol || !data) return null;
  return <div className="space-y-4"><div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Correlaciones</h4><div className="space-y-2">{data.correlations.map((item) => <div key={item.asset} className="rounded-xl border border-border bg-secondary/20 p-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{item.asset}</span><span className={`text-xs font-bold ${item.coefficient >= 0 ? 'text-green-400' : 'text-red-400'}`}>{item.coefficient.toFixed(2)}</span></div><p className="text-xs text-muted-foreground mt-1">{item.relationship}</p></div>)}</div></div><div><h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Patrones estacionales</h4><div className="space-y-2">{data.seasonal_patterns.map((item) => <div key={item.period} className="rounded-xl border border-border bg-secondary/20 p-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{item.period}</span><span className="text-xs text-primary">{item.reliability}%</span></div><p className="text-xs text-muted-foreground mt-1">{item.explanation}</p></div>)}</div></div></div>;
}
