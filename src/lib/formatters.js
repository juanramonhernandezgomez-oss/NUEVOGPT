export const formatCurrency = (value, currency = 'USD') => {
  if (value == null || Number.isNaN(Number(value))) return 'N/A';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value);
};

export const formatNumber = (value, digits = 2) => {
  if (value == null || Number.isNaN(Number(value))) return 'N/A';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
};

export const formatCompact = (value) => {
  if (value == null || Number.isNaN(Number(value))) return 'N/A';
  return new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
};

export const formatPercent = (value, digits = 2) => {
  if (value == null || Number.isNaN(Number(value))) return 'N/A';
  return `${value >= 0 ? '+' : ''}${Number(value).toFixed(digits)}%`;
};
