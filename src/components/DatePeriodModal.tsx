import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import {
  MONTH_NAMES,
  toISODateString,
  parseISODate,
  formatDisplayDate,
  formatMonthYear,
} from '../utils/dateUtils';

interface DatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatePeriodModal: React.FC<DatePeriodModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedDate,
    selectedMonth,
    dateFilterMode,
    setSelectedDate,
    setSelectedMonth,
    setDateFilterMode,
    workEntries,
  } = useHarvester();

  if (!isOpen) return null;

  const initialMode = dateFilterMode;
  const [tab, setTab] = useState<'month' | 'day' | 'all'>(initialMode);

  // Month & Year state
  const parts = selectedMonth.trim().split(' ');
  const curMonthName = parts[0] || MONTH_NAMES[new Date().getMonth()];
  const curYearNum = parseInt(parts[1], 10) || new Date().getFullYear();

  const [tempMonth, setTempMonth] = useState<string>(curMonthName);
  const [tempYear, setTempYear] = useState<number>(curYearNum);

  // Specific Day state
  const [tempDate, setTempDate] = useState<string>(selectedDate || toISODateString(new Date()));

  // Quick years list
  const currentYear = new Date().getFullYear();
  const availableYears = [
    currentYear - 3,
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  const handleApply = () => {
    if (tab === 'all') {
      setDateFilterMode('all');
    } else if (tab === 'day') {
      setDateFilterMode('day');
      setSelectedDate(tempDate);
      const d = parseISODate(tempDate);
      setSelectedMonth(formatMonthYear(d));
    } else {
      // Month mode
      setDateFilterMode('month');
      setSelectedMonth(`${tempMonth} ${tempYear}`);
      const mIdx = MONTH_NAMES.indexOf(tempMonth);
      const d = new Date(tempYear, mIdx !== -1 ? mIdx : 0, 1);
      setSelectedDate(toISODateString(d));
    }
    onClose();
  };

  const setToday = () => {
    const now = new Date();
    setTempDate(toISODateString(now));
    setTempMonth(MONTH_NAMES[now.getMonth()]);
    setTempYear(now.getFullYear());
    setTab('day');
  };

  const setThisMonth = () => {
    const now = new Date();
    setTempMonth(MONTH_NAMES[now.getMonth()]);
    setTempYear(now.getFullYear());
    setTab('month');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl border border-outline-variant/30">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">calendar_month</span>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">Change Date &amp; Period</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Quick Jump Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={setToday}
            className="py-1.5 px-2 rounded-xl text-xs font-bold bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed/80 transition-all text-center cursor-pointer"
          >
            ⚡ Today
          </button>
          <button
            type="button"
            onClick={setThisMonth}
            className="py-1.5 px-2 rounded-xl text-xs font-bold bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 transition-all text-center cursor-pointer"
          >
            📅 This Month
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
              tab === 'all'
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            🌾 All Records
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-surface-container rounded-2xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab('month')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'month'
                ? 'bg-surface-container-lowest text-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            By Month &amp; Year
          </button>
          <button
            type="button"
            onClick={() => setTab('day')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === 'day'
                ? 'bg-surface-container-lowest text-secondary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Specific Date
          </button>
        </div>

        {/* Tab 1: Month & Year Picker */}
        {tab === 'month' && (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Select Month</label>
              <select
                value={tempMonth}
                onChange={(e) => setTempMonth(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Select Year</label>
              <div className="grid grid-cols-3 gap-1.5">
                {availableYears.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTempYear(yr)}
                    className={`h-10 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tempYear === yr
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Specific Date Picker */}
        {tab === 'day' && (
          <div className="flex flex-col gap-3 py-1">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface">Select Exact Date</label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl bg-surface-container font-body-md text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
              />
            </div>

            <div className="bg-surface-container-low p-2.5 rounded-xl text-xs text-on-surface-variant flex items-center justify-between">
              <span>Displaying as:</span>
              <strong className="text-secondary">{formatDisplayDate(parseISODate(tempDate))}</strong>
            </div>
          </div>
        )}

        {/* Tab 3: All Records */}
        {tab === 'all' && (
          <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface block font-bold mb-1">Showing All Season Records</strong>
            The dashboard will show overall totals across all dates and months ({workEntries.length} total jobs).
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-11 rounded-full bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-md hover:bg-secondary/95 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>Apply Date</span>
          </button>
        </div>
      </div>
    </div>
  );
};
