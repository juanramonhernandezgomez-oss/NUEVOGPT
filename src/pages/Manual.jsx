const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState } from "react";
import { Download, ChevronDown, ChevronRight, Code, Database, Layout, Zap, Globe, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const MANUAL_CONTENT = {
  title: "InvestPro Terminal — Manual Técnico Completo",
  version: "v2.0",
  date: "Marzo 2026",
  sections: [
    {
      id: "overview",
      icon: "📊",
      title: "Descripción General",
      content: `
## ¿Qué es InvestPro Terminal?

InvestPro Terminal es una plataforma profesional de análisis financiero impulsada por IA. Permite analizar cualquier activo financiero (acciones, criptomonedas, ETFs, forex) con datos en tiempo real, indicadores técnicos, análisis fundamental, datos de opciones, correlaciones ocultas, patrones de mercado y predicciones IA.

## Stack Tecnológico
- **Frontend:** React 18 + Vite
- **Estilos:** Tailwind CSS con sistema de tokens personalizado
- **Backend:** Base44 BaaS (Base de datos, Autenticación, Integraciones)
- **Gráficos:** Recharts
- **Animaciones:** Framer Motion
- **Routing:** React Router DOM v6
- **State:** TanStack React Query
- **LLM / IA:** Google Gemini Flash (vía Base44 InvokeLLM)

## Rutas de la Aplicación
| Ruta | Componente | Descripción |
|------|-----------|-------------|
| / | → /Dashboard | Redirección principal |
| /Dashboard | Dashboard | Terminal de mercados en tiempo real |
| /AssetAnalysis | AssetAnalysis | Análisis completo de activo individual |
| /Watchlist | Watchlist | Lista de seguimiento personalizada |
| /AnalysisHistoryPage | AnalysisHistoryPage | Historial de análisis realizados |
| /Manual | Manual | Este manual |
      `
    },
    {
      id: "layout",
      icon: "🧱",
      title: "Layout & Navegación",
      content: `
## components/layout/AppLayout.jsx

Componente wrapper principal que envuelve todas las páginas mediante React Router \`<Outlet>\`.

### Estructura
- **Sidebar Desktop (md+):** Logo + navegación vertical + indicador de estado
- **Header Mobile:** Logo + indicador LIVE
- **Bottom Nav Mobile:** 4 iconos de navegación
- **Outlet:** Área de contenido de páginas

### Props
No recibe props. Lee la ruta activa con \`useLocation()\`.

### Items de Navegación
\`\`\`js
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",  path: "/Dashboard" },
  { icon: Activity,        label: "Terminal",   path: "/AssetAnalysis" },
  { icon: Star,            label: "Watchlist",  path: "/Watchlist" },
  { icon: History,         label: "Historial",  path: "/AnalysisHistoryPage" },
];
\`\`\`

### Dependencias
- \`react-router-dom\`: Outlet, Link, useLocation
- \`lucide-react\`: LayoutDashboard, Search, Star, History, TrendingUp, Activity
      `
    },
    {
      id: "dashboard",
      icon: "🖥️",
      title: "Página: Dashboard",
      content: `
## pages/Dashboard.jsx

Terminal principal de mercados. Muestra datos de mercado globales en tiempo real o datos de muestra (demo).

### Estado Interno
| Variable | Tipo | Descripción |
|----------|------|-------------|
| dashData | object | Datos del dashboard (live o mock) |
| loading | boolean | Estado de carga al llamar API |
| isLive | boolean | Si los datos son en tiempo real |
| error | string | Mensaje de error si falla la API |
| time | Date | Reloj en tiempo real (actualiza cada 1s) |

### Flujo de Datos
1. Al cargar, muestra \`MOCK_DASHBOARD_DATA\` de \`lib/mockMarketData.js\`
2. Usuario hace clic en "Cargar datos en vivo" → llama \`fetchLiveData()\`
3. \`fetchLiveData()\` llama \`InvokeLLM\` con modelo \`gemini_3_flash\` + internet
4. Si hay error de límite → muestra banner y mantiene datos mock

### API Call — fetchLiveData()
\`\`\`js
db.integrations.Core.InvokeLLM({
  prompt: "...",           // Prompt consolidado para todos los datos
  add_context_from_internet: true,
  model: "gemini_3_flash",
  response_json_schema: { ... }
})
\`\`\`

### Datos Retornados por la API
\`\`\`json
{
  "tickers":     [ { symbol, price, change } ],
  "assets":      [ { name, symbol, value, change_1d, change_1w, sparkline[] } ],
  "fear_greed":  { value, label, vix, summary },
  "gainers":     [ { symbol, name, price, change_pct } ],
  "losers":      [ { symbol, name, price, change_pct } ],
  "headlines":   [ { title, summary, sentiment, source, time_ago } ],
  "signals":     [ { symbol, action, price, target, stop, strength, reason, timeframe, pattern } ],
  "market_bias": "string",
  "session":     "string"
}
\`\`\`

### Sub-Componentes Usados
- \`MarketTickerBar\` — Barra de tickers animada
- \`MarketOverviewCards\` — Cards de activos principales
- \`LiveSignalsFeed\` — Feed de señales IA
- \`MarketNews\` — Noticias financieras
- \`FearGreedGauge\` — Indicador miedo/codicia
- \`TopMovers\` — Ganadores y perdedores del día
      `
    },
    {
      id: "assetanalysis",
      icon: "🔍",
      title: "Página: AssetAnalysis",
      content: `
## pages/AssetAnalysis.jsx

Terminal de análisis profundo para un activo individual. Integra múltiples paneles de análisis.

### Parámetros URL
- \`?symbol=AAPL\` — Ticker precargado (lee con \`URLSearchParams\`)

### Estado Interno
| Variable | Descripción |
|----------|-------------|
| inputSymbol | Ticker escrito por el usuario |
| activeSymbol | Ticker en análisis activo |
| data | Resultado completo del análisis |
| loading | Estado de carga |
| error | Mensaje de error capturado |
| rightTab | Tab derecho activo (ai/positioning/macro) |
| bottomTab | Tab inferior activo (technical/fundamental/options/patterns/correlations) |

### Función Principal: analyzeAssetWithSymbol(sym)
Llama a \`InvokeLLM\` con el ticker y obtiene análisis completo. Al terminar, guarda en \`AnalysisHistory\`.

\`\`\`js
db.integrations.Core.InvokeLLM({
  prompt: \`Comprehensive real-time financial analysis for \${s}...\`,
  add_context_from_internet: true,
  model: "gemini_3_flash",
  response_json_schema: { ... }
})
\`\`\`

### Datos Retornados
\`\`\`json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "asset_type": "stock",
  "current_price": "$175.50",
  "daily_change_pct": 1.23,
  "signal": "buy",          // strong_buy | buy | hold | sell | strong_sell
  "score": 72,              // 0-100
  "summary": "...",
  "catalysts": ["..."],
  "risk_factors": ["..."],
  "technical": { rsi, macd, ma_20/50/100/200, bollinger, stochastic, atr, supports, resistances },
  "fundamental": { pe_ratio, eps, revenue, analyst_buy/hold/sell, ... },
  "options": { implied_volatility, put_call_ratio, delta, gamma, theta, vega, max_pain }
}
\`\`\`

### Manejo de Errores: analyzeAssetSafe(sym)
Wrapper con try/catch que captura errores de límite de API y muestra mensajes amigables.

### signalConfig — Mapa de Señales
\`\`\`js
{
  strong_buy: { label: "COMPRA FUERTE", color: "text-green-400", bg: "..." },
  buy:        { label: "COMPRA",        color: "text-green-400", bg: "..." },
  hold:       { label: "MANTENER",      color: "text-yellow-400", bg: "..." },
  sell:       { label: "VENTA",         color: "text-red-400",   bg: "..." },
  strong_sell:{ label: "VENTA FUERTE",  color: "text-red-400",   bg: "..." },
}
\`\`\`

### Layout de la Página
\`\`\`
[Top Bar: Input + Signal Header]
[Loading / Error / Empty State]
[Grid xl:3 cols]
  [xl:2 cols — CandlestickChart]
  [1 col — Tabs: AIPrediction | LongShortPanel | MacroPanel]
[Bottom Tabs]
  Technical | Fundamental | Options | Patterns | Correlations
  [Score Bar + Panel correspondiente]
  [Catalysts + Risk Factors]
\`\`\`

### Guardado en Base de Datos
\`\`\`js
db.entities.AnalysisHistory.create({
  symbol, asset_type, analysis_data: JSON.stringify(result),
  signal, score
})
\`\`\`
      `
    },
    {
      id: "watchlist",
      icon: "⭐",
      title: "Página: Watchlist",
      content: `
## pages/Watchlist.jsx

Gestión de lista de seguimiento personal. CRUD completo sobre la entidad \`Watchlist\`.

### Funciones
- **Listar:** \`db.entities.Watchlist.list("-created_date")\`
- **Crear:** \`db.entities.Watchlist.create(data)\` — abre Dialog modal
- **Eliminar:** \`db.entities.Watchlist.delete(id)\`
- **Navegar:** Link a \`/AssetAnalysis?symbol=TICKER\`

### Formulario de Creación
| Campo | Tipo | Requerido |
|-------|------|-----------|
| symbol | string (ticker) | ✓ |
| name | string | ✓ |
| asset_type | enum: stock/crypto/etf/option/forex | ✓ |
| target_buy_price | number | — |
| target_sell_price | number | — |
| notes | text | — |

### State Management
Usa TanStack Query (\`useQuery\` + \`useMutation\`) con \`queryClient.invalidateQueries\` para refrescar la lista tras operaciones.
      `
    },
    {
      id: "history",
      icon: "📋",
      title: "Página: AnalysisHistoryPage",
      content: `
## pages/AnalysisHistoryPage.jsx

Muestra el historial de todos los análisis realizados, ordenados por fecha descendente.

### Datos
- **Fuente:** Entidad \`AnalysisHistory\`
- **Query:** \`db.entities.AnalysisHistory.list("-created_date", 50)\`
- **Eliminar:** \`db.entities.AnalysisHistory.delete(id)\`

### Visualización por Item
- Avatar con iniciales del símbolo
- Nombre + badge de señal (color según tipo)
- Fecha formateada con \`date-fns\` (locale español)
- Score con barra de progreso
- Botón "Re-analizar" → navega a \`/AssetAnalysis?symbol=TICKER\`
- Botón eliminar

### signalConfig
\`\`\`js
{
  strong_buy: { label: "COMPRA FUERTE", color: "text-green-400", bg: "bg-green-500/10" },
  buy:        { label: "COMPRA",        color: "text-green-400", bg: "bg-green-500/10" },
  hold:       { label: "MANTENER",      color: "text-yellow-400", bg: "bg-yellow-500/10" },
  sell:       { label: "VENTA",         color: "text-red-400",   bg: "bg-red-500/10" },
  strong_sell:{ label: "VENTA FUERTE",  color: "text-red-400",   bg: "bg-red-500/10" },
}
\`\`\`
      `
    },
    {
      id: "dashboard-components",
      icon: "📦",
      title: "Componentes: Dashboard",
      content: `
## components/dashboard/MarketTickerBar.jsx
Barra horizontal animada con scroll infinito (CSS \`@keyframes ticker\`).
- **Props:** \`tickers\` — array de \`{ symbol, price, change }\`
- Si no hay datos, usa \`DEFAULT_TICKERS\` con valores "---"
- Duplica el array para el efecto infinite scroll

---

## components/dashboard/MarketOverviewCards.jsx
Grid de 2x4 cards con mini-gráfico sparkline (AreaChart de Recharts).
- **Props:** \`assets\` — array de objetos con \`symbol, name, value, change_1d, change_1w, sparkline[]\`
- Colores: verde si \`change_1d >= 0\`, rojo si negativo
- Animación con Framer Motion (\`delay: i * 0.05\`)

---

## components/dashboard/FearGreedGauge.jsx
Gauge circular SVG que muestra el índice Miedo & Codicia (0-100).
- **Props:** \`data\` — \`{ value, label, vix, summary }\`
- Colores: rojo (≤25), naranja (≤45), amarillo (≤55), verde (≤75), verde brillante (>75)
- Dibuja arco con \`strokeDasharray\` proporcional al valor

---

## components/dashboard/TopMovers.jsx
Tabs con ganadores/perdedores del día.
- **Props:** \`gainers, losers\` — arrays de \`{ symbol, name, price, change_pct }\`
- Usa \`<Tabs>\` de shadcn/ui

---

## components/dashboard/MarketNews.jsx
Lista de noticias con badge de sentimiento.
- **Props:** \`headlines\` — array de \`{ title, summary, sentiment, source, time_ago }\`
- Sentimientos: positive (verde), negative (rojo), neutral (amarillo)

---

## components/dashboard/LiveSignalsFeed.jsx
Feed de señales AI de trading con datos detallados.
- **Props:** \`signals, marketBias\`
- Barra de fuerza visual (5 bloques apilados)
- Colores por acción: BUY (verde), SELL (rojo), WATCH (amarillo)
- Links directos a \`/AssetAnalysis?symbol=TICKER\`
      `
    },
    {
      id: "chart-components",
      icon: "📈",
      title: "Componentes: Charts (Análisis)",
      content: `
## components/charts/CandlestickChart.jsx
Gráfico de velas japonesas con indicadores técnicos.
- **Props:** \`symbol\` (string)
- Llama a \`InvokeLLM\` para obtener datos OHLCV simulados para el timeframe seleccionado
- **Timeframes:** 1D, 1W, 1M, 3M, 1Y
- **Indicadores:** MA20 (verde), MA50 (amarillo), Bollinger Bands
- Usa \`recharts\` ComposedChart con CustomCandlestick SVG

---

## components/charts/AIPrediction.jsx
Panel de predicción IA con targets y curva de probabilidad.
- **Props:** \`symbol, currentPrice\`
- Llama \`InvokeLLM\` para obtener targets a corto/medio/largo plazo
- Muestra: confidence score, área de predicción (Recharts), señales de entrada/salida, evaluación de riesgo

---

## components/charts/LongShortPanel.jsx
Análisis de posicionamiento Long/Short e institucional.
- **Props:** \`symbol\`
- Llama \`InvokeLLM\` para obtener:
  - Sentimiento retail (% long vs short)
  - Short interest
  - Flujo de opciones
  - Dark Pool / Insiders

---

## components/charts/CorrelationMatrix.jsx
Correlaciones ocultas con otros activos y patrones estacionales.
- **Props:** \`symbol\`
- Llama \`InvokeLLM\` para:
  - Correlaciones con activos relacionados (coeficiente -1 a +1)
  - Patrones estacionales por mes
  - Indicadores adelantados (lead/lag)

---

## components/charts/ChartPatterns.jsx
Detección de patrones técnicos y formaciones chartistas.
- **Props:** \`symbol\`
- Llama \`InvokeLLM\` para detectar:
  - Patrones de chart (head & shoulders, triangles, etc.)
  - Velas japonesas significativas
  - Divergencias de indicadores
  - Conteo de ondas de Elliott

---

## components/charts/MacroPanel.jsx
Análisis del entorno macroeconómico.
- **Props:** \`symbol\`
- Muestra: DXY, VIX, yields del Tesoro, políticas de bancos centrales, rotación sectorial
- Risk score visual con colores
      `
    },
    {
      id: "analysis-components",
      icon: "🧮",
      title: "Componentes: Paneles de Análisis",
      content: `
## components/analysis/TechnicalPanel.jsx
Muestra todos los indicadores técnicos obtenidos del análisis principal.
- **Props:** \`data\` (objeto \`technical\` del resultado de análisis)
- Secciones:
  - **Precio:** Open, High, Low, Prev Close
  - **Osciladores:** RSI, MACD (valor/señal/histograma/interpretación), Stochastics K/D
  - **Medias Móviles:** MA20/50/100/200 con señal golden/death cross
  - **Bollinger Bands:** Upper/Middle/Lower + posición
  - **Volumen/Volatilidad:** Vol actual vs media 20d, ATR
  - **Soportes/Resistencias:** 3 niveles cada uno
  - **Fibonacci:** Niveles calculados
  - **Señal General**

---

## components/analysis/FundamentalPanel.jsx
Panel de análisis fundamental completo.
- **Props:** \`data\` (objeto \`fundamental\`)
- Secciones:
  - **Valoración:** Market Cap, P/E, Forward P/E, PEG, EPS
  - **Salud Financiera:** Ingresos, Margen, Deuda/Capital, Dividendo
  - **Rango 52 Semanas:** Barra visual min-max, Sector, Industria
  - **Consenso Analistas:** Cards de Buy/Hold/Sell + precio objetivo
  - **Señal General**

---

## components/analysis/OptionsPanel.jsx
Panel de datos de opciones y griegas.
- **Props:** \`data\` (objeto \`options\`)
- Secciones:
  - **Volatilidad:** IV, IV Percentil, Put/Call Ratio, Volumen de Opciones
  - **Greeks ATM:** Δ Delta, Γ Gamma, Θ Theta, V Vega
  - **Max Pain:** precio donde más opciones expiran sin valor
  - **Actividad Inusual:** descripción de flujos inusuales

---

## components/analysis/SignalBadge.jsx
Badge de señal con datos de precio y score.
- **Props:** \`data\` (signal, score, current_price, daily_change_pct, symbol, name)
- Muestra barra de progreso animada del score
      `
    },
    {
      id: "entities",
      icon: "🗄️",
      title: "Entidades de Base de Datos",
      content: `
## entities/Watchlist.json

Almacena los activos en seguimiento del usuario.

\`\`\`json
{
  "symbol":            "string (requerido) — Ticker ej: AAPL, BTC",
  "name":              "string (requerido) — Nombre completo",
  "asset_type":        "enum: stock | option | crypto | etf | forex (requerido)",
  "notes":             "string — Notas personales",
  "target_buy_price":  "number — Precio objetivo de compra",
  "target_sell_price": "number — Precio objetivo de venta",
  "alert_enabled":     "boolean (default: false)"
}
\`\`\`

**Campos auto-generados:** id, created_date, updated_date, created_by

---

## entities/AnalysisHistory.json

Almacena el historial de análisis realizados.

\`\`\`json
{
  "symbol":        "string (requerido) — Ticker analizado",
  "asset_type":    "enum: stock | option | crypto | etf | forex",
  "analysis_data": "string — JSON serializado con resultado completo",
  "signal":        "enum: strong_buy | buy | hold | sell | strong_sell (requerido)",
  "score":         "number — Puntuación 0-100 (requerido)"
}
\`\`\`

**Campos auto-generados:** id, created_date, updated_date, created_by

---

## Entidad User (Built-in de Base44)
Gestionada automáticamente por la plataforma.
- id, email, full_name, role (admin/user), created_date

---

## Operaciones SDK Utilizadas
\`\`\`js

// Listar
db.entities.Watchlist.list("-created_date")
db.entities.AnalysisHistory.list("-created_date", 50)

// Crear
db.entities.Watchlist.create({ symbol, name, asset_type, ... })
db.entities.AnalysisHistory.create({ symbol, signal, score, analysis_data })

// Eliminar
db.entities.Watchlist.delete(id)
db.entities.AnalysisHistory.delete(id)
\`\`\`
      `
    },
    {
      id: "integrations",
      icon: "🤖",
      title: "Integraciones & APIs",
      content: `
## Base44 Core Integration — InvokeLLM

Toda la inteligencia de la aplicación proviene de esta integración.

\`\`\`js

const result = await db.integrations.Core.InvokeLLM({
  prompt: "...",
  add_context_from_internet: true,  // Permite búsqueda en Google/news
  model: "gemini_3_flash",          // Modelo usado en toda la app
  response_json_schema: { ... }     // Fuerza respuesta estructurada
});
\`\`\`

### Modelos Disponibles
| Modelo | Uso | Costo |
|--------|-----|-------|
| automatic (gpt-4o-mini) | Tareas simples | Bajo |
| gemini_3_flash | Toda la app | Medio |
| gemini_3_pro | Mayor calidad | Alto |
| claude_sonnet_4_6 | Tareas complejas | Alto |

**Nota:** Solo \`gemini_3_flash\` y \`gemini_3_pro\` soportan \`add_context_from_internet: true\`.

---

## Usos de InvokeLLM en la App

| Componente/Página | Propósito | add_internet |
|-------------------|-----------|-------------|
| Dashboard | Datos globales de mercado + noticias + señales | ✓ |
| AssetAnalysis | Análisis técnico + fundamental + opciones | ✓ |
| CandlestickChart | Datos OHLCV históricos simulados | ✗ |
| AIPrediction | Predicciones de precio con targets | ✗ |
| LongShortPanel | Posicionamiento institucional y retail | ✗ |
| CorrelationMatrix | Correlaciones y patrones estacionales | ✗ |
| ChartPatterns | Detección de patrones chartistas | ✗ |
| MacroPanel | Análisis macroeconómico | ✗ |

---

## Gestión de Créditos y Errores

\`\`\`js
// Patrón de manejo de errores usado en toda la app
const analyzeAssetSafe = async (sym) => {
  try {
    await analyzeAssetWithSymbol(sym);
  } catch (err) {
    setLoading(false);
    setError(err?.message?.includes("limit")
      ? "Has alcanzado el límite de integraciones."
      : "Error al obtener datos. Intenta de nuevo más tarde.");
  }
};
\`\`\`

### Estrategia de Datos Mock
El Dashboard usa \`MOCK_DASHBOARD_DATA\` de \`lib/mockMarketData.js\` por defecto, evitando consumo de créditos hasta que el usuario solicite datos en vivo explícitamente.
      `
    },
    {
      id: "design",
      icon: "🎨",
      title: "Sistema de Diseño",
      content: `
## Tema y Tokens (index.css)

La app usa un tema oscuro profesional de terminal financiera.

### Paleta de Colores Principales
| Token CSS | Valor HSL | Uso |
|-----------|-----------|-----|
| --background | 220 20% 4% | Fondo principal (casi negro) |
| --foreground | 210 20% 95% | Texto principal |
| --card | 220 18% 7% | Fondos de cards |
| --primary | 142 71% 45% | Verde principal (acciones positivas) |
| --secondary | 220 16% 12% | Fondos secundarios |
| --muted-foreground | 215 15% 50% | Textos secundarios |
| --destructive | 0 72% 51% | Rojo (acciones negativas) |
| --border | 220 16% 14% | Bordes |

### Chart Colors
| Token | Hex Aprox | Uso |
|-------|-----------|-----|
| --chart-1 | Verde | Señales positivas |
| --chart-2 | Rojo | Señales negativas |
| --chart-3 | Amarillo | Señales neutras |
| --chart-4 | Azul | Información |
| --chart-5 | Púrpura | Decorativo |

### Tipografía
- **Fuente:** Inter (Google Fonts, pesos 300-900)
- **Variable CSS:** \`--font-inter\`
- **Tailwind:** \`font-inter\`
- **Monospace:** \`font-mono\` para precios y tickers

### Clases Safelisted (tailwind.config.js)
Para colores dinámicos que no se purgan:
\`\`\`js
safelist: [
  'text-green-400', 'text-red-400', 'text-yellow-400', 'text-blue-400',
  'bg-green-500/10', 'bg-red-500/10', 'bg-yellow-500/10',
  'border-green-500/30', 'border-red-500/30', ...
]
\`\`\`

### Patrones de Diseño Recurrentes
\`\`\`jsx
// Card estándar
<div className="rounded-xl border border-border bg-card/50 p-4">

// Badge de señal
<span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-400">

// Label de sección
<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">

// Texto de precio
<span className="font-mono text-foreground font-bold">
\`\`\`
      `
    },
    {
      id: "mockdata",
      icon: "📁",
      title: "Datos Mock",
      content: `
## lib/mockMarketData.js — MOCK_DASHBOARD_DATA

Objeto estático que simula una respuesta completa de la API del Dashboard. Usado como estado inicial para evitar consumo de créditos al cargar la página.

### Estructura
\`\`\`js
export const MOCK_DASHBOARD_DATA = {
  tickers: [
    { symbol: "SPY", price: "$485.20", change: 0.43 },
    // ... 9 más
  ],
  assets: [
    {
      name: "S&P 500", symbol: "SPY", value: "$485.20",
      change_1d: 0.43, change_1w: 1.2,
      sparkline: [78, 82, 79, 85, 88, 84, 90, 87]
    },
    // ... 7 más
  ],
  fear_greed: { value: 65, label: "Greed", vix: 14.2, summary: "..." },
  gainers: [ { symbol, name, price, change_pct } ],  // 5 items
  losers:  [ { symbol, name, price, change_pct } ],  // 5 items
  headlines: [ { title, summary, sentiment, source, time_ago } ],  // 5 items
  signals: [
    {
      symbol: "NVDA", action: "BUY", price: "$875.40",
      target: "$920", stop: "$850", strength: 82,
      reason: "...", timeframe: "1D", pattern: "Bull Flag"
    },
    // ... 7 más
  ],
  market_bias: "Alcista moderado",
  session: "Nueva York · Mercado Abierto"
}
\`\`\`
      `
    },
    {
      id: "appconfig",
      icon: "⚙️",
      title: "Configuración del Proyecto",
      content: `
## App.jsx — Router Principal

Define todas las rutas usando React Router v6 con el patrón de layout anidado.

\`\`\`jsx
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/"                   element={<Navigate to="/Dashboard" replace />} />
    <Route path="/Dashboard"          element={<Dashboard />} />
    <Route path="/AssetAnalysis"      element={<AssetAnalysis />} />
    <Route path="/Watchlist"          element={<Watchlist />} />
    <Route path="/AnalysisHistoryPage" element={<AnalysisHistoryPage />} />
    <Route path="/Manual"             element={<Manual />} />
  </Route>
  <Route path="*" element={<PageNotFound />} />
</Routes>
\`\`\`

### Wrappers Obligatorios
- \`<AuthProvider>\` — Gestión de autenticación Base44
- \`<QueryClientProvider>\` — TanStack Query
- \`<BrowserRouter>\` — React Router
- \`<Toaster />\` — Notificaciones toast

---

## tailwind.config.js

- **darkMode:** class-based
- **content:** \`./index.html, ./src/**/*.{ts,tsx,js,jsx}\`
- **Colores:** todos mapeados desde variables CSS HSL
- **safelist:** clases dinámicas de colores financieros

---

## Paquetes Principales Instalados
| Paquete | Versión | Uso |
|---------|---------|-----|
| @base44/sdk | ^0.8.0 | Backend BaaS |
| react | ^18.2.0 | Framework |
| react-router-dom | ^6.26.0 | Routing |
| @tanstack/react-query | ^5.84.1 | State/cache |
| recharts | ^2.15.4 | Gráficos |
| framer-motion | ^11.16.4 | Animaciones |
| tailwindcss | — | Estilos |
| lucide-react | ^0.475.0 | Iconos |
| date-fns | ^3.6.0 | Fechas |
| @radix-ui/* | varios | UI Primitivos |

---

## Autenticación

Manejada por Base44 automáticamente. El \`AuthProvider\` en \`App.jsx\` controla:
- Estado de carga (\`isLoadingAuth\`)
- Errores: \`user_not_registered\` → muestra \`UserNotRegisteredError\`
- \`auth_required\` → redirige al login automáticamente
      `
    }
  ]
};

function SectionBlock({ section }) {
  const [open, setOpen] = useState(true);

  const renderContent = (text) => {
    const lines = text.trim().split("\n");
    const elements = [];
    let inCode = false;
    let codeLines = [];
    let codeKey = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (inCode) {
          elements.push(
            <pre key={`code-${codeKey++}`} className="bg-background border border-border rounded-lg p-3 overflow-x-auto text-xs text-green-400 font-mono my-3">
              {codeLines.join("\n")}
            </pre>
          );
          codeLines = [];
          inCode = false;
        } else {
          inCode = true;
        }
        continue;
      }

      if (inCode) {
        codeLines.push(line);
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(<h2 key={i} className="text-base font-bold text-foreground mt-5 mb-2 border-b border-border pb-1">{line.slice(3)}</h2>);
      } else if (line.startsWith("### ")) {
        elements.push(<h3 key={i} className="text-sm font-semibold text-primary mt-4 mb-1.5">{line.slice(4)}</h3>);
      } else if (line.startsWith("#### ")) {
        elements.push(<h4 key={i} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">{line.slice(5)}</h4>);
      } else if (line.startsWith("| ")) {
        // Table row
        const cells = line.split("|").filter(c => c.trim() !== "");
        const isHeader = lines[i + 1]?.includes("---");
        const isSeparator = line.includes("---");
        if (!isSeparator) {
          elements.push(
            <tr key={i} className={isHeader ? "border-b border-primary/30" : "border-b border-border/50"}>
              {cells.map((cell, ci) => (
                isHeader
                  ? <th key={ci} className="text-left text-xs font-semibold text-primary px-3 py-1.5 whitespace-nowrap">{cell.trim()}</th>
                  : <td key={ci} className="text-xs text-muted-foreground px-3 py-1.5 align-top">{cell.trim()}</td>
              ))}
            </tr>
          );
          if (isHeader) {
            // Wrap previous rows and this one in thead at render time
          }
        }
      } else if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*:? ?(.*)/);
        if (match) {
          elements.push(
            <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start ml-2 my-0.5">
              <span className="text-primary mt-0.5">▸</span>
              <span><span className="text-foreground font-medium">{match[1]}</span>{match[2] ? `: ${match[2]}` : ""}</span>
            </li>
          );
        }
      } else if (line.startsWith("- ")) {
        elements.push(
          <li key={i} className="text-xs text-muted-foreground flex gap-2 items-start ml-2 my-0.5">
            <span className="text-primary mt-0.5">▸</span>
            <span>{line.slice(2)}</span>
          </li>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={i} className="h-1.5" />);
      } else {
        // Inline bold
        const parts = line.split(/\*\*(.+?)\*\*/g);
        elements.push(
          <p key={i} className="text-xs text-muted-foreground leading-relaxed">
            {parts.map((part, pi) =>
              pi % 2 === 1
                ? <span key={pi} className="text-foreground font-medium">{part}</span>
                : part
            )}
          </p>
        );
      }
    }

    // Wrap table rows
    const tableIndexes = elements.reduce((acc, el, i) => {
      if (el?.type === "tr") acc.push(i);
      return acc;
    }, []);

    if (tableIndexes.length > 0) {
      const nonTableElements = [];
      let tableBuffer = [];
      elements.forEach((el, i) => {
        if (el?.type === "tr") {
          tableBuffer.push(el);
        } else {
          if (tableBuffer.length > 0) {
            nonTableElements.push(
              <div key={`table-${i}`} className="overflow-x-auto my-3">
                <table className="w-full border border-border rounded-lg overflow-hidden">
                  <tbody>{tableBuffer}</tbody>
                </table>
              </div>
            );
            tableBuffer = [];
          }
          nonTableElements.push(el);
        }
      });
      if (tableBuffer.length > 0) {
        nonTableElements.push(
          <div key="table-end" className="overflow-x-auto my-3">
            <table className="w-full border border-border rounded-lg overflow-hidden">
              <tbody>{tableBuffer}</tbody>
            </table>
          </div>
        );
      }
      return nonTableElements;
    }

    return elements;
  };

  return (
    <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{section.icon}</span>
          <span className="text-sm font-semibold text-foreground">{section.title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-0.5">
          {renderContent(section.content)}
        </div>
      )}
    </div>
  );
}

