import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';

interface PartnerAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerAuditModal: React.FC<PartnerAuditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    partner1Spent,
    partner2Spent,
    totalExpenses,
    totalIncome,
    netProfit,
    netProfitPartner1,
    netProfitPartner2,
    settlementOwed,
    settlePartnerAccount,
    settlements,
    businessSettings,
  } = useHarvester();

  const [settledSuccess, setSettledSuccess] = useState(false);

  if (!isOpen) return null;

  const p1 = businessSettings.partner1Name || 'Anand';
  const p2 = businessSettings.partner2Name || 'Boopathi';

  const handleSettle = () => {
    settlePartnerAccount(`Equalized ${businessSettings.profitSharePartner1}/${businessSettings.profitSharePartner2} machine expense accounts via UPI / Bank`);
    setSettledSuccess(true);
    setTimeout(() => {
      setSettledSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-3 sm:p-4">
      <div className="bg-surface-container-lowest rounded-2xl p-5 w-full max-w-md mx-auto shadow-2xl flex flex-col gap-4 border border-outline-variant/30 max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary-fixed/70 flex items-center justify-center text-on-primary-fixed">
              <span className="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Partner Ledger Audit
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {p1} &amp; {p2} ({businessSettings.profitSharePartner1}/{businessSettings.profitSharePartner2} Split)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-highest cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col">
            <span className="font-label-sm text-[11px] text-outline uppercase font-semibold">
              Total Machine Income
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              ₹ {totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl flex flex-col">
            <span className="font-label-sm text-[11px] text-outline uppercase font-semibold">
              Total Expenses
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              ₹ {totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Profit Split Explanation */}
        <div className="bg-secondary-container/40 p-3.5 rounded-xl flex flex-col gap-1.5 text-on-surface">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-bold text-secondary">
              Net Seasonal Profit
            </span>
            <span className="font-headline-sm text-headline-sm text-secondary font-extrabold">
              ₹ {netProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-xs text-on-secondary-container flex justify-between pt-1 border-t border-secondary/20">
            <span>{p1} ({businessSettings.profitSharePartner1}%): <strong>₹{netProfitPartner1.toLocaleString('en-IN')}</strong></span>
            <span>{p2} ({businessSettings.profitSharePartner2}%): <strong>₹{netProfitPartner2.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>

        {/* Partner Outlay Breakdown */}
        <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col gap-2.5">
          <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
            Who Paid What (From Pocket)
          </span>

          <div className="flex items-center justify-between pb-1 border-b border-surface-container-highest">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
              <span className="font-body-md font-semibold text-on-surface">
                {p1}'s Expenses
              </span>
            </div>
            <span className="font-label-lg font-bold text-on-surface">
              ₹ {partner1Spent.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between pb-1 border-b border-surface-container-highest">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              <span className="font-body-md font-semibold text-on-surface">
                {p2}'s Expenses
              </span>
            </div>
            <span className="font-label-lg font-bold text-on-surface">
              ₹ {partner2Spent.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-0.5">
            <span>Difference in Outlays:</span>
            <span className="font-semibold text-on-surface">
              ₹ {settlementOwed.difference.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Settlement Directive */}
        <div className="bg-tertiary-fixed/30 border border-tertiary/20 rounded-2xl p-4 flex flex-col gap-2">
          <span className="font-label-sm text-[11px] text-tertiary uppercase font-bold tracking-wider">
            Settlement Calculation
          </span>

          {settlementOwed.amount > 0 ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="font-currency-card text-2xl font-extrabold text-on-tertiary-fixed">
                  ₹ {settlementOwed.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-on-tertiary-fixed-variant">to equalize ledger</span>
              </div>
              <p className="font-body-md text-xs text-on-tertiary-fixed-variant">
                <strong>{settlementOwed.from}</strong> needs to transfer ₹ {settlementOwed.amount.toLocaleString('en-IN')} to <strong>{settlementOwed.to}</strong>.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-secondary font-bold text-sm py-1">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Both partner expenses are completely equalized!</span>
            </div>
          )}
        </div>

        {/* Settlement Success Message */}
        {settledSuccess && (
          <div className="bg-secondary-container text-on-secondary-container p-3 rounded-xl text-center text-xs font-bold animate-in fade-in">
            ✓ Settlement recorded in ledger history!
          </div>
        )}

        {/* Action Button */}
        {settlementOwed.amount > 0 && !settledSuccess && (
          <button
            type="button"
            onClick={handleSettle}
            className="w-full h-12 rounded-full bg-secondary text-on-secondary font-label-lg font-bold text-sm shadow-md hover:bg-secondary/90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>Record Full Equalization Settlement</span>
          </button>
        )}

        {/* Historical Settlements */}
        {settlements.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-surface-container">
            <span className="font-label-sm text-[11px] text-outline uppercase font-semibold">
              Recent Settlements
            </span>
            {settlements.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="text-xs text-on-surface-variant flex justify-between py-1 border-b border-surface-container/60"
              >
                <span>{s.date} - {s.fromPartner} → {s.toPartner}</span>
                <span className="font-bold text-on-surface">₹ {s.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
