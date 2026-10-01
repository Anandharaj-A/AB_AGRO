import React from 'react';
import { useHarvester, ScreenType } from '../context/HarvesterContext';

export const BottomNav: React.FC = () => {
  const { currentScreen, setCurrentScreen } = useHarvester();

  const navItems: {
    id: ScreenType;
    label: string;
    icon: string;
  }[] = [
    { id: 'home-dashboard', label: 'Home', icon: 'speed' },
    { id: 'work-list', label: 'Work', icon: 'agriculture' },
    { id: 'expense-list', label: 'Expenses', icon: 'local_gas_station' },
    { id: 'driver-management', label: 'Driver', icon: 'sports_motorsports' },
    { id: 'reports', label: 'More', icon: 'bar_chart' },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(43,40,35,0.08)]">
      <div className="flex justify-around items-center h-20 px-2 max-w-xl mx-auto">
        {navItems.map((item) => {
          const isActive =
            currentScreen === item.id ||
            (item.id === 'work-list' && currentScreen === 'add-work') ||
            (item.id === 'expense-list' && currentScreen === 'add-expense');

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentScreen(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[52px] py-1 transition-all duration-150 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-secondary font-bold'
                  : 'text-on-surface-variant hover:text-secondary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="font-label-sm text-[11px] leading-tight font-bold tracking-wide mt-1">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
