const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Star, Plus, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Watchlist() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", asset_type: "stock", notes: "", target_buy_price: "", target_sell_price: "" });
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["watchlist"],
    queryFn: () => db.entities.Watchlist.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.Watchlist.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["watchlist"] }); setOpen(false); setForm({ symbol: "", name: "", asset_type: "stock", notes: "", target_buy_price: "", target_sell_price: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Watchlist.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const handleSubmit = () => {
    const payload = { ...form };
    if (payload.target_buy_price) payload.target_buy_price = parseFloat(payload.target_buy_price);
    else delete payload.target_buy_price;
    if (payload.target_sell_price) payload.target_sell_price = parseFloat(payload.target_sell_price);
    else delete payload.target_sell_price;
    createMutation.mutate(payload);
  };

  const typeColors = {
    stock: "bg-blue-500/10 text-blue-400",
    crypto: "bg-yellow-500/10 text-yellow-400",
    etf: "bg-green-500/10 text-green-400",
    option: "bg-red-500/10 text-red-400",
    forex: "bg-blue-500/10 text-blue-400",
  };

  return (
    <div className="p-4 md:p-6 max-w-[1200px] mx-auto space-y-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">Activos que estás siguiendo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Agregar Activo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Ticker</Label>
                  <Input placeholder="AAPL" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo</Label>
                  <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Acción</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="option">Opción</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Nombre</Label>
                <Input placeholder="Apple Inc." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Precio Objetivo Compra</Label>
                  <Input type="number" placeholder="150.00" value={form.target_buy_price} onChange={(e) => setForm({ ...form, target_buy_price: e.target.value })} className="bg-secondary border-border mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Precio Objetivo Venta</Label>
                  <Input type="number" placeholder="200.00" value={form.target_sell_price} onChange={(e) => setForm({ ...form, target_sell_price: e.target.value })} className="bg-secondary border-border mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Notas</Label>
                <Textarea placeholder="Tus notas..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-border mt-1" />
              </div>
              <Button onClick={handleSubmit} disabled={!form.symbol || !form.name || createMutation.isPending} className="w-full bg-primary text-primary-foreground">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Tu watchlist está vacía</p>
          <p className="text-xs text-muted-foreground mt-1">Agrega activos para empezar a hacer seguimiento</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border bg-card/50 p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{item.symbol?.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{item.symbol}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeColors[item.asset_type]}`}>
                          {item.asset_type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.target_buy_price && (
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] text-muted-foreground">Compra</p>
                        <p className="text-xs font-medium text-green-400">${item.target_buy_price}</p>
                      </div>
                    )}
                    {item.target_sell_price && (
                      <div className="text-right hidden md:block">
                        <p className="text-[10px] text-muted-foreground">Venta</p>
                        <p className="text-xs font-medium text-red-400">${item.target_sell_price}</p>
                      </div>
                    )}
                    <Link to={`/AssetAnalysis?symbol=${item.symbol}`}>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
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
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-3 pl-14">{item.notes}</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}