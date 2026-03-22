import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export default function MarketOverviewCards({ assets }) {
  if (!assets?.length) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-28 rounded-xl border border-border bg-card/50 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {assets.map((asset, i) => {
        const sparkData = asset.sparkline?.map((v) => ({ v })) || [];
        const isUp = (asset.change_1d || 0) >= 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card/50 p-3 hover:bg-accent/30 transition-colors cursor-default overflow-hidden relative"
          >
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData}>
                  <Area type="monotone" dataKey="v" stroke={isUp ? "#22c55e" : "#ef4444"} fill={isUp ? "#22c55e" : "#ef4444"} fillOpacity={0.2} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{asset.symbol}</span>
                {isUp ? <TrendingUp className="h-3 w-3 text-green-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
              </div>
              <p className="text-base font-bold text-foreground font-mono leading-tight">{asset.value}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
                  {isUp ? "+" : ""}{asset.change_1d?.toFixed(2)}%
                </span>
                <span className="text-[10px] text-muted-foreground hidden sm:inline">{asset.name}</span>
              </div>
              <span className={`text-[9px] ${(asset.change_1w || 0) >= 0 ? "text-green-400/60" : "text-red-400/60"}`}>
                7D: {(asset.change_1w || 0) >= 0 ? "+" : ""}{asset.change_1w?.toFixed(2)}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}