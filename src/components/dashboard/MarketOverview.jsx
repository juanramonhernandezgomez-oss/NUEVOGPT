const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from "react";

import { TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function MarketOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    setLoading(true);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `Provide current market overview data for today. Include the latest approximate values for these major indices and assets. Be as accurate as possible with real current data.
      
      Return current price, daily change percentage, and trend direction.`,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: {
        type: "object",
        properties: {
          indices: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                symbol: { type: "string" },
                price: { type: "string" },
                change_pct: { type: "number" },
                trend: { type: "string", enum: ["up", "down"] }
              }
            }
          },
          market_status: { type: "string" },
          last_updated: { type: "string" }
        }
      }
    });
    setData(result);
    setLoading(false);
  };

  useEffect(() => { fetchMarketData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Mercados</h2>
          <p className="text-xs text-muted-foreground">{data?.market_status || "Actualizado"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchMarketData} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {data?.indices?.map((item, i) => (
          <motion.div
            key={item.symbol}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card/50 p-4 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{item.symbol}</span>
              {item.trend === "up" ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              )}
            </div>
            <p className="text-sm font-bold text-foreground">{item.price}</p>
            <p className={`text-xs font-medium mt-1 ${item.change_pct >= 0 ? "text-green-400" : "text-red-400"}`}>
              {item.change_pct >= 0 ? "+" : ""}{item.change_pct?.toFixed(2)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.name}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}