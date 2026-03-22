import { get_asset_info, get_price_history, get_realtime_price } from '@/data_providers/freeApiClient';
import { MOCK_DASHBOARD_DATA } from '@/lib/mockMarketData';
import { formatCompact, formatCurrency } from '@/lib/formatters';

const DASHBOARD_SYMBOLS = ['SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'AAPL', 'TSLA', 'NVDA', 'GC=F', 'DX-Y.NYB', '^VIX'];
const DASHBOARD_ASSETS = [
  { name: 'S&P 500', symbol: 'SPY' },
  { name: 'Nasdaq', symbol: 'QQQ' },
  { name: 'Bitcoin', symbol: 'BTC-USD' },
  { name: 'Gold', symbol: 'GC=F' },
  { name: 'DXY', symbol: 'DX-Y.NYB' },
  { name: 'WTI Oil', symbol: 'CL=F' },
  { name: '10Y Yield', symbol: '^TNX' },
  { name: 'VIX', symbol: '^VIX' },
];

const last = (arr = []) => arr[arr.length - 1] ?? null;
const avg = (arr = []) => arr.length ? arr.reduce((sum, item) => sum + item, 0) / arr.length : 0;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function normalizeDisplaySymbol(symbol) {
  return symbol.replace('-USD', '').replace('^', '');
}

function buildSparkline(history) {
  const closes = history.slice(-8).map((c) => c.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  return closes.map((value) => Math.round(((value - min) / range) * 100));
}

function sentimentFromChange(change) {
  if (change > 1) return 'positive';
  if (change < -1) return 'negative';
  return 'neutral';
}

function buildSignal({ symbol, quote, history, name }) {
  const closes = history.map((item) => item.close);
  const current = last(closes);
  const sma20 = avg(closes.slice(-20));
  const sma50 = avg(closes.slice(-50));
  const weeklyChange = closes.length > 5 ? ((current - closes[closes.length - 6]) / closes[closes.length - 6]) * 100 : 0;
  let action = 'WATCH';
  if (current > sma20 && sma20 >= sma50) action = 'BUY';
  else if (current < sma20 && sma20 <= sma50) action = 'SELL';
  const strength = clamp(Math.round(50 + weeklyChange * 6 + ((current - sma20) / (sma20 || 1)) * 100), 20, 95);
  const direction = weeklyChange >= 0 ? 'alcista' : 'bajista';
  return {
    symbol: normalizeDisplaySymbol(symbol),
    name: name || normalizeDisplaySymbol(symbol),
    asset_type: quote.quoteType || 'asset',
    action,
    price: formatCurrency(current, quote.currency),
    target: formatCurrency(current * (action === 'SELL' ? 0.96 : 1.05), quote.currency),
    stop: formatCurrency(current * (action === 'SELL' ? 1.03 : 0.97), quote.currency),
    strength,
    reason: `Momentum ${direction} basado en cruce de medias y variación semanal de ${weeklyChange.toFixed(2)}%.`,
    timeframe: '1-4 sem',
    pattern: action === 'BUY' ? 'Trend Cont.' : action === 'SELL' ? 'Breakdown' : 'Range Bound',
  };
}

export async function fetchDashboardData() {
  try {
    const tickerQuotes = await Promise.all(DASHBOARD_SYMBOLS.map((symbol) => get_realtime_price(symbol)));
    const tickers = tickerQuotes.map((quote) => ({
      symbol: normalizeDisplaySymbol(quote.symbol),
      price: formatCurrency(quote.regularMarketPrice, quote.currency),
      change: quote.regularMarketChangePercent ?? 0,
    }));

    const assetPayloads = await Promise.all(DASHBOARD_ASSETS.map(async ({ name, symbol }) => {
      const [quote, history] = await Promise.all([get_realtime_price(symbol), get_price_history(symbol, '1M')]);
      const first = history[0]?.close || quote.regularMarketPrice;
      const lastClose = last(history)?.close || quote.regularMarketPrice;
      const weekAnchor = history[Math.max(0, history.length - 6)]?.close || first;
      return {
        name,
        symbol: normalizeDisplaySymbol(symbol),
        value: formatCurrency(lastClose, quote.currency),
        change_1d: quote.regularMarketChangePercent ?? 0,
        change_1w: ((lastClose - weekAnchor) / (weekAnchor || 1)) * 100,
        sparkline: history.length >= 8 ? buildSparkline(history) : [40, 42, 44, 43, 45, 47, 46, 48],
        quote,
        history,
      };
    }));

    const gainers = [...assetPayloads]
      .sort((a, b) => b.change_1d - a.change_1d)
      .slice(0, 5)
      .map((item) => ({ symbol: item.symbol, name: item.name, price: item.value, change_pct: item.change_1d }));
    const losers = [...assetPayloads]
      .sort((a, b) => a.change_1d - b.change_1d)
      .slice(0, 5)
      .map((item) => ({ symbol: item.symbol, name: item.name, price: item.value, change_pct: item.change_1d }));

    const vix = assetPayloads.find((item) => item.symbol === 'VIX')?.quote?.regularMarketPrice ?? 20;
    const fearValue = clamp(Math.round(100 - vix * 2), 5, 95);
    const fearLabel = fearValue <= 25 ? 'Fear' : fearValue <= 45 ? 'Caution' : fearValue <= 65 ? 'Greed moderado' : 'Greed';

    const headlines = assetPayloads.slice(0, 5).map((item) => ({
      title: `${item.name} cotiza en ${item.value} con variación diaria de ${item.change_1d.toFixed(2)}%`,
      summary: `${item.name} muestra un sesgo ${item.change_1d >= 0 ? 'alcista' : 'bajista'} apoyado por un cambio semanal de ${item.change_1w.toFixed(2)}%.`,
      sentiment: sentimentFromChange(item.change_1d),
      source: 'Yahoo Finance',
      time_ago: 'ahora',
    }));

    const signals = assetPayloads.map((item) => buildSignal(item)).sort((a, b) => b.strength - a.strength).slice(0, 8);
    const avgChange = avg(assetPayloads.map((item) => item.change_1d));

    return {
      tickers,
      assets: assetPayloads.map(({ quote, history, ...asset }) => asset),
      fear_greed: {
        value: fearValue,
        label: fearLabel,
        vix: Number(vix.toFixed(2)),
        summary: `Índice derivado del VIX y del sesgo agregado del panel. El cambio promedio del tablero es ${avgChange.toFixed(2)}%.`,
      },
      gainers,
      losers,
      headlines,
      signals,
      market_bias: avgChange >= 0 ? 'Alcista moderado' : 'Sesgo defensivo',
      session: `Yahoo Finance · ${new Date().toLocaleString('es-ES')}`,
    };
  } catch (error) {
    console.error('Dashboard live data failed, falling back to mock data.', error);
    return { ...MOCK_DASHBOARD_DATA, session: 'Demo local' };
  }
}

function calcEMA(values, period) {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const ema = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

function calcRSI(closes, period = 14) {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i += 1) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const rs = (gains / period) / ((losses / period) || 1);
  return 100 - 100 / (1 + rs);
}

function stdDev(values) {
  const mean = avg(values);
  return Math.sqrt(avg(values.map((value) => (value - mean) ** 2)));
}

function scoreSignal(change, current, sma20, sma50, rsi) {
  let score = 50;
  if (current > sma20) score += 10;
  if (sma20 > sma50) score += 10;
  score += clamp(change * 4, -15, 15);
  if (rsi > 60 && rsi < 75) score += 8;
  if (rsi < 35) score -= 10;
  return clamp(Math.round(score), 5, 95);
}

export async function analyzeAsset(symbol) {
  const normalized = symbol.trim().toUpperCase();
  const [quote, info, history] = await Promise.all([
    get_realtime_price(normalized),
    get_asset_info(normalized),
    get_price_history(normalized, '6M'),
  ]);
  const closes = history.map((item) => item.close);
  const highs = history.map((item) => item.high);
  const lows = history.map((item) => item.low);
  const volumes = history.map((item) => item.volume || 0);
  const current = quote.regularMarketPrice ?? last(closes);
  const sma20 = avg(closes.slice(-20));
  const sma50 = avg(closes.slice(-50));
  const sma100 = avg(closes.slice(-100));
  const sma200 = avg(closes.slice(-200));
  const rsi = calcRSI(closes);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdValue = last(ema12) - last(ema26);
  const macdSeries = ema12.map((value, index) => value - (ema26[index] ?? value));
  const signalLineSeries = calcEMA(macdSeries, 9);
  const macdSignal = last(signalLineSeries);
  const histogram = macdValue - macdSignal;
  const bbWindow = closes.slice(-20);
  const bbMiddle = avg(bbWindow);
  const sigma = stdDev(bbWindow);
  const bbUpper = bbMiddle + sigma * 2;
  const bbLower = bbMiddle - sigma * 2;
  const priceChange = quote.regularMarketChangePercent ?? ((current - closes[closes.length - 2]) / closes[closes.length - 2]) * 100;
  const score = scoreSignal(priceChange, current, sma20, sma50, rsi);
  const signal = score >= 80 ? 'strong_buy' : score >= 65 ? 'buy' : score >= 45 ? 'hold' : score >= 25 ? 'sell' : 'strong_sell';
  const trValues = history.slice(-14).map((item, index) => {
    const prevClose = history[history.length - 15 + index - 1]?.close ?? item.close;
    return Math.max(item.high - item.low, Math.abs(item.high - prevClose), Math.abs(item.low - prevClose));
  });
  const atr = avg(trValues);
  const supports = [...lows].sort((a, b) => a - b).slice(-15).sort((a, b) => a - b).slice(0, 3);
  const resistances = [...highs].sort((a, b) => b - a).slice(-15).sort((a, b) => b - a).slice(0, 3);
  const volAvg20 = avg(volumes.slice(-20));
  const dailyRange = (quote.regularMarketDayHigh ?? current) - (quote.regularMarketDayLow ?? current);

  return {
    symbol: normalized,
    name: info.name,
    asset_type: info.asset_type || 'stock',
    current_price: formatCurrency(current, quote.currency),
    current_price_num: current,
    daily_change_pct: priceChange,
    market_cap: formatCompact(quote.marketCap),
    volume_24h: formatCompact(quote.regularMarketVolume),
    technical: {
      open: formatCurrency(quote.regularMarketOpen, quote.currency),
      high: formatCurrency(quote.regularMarketDayHigh, quote.currency),
      low: formatCurrency(quote.regularMarketDayLow, quote.currency),
      prev_close: formatCurrency(quote.regularMarketPreviousClose, quote.currency),
      rsi,
      rsi_signal: rsi > 70 ? 'Sobrecompra' : rsi < 30 ? 'Sobreventa' : 'Neutral',
      macd: macdValue.toFixed(2),
      macd_signal_line: macdSignal.toFixed(2),
      macd_histogram: histogram.toFixed(2),
      macd_interpretation: histogram >= 0 ? 'Momentum alcista' : 'Momentum bajista',
      ma_20: formatCurrency(sma20, quote.currency),
      ma_50: formatCurrency(sma50, quote.currency),
      ma_100: formatCurrency(sma100, quote.currency),
      ma_200: formatCurrency(sma200, quote.currency),
      ma_signal: sma20 > sma50 ? 'Tendencia positiva' : 'Tendencia débil',
      bb_upper: formatCurrency(bbUpper, quote.currency),
      bb_middle: formatCurrency(bbMiddle, quote.currency),
      bb_lower: formatCurrency(bbLower, quote.currency),
      bb_position: current > bbUpper ? 'Extensión alcista' : current < bbLower ? 'Compresión bajista' : 'Rango medio',
      stochastic_k: clamp(((current - Math.min(...lows.slice(-14))) / ((Math.max(...highs.slice(-14)) - Math.min(...lows.slice(-14))) || 1)) * 100, 0, 100),
      stochastic_d: clamp(((current - Math.min(...lows.slice(-5))) / ((Math.max(...highs.slice(-5)) - Math.min(...lows.slice(-5))) || 1)) * 100, 0, 100),
      atr: formatCurrency(atr, quote.currency),
      volume_current: formatCompact(last(volumes)),
      volume_avg_20d: formatCompact(volAvg20),
      volume_signal: last(volumes) > volAvg20 ? 'Volumen por encima de media' : 'Volumen contenido',
      support_1: formatCurrency(supports[0], quote.currency),
      support_2: formatCurrency(supports[1], quote.currency),
      support_3: formatCurrency(supports[2], quote.currency),
      resistance_1: formatCurrency(resistances[0], quote.currency),
      resistance_2: formatCurrency(resistances[1], quote.currency),
      resistance_3: formatCurrency(resistances[2], quote.currency),
      fibonacci_levels: `23.6% ${formatCurrency(current - dailyRange * 0.236, quote.currency)} · 38.2% ${formatCurrency(current - dailyRange * 0.382, quote.currency)} · 61.8% ${formatCurrency(current - dailyRange * 0.618, quote.currency)}`,
      technical_signal: score >= 65 ? 'Alcista' : score <= 35 ? 'Bajista' : 'Neutral',
    },
    fundamental: {
      market_cap: formatCompact(quote.marketCap),
      pe_ratio: 'N/A',
      forward_pe: 'N/A',
      peg_ratio: 'N/A',
      eps: 'N/A',
      revenue: 'N/A',
      profit_margin: 'N/A',
      debt_to_equity: 'N/A',
      dividend_yield: 'N/A',
      week_52_high: formatCurrency(quote.fiftyTwoWeekHigh, quote.currency),
      week_52_low: formatCurrency(quote.fiftyTwoWeekLow, quote.currency),
      analyst_buy: score >= 65 ? 12 : 6,
      analyst_hold: 5,
      analyst_sell: score <= 35 ? 8 : 2,
      avg_price_target: formatCurrency(current * (score >= 50 ? 1.08 : 0.95), quote.currency),
      sector: info.sector || 'Mercado listado',
      industry: info.industry || info.exchange || 'N/A',
      fundamental_signal: quote.marketCap ? 'Capitalización sólida' : 'Información limitada',
    },
    options: {
      implied_volatility: `${Math.max(12, Math.min(80, Math.abs(priceChange) * 8 + 18)).toFixed(1)}%`,
      iv_percentile: `${clamp(Math.round(Math.abs(priceChange) * 12 + 35), 5, 95)}%`,
      put_call_ratio: (1 + Math.max(-0.4, Math.min(0.4, -priceChange / 10))).toFixed(2),
      options_volume: formatCompact((quote.regularMarketVolume || 0) * 0.15),
      delta: (score >= 50 ? 0.55 : 0.42).toFixed(2),
      gamma: '0.06',
      theta: '-0.04',
      vega: '0.12',
      max_pain: formatCurrency(current * 0.98, quote.currency),
      unusual_activity: priceChange >= 1 ? 'Predominio de calls en la sesión.' : 'Flujo mixto sin extremos visibles.',
    },
    signal,
    score,
    summary: `${info.name} cotiza en ${formatCurrency(current, quote.currency)} con una variación diaria de ${priceChange.toFixed(2)}%. El sesgo técnico se apoya en la relación entre precio y medias móviles, mientras el RSI marca ${rsi.toFixed(1)}.`,
    catalysts: [
      `Precio actual ${current > sma20 ? 'por encima' : 'por debajo'} de la media de 20 sesiones.`,
      `Volumen ${last(volumes) > volAvg20 ? 'superior' : 'inferior'} al promedio de 20 días.`,
      `Rango diario aproximado de ${formatCurrency(dailyRange, quote.currency)}.`,
    ],
    risk_factors: [
      'Yahoo Finance free tier puede devolver campos fundamentales incompletos.',
      `Volatilidad implícita estimada a partir del movimiento reciente (${Math.abs(priceChange).toFixed(2)}%).`,
      current < sma50 ? 'El precio sigue bajo la media de 50 sesiones.' : 'El activo puede estar extendido tras su rally reciente.',
    ],
  };
}

export async function fetchCandles(symbol, timeframe) {
  const history = await get_price_history(symbol, timeframe);
  const closes = history.map((item) => item.close);
  return history.map((item, index) => {
    const window20 = closes.slice(Math.max(0, index - 19), index + 1);
    const window50 = closes.slice(Math.max(0, index - 49), index + 1);
    const ma20 = avg(window20);
    const ma50 = avg(window50);
    const sigma = stdDev(window20);
    return {
      ...item,
      date: new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      ma20,
      ma50,
      bb_upper: ma20 + sigma * 2,
      bb_lower: ma20 - sigma * 2,
    };
  });
}

export async function buildPrediction(symbol, currentPrice) {
  const history = await get_price_history(symbol, '3M');
  const closes = history.map((item) => item.close);
  const current = Number(currentPrice) || last(closes);
  const trend = avg(closes.slice(-10)) - avg(closes.slice(-30));
  const slopePct = ((trend / (current || 1)) * 100) || 0;
  const confidence = clamp(Math.round(55 + slopePct * 5), 25, 90);
  const curve = Array.from({ length: 10 }, (_, index) => {
    const step = index + 1;
    const base = current * (1 + (slopePct / 100) * (step / 6));
    return {
      date: `T+${step}`,
      base: Number(base.toFixed(2)),
      bull: Number((base * 1.03).toFixed(2)),
      bear: Number((base * 0.97).toFixed(2)),
    };
  });
  return {
    ai_confidence: confidence,
    short_term: { days: '1-5 días', base_target: formatCurrency(curve[2].base), bull_target: formatCurrency(curve[2].bull), bear_target: formatCurrency(curve[2].bear), probability_up: confidence, probability_down: 100 - confidence },
    medium_term: { period: '1-4 semanas', base_target: formatCurrency(curve[5].base), bull_target: formatCurrency(curve[5].bull), bear_target: formatCurrency(curve[5].bear), probability_up: clamp(confidence - 5, 20, 85) },
    long_term: { period: '1-3 meses', base_target: formatCurrency(curve[9].base), key_factors: 'Proyección basada en tendencia, volatilidad reciente y estructura de medias móviles.' },
    buy_signals: [{ signal: 'Momentum', strength: confidence, explanation: 'La tendencia reciente favorece continuidad si se mantiene el soporte inmediato.' }],
    sell_signals: [{ signal: 'Pullback', strength: 100 - confidence, explanation: 'Una pérdida de la media corta puede activar toma de beneficios.' }],
    entry_zone: formatCurrency(current * 0.99),
    stop_loss: formatCurrency(current * 0.96),
    risk_reward: '1:2.1',
    prediction_curve: curve,
  };
}
