import { motion } from "framer-motion";

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value || "N/A"}</span>
    </div>
  );
}

export default function FundamentalPanel({ data }) {
  if (!data) return <p className="text-muted-foreground text-sm p-4">No hay datos fundamentales disponibles.</p>;

  const totalAnalysts = (data.analyst_buy || 0) + (data.analyst_hold || 0) + (data.analyst_sell || 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 mt-4"
    >
      {/* Valuation */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Valoración</h3>
        <MetricRow label="Capitalización de Mercado" value={data.market_cap} />
        <MetricRow label="P/E Ratio (TTM)" value={data.pe_ratio} />
        <MetricRow label="Forward P/E" value={data.forward_pe} />
        <MetricRow label="PEG Ratio" value={data.peg_ratio} />
        <MetricRow label="EPS (TTM)" value={data.eps} />
      </div>

      {/* Financial Health */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Salud Financiera</h3>
        <MetricRow label="Ingresos (TTM)" value={data.revenue} />
        <MetricRow label="Margen de Ganancia" value={data.profit_margin} />
        <MetricRow label="Deuda/Capital" value={data.debt_to_equity} />
        <MetricRow label="Rendimiento Dividendo" value={data.dividend_yield || "N/A"} />
      </div>

      {/* Price Range */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Rango de 52 Semanas</h3>
        <div className="flex items-center gap-4 mb-3">
          <span className="text-sm text-red-400 font-medium">{data.week_52_low}</span>
          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 w-full" />
          </div>
          <span className="text-sm text-green-400 font-medium">{data.week_52_high}</span>
        </div>
        <MetricRow label="Sector" value={data.sector} />
        <MetricRow label="Industria" value={data.industry} />
      </div>

      {/* Analyst Ratings */}
      {totalAnalysts > 0 && (
        <div className="rounded-2xl border border-border bg-card/50 p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Consenso de Analistas</h3>
          <div className="flex gap-3 mb-4">
            <div className="flex-1 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{data.analyst_buy || 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Compra</p>
            </div>
            <div className="flex-1 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-yellow-400">{data.analyst_hold || 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Mantener</p>
            </div>
            <div className="flex-1 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{data.analyst_sell || 0}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Venta</p>
            </div>
          </div>
          <MetricRow label="Precio Objetivo Promedio" value={data.avg_price_target} />
        </div>
      )}

      {/* Overall Signal */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Señal Fundamental General</h3>
        <p className="text-base font-bold text-foreground">{data.fundamental_signal || "N/A"}</p>
      </div>
    </motion.div>
  );
}