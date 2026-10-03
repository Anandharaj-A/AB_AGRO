import React, { useState, useEffect } from 'react';
import { WorkEntry, PartnerId, PaymentMode } from '../types';
import { useHarvester } from '../context/HarvesterContext';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workEntry: WorkEntry | null;
  onSuccess: (farmerName: string, amount: number) => void;
  onShareWhatsApp?: (entry: WorkEntry) => void;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  isOpen,
  onClose,
  workEntry,
  onSuccess,
  onShareWhatsApp,
}) => {
  const {
    recordPayment,
    activePartnerView,
    businessSettings,
    isPartner1,
    isPartner2,
    p1Name,
    p2Name,
  } = useHarvester();
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [collector, setCollector] = useState<PartnerId>(activePartnerView || p1Name);
  const [payMode, setPayMode] = useState<PaymentMode>('cash');

  useEffect(() => {
    if (workEntry) {
      setPayAmount(workEntry.balanceAmount > 0 ? workEntry.balanceAmount : '');
      setCollector(activePartnerView || p1Name);
      setPayMode('cash');
    }
  }, [workEntry, activePartnerView, p1Name]);

  if (!isOpen || !workEntry) return null;

  const handleSave = () => {
    const amount = Number(payAmount) || 0;
    if (amount <= 0) return;
    const canonicalCollector = isPartner2(collector) ? p2Name : p1Name;
    recordPayment(workEntry.id, amount, canonicalCollector, payMode);
    onSuccess(workEntry.farmerName, amount);
    onClose();

    // Option to prompt WhatsApp share
    if (onShareWhatsApp) {
      setTimeout(() => {
        onShareWhatsApp({
          ...workEntry,
          receivedAmount: workEntry.receivedAmount + amount,
          balanceAmount: Math.max(0, workEntry.balanceAmount - amount),
          status:
            workEntry.balanceAmount - amount <= 0 ? 'paid' : 'partly_paid',
        });
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end transition-opacity duration-200">
      <div className="w-full bg-surface-container-lowest rounded-t-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl max-w-lg mx-auto border-t border-outline-variant/30 animate-in fade-in slide-in-from-bottom duration-200">
        {/* Drag Handle & Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-outline-variant"></div>
          <div className="w-full flex items-center justify-between">
            <div>
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider block">
                Quick Ledger Receipt
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface">
                {workEntry.farmerName} ({workEntry.village})
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:bg-surface-container-highest cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>
        </div>

        {/* Amount Due Callout */}
        <div className="bg-surface-container-high rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <span className="font-body-md text-body-md text-on-surface-variant font-medium">
            Pending Balance:
          </span>
          <span className="font-currency-card text-currency-card text-tertiary font-extrabold">
            ₹ {workEntry.balanceAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Payment Entry Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="custom-pay-input"
              className="font-label-sm text-label-sm font-bold text-on-surface uppercase"
            >
              Cash Received Now (₹)
            </label>
            <button
              type="button"
              onClick={() => setPayAmount(workEntry.balanceAmount)}
              className="text-xs text-primary font-bold hover:underline"
            >
              Collect Full Balance
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center font-headline-md text-on-surface font-extrabold">
              ₹
            </span>
            <input
              id="custom-pay-input"
              type="text"
              inputMode="numeric"
              value={formatInputDisplay(payAmount)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setPayAmount(cleanNumberInput(e.target.value))}
              placeholder="0"
              className="w-full h-14 pl-10 pr-4 rounded-xl bg-surface-container font-currency-card text-currency-card text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/40 shadow-sm"
            />
          </div>
        </div>

        {/* Collector Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase">
            Who collected this money?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCollector(p1Name)}
              className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer font-label-md text-label-md font-bold shadow-xs transition-all text-left ${
                isPartner1(collector)
                  ? 'bg-secondary-container/50 border-2 border-secondary text-on-secondary-container'
                  : 'bg-surface-container text-on-surface border-2 border-transparent'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                  isPartner1(collector) ? 'bg-secondary' : 'bg-surface-container-highest'
                }`}
              >
                {isPartner1(collector) && (
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                )}
              </div>
              <span>{p1Name}</span>
            </button>

            <button
              type="button"
              onClick={() => setCollector(p2Name)}
              className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer font-label-md text-label-md font-bold shadow-xs transition-all text-left ${
                isPartner2(collector)
                  ? 'bg-secondary-container/50 border-2 border-secondary text-on-secondary-container'
                  : 'bg-surface-container text-on-surface border-2 border-transparent'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${
                  isPartner2(collector)
                    ? 'bg-secondary'
                    : 'bg-surface-container-highest'
                }`}
              >
                {isPartner2(collector) && (
                  <span className="material-symbols-outlined text-[14px]">
                    check
                  </span>
                )}
              </div>
              <span>{p2Name}</span>
            </button>
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="font-label-sm text-label-sm font-bold text-on-surface uppercase">
            Payment Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPayMode('cash')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                payMode === 'cash'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Cash In Hand
            </button>
            <button
              type="button"
              onClick={() => setPayMode('upi')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                payMode === 'upi'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              GPay / UPI
            </button>
            <button
              type="button"
              onClick={() => setPayMode('bank')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                payMode === 'bank'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Bank Transfer
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-14 rounded-full bg-secondary text-on-secondary font-label-lg text-label-lg font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
            <span>
              Save Cash Entry (₹ {Number(payAmount).toLocaleString('en-IN')})
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 text-outline font-label-md text-label-md hover:text-on-surface cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
