import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { HARVESTER_BANNER_IMG } from '../mockData';
import { PartnerAuditModal } from './PartnerAuditModal';
import { VoiceEntryModal } from './VoiceEntryModal';
import { PaymentDrawer } from './PaymentDrawer';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { DatePeriodModal } from './DatePeriodModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { formatDisplayDate, parseISODate } from '../utils/dateUtils';
import { WorkEntry } from '../types';

export const HomeDashboard: React.FC = () => {
  const {
    totalIncome,
    totalReceived,
    totalExpenses,
    billedProfit,
    cashProfit,
    netProfit,
    profitViewMode,
    setProfitViewMode,
    netProfitPartner1,
    netProfitPartner2,
    totalPending,
    pendingCount,
    totalWorkCount,
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
    workEntries,
    setCurrentScreen,
    selectedDate,
    selectedMonth,
    dateFilterMode,
    setDateFilterMode,
    stepDate,
    filteredWorkEntries,
    businessSettings,
    deleteWorkEntry,
  } = useHarvester();

  const { canEdit, canDelete } = useAuth();

  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [selectedWorkForPay, setSelectedWorkForPay] = useState<WorkEntry | null>(null);
  const [selectedWorkForShare, setSelectedWorkForShare] = useState<WorkEntry | null>(null);
  const [workToDelete, setWorkToDelete] = useState<WorkEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Recent entries for active period or overall
  const displayWorks = filteredWorkEntries.length > 0 ? filteredWorkEntries : workEntries;
  const recentWorks = displayWorks.slice(0, 3);

  const currentPeriodTitle =
    dateFilterMode === 'all'
      ? 'All Season Records'
      : dateFilterMode === 'day'
      ? formatDisplayDate(parseISODate(selectedDate))
      : selectedMonth;

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Seasonal Context & Ambient Status Bar */}
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-2 rounded-full shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0 animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold truncate">
            Live Season: {businessSettings.businessName}
          </span>
        </div>
        <span className="font-label-sm text-label-sm text-secondary font-bold shrink-0">
          {workEntries.length} Jobs Logged
        </span>
      </div>

      {/* Date & Period Navigation Control */}
      <section className="bg-surface-container-lowest rounded-2xl p-3 shadow-xs flex items-center justify-between gap-2 border border-outline-variant/30">
        <button
          type="button"
          aria-label="Previous Period"
          onClick={() => stepDate(-1)}
          className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          title="Previous Month or Day"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_left</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDateModalOpen(true)}
          className="flex-1 flex flex-col items-center text-center min-w-0 px-2 py-1 rounded-xl hover:bg-surface-container-low active:scale-98 transition-all cursor-pointer group"
          title="Click to change date, month, or year"
        >
          <div className="flex items-center gap-1.5 max-w-full">
            <span className="material-symbols-outlined text-primary text-[20px] group-hover:scale-110 transition-transform">
              calendar_month
            </span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate font-bold group-hover:text-primary transition-colors">
              {currentPeriodTitle}
            </h2>
            <span className="material-symbols-outlined text-outline text-[16px] group-hover:text-primary">
              arrow_drop_down
            </span>
          </div>
          <span className="font-label-sm text-[11px] text-primary font-bold uppercase tracking-wider mt-0.5">
            {dateFilterMode === 'all' ? 'All Time (No Filter)' : 'Tap to change date or year ▾'}
          </span>
        </button>

        <button
          type="button"
          aria-label="Next Period"
          onClick={() => stepDate(1)}
          className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-high active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          title="Next Month or Day"
        >
          <span className="material-symbols-outlined text-[24px]">chevron_right</span>
        </button>
      </section>

      {/* Filter info banner when 0 jobs are found in active period */}
      {dateFilterMode !== 'all' && filteredWorkEntries.length === 0 && workEntries.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-on-surface min-w-0">
            <span className="material-symbols-outlined text-amber-600 text-[18px] shrink-0">info</span>
            <span className="truncate">No jobs logged for {currentPeriodTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => setDateFilterMode('all')}
            className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] hover:bg-amber-700 cursor-pointer shrink-0 shadow-xs"
          >
            Show All ({workEntries.length})
          </button>
        </div>
      )}

      {/* Big Field Touch Action Row */}
      {canEdit && (
        <section className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCurrentScreen('add-work')}
            className="h-14 rounded-full bg-secondary text-on-secondary px-4 flex items-center justify-center gap-2 shadow-md active:translate-y-0.5 active:shadow-xs transition-all text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[26px]">add_circle</span>
            <span className="font-label-lg text-label-lg font-bold">Add Work</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentScreen('add-expense')}
            className="h-14 rounded-full bg-primary-container text-on-primary-container px-4 flex items-center justify-center gap-2 shadow-md active:translate-y-0.5 active:shadow-xs transition-all text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-[26px]">receipt_long</span>
            <span className="font-label-lg text-label-lg font-bold">Add Expense</span>
          </button>
        </section>
      )}

      {/* View Toggle (Cash Profit in hand vs Billed Paper Profit) */}
      <section className="bg-surface-container-lowest p-1.5 rounded-2xl border border-outline-variant/30 flex items-center gap-1 shadow-xs">
        <button
          type="button"
          onClick={() => setProfitViewMode('cash')}
          className={`flex-1 py-2 px-3 rounded-xl font-label-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            profitViewMode === 'cash'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
          <span>Cash Profit (In Hand)</span>
        </button>
        <button
          type="button"
          onClick={() => setProfitViewMode('billed')}
          className={`flex-1 py-2 px-3 rounded-xl font-label-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            profitViewMode === 'billed'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">description</span>
          <span>Billed Profit (On Paper)</span>
        </button>
      </section>

      {/* 4 Big Metric Cards (2x2 Grid) */}
      <section className="grid grid-cols-2 gap-3">
        {/* Total Income */}
        <div
          onClick={() => setCurrentScreen('work-list')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[148px] relative overflow-hidden border border-outline-variant/30 cursor-pointer hover:border-secondary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
              Total Billed
            </span>
            <div className="w-8 h-8 rounded-full bg-secondary-container/50 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="my-1">
            <p className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold">
              ₹ {totalIncome.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 bg-secondary-container/40 px-2 py-0.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-secondary text-[14px]">check_circle</span>
            <span className="font-label-sm text-[11px] text-on-secondary-container font-bold">
              ₹ {totalReceived.toLocaleString('en-IN')} Collected
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div
          onClick={() => setCurrentScreen('expense-list')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[148px] border border-outline-variant/30 cursor-pointer hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
              Expenses
            </span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed/40 flex items-center justify-center text-on-primary-fixed-variant">
              <span className="material-symbols-outlined text-[18px]">local_gas_station</span>
            </div>
          </div>
          <div className="my-1">
            <p className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-extrabold">
              ₹ {totalExpenses.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="font-body-sm text-[12px] truncate font-medium">
              Fuel, Spares, Driver
            </span>
          </div>
        </div>

        {/* Net Profit (Cash vs Billed view) */}
        <div
          onClick={() => setIsAuditOpen(true)}
          className="bg-secondary-container/30 rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[148px] border border-secondary/20 cursor-pointer hover:bg-secondary-container/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-[11px]">
              {profitViewMode === 'cash' ? 'Cash Profit' : 'Billed Profit'}
            </span>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-xs">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
          </div>
          <div className="my-1">
            <p className="font-headline-lg text-headline-lg text-secondary tracking-tight font-extrabold">
              {netProfit < 0 ? '−' : ''}₹ {Math.abs(netProfit).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 text-secondary">
            <span className="font-label-sm text-[11px] font-bold">
              {profitViewMode === 'cash' ? 'Real Cash in Hand' : 'Paper Profit'} • Tap for Audit
            </span>
          </div>
        </div>

        {/* Pending to Collect */}
        <div
          onClick={() => setCurrentScreen('work-list')}
          className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[148px] border border-outline-variant/30 cursor-pointer hover:border-tertiary/40 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase tracking-wider text-[11px]">
              Pending
            </span>
            <div className="w-8 h-8 rounded-full bg-tertiary-container/50 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <div className="my-1">
            <p className="font-headline-lg text-headline-lg text-tertiary tracking-tight font-extrabold">
              ₹ {totalPending.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 bg-tertiary-fixed/60 px-2 py-0.5 rounded-full w-fit">
            <span className="material-symbols-outlined text-tertiary text-[14px]">timer</span>
            <span className="font-label-sm text-[11px] text-on-tertiary-fixed-variant font-bold">
              {pendingCount} Farmers Due
            </span>
          </div>
        </div>
      </section>

      {/* Partner Settlement Ledger Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5 border border-outline-variant/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary-fixed/60 flex items-center justify-center text-on-primary-fixed">
              <span className="material-symbols-outlined text-[22px]">handshake</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Partner Split ({businessSettings.profitSharePartner1}% - {businessSettings.profitSharePartner2}%)
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                Auto-calculated from cash collected, expenses, and settlements
              </p>
            </div>
          </div>
          <span className="bg-surface-container px-2.5 py-1 rounded-full font-label-sm text-label-sm text-on-surface-variant font-bold text-[11px]">
            Live Sync
          </span>
        </div>

        {/* Who Received & Who Spent (The Correct Partner Ledger) */}
        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider text-xs">
            Who Received &amp; Who Spent
          </span>
          <div className="grid grid-cols-2 gap-3">
            {/* Partner 1 (Anand) */}
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1.5 border border-outline-variant/20">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary"></div>
                <span className="font-label-sm text-label-sm text-on-surface font-bold">
                  {p1Name}
                </span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant">
                <span>Received:</span>
                <span className="font-bold text-on-surface">₹ {partner1Received.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant">
                <span>Spent:</span>
                <span className="font-bold text-on-surface">₹ {partner1Spent.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs flex justify-between pt-1 border-t border-surface-container-high font-bold">
                <span>Net Cash:</span>
                <span className={netAnand >= 0 ? 'text-secondary' : 'text-error'}>
                  {netAnand >= 0 ? '+' : '−'}₹ {Math.abs(netAnand).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Partner 2 (Boopathi) */}
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-1.5 border border-outline-variant/20">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-container"></div>
                <span className="font-label-sm text-label-sm text-on-surface font-bold">
                  {p2Name}
                </span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant">
                <span>Received:</span>
                <span className="font-bold text-on-surface">₹ {partner2Received.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs flex justify-between text-on-surface-variant">
                <span>Spent:</span>
                <span className="font-bold text-on-surface">₹ {partner2Spent.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs flex justify-between pt-1 border-t border-surface-container-high font-bold">
                <span>Net Cash:</span>
                <span className={netBoopathi >= 0 ? 'text-secondary' : 'text-error'}>
                  {netBoopathi >= 0 ? '+' : '−'}₹ {Math.abs(netBoopathi).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Settlement Directive Alert Highlight Box */}
        <div className="bg-primary-fixed/30 rounded-xl p-4 flex flex-col gap-3 border border-primary-fixed/40">
          <div className="flex items-start gap-2.5">
            <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">
              account_balance_wallet
            </span>
            <div className="flex flex-col">
              <p className="font-headline-sm text-headline-sm text-on-primary-fixed font-bold">
                {settlementDirective.text}
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed text-xs">
                {settlementDirective.isSettled
                  ? `Both ${p1Name} and ${p2Name} cash positions and machine expenses are completely equalized (₹0 balance).`
                  : `Fair share of combined net cash (${totalNet < 0 ? '−' : ''}₹${Math.abs(totalNet).toLocaleString('en-IN')}) is ${fairShareAnand < 0 ? '−' : ''}₹${Math.abs(Math.round(fairShareAnand)).toLocaleString('en-IN')} each. A transfer of ₹${settlementDirective.amount.toLocaleString('en-IN')} equalizes the accounts.`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => setIsAuditOpen(true)}
              className="h-10 px-4 rounded-full bg-surface-container-lowest text-secondary font-label-md text-label-md font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
            >
              <span>Detailed Audit</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>

            {canEdit && !settlementDirective.isSettled && (
              <button
                type="button"
                onClick={async () => {
                  await settlePartnerAccount(
                    settlementDirective.from,
                    settlementDirective.to,
                    settlementDirective.amount
                  );
                  showToast(`Settlement Recorded: ${settlementDirective.text}`);
                }}
                className="h-10 px-4 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-xs active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Settle Up</span>
              </button>
            )}
          </div>
        </div>

        {/* Profit Share Realization (50% - 50%) */}
        <div className="bg-surface-container-low/70 rounded-xl p-3.5 flex flex-col gap-2.5 border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-xs font-bold text-on-surface uppercase tracking-wider">
              Profit Share Realization ({businessSettings.profitSharePartner1}% - {businessSettings.profitSharePartner2}%)
            </span>
            <span className="text-[11px] text-outline font-semibold">
              Net Profit: ₹{netProfit.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Partner 1 (Anand) */}
            <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20 flex flex-col gap-1">
              <span className="font-bold text-on-surface block mb-0.5">{p1Name} ({businessSettings.profitSharePartner1}%)</span>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Profit Entitlement:</span>
                <span className="font-bold text-on-surface">₹ {cashShare1.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Net Cash In Hand:</span>
                <span className="font-bold text-secondary">
                  ₹ {netAnand.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-surface-container font-bold">
                <span>Remaining:</span>
                <span className={partner1RemainingShare > 0 ? 'text-tertiary' : 'text-secondary'}>
                  {partner1RemainingShare > 0 ? `₹ ${partner1RemainingShare.toLocaleString('en-IN')} due` : '✓ Fully Realized'}
                </span>
              </div>
            </div>

            {/* Partner 2 (Boopathi) */}
            <div className="bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20 flex flex-col gap-1">
              <span className="font-bold text-on-surface block mb-0.5">{p2Name} ({businessSettings.profitSharePartner2}%)</span>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Profit Entitlement:</span>
                <span className="font-bold text-on-surface">₹ {cashShare2.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant text-[11px]">
                <span>Net Cash In Hand:</span>
                <span className="font-bold text-secondary">
                  ₹ {netBoopathi.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-surface-container font-bold">
                <span>Remaining:</span>
                <span className={partner2RemainingShare > 0 ? 'text-tertiary' : 'text-secondary'}>
                  {partner2RemainingShare > 0 ? `₹ ${partner2RemainingShare.toLocaleString('en-IN')} due` : '✓ Fully Realized'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-on-surface-variant leading-tight">
            {settlementDirective.isSettled
              ? `Both partners hold their exact ${businessSettings.profitSharePartner1}/${businessSettings.profitSharePartner2} share of cash profit (₹${cashShare1.toLocaleString('en-IN')} each). ${totalPending > 0 ? `Remaining ₹${totalPending.toLocaleString('en-IN')} will be distributed as pending dues are collected.` : 'All accounts are 100% equalized!'}`
              : `To equalize partner profits to ₹${cashShare1.toLocaleString('en-IN')} each, ${settlementDirective.text}.`}
          </p>
        </div>
      </section>

      {/* Machine Field Photo & Quick Stats Strip */}
      <section className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col gap-3 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Harvester Status
          </h3>
          <span className="font-label-sm text-label-sm text-secondary font-bold">
            {businessSettings.harvesterModel}
          </span>
        </div>

        <div className="relative w-full h-36 rounded-xl overflow-hidden shadow-inner group">
          <img
            src={HARVESTER_BANNER_IMG}
            alt="Combine harvester in field"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
            <div className="flex items-center justify-between w-full text-white">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary-fixed">
                  speed
                </span>
                <span className="font-label-sm text-label-sm font-bold text-white">
                  Reg: {businessSettings.registrationNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentScreen('machine-care')}
                className="bg-surface-container-lowest/80 text-on-surface px-2.5 py-1 rounded-full text-xs font-bold hover:bg-white transition-colors"
              >
                Machine Care &gt;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Field Work Activity */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
            Recent Harvest Work
          </h3>
          <button
            type="button"
            onClick={() => setCurrentScreen('work-list')}
            className="font-label-md text-label-md text-secondary font-bold flex items-center gap-0.5 cursor-pointer hover:underline"
          >
            <span>View All ({workEntries.length})</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {recentWorks.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-xs text-outline border border-outline-variant/30">
            No work entries recorded yet. Tap <strong>+ Add Work</strong> above to log your first field cutting.
          </div>
        ) : (
          recentWorks.map((work) => {
            const isPaid = work.status === 'paid';
            const isPartly = work.status === 'partly_paid';

            return (
              <div
                key={work.id}
                onClick={() => {
                  if (!isPaid) {
                    setSelectedWorkForPay(work);
                  } else {
                    setSelectedWorkForShare(work);
                  }
                }}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs flex flex-col gap-2 border border-outline-variant/30 active:bg-surface-container-low transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                        {work.farmerName}
                      </h4>
                      {work.verified && (
                        <span className="material-symbols-outlined text-secondary text-[16px]">
                          verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="font-label-sm text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container">
                        {work.cropVariety || work.crop}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">•</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                        {work.village}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-currency-card text-currency-card font-extrabold ${
                        work.status === 'pending' ? 'text-tertiary' : 'text-on-surface'
                      }`}
                    >
                      ₹ {work.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <p className="font-body-sm text-[11px] text-on-surface-variant">
                      {work.quantity} {work.unit === 'acres' ? 'Acres' : 'Hours'} @ ₹{' '}
                      {work.rate.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t-0 bg-surface-container-low/50 -mx-4 -mb-4 px-4 py-2 mt-1 rounded-b-2xl">
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-[12px]">
                    {work.date} • {work.receivedBy ? `${work.receivedBy} received` : 'Logged'}
                  </span>

                  {isPaid ? (
                    <span className="bg-secondary-container text-on-secondary-container font-label-sm text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      Paid Cash
                    </span>
                  ) : isPartly ? (
                    <span className="bg-primary-container/30 text-on-primary-container font-label-sm text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                      Partly Paid (₹ {work.receivedAmount} recd)
                    </span>
                  ) : (
                    <span className="bg-tertiary-fixed/60 text-on-tertiary-fixed-variant font-label-sm text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Full Pending
                    </span>
                  )}
                </div>

                {/* Audit Stamp & Action Buttons */}
                <div className="flex items-center justify-between text-[10px] text-outline pt-1">
                  <span>
                    Added by {work.addedByName || 'Partner'}
                    {work.lastEditedByName && work.lastEditedByName !== work.addedByName && ` • Edited by ${work.lastEditedByName}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkToDelete(work);
                        }}
                        className="text-error font-bold hover:underline cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Vernacular Audio Ledger Helper Card */}
      <section className="bg-surface-container rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs border border-outline-variant/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </div>
          <div className="min-w-0">
            <p className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
              Voice Entry (ಕನ್ನಡ / தமிழ்)
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
              Speak field records hands-free under the sun
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsVoiceOpen(true)}
          className="h-10 px-4 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          Record
        </button>
      </section>

      {/* Modals */}
      <PartnerAuditModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
      />

      <VoiceEntryModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyParsedWork={(parsed) => {
          setCurrentScreen('add-work');
          showToast(`Extracted ${parsed.farmerName}'s harvest details!`);
        }}
      />

      <PaymentDrawer
        isOpen={selectedWorkForPay !== null}
        onClose={() => setSelectedWorkForPay(null)}
        workEntry={selectedWorkForPay}
        onSuccess={(name, amt) => {
          showToast(`₹ ${amt.toLocaleString('en-IN')} received from ${name}`);
        }}
        onShareWhatsApp={(entry) => setSelectedWorkForShare(entry)}
      />

      <WhatsAppShareModal
        isOpen={selectedWorkForShare !== null}
        onClose={() => setSelectedWorkForShare(null)}
        workEntry={selectedWorkForShare}
      />

      <DatePeriodModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
      />

      <ConfirmDeleteModal
        isOpen={workToDelete !== null}
        onClose={() => setWorkToDelete(null)}
        onConfirm={async () => {
          if (workToDelete) {
            const target = workToDelete;
            await deleteWorkEntry(target.id);
            showToast(`Deleted work entry for ${target.farmerName}`);
            setWorkToDelete(null);
          }
        }}
        title="Delete Work Entry"
        itemName={workToDelete?.farmerName}
        message="Are you sure you want to permanently delete this field harvesting record from the ledger?"
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full font-label-md text-label-md shadow-xl flex items-center gap-2 animate-in fade-in zoom-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
