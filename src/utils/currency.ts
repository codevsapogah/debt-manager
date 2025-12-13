export const formatCurrency = (amount: number): string => {
  return `₸${amount.toLocaleString('kk-KZ')}`;
};

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) {
    return `₸${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₸${(amount / 1000).toFixed(0)}K`;
  }
  return `₸${amount.toLocaleString('kk-KZ')}`;
};