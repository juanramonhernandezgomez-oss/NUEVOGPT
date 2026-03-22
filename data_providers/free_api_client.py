"""Free market-data client for InvestPro.

Uses Yahoo Finance public chart/quote endpoints and returns normalized structures.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List
import requests

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v7/finance/quote"
YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search"

RANGE_CONFIG = {
    "1D": {"range": "1d", "interval": "5m"},
    "5D": {"range": "5d", "interval": "15m"},
    "1W": {"range": "5d", "interval": "1h"},
    "1M": {"range": "1mo", "interval": "1d"},
    "3M": {"range": "3mo", "interval": "1d"},
    "6M": {"range": "6mo", "interval": "1d"},
    "1Y": {"range": "1y", "interval": "1d"},
}


def _get_json(url: str, params: Dict[str, Any] | None = None) -> Dict[str, Any]:
    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()
    return response.json()


def get_price_history(symbol: str, range_key: str = "6M") -> List[Dict[str, Any]]:
    symbol = symbol.strip().upper()
    config = RANGE_CONFIG.get(range_key, RANGE_CONFIG["6M"])
    payload = _get_json(YAHOO_CHART_URL.format(symbol=symbol), params={
        "range": config["range"],
        "interval": config["interval"],
        "includePrePost": "false",
        "events": "div,splits",
    })
    result = payload.get("chart", {}).get("result", [None])[0]
    if not result:
        raise ValueError(f"No historical data returned for {symbol}")

    quote = (result.get("indicators", {}).get("quote") or [{}])[0]
    timestamps = result.get("timestamp") or []
    candles: List[Dict[str, Any]] = []
    for idx, ts in enumerate(timestamps):
        close = (quote.get("close") or [None])[idx]
        open_ = (quote.get("open") or [close])[idx]
        high = (quote.get("high") or [close])[idx]
        low = (quote.get("low") or [close])[idx]
        volume = (quote.get("volume") or [0])[idx]
        if None in (open_, high, low, close):
            continue
        candles.append({
            "timestamp": ts,
            "open": open_,
            "high": high,
            "low": low,
            "close": close,
            "volume": volume,
        })
    return candles


def get_realtime_price(symbol: str) -> Dict[str, Any]:
    symbol = symbol.strip().upper()
    payload = _get_json(YAHOO_QUOTE_URL, params={"symbols": symbol})
    quote = payload.get("quoteResponse", {}).get("result", [None])[0]
    if not quote:
        raise ValueError(f"No realtime quote returned for {symbol}")
    return quote


def get_asset_info(symbol: str) -> Dict[str, Any]:
    quote = get_realtime_price(symbol)
    search = _get_json(YAHOO_SEARCH_URL, params={"q": symbol, "quotesCount": 1, "newsCount": 0})
    match = (search.get("quotes") or [{}])[0]
    return {
        "symbol": quote.get("symbol", symbol.upper()),
        "name": match.get("longname") or quote.get("shortName") or symbol.upper(),
        "exchange": quote.get("fullExchangeName") or quote.get("exchange"),
        "asset_type": (match.get("quoteType") or quote.get("quoteType") or "stock").lower(),
        "currency": quote.get("currency", "USD"),
        "market_cap": quote.get("marketCap"),
        "fifty_two_week_low": quote.get("fiftyTwoWeekLow"),
        "fifty_two_week_high": quote.get("fiftyTwoWeekHigh"),
    }
