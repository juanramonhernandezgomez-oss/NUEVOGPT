import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { buildLongShortData } from '@/services/panelDataService';

export default function LongShortPanel({ symbol }) {
  const [data, setData] = useState(null);
  useEffect(() => { if (!symbol) return; buildLongShortData(symbol).then(setData); }, [symbol]);
  if (!symbol || !data) return null;
  const pieData = [{ name: 'Long', value: data.retail_long_pct }, { name: 'Short', value: data.retail_short_pct }];
  return <div className="space-y-4"><div className="h-44"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70}>{pieData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#22c55e' : '#ef4444'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="grid grid-cols-2 gap-3 text-xs"><div className="rounded-xl border border-border bg-secondary/20 p-3"><p className="text-muted-foreground">Retail</p><p className="text-foreground font-semibold">{data.retail_long_pct}% long / {data.retail_short_pct}% short</p><p className="text-muted-foreground mt-1">{data.retail_signal}</p></div><div className="rounded-xl border border-border bg-secondary/20 p-3"><p className="text-muted-foreground">Institucional</p><p className="text-foreground font-semibold">{data.institutional_net}</p><p className="text-muted-foreground mt-1">{data.institutional_trend}</p></div><div className="rounded-xl border border-border bg-secondary/20 p-3"><p className="text-muted-foreground">Short interest</p><p className="text-foreground font-semibold">{data.short_interest_pct}%</p><p className="text-muted-foreground mt-1">{data.days_to_cover} días para cubrir</p></div><div className="rounded-xl border border-border bg-secondary/20 p-3"><p className="text-muted-foreground">Opciones</p><p className="text-foreground font-semibold">Calls {data.call_volume}</p><p className="text-muted-foreground mt-1">Puts {data.put_volume}</p></div></div><div className="rounded-xl border border-border bg-secondary/20 p-3 text-sm text-foreground">{data.interpretation}</div></div>;
}
