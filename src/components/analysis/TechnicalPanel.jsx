import { motion } from "framer-motion";

function DataCard({ label, value, sub, color }) {
  return (
    <div className="rounded-xl bg-secondary/30 border border-border p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-base font-bold mt-1 ${color || "text-foreground"}`}>{value || "N/A"}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function TechnicalPanel({ data }) {
  if (!data) return <p className="text-muted-foreground text-sm p-4">No hay datos técnicos disponibles.</p>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 mt-4"
    >
      {/* Price Action */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acción del Precio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DataCard label="Apertura" value={data.open} />
          <DataCard label="Máximo" value={data.high} color="text-green-400" />
          <DataCard label="Mínimo" value={data.low} color="text-red-400" />
          <DataCard label="Cierre Anterior" value={data.prev_close} />
        </div>
      </div>

      {/* Oscillators */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Osciladores</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DataCard
            label="RSI (14)"
            value={data.rsi?.toFixed(1)}
            sub={data.rsi_signal}
            color={data.rsi > 70 ? "text-red-400" : data.rsi < 30 ? "text-green-400" : "text-yellow-400"}
          />
          <DataCard label="MACD" value={data.macd} sub={data.macd_interpretation} />
          <DataCard label="MACD Señal" value={data.macd_signal_line} sub={data.macd_histogram} />
          <DataCard
            label="Estocástico"
            value={`K: ${data.stochastic_k?.toFixed(1) || "N/A"}`}
            sub={`D: ${data.stochastic_d?.toFixed(1) || "N/A"}`}
          />
        </div>
      </div>

      {/* Moving Averages */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Medias Móviles</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DataCard label="MA 20" value={data.ma_20} />
          <DataCard label="MA 50" value={data.ma_50} />
          <DataCard label="MA 100" value={data.ma_100} />
          <DataCard label="MA 200" value={data.ma_200} sub={data.ma_signal} />
        </div>
      </div>

      {/* Bollinger Bands */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bandas de Bollinger</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <DataCard label="Superior" value={data.bb_upper} color="text-red-400" />
          <DataCard label="Media" value={data.bb_middle} />
          <DataCard label="Inferior" value={data.bb_lower} color="text-green-400" />
          <DataCard label="Posición" value={data.bb_position} />
        </div>
      </div>

      {/* Volume & Volatility */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Volumen y Volatilidad</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <DataCard label="Volumen Actual" value={data.volume_current} sub={data.volume_signal} />
          <DataCard label="Vol. Promedio 20D" value={data.volume_avg_20d} />
          <DataCard label="ATR" value={data.atr} />
        </div>
      </div>

      {/* Support & Resistance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">Soportes</h3>
          <div className="space-y-2">
            {[data.support_1, data.support_2, data.support_3].map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-green-500/5 border border-green-500/10 px-4 py-3">
                <span className="text-xs text-muted-foreground">S{i + 1}</span>
                <span className="text-sm font-bold text-green-400">{s || "N/A"}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Resistencias</h3>
          <div className="space-y-2">
            {[data.resistance_1, data.resistance_2, data.resistance_3].map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-red-500/5 border border-red-500/10 px-4 py-3">
                <span className="text-xs text-muted-foreground">R{i + 1}</span>
                <span className="text-sm font-bold text-red-400">{r || "N/A"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fibonacci */}
      {data.fibonacci_levels && (
        <div className="rounded-2xl border border-border bg-secondary/20 p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fibonacci</h3>
          <p className="text-sm text-foreground">{data.fibonacci_levels}</p>
        </div>
      )}

      {/* Overall Technical Signal */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Señal Técnica General</h3>
        <p className="text-base font-bold text-foreground">{data.technical_signal || "N/A"}</p>
      </div>
    </motion.div>
  );
}