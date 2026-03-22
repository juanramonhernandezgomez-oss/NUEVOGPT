import { motion } from "framer-motion";

const signalConfig = {
  strong_buy: { label: "COMPRA FUERTE", color: "text-green-400", gradient: "from-green-500/20" },
  buy: { label: "COMPRA", color: "text-green-400", gradient: "from-green-500/20" },
  hold: { label: "MANTENER", color: "text-yellow-400", gradient: "from-yellow-500/20" },
  sell: { label: "VENTA", color: "text-red-400", gradient: "from-red-500/20" },
  strong_sell: { label: "VENTA FUERTE", color: "text-red-400", gradient: "from-red-500/20" },
};

export default function SignalBadge({ data }) {
  const sig = signalConfig[data.signal] || signalConfig.hold;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border border-border bg-gradient-to-br ${sig.gradient} to-transparent p-6 md:p-8`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{data.symbol}</h2>
            <span className="text-xs bg-secondary px-3 py-1 rounded-full text-muted-foreground uppercase">
              {data.asset_type}
            </span>
          </div>
          <p className="text-base text-muted-foreground">{data.name}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-3xl md:text-4xl font-bold text-foreground">{data.current_price}</p>
            <p className={`text-lg font-semibold ${data.daily_change_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
              {data.daily_change_pct >= 0 ? "+" : ""}{data.daily_change_pct?.toFixed(2)}%
            </p>
          </div>

          <div className="h-16 w-px bg-border" />

          <div className="text-center">
            <p className={`text-xl font-bold ${sig.color}`}>{sig.label}</p>
            <div className="mt-2 w-24 h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-primary"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Score: {data.score}/100</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}