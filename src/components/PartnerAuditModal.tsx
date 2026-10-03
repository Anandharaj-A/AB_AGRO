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
    totalIncome,
    totalReceived,
    totalPending,
    totalExpenses,
    billedProfit,
    cashProfit,
    p1Name,
    p2Name,
    partner1Spent,
    partner2Spent,
    partner1Received,
    partner2Received,
    partner1SettledOut,
    partner1SettledIn,
    partner2SettledOut,
    partner2SettledIn,
    netAnand,
    netBoopathi,
    totalNet,
    fairShareAnand,
    anandOwes,
    settlementDirective,
    settlePartnerAccount,
    deleteSettlement,
    settlements,
    businessSettings,
    billedShare1,
    billedShare2,
    cashShare1,
    cashShare2,
    pendingShare1,
    pendingShare2,
    partner1AdvanceDeducted,
    partner2AdvanceDeducted,
    partner1RemainingShare,
    partner2RemainingShare,
  } = useHarvester();

  const [settledSuccess, setSettledSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSettle = async () => {
    if (settlementDirective.amount <= 0) return;
    await settlePartnerAccount(
      settlementDirective.from,
      settlementDirective.to,
      settlementDirective.amount,
      `Equalization: ${settlementDirective.from} paid ${settlementDirective.to} ₹${settlementDirective.amount.toLocaleString('en-IN')}`
    );
    setSettledSuccess(true);
    setTimeout(() => {
      setSettledSuccess(false);
    }, 2500);
  };

  const handleDeleteSettlement = async (id: string) => {
    if (confirm('Delete this settlement record? The balances will update immediately.')) {
      setDeletingId(id);
      try {
        await deleteSettlement(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-3 sm:p-4">
      <div className="bg-surface-container-lowest rounded-2xl p-5 w-full max-w-xl mx-auto shadow-2xl flex flex-col gap-4 border border-outline-variant/30 max-h-[92vh] overflow-y-auto animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary-fixed/70 flex items-center justify-center text-on-primary-fixed">
              <span className="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Partner Ledger &amp; Settlement
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {p1Name} &amp; {p2Name} ({businessSettings.profitSharePartner1}% - {businessSettings.profitSharePartner2}%)
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

        {/* 1. Two Views of Profit (Billed vs Cash) */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wider text-[11px]">
            Profit Summary (Two Perspectives)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Billed Profit */}
            <div className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-[11px] text-outline uppercase font-bold">
                  Billed Profit
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container-highest font-bold text-on-surface-variant">
                  On Paper
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                ₹ {billedProfit.toLocaleString('en-IN')}
              </span>
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-1 leading-tight">
                ₹{totalIncome.toLocaleString('en-IN')} billed − ₹{totalExpenses.toLocaleString('en-IN')} expenses
              </p>
            </div>

            {/* Cash Profit */}
            <div className="bg-secondary-container/30 p-3.5 rounded-xl flex flex-col justify-between border border-secondary/20">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-[11px] text-secondary uppercase font-bold">
                  Cash Profit
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary font-bold">
                  In Hand
                </span>
              </div>
              <span className="font-headline-sm text-headline-sm text-secondary font-extrabold">
                {cashProfit < 0 ? '−' : ''}₹ {Math.abs(cashProfit).toLocaleString('en-IN')}
              </span>
              <p className="font-body-sm text-[11px] text-on-surface-variant mt-1 leading-tight">
                ₹{totalReceived.toLocaleString('en-IN')} collected − ₹{totalExpenses.toLocaleString('en-IN')} expenses (₹{totalPending.toLocaleString('en-IN')} pending)
              </p>
            </div>
          </div>
        </div>

        {/* 2. Who Received and Who Spent (The Correct Partner Ledger) */}
        <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Who Received &amp; Who Spent
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Live Cash Position
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Partner 1 (Anand) */}
            <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col gap-1.5 border border-outline-variant/30">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="font-label-md font-bold text-on-surface">
                  {p1Name}
                </span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant pt-1 border-t border-surface-container">
                <span>Received from farmers:</span>
                <span className="font-bold text-on-surface">₹ {partner1Received.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant">
                <span>Spent from pocket:</span>
                <span className="font-bold text-on-surface">₹ {partner1Spent.toLocaleString('en-IN')}</span>
              </div>
              {(partner1SettledOut > 0 || partner1SettledIn > 0) && (
                <div className="text-[11px] flex justify-between text-on-surface-variant">
                  <span>Settlements:</span>
                  <span className="font-semibold text-on-surface">
                    {partner1SettledIn > 0 ? `+₹${partner1SettledIn.toLocaleString('en-IN')} ` : ''}
                    {partner1SettledOut > 0 ? `−₹${partner1SettledOut.toLocaleString('en-IN')}` : ''}
                  </span>
                </div>
              )}
              <div className="text-xs flex justify-between pt-1.5 border-t border-surface-container-high font-bold">
                <span className="text-on-surface-variant">Net Cash Position:</span>
                <span className={netAnand >= 0 ? 'text-secondary' : 'text-error'}>
                  {netAnand >= 0 ? '+' : '−'}₹ {Math.abs(netAnand).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Partner 2 (Boopathi) */}
            <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col gap-1.5 border border-outline-variant/30">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                <span className="font-label-md font-bold text-on-surface">
                  {p2Name}
                </span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant pt-1 border-t border-surface-container">
                <span>Received from farmers:</span>
                <span className="font-bold text-on-surface">₹ {partner2Received.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant">
                <span>Spent from pocket:</span>
                <span className="font-bold text-on-surface">₹ {partner2Spent.toLocaleString('en-IN')}</span>
              </div>
              {(partner2SettledOut > 0 || partner2SettledIn > 0) && (
                <div className="text-[11px] flex justify-between text-on-surface-variant">
                  <span>Settlements:</span>
                  <span className="font-semibold text-on-surface">
                    {partner2SettledIn > 0 ? `+₹${partner2SettledIn.toLocaleString('en-IN')} ` : ''}
                    {partner2SettledOut > 0 ? `−₹${partner2SettledOut.toLocaleString('en-IN')}` : ''}
                  </span>
                </div>
              )}
              <div className="text-xs flex justify-between pt-1.5 border-t border-surface-container-high font-bold">
                <span className="text-on-surface-variant">Net Cash Position:</span>
                <span className={netBoopathi >= 0 ? 'text-secondary' : 'text-error'}>
                  {netBoopathi >= 0 ? '+' : '−'}₹ {Math.abs(netBoopathi).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-surface-container-high">
            <span>Total Combined Cash: <strong>{totalNet < 0 ? '−' : ''}₹{Math.abs(totalNet).toLocaleString('en-IN')}</strong></span>
            <span>Fair Share (50%): <strong>{fairShareAnand < 0 ? '−' : ''}₹{Math.abs(Math.round(fairShareAnand)).toLocaleString('en-IN')}</strong> each</span>
          </div>
        </div>

        {/* 3. Settlement Directive Box */}
        <div className="bg-tertiary-fixed/30 border border-tertiary/30 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-tertiary uppercase font-bold tracking-wider">
              Settlement Status
            </span>
            {settlementDirective.isSettled ? (
              <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                Settled
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary text-[11px] font-bold">
                Action Required
              </span>
            )}
          </div>

          {!settlementDirective.isSettled ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="font-headline-lg text-2xl font-extrabold text-on-tertiary-fixed">
                  {settlementDirective.text}
                </span>
              </div>
              <p className="font-body-md text-xs text-on-tertiary-fixed-variant leading-relaxed">
                Money a partner receives goes directly into his pocket. Accounting for cash received, outlays, and previous settlements, a transfer of <strong>₹{settlementDirective.amount.toLocaleString('en-IN')}</strong> completely equalizes partner accounts.
              </p>

              {settledSuccess ? (
                <div className="bg-secondary-container text-on-secondary-container p-2.5 rounded-xl text-center text-xs font-bold mt-1">
                  ✓ Settlement recorded! Balances equalized to 0.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSettle}
                  className="mt-1 w-full h-11 rounded-full bg-secondary text-on-secondary font-label-lg font-bold text-xs shadow-md hover:bg-secondary/90 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  <span>Record Transfer: {settlementDirective.text}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-secondary font-bold text-sm py-1">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Settled — Both partner cash positions and expenses are completely equalized (₹0 balance)!</span>
            </div>
          )}
        </div>

        {/* 4. Profit Share & Partner Distribution */}
        <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider">
              Profit Share Realization ({businessSettings.profitSharePartner1}% - {businessSettings.profitSharePartner2}%)
            </span>
            <span className="text-[11px] text-outline font-semibold">
              Net Profit: ₹{cashProfit.toLocaleString('en-IN')}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant leading-tight">
            Fair distribution of cash profit (₹{cashProfit.toLocaleString('en-IN')}) after reimbursing all pocket machine expenses:
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Anand Share */}
            <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col gap-1.5 border border-outline-variant/30 text-xs">
              <span className="font-bold text-on-surface">{p1Name} ({businessSettings.profitSharePartner1}%)</span>
              <div className="flex justify-between text-on-surface-variant">
                <span>Profit Entitlement:</span>
                <span className="font-bold text-on-surface">₹ {cashShare1.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Net Cash In Hand:</span>
                <span className="font-bold text-secondary">₹ {netAnand.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-surface-container font-bold text-on-surface">
                <span>Remaining:</span>
                <span className={partner1RemainingShare > 0 ? 'text-tertiary' : 'text-secondary'}>
                  {partner1RemainingShare > 0 ? `₹ ${partner1RemainingShare.toLocaleString('en-IN')} due` : '✓ Fully Realized'}
                </span>
              </div>
            </div>

            {/* Boopathi Share */}
            <div className="bg-surface-container-lowest p-3 rounded-xl flex flex-col gap-1.5 border border-outline-variant/30 text-xs">
              <span className="font-bold text-on-surface">{p2Name} ({businessSettings.profitSharePartner2}%)</span>
              <div className="flex justify-between text-on-surface-variant">
                <span>Profit Entitlement:</span>
                <span className="font-bold text-on-surface">₹ {cashShare2.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Net Cash In Hand:</span>
                <span className="font-bold text-secondary">₹ {netBoopathi.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-surface-container font-bold text-on-surface">
                <span>Remaining:</span>
                <span className={partner2RemainingShare > 0 ? 'text-tertiary' : 'text-secondary'}>
                  {partner2RemainingShare > 0 ? `₹ ${partner2RemainingShare.toLocaleString('en-IN')} due` : '✓ Fully Realized'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-on-surface-variant bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/20 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">info</span>
            <span>
              {settlementDirective.isSettled
                ? `Both partners hold their exact ${businessSettings.profitSharePartner1}/${businessSettings.profitSharePartner2} share of cash profit (₹${cashShare1.toLocaleString('en-IN')} each). ${totalPending > 0 ? `Remaining ₹${totalPending.toLocaleString('en-IN')} will be distributed as pending dues are collected.` : 'All accounts are 100% equalized!'}`
                : `To equalize partner profits to ₹${cashShare1.toLocaleString('en-IN')} each, ${settlementDirective.text}.`}
            </span>
          </div>
        </div>

        {/* 5. Historical Settlements with Delete capability */}
        <div className="flex flex-col gap-2 pt-1 border-t border-surface-container">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-[11px] text-outline uppercase font-semibold">
              Settlement History ({settlements.length})
            </span>
            <span className="text-[11px] text-on-surface-variant">
              Affects balance directly
            </span>
          </div>

          {settlements.length === 0 ? (
            <div className="text-xs text-outline py-2 text-center bg-surface-container-low rounded-xl">
              No settlements recorded yet.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  className="text-xs bg-surface-container-low px-3 py-2 rounded-xl flex items-center justify-between border border-outline-variant/20"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-on-surface truncate">
                      {s.date} • {s.fromPartner} → {s.toPartner}
                    </span>
                    {s.notes && (
                      <span className="text-[11px] text-on-surface-variant truncate">
                        {s.notes}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-currency-card text-currency-card font-extrabold text-on-surface">
                      ₹ {s.amount.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      disabled={deletingId === s.id}
                      onClick={() => handleDeleteSettlement(s.id)}
                      className="w-7 h-7 rounded-full bg-error-container/40 text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors cursor-pointer"
                      title="Delete settlement record"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {deletingId === s.id ? 'hourglass_top' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
