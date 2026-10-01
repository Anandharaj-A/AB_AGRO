import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { PartnerAuditModal } from './PartnerAuditModal';

export const ReportsScreen: React.FC = () => {
  const {
    totalIncome,
    totalExpenses,
    netProfit,
    netProfitPartner1,
    netProfitPartner2,
    totalPending,
    totalWorkCount,
    partner1Spent,
    partner2Spent,
    settlementOwed,
    businessSettings,
    activePartnerView,
    setActivePartnerView,
    setCurrentScreen,
    exportDataToCSV,
  } = useHarvester();

  const { isAdmin, appUser } = useAuth();
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  const p1 = businessSettings.partner1Name || 'Anand';
  const p2 = businessSettings.partner2Name || 'Boopathi';

  const handleCopyReport = () => {
    const reportText = `📋 *${businessSettings.harvesterModel.toUpperCase()} (${businessSettings.registrationNumber}) - SEASON AUDIT REPORT*
Partners: ${p1} (${businessSettings.profitSharePartner1}%) & ${p2} (${businessSettings.profitSharePartner2}%)
Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

💰 Total Harvest Revenue: ₹ ${totalIncome.toLocaleString('en-IN')}
🛠 Total Machine Expenses: ₹ ${totalExpenses.toLocaleString('en-IN')}
📈 Net Seasonal Profit: ₹ ${netProfit.toLocaleString('en-IN')}
🤝 ${p1}'s Share (${businessSettings.profitSharePartner1}%): ₹ ${netProfitPartner1.toLocaleString('en-IN')}
🤝 ${p2}'s Share (${businessSettings.profitSharePartner2}%): ₹ ${netProfitPartner2.toLocaleString('en-IN')}
⏳ Outstanding Farmers Due: ₹ ${totalPending.toLocaleString('en-IN')}

*Outlays from Pocket:*
• ${p1} Outlay: ₹ ${partner1Spent.toLocaleString('en-IN')}
• ${p2} Outlay: ₹ ${partner2Spent.toLocaleString('en-IN')}
• Equalization Status: ${settlementOwed.amount > 0 ? `${settlementOwed.from} owes ${settlementOwed.to} ₹ ${settlementOwed.amount.toLocaleString('en-IN')}` : 'Accounts Fully Equalized'}`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2200);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Title Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-fixed/60 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">analytics</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Harvester Reports &amp; Audit
            </h2>
            <span className="font-body-sm text-xs text-on-surface-variant font-medium">
              Machine: {businessSettings.harvesterModel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAuditOpen(true)}
          className="h-10 px-3.5 rounded-full bg-secondary text-on-secondary font-label-md text-xs font-bold shadow-xs active:scale-95 transition-transform cursor-pointer"
        >
          View Audit
        </button>
      </div>

      {/* Season Financial Summary */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          Key Performance Ledger
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low p-3 rounded-xl">
            <span className="text-outline text-xs block font-semibold">Total Revenue</span>
            <span className="font-headline-sm text-on-surface font-extrabold">
              ₹ {totalIncome.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-secondary font-bold block mt-0.5">
              {totalWorkCount} Harvest Jobs
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl">
            <span className="text-outline text-xs block font-semibold">Total Expenses</span>
            <span className="font-headline-sm text-on-surface font-extrabold">
              ₹ {totalExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-primary font-bold block mt-0.5">
              Fuel, Parts &amp; Bata
            </span>
          </div>

          <div className="bg-secondary-container/40 p-3 rounded-xl">
            <span className="text-secondary text-xs block font-bold">Net Profit</span>
            <span className="font-headline-sm text-secondary font-extrabold">
              ₹ {netProfit.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-on-secondary-container font-semibold block mt-0.5">
              {p1}: ₹{netProfitPartner1.toLocaleString('en-IN')} • {p2}: ₹{netProfitPartner2.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-tertiary-fixed/40 p-3 rounded-xl">
            <span className="text-tertiary text-xs block font-bold">Unsettled Bills</span>
            <span className="font-headline-sm text-tertiary font-extrabold">
              ₹ {totalPending.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-on-tertiary-fixed-variant font-semibold block mt-0.5">
              Field Cash Pending
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-11 rounded-full bg-surface-container text-on-surface font-label-md text-xs font-bold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              {copiedReport ? 'check' : 'share'}
            </span>
            <span>{copiedReport ? 'Copied!' : 'Share Summary'}</span>
          </button>

          <button
            type="button"
            onClick={exportDataToCSV}
            className="h-11 rounded-full bg-secondary text-on-secondary font-label-md text-xs font-bold hover:bg-secondary/95 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2.5">
        <h3 className="font-headline-sm text-sm font-bold text-on-surface">
          Operations &amp; Machinery
        </h3>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setCurrentScreen('machine-care')}
            className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[22px]">construction</span>
              <div>
                <span className="font-bold text-xs text-on-surface block">Machine Care &amp; Service</span>
                <span className="text-[11px] text-outline">Greasing logs, oil changes, engine hours</span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
          </button>

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setCurrentScreen('activity-log')}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary text-[22px]">history</span>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">Activity Audit Log</span>
                    <span className="text-[11px] text-outline">Who added, edited or deleted entries</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('admin-settings')}
                className="p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all flex items-center justify-between text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-[22px]">admin_panel_settings</span>
                  <div>
                    <span className="font-bold text-xs text-on-surface block">Admin Settings</span>
                    <span className="text-[11px] text-outline">Users, business profile, dropdown lists &amp; data tools</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-outline">chevron_right</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Switch Partner Perspective */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          Partner Viewpoint
        </h3>
        <p className="font-body-sm text-xs text-on-surface-variant">
          Currently inspecting ledger from <strong className="text-on-surface font-bold">{activePartnerView}</strong>'s perspective.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setActivePartnerView(p1)}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activePartnerView.toLowerCase() === p1.toLowerCase()
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>{p1} ({businessSettings.profitSharePartner1}%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActivePartnerView(p2)}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activePartnerView.toLowerCase() === p2.toLowerCase()
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">person</span>
            <span>{p2} ({businessSettings.profitSharePartner2}%)</span>
          </button>
        </div>
      </div>

      {/* Machinery Specs & Registration */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2">
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
          Combine Machinery Profile
        </h3>
        <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
          <div className="flex justify-between py-1 border-b border-surface-container">
            <span>Model</span>
            <span className="font-bold text-on-surface">{businessSettings.harvesterModel}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-container">
            <span>Registration</span>
            <span className="font-bold text-on-surface font-mono">{businessSettings.registrationNumber}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-surface-container">
            <span>Engine Specs</span>
            <span className="font-bold text-on-surface">Turbo Diesel Combine Harvester</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Logged in Account</span>
            <span className="font-bold text-secondary">{appUser?.name} ({appUser?.role?.toUpperCase()})</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      <PartnerAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />
    </div>
  );
};
