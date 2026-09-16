export const formatCurrency = (value: number | null, cents = false) => {
  if (value === null || !Number.isFinite(value)) return 'Incomplete';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value);
};

export const formatPercent = (value: number | null) => value === null || !Number.isFinite(value)
  ? 'Incomplete'
  : `${value.toFixed(1)}%`;

export const formatMonths = (months: number | null) => {
  if (months === null) return 'Not paid off';
  if (months === 0) return 'No debt';
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (!years) return `${remainder} mo`;
  return remainder ? `${years} yr ${remainder} mo` : `${years} yr`;
};
