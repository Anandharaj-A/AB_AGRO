import React, { useState } from 'react';
import { useHarvester, ScreenType } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { HarvesterLogo } from './HarvesterLogo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
}) => {
  const { currentScreen, setCurrentScreen, businessSettings, activePartnerView, setActivePartnerView } = useHarvester();
  const { appUser, logout, isAdmin } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const displaySubtitle = subtitle || `${businessSettings.harvesterModel} (${businessSettings.registrationNumber})`;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      setCurrentScreen('home-dashboard');
    }
  };

  const getScreenTitle = (): { main: string; category?: string } => {
    if (title) return { main: title };
    switch (currentScreen) {
      case 'home-dashboard':
        return { main: businessSettings.businessName, category: 'Dashboard' };
      case 'work-list':
        return { main: businessSettings.businessName, category: 'Work List' };
      case 'add-work':
        return { main: 'Add Work' };
      case 'add-expense':
        return { main: 'Add Expense' };
      case 'expense-list':
        return { main: businessSettings.businessName, category: 'Expenses' };
      case 'driver-management':
        return { main: businessSettings.businessName, category: 'Driver Bata' };
      case 'machine-care':
        return { main: businessSettings.businessName, category: 'Machine Care' };
      case 'admin-settings':
        return { main: 'Admin Settings' };
      case 'activity-log':
        return { main: 'Activity Log' };
      case 'reports':
        return { main: businessSettings.businessName, category: 'Partner Audit' };
      default:
        return { main: businessSettings.businessName };
    }
  };

  const screenTitle = getScreenTitle();

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(43,40,35,0.06)]">
      <div className="h-20 px-4 sm:px-6 flex items-center justify-between gap-2 max-w-xl mx-auto">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack && (
            <button
              aria-label="Go back"
              onClick={handleBack}
              className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">
                arrow_back
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setCurrentScreen('home-dashboard')}
            className="cursor-pointer active:scale-95 transition-transform shrink-0"
            title="Harvester Book Dashboard"
          >
            <HarvesterLogo className="w-8 h-8" />
          </button>

          <div className="flex flex-col min-w-0">
            {screenTitle.category ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-headline-sm text-headline-sm text-secondary truncate font-bold">
                  {screenTitle.main}
                </span>
                <span className="hidden sm:inline-block font-label-sm text-label-sm text-outline-variant font-bold">
                  •
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {screenTitle.category}
                </span>
              </div>
            ) : (
              <h1 className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                {screenTitle.main}
              </h1>
            )}

            <div className="flex items-center gap-1 truncate">
              <span className="material-symbols-outlined text-[13px] text-primary shrink-0">
                agriculture
              </span>
              <span className="font-label-sm text-[12px] text-on-surface font-semibold truncate">
                {displaySubtitle}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Active Partner Pill Button */}
          <button
            type="button"
            onClick={() => {
              const next = activePartnerView === businessSettings.partner1Name
                ? businessSettings.partner2Name
                : businessSettings.partner1Name;
              setActivePartnerView(next);
            }}
            className="flex items-center gap-1.5 bg-secondary-container/60 hover:bg-secondary-container px-2.5 py-1 rounded-full border border-secondary/20 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Click to toggle partner perspective"
          >
            <span className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-secondary-container font-extrabold tracking-wide uppercase">
              {activePartnerView}
            </span>
          </button>

          {/* User Profile / Admin Menu Trigger */}
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-[0_2px_4px_rgba(125,88,0,0.2)] active:scale-95 transition-transform cursor-pointer"
            title="Account & Menu"
          >
            <span className="material-symbols-outlined text-on-primary text-[18px]">
              {isAdmin ? 'admin_panel_settings' : 'person'}
            </span>
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute right-0 top-12 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-2 shadow-2xl z-50 w-56 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-surface-container">
                <span className="text-xs font-bold text-on-surface block truncate">
                  {appUser?.name || 'User'}
                </span>
                <span className="text-[11px] text-secondary font-bold uppercase block">
                  Role: {appUser?.role}
                </span>
                <span className="text-[10px] text-outline truncate block">
                  {appUser?.email}
                </span>
              </div>

              {/* Admin-only links */}
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen('admin-settings');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-colors text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">
                      settings
                    </span>
                    <span>Admin Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen('activity-log');
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-on-surface hover:bg-surface-container transition-colors text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      history
                    </span>
                    <span>Activity Audit Log</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('machine-care');
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-outline">
                  construction
                </span>
                <span>Machine Care</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('reports');
                  setShowProfileMenu(false);
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-outline">
                  bar_chart
                </span>
                <span>Reports &amp; Audit</span>
              </button>

              <div className="my-1 border-t border-surface-container"></div>

              {/* Logout button */}
              <button
                type="button"
                onClick={async () => {
                  setShowProfileMenu(false);
                  await logout();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-error hover:bg-error-container/40 transition-colors text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  logout
                </span>
                <span>Log Out</span>
              </button>
            </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
