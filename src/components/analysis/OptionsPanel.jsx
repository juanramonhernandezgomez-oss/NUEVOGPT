import { motion } from "framer-motion";

function GreekCard({ letter, name, value, description }) {
  return (
    <div className="rounded-xl bg-secondary/30 border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-bold text-primary">{letter}</span>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{name}</span>
      </div>
      <p className="text-base font-bold text-foreground">{value || "N/A"}</p>
      {description && <p className="text-[10px] text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

export default function OptionsPanel({ data }) {
  if (!data) return <p className="text-muted-foreground text-sm p-4">No hay datos de opciones disponibles para este activo.</p>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 mt-4"
    >
      {/* Volatility */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Volatilidad</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-secondary/30 border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">IV</p>
            <p className="text-xl font-bold text-foreground mt-1">{data.implied_volatility || "N/A"}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">IV Percentil</p>
            <p className="text-xl font-bold text-foreground mt-1">{data.iv_percentile || "N/A"}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Put/Call Ratio</p>
            <p className="text-xl font-bold text-foreground mt-1">{data.put_call_ratio || "N/A"}</p>
          </div>
          <div className="rounded-xl bg-secondary/30 border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vol. Opciones</p>
            <p className="text-xl font-bold text-foreground mt-1">{data.options_volume || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Greeks */}
      <div className="rounded-2xl border border-border bg-card/50 p-5">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Greeks (ATM Options)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <GreekCard
            letter="Δ"
            name="Delta"
            value={data.delta}
            description="Sensibilidad al precio"
          />
          <GreekCard
            letter="Γ"
            name="Gamma"
            value={data.gamma}
            description="Tasa de cambio del delta"
          />
          <GreekCard
            letter="Θ"
            name="Theta"
            value={data.theta}
            description="Decaimiento temporal"
          />
          <GreekCard
            letter="V"
            name="Vega"
            value={data.vega}
            description="Sensibilidad a volatilidad"
          />
        </div>
      </div>

      {/* Max Pain & Unusual Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card/50 p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Max Pain</h3>
          <p className="text-2xl font-bold text-foreground">{data.max_pain || "N/A"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Precio donde más opciones expiran sin valor
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card/50 p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actividad Inusual</h3>
          <p className="text-sm text-foreground leading-relaxed">{data.unusual_activity || "Sin actividad inusual detectada"}</p>
        </div>
      </div>
    </motion.div>
  );
}