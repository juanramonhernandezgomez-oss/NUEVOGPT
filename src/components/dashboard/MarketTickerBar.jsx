const DEFAULT_TICKERS = [
  { symbol: "SPY", price: "---", change: 0 },
  { symbol: "QQQ", price: "---", change: 0 },
  { symbol: "BTC", price: "---", change: 0 },
  { symbol: "ETH", price: "---", change: 0 },
  { symbol: "AAPL", price: "---", change: 0 },
  { symbol: "TSLA", price: "---", change: 0 },
  { symbol: "NVDA", price: "---", change: 0 },
  { symbol: "GOLD", price: "---", change: 0 },
  { symbol: "DXY", price: "---", change: 0 },
  { symbol: "VIX", price: "---", change: 0 },
];

export default function MarketTickerBar({ tickers }) {
  const items = tickers?.length ? tickers : DEFAULT_TICKERS;
  const doubled = [...items, ...items];

  return (
    <div className="border-b border-border bg-card/20 overflow-hidden py-1.5">
      <div className="flex animate-[ticker_40s_linear_infinite]" style={{ width: "max-content" }}>
        {doubled.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-5 border-r border-border/30 whitespace-nowrap">
            <span className="text-xs font-bold text-foreground font-mono">{t.symbol}</span>
            <span className="text-xs text-muted-foreground font-mono">{t.price}</span>
            <span className={`text-xs font-semibold font-mono ${(t.change || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
              {(t.change || 0) >= 0 ? "▲" : "▼"} {Math.abs(t.change || 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}