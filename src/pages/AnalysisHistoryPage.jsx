const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };


import { useQuery } from "@tanstack/react-query";
import { Loader2, History, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const signalConfig = {
  strong_buy: { label: "COMPRA FUERTE", color: "text-green-400", bg: "bg-green-500/10" },
  buy: { label: "COMPRA", color: "text-green-400", bg: "bg-green-500/10" },
  hold: { label: "MANTENER", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  sell: { label: "VENTA", color: "text-red-400", bg: "bg-red-500/10" },
  strong_sell: { label: "VENTA FUERTE", color: "text-red-400", bg: "bg-red-500/10" },
};

export default function AnalysisHistoryPage() {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["analysis-history"],
    queryFn: () => db.entities.AnalysisHistory.list("-created_date", 50),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.AnalysisHistory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analysis-history"] }),
  });

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-4 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Historial de Análisis</h1>
        <p className="text-sm text-muted-foreground mt-1">Todos tus análisis anteriores</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No hay análisis en el historial</p>
          <p className="text-xs text-muted-foreground mt-1">Analiza un activo para ver su historial aquí</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => {
            const sig = signalConfig[item.signal] || signalConfig.hold;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card/50 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${sig.bg} flex items-center justify-center`}>
                      <span className={`text-sm font-bold ${sig.color}`}>
                        {item.symbol?.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{item.symbol}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sig.bg} ${sig.color}`}>
                          {sig.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.created_date ? format(new Date(item.created_date), "d MMM yyyy, HH:mm", { locale: es }) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-sm font-bold text-foreground">{item.score}/100</p>
                    </div>
                    <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden hidden md:block">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${item.score}%` }} />
                    </div>
                    <Link to={`/AssetAnalysis?symbol=${item.symbol}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                        Re-analizar
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(item.id)}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}