import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";

export default function MarketNews({ headlines }) {
  if (!headlines?.length) return (
    <div className="rounded-xl border border-border bg-card/50 p-4 h-40 animate-pulse" />
  );

  const sentimentColor = {
    positive: "bg-green-500/20 text-green-400",
    negative: "bg-red-500/20 text-red-400",
    neutral: "bg-yellow-500/20 text-yellow-400"
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Noticias del Mercado</h3>
      </div>
      <div className="space-y-2">
        {headlines.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-3 rounded-xl hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
          >
            <p className="text-xs font-medium text-foreground line-clamp-2">{item.title}</p>
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{item.summary}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sentimentColor[item.sentiment] || sentimentColor.neutral}`}>
                {item.sentiment === "positive" ? "Positivo" : item.sentiment === "negative" ? "Negativo" : "Neutral"}
              </span>
              <span className="text-[10px] text-muted-foreground">{item.source}</span>
              <span className="text-[10px] text-muted-foreground">· {item.time_ago}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}