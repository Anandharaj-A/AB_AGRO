export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const toISODateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseISODate = (isoStr: string): Date => {
  if (!isoStr) return new Date();
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(isoStr);
};

export const formatDisplayDate = (d: Date = new Date()): string => {
  const now = new Date();
  const isSameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const formatted = d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return isSameDay ? `Today, ${formatted}` : formatted;
};

export const formatMonthYear = (d: Date = new Date()): string => {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
};

export const addDays = (d: Date, days: number): Date => {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
};

export const addMonths = (d: Date, months: number): Date => {
  const res = new Date(d);
  res.setMonth(res.getMonth() + months);
  return res;
};

export const doesEntryMatchDate = (entryDate: string | undefined, targetISO: string): boolean => {
  if (!entryDate || !targetISO) return false;
  if (entryDate.includes(targetISO)) return true;
  const targetDate = parseISODate(targetISO);
  const day = String(targetDate.getDate());
  const monthShort = targetDate.toLocaleDateString('en-GB', { month: 'short' });
  const monthFull = MONTH_NAMES[targetDate.getMonth()];
  const year = String(targetDate.getFullYear());
  const hasYear = entryDate.includes(year);
  const hasMonth = entryDate.includes(monthShort) || entryDate.includes(monthFull);
  const hasDay = entryDate.includes(day);
  return hasYear && hasMonth && hasDay;
};

export const doesEntryMatchMonth = (entryDate: string | undefined, targetMonthYear: string): boolean => {
  if (!entryDate || !targetMonthYear) return false;
  const parts = targetMonthYear.trim().split(' ');
  if (parts.length < 2) return true;
  const [mName, yStr] = parts;
  const monthShort = mName.slice(0, 3);
  const hasYear = entryDate.includes(yStr);
  const hasMonth = entryDate.toLowerCase().includes(mName.toLowerCase()) || entryDate.toLowerCase().includes(monthShort.toLowerCase());
  return hasYear && hasMonth;
};

