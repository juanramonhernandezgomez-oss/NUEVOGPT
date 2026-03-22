import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function TopMovers({ gainers, losers }) {
  if (!gainers && !losers) return (
    <div className="rounded-xl border border-border bg-card/50 p-4 h-48 animate-pulse" />
  );

  const renderList = (items, type) => (
    <div className="space-y-1">
      {items?.map((item, i) => (
        <motion.div
          key={item.symbol}
          initial={{ opacity: 0, x: type === "gain" ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold
              ${type === "gain" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {item.symbol?.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-medium text-foreground">{item.symbol}</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{item.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">{item.price}</p>
            <div className={`flex items-center gap-0.5 justify-end ${type === "gain" ? "text-green-400" : "text-red-400"}`}>
              {type === "gain" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span className="text-[10px] font-medium">{Math.abs(item.change_pct || 0).toFixed(2)}%</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <Tabs defaultValue="gainers">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top del Día</h3>
          <TabsList className="bg-secondary h-7">
            <TabsTrigger value="gainers" className="text-[10px] h-5 px-2">Ganadores</TabsTrigger>
            <TabsTrigger value="losers" className="text-[10px] h-5 px-2">Perdedores</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="gainers">{renderList(gainers, "gain")}</TabsContent>
        <TabsContent value="losers">{renderList(losers, "loss")}</TabsContent>
      </Tabs>
    </div>
  );
}