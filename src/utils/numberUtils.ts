/**
 * Utilities for cleaning and formatting numeric inputs
 * Prevents leading zeros (e.g. "0450" -> 450) while supporting decimals (e.g. "0.5")
 */

export const sanitizeNumberString = (raw: string | number | undefined | null): string => {
  if (raw === '' || raw === null || raw === undefined) {
    return '';
  }

  let str = String(raw).trim();

  // Strip anything that is not digit or period
  str = str.replace(/[^0-9.]/g, '');

  // Keep only the first decimal point
  const dotIndex = str.indexOf('.');
  if (dotIndex !== -1) {
    const beforeDot = str.slice(0, dotIndex);
    const afterDot = str.slice(dotIndex + 1).replace(/\./g, '');
    str = beforeDot + '.' + afterDot;
  }

  // Strip leading zeroes before a non-zero digit (e.g. "0450" -> "450", "0045" -> "45")
  // But preserve "0." for decimals like "0.5" or "0.75"
  if (/^0+[1-9]/.test(str)) {
    str = str.replace(/^0+/, '');
  } else if (/^00+$/.test(str)) {
    // If only multiple zeroes typed like "00", keep as single "0"
    str = '0';
  }

  return str;
};

export const cleanNumberInput = (raw: string | number | undefined | null): number | '' => {
  if (raw === '' || raw === null || raw === undefined) {
    return '';
  }

  const sanitized = sanitizeNumberString(raw);
  if (sanitized === '' || sanitized === '.') return '';

  const num = parseFloat(sanitized);
  return isNaN(num) ? '' : num;
};

export const formatInputDisplay = (val: number | string | '' | undefined | null): string => {
  if (val === '' || val === undefined || val === null) return '';
  return sanitizeNumberString(val);
};
