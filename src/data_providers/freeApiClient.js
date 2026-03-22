const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';
const YAHOO_QUOTE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';
const YAHOO_SEARCH_URL = 'https://query1.finance.yahoo.com/v1/finance/search';

const RANGE_CONFIG = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '15m' },
  '1W': { range: '5d', interval: '1h' },
  '1M': { range: '1mo', interval: '1d' },
  '3M': { range: '3mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  default: { range: '6mo', interval: '1d' },
};

const normalizeSymbol = (symbol = '') => symbol.trim().toUpperCase();

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  return response.json();
}

function mapChartResult(result = {}) {
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

  return timestamps.map((ts, index) => {
    const close = quote.close?.[index] ?? adjClose[index] ?? null;
    const open = quote.open?.[index] ?? close;
    const high = quote.high?.[index] ?? close;
    const low = quote.low?.[index] ?? close;
    const volume = quote.volume?.[index] ?? 0;
    if ([open, high, low, close].some((value) => value == null)) {
      return null;
    }
    return {
      date: new Date(ts * 1000).toISOString(),
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume,
    };
  }).filter(Boolean);
}

function pickRangeConfig(rangeKey) {
  return RANGE_CONFIG[rangeKey] || RANGE_CONFIG.default;
}

export async function get_price_history(symbol, rangeKey = '6M') {
  const normalized = normalizeSymbol(symbol);
  const { range, interval } = pickRangeConfig(rangeKey);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(normalized)}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplits`;
  const payload = await fetchJson(url);
  const result = payload.chart?.result?.[0];
  if (!result) {
    throw new Error(`No historical data returned for ${normalized}`);
  }
  return mapChartResult(result);
}

export async function get_realtime_price(symbol) {
  const normalized = normalizeSymbol(symbol);
  const url = `${YAHOO_QUOTE_URL}?symbols=${encodeURIComponent(normalized)}`;
  const payload = await fetchJson(url);
  const quote = payload.quoteResponse?.result?.[0];
  if (!quote) {
    throw new Error(`No realtime quote returned for ${normalized}`);
  }
  return {
    symbol: quote.symbol || normalized,
    shortName: quote.shortName || quote.longName || normalized,
    currency: quote.currency || 'USD',
    marketState: quote.marketState || 'REGULAR',
    regularMarketPrice: quote.regularMarketPrice ?? null,
    regularMarketChange: quote.regularMarketChange ?? 0,
    regularMarketChangePercent: quote.regularMarketChangePercent ?? 0,
    regularMarketVolume: quote.regularMarketVolume ?? 0,
    regularMarketOpen: quote.regularMarketOpen ?? null,
    regularMarketDayHigh: quote.regularMarketDayHigh ?? null,
    regularMarketDayLow: quote.regularMarketDayLow ?? null,
    regularMarketPreviousClose: quote.regularMarketPreviousClose ?? null,
    marketCap: quote.marketCap ?? null,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? null,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? null,
    averageDailyVolume3Month: quote.averageDailyVolume3Month ?? null,
    exchange: quote.fullExchangeName || quote.exchange || '',
    quoteType: (quote.quoteType || '').toLowerCase(),
  };
}

export async function get_asset_info(symbol) {
  const normalized = normalizeSymbol(symbol);
  const [quote, searchPayload] = await Promise.all([
    get_realtime_price(normalized),
    fetchJson(`${YAHOO_SEARCH_URL}?q=${encodeURIComponent(normalized)}&quotesCount=1&newsCount=0`).catch(() => ({ quotes: [] })),
  ]);

  const match = searchPayload.quotes?.[0] || {};
  return {
    symbol: quote.symbol,
    name: match.longname || quote.shortName || normalized,
    exchange: quote.exchange,
    asset_type: match.quoteType?.toLowerCase() || quote.quoteType || 'stock',
    sector: match.sector || 'N/A',
    industry: match.industry || 'N/A',
    currency: quote.currency,
    market_cap: quote.marketCap,
    fifty_two_week_low: quote.fiftyTwoWeekLow,
    fifty_two_week_high: quote.fiftyTwoWeekHigh,
  };
}

export default { get_price_history, get_realtime_price, get_asset_info };
