/**
 * Format price value to display with 2 decimal places
 * Handles both number and string/Decimal types from backend
 */
export const formatPrice = (price: number | string): string => {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  
  // Handle string or Decimal object
  const numPrice = Number(price);
  if (isNaN(numPrice)) {
    return '0.00';
  }
  
  return numPrice.toFixed(2);
};

/**
 * Format currency with Turkish Lira symbol
 */
export const formatCurrency = (price: number | string): string => {
  return `₺${formatPrice(price)}`;
};

/**
 * Parse price input to number for API calls
 */
export const parsePrice = (price: string | number): number => {
  if (typeof price === 'number') {
    return price;
  }
  
  const parsed = Number(price);
  return isNaN(parsed) ? 0 : parsed;
};