import { Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function LiveSignalsFeed({ signals, marketBias }) {
  if (!signals?.length) return (
    <div className="rounded-xl border border-border bg-card/50 h-48 animate-pulse" />
  );

  const actionColor = {
    BUY: "text-green-400 bg-green-500/10 border-green-500/30",
    SELL: "text-red-400 bg-red-500/10 border-red-500/30",
    WATCH: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
  };

  return (
    <div className="rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Señales IA en Tiempo Real</h2>
          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">AI-Powered</span>
        </div>
        {marketBias && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{marketBias}</span>
        )}
      </div>
      <div className="divide-y divide-border">
        {signals.map((sig, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="p-3 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-foreground">{sig.symbol?.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/AssetAnalysis?symbol=${sig.symbol}`} className="text-sm font-bold text-foreground hover:text-primary transition-colors">
                    {sig.symbol}
                  </Link>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${actionColor[sig.action] || actionColor.WATCH}`}>{sig.action}</span>
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded">{sig.timeframe}</span>
                  <span className="text-[10px] text-muted-foreground border border-border px-1.5 py-0.5 rounded hidden sm:inline">{sig.pattern}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{sig.reason}</p>
              </div>
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs font-bold text-foreground font-mono">{sig.price}</p>
                <div className="flex gap-2 justify-end text-[10px] mt-0.5">
                  <span className="text-green-400">▶ {sig.target}</span>
                  <span className="text-red-400">✕ {sig.stop}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-7">
                {[5,4,3,2,1].map(v => (
                  <div key={v} className={`w-1.5 h-1 rounded-sm ${v <= Math.round((sig.strength || 50) / 20) ? "bg-primary" : "bg-secondary"}`} />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}