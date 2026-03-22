export default function FearGreedGauge({ data }) {
  if (!data) return (
    <div className="rounded-xl border border-border bg-card/50 p-4 h-40 animate-pulse" />
  );

  const value = data.value || 50;
  const getColor = (v) => {
    if (v <= 25) return "text-red-400";
    if (v <= 45) return "text-orange-400";
    if (v <= 55) return "text-yellow-400";
    if (v <= 75) return "text-green-400";
    return "text-green-500";
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Fear & Greed Index
      </h3>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeDasharray={`${value * 2.64} 264`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${getColor(value)}`}>{value}</span>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-bold ${getColor(value)}`}>{data.label || "Neutral"}</p>
          {data.vix && <p className="text-xs text-muted-foreground mt-1">VIX: {data.vix}</p>}
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{data.summary}</p>
        </div>
      </div>
    </div>
  );
}