function generateHTML() {
  const css = `
    body { font-family: 'Segoe UI', sans-serif; background: #0a0d12; color: #e8ecf0; margin: 0; padding: 0; }
    .container { max-width: 960px; margin: 0 auto; padding: 40px 24px; }
    h1 { color: #3dd68c; font-size: 2rem; border-bottom: 2px solid #3dd68c; padding-bottom: 12px; }
    h2 { color: #e8ecf0; font-size: 1.1rem; border-bottom: 1px solid #1e2430; padding-bottom: 8px; margin-top: 2rem; }
    h3 { color: #3dd68c; font-size: 0.95rem; margin-top: 1.5rem; }
    h4 { color: #7a8899; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; }
    p, li { color: #7a8899; font-size: 0.85rem; line-height: 1.7; }
    strong { color: #e8ecf0; }
    pre { background: #060810; border: 1px solid #1e2430; border-radius: 8px; padding: 16px; overflow-x: auto; font-size: 0.75rem; color: #3dd68c; }
    code { font-family: 'Consolas', monospace; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.82rem; }
    th { color: #3dd68c; background: #0f1520; padding: 8px 12px; text-align: left; border-bottom: 2px solid #1e2430; }
    td { color: #7a8899; padding: 8px 12px; border-bottom: 1px solid #1a2030; }
    .section { background: #0d1117; border: 1px solid #1e2430; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .section-title { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .badge { display: inline-block; background: #3dd68c22; color: #3dd68c; padding: 2px 10px; border-radius: 20px; font-size: 0.75rem; }
    hr { border: none; border-top: 1px solid #1e2430; margin: 2rem 0; }
    ul { padding-left: 0; list-style: none; }
    li::before { content: "▸ "; color: #3dd68c; }
  `;

  let html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>InvestPro Terminal — Manual Técnico</title>
  <style>${css}</style></head><body><div class="container">
  <h1>📊 InvestPro Terminal — Manual Técnico Completo</h1>
  <p><span class="badge">v2.0</span> &nbsp; Generado: ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>`;

  MANUAL_CONTENT.sections.forEach(section => {
    html += `<div class="section">`;
    html += `<div class="section-title"><span style="font-size:1.4rem">${section.icon}</span><h2 style="margin:0;border:none">${section.title}</h2></div>`;
    
    let content = section.content;
    content = content.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) => `<pre><code>${code.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`);
    content = content.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    content = content.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    content = content.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
    content = content.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    content = content.replace(/^---$/gm, "<hr/>");
    content = content.replace(/^- (.+)$/gm, "<li>$1</li>");
    content = content.replace(/^(\| .+)$/gm, (line) => {
      if (line.includes("---")) return "";
      const cells = line.split("|").filter(c => c.trim());
      return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join("")}</tr>`;
    });
    content = content.replace(/(<tr>[\s\S]+?<\/tr>)/g, "<table>$1</table>");
    content = content.replace(/^(?!<[h|l|p|t|u|d|c|b])(.+)$/gm, "<p>$1</p>");

    html += content;
    html += `</div>`;
  });

  html += `</div></body></html>`;
  return html;
}

export default function Manual() {
  const handleDownload = () => {
    const html = generateHTML();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "InvestPro_Manual_Tecnico.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-card/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Manual Técnico</h1>
            <p className="text-[10px] text-muted-foreground">InvestPro Terminal {MANUAL_CONTENT.version} · {MANUAL_CONTENT.date}</p>
          </div>
        </div>
        <Button onClick={handleDownload} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-4 text-xs gap-2">
          <Download className="h-3.5 w-3.5" />
          Descargar HTML
        </Button>
      </div>

      {/* Index */}
      <div className="px-4 md:px-6 py-4 border-b border-border bg-secondary/20">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Índice de Contenidos</p>
        <div className="flex flex-wrap gap-2">
          {MANUAL_CONTENT.sections.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <span>{s.icon}</span> {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 max-w-[900px] mx-auto w-full space-y-4 pb-12">
        {MANUAL_CONTENT.sections.map(section => (
          <div key={section.id} id={section.id}>
            <SectionBlock section={section} />
          </div>
        ))}

        <div className="text-center py-6 text-xs text-muted-foreground">
          InvestPro Terminal v2.0 · Generado el {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>
    </div>
  );
}