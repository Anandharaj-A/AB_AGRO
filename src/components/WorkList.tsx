import React, { useState, useMemo } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { WorkEntry } from '../types';
import { PaymentDrawer } from './PaymentDrawer';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { VoiceEntryModal } from './VoiceEntryModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const WorkList: React.FC = () => {
  const { workEntries, setCurrentScreen, deleteWorkEntry, updateWorkEntry } = useHarvester();
  const { canEdit, canDelete } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'settled'>('all');
  const [selectedWorkForPay, setSelectedWorkForPay] = useState<WorkEntry | null>(null);
  const [selectedWorkForShare, setSelectedWorkForShare] = useState<WorkEntry | null>(null);
  const [editingWork, setEditingWork] = useState<WorkEntry | null>(null);
  const [workToDelete, setWorkToDelete] = useState<WorkEntry | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const counts = useMemo(() => {
    const pending = workEntries.filter((w) => (w.balanceAmount || 0) > 0).length;
    const settled = workEntries.filter((w) => (w.balanceAmount || 0) === 0).length;
    const pendingSum = workEntries.reduce(
      (sum, w) => sum + ((w.balanceAmount || 0) > 0 ? Number(w.balanceAmount) || 0 : 0),
      0
    );

    return {
      all: workEntries.length,
      pending,
      settled,
      pendingSum,
    };
  }, [workEntries]);

  const filteredWorks = useMemo(() => {
    return workEntries.filter((entry) => {
      const matchesSearch =
        (entry.farmerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.village || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.cropVariety && entry.cropVariety.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeFilter === 'pending') return (entry.balanceAmount || 0) > 0;
      if (activeFilter === 'settled') return (entry.balanceAmount || 0) === 0;
      return true;
    });
  }, [workEntries, searchQuery, activeFilter]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork) return;

    const numQty = Number(editingWork.quantity) || 0;
    const numRate = Number(editingWork.rate) || 0;
    const numRecv = Number(editingWork.receivedAmount) || 0;
    const total = Math.round(numQty * numRate);
    const balance = Math.max(0, total - numRecv);
    const status = balance === 0 ? 'paid' : numRecv > 0 ? 'partly_paid' : 'pending';

    await updateWorkEntry(editingWork.id, {
      ...editingWork,
      quantity: numQty,
      rate: numRate,
      receivedAmount: numRecv,
      totalAmount: total,
      balanceAmount: balance,
      status,
    });

    setEditingWork(null);
    showToast(`Updated entry for ${editingWork.farmerName}`);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Search & Filter Area */}
      <section className="flex flex-col gap-3 pt-1">
        {/* Search Bar */}
        <div className="relative w-full shadow-xs rounded-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </div>
          <input
            id="farmer-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search farmer name or village..."
            className="w-full h-14 pl-12 pr-12 bg-surface-container-lowest rounded-2xl font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/30 shadow-[0_2px_4px_rgba(43,40,35,0.06)] border border-outline-variant/30"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              aria-label="Voice search"
              onClick={() => setIsVoiceOpen(true)}
              className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Chips Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`filter-chip shrink-0 px-4 py-2.5 rounded-full font-label-md text-label-md shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40'
            }`}
          >
            <span>All Works</span>
            <span className="bg-surface-container-high px-2 py-0.5 rounded-full font-label-sm text-[11px] text-on-surface font-bold">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`filter-chip shrink-0 px-4 py-2.5 rounded-full font-label-md text-label-md shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer ${
              activeFilter === 'pending'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-on-primary-container animate-pulse"></span>
            <span>Pending Only</span>
            <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-label-sm text-[11px] font-bold">
              {counts.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('settled')}
            className={`filter-chip shrink-0 px-4 py-2.5 rounded-full font-label-md text-label-md shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === 'settled'
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40'
            }`}
          >
            <span>Fully Settled</span>
            <span className="text-outline text-label-sm font-medium">{counts.settled}</span>
          </button>
        </div>

        {/* Ledger Total Tally Strip */}
        <div className="bg-surface-container-high rounded-xl p-3.5 flex items-center justify-between shadow-xs border border-outline-variant/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-tertiary text-[18px]">account_balance_wallet</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold text-[11px]">
                {counts.pending} Unsettled Bills
              </span>
              <span className="font-body-sm text-body-sm text-on-surface truncate">
                Balance to collect from fields
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <div className="font-currency-card text-currency-card text-tertiary font-extrabold leading-none">
              ₹ {counts.pendingSum.toLocaleString('en-IN')}
            </div>
            <span className="font-label-sm text-[10px] text-outline uppercase font-semibold">
              Live Cloud Ledger
            </span>
          </div>
        </div>
      </section>

      {/* Work Cards Stream */}
      <section className="flex flex-col gap-3" id="work-card-list">
        {filteredWorks.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-xs text-outline border border-outline-variant/30">
            No work entries matching this filter. Tap <strong>+ Add Work</strong> below to create a record.
          </div>
        ) : (
          filteredWorks.map((work) => {
            const isPaid = (work.balanceAmount || 0) === 0;
            const isPartly = (work.balanceAmount || 0) > 0 && (work.receivedAmount || 0) > 0;
            const isPending = (work.balanceAmount || 0) > 0 && (work.receivedAmount || 0) === 0;

            const stripColor = isPaid
              ? 'bg-secondary'
              : isPartly
              ? 'bg-primary-container'
              : 'bg-tertiary';

            return (
              <div
                key={work.id}
                className="ledger-card bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3 relative overflow-hidden transition-all duration-200 border border-outline-variant/30 hover:border-secondary/40"
              >
                {/* Colored Accent Strip */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${stripColor}`}></div>

                {/* Top Row: Name, Location, Status Tag */}
                <div className="flex items-start justify-between gap-2 pl-1">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                        {work.farmerName}
                      </h3>
                      {work.verified && (
                        <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                          verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md mt-1 flex-wrap">
                      {work.serviceType && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary-container/70 text-on-secondary-container text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">
                            {work.serviceType.toLowerCase().includes('drone')
                              ? 'flight'
                              : work.serviceType.toLowerCase().includes('plough')
                              ? 'precision_manufacturing'
                              : 'agriculture'}
                          </span>
                          <span>{work.serviceType}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 text-on-surface font-medium text-xs">
                        <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
                        <span className="truncate">{work.village}</span>
                      </span>
                      <span className="text-outline-variant">•</span>
                      <span className="text-outline text-[11px]">{work.date}</span>
                      {work.driverName && (
                        <>
                          <span className="text-outline-variant">•</span>
                          <span className="text-secondary font-bold text-[11px] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">engineering</span>
                            <span>{work.driverName}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isPartly && (
                    <div className="shrink-0 bg-primary-fixed/80 px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-on-primary-container"></span>
                      <span className="font-label-sm text-[11px] text-on-primary-container font-extrabold tracking-wide uppercase">
                        Partly Paid
                      </span>
                    </div>
                  )}
                  {isPending && (
                    <div className="shrink-0 bg-tertiary-fixed px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      <span className="font-label-sm text-[11px] text-on-tertiary-fixed-variant font-extrabold tracking-wide uppercase">
                        Full Due
                      </span>
                    </div>
                  )}
                  {isPaid && (
                    <div className="shrink-0 bg-secondary-container px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                      <span className="material-symbols-outlined text-[14px] text-secondary font-bold">
                        check_circle
                      </span>
                      <span className="font-label-sm text-[11px] text-on-secondary-container font-extrabold tracking-wide uppercase">
                        Fully Settled
                      </span>
                    </div>
                  )}
                </div>

                {/* Center Ledger Details Box */}
                <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-secondary">grass</span>
                      <span className="font-body-md font-semibold text-on-surface">
                        {work.cropVariety || work.crop}
                      </span>
                    </div>
                    <div className="font-body-md font-medium text-on-surface">
                      {work.quantity} {work.unit === 'acres' ? 'Acres' : 'Hours'}{' '}
                      <span className="text-outline text-body-sm font-normal">
                        @ ₹{work.rate.toLocaleString('en-IN')}/{work.unit === 'acres' ? 'ac' : 'hr'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-px bg-surface-container-highest"></div>

                  {/* Financial Split Row */}
                  <div className="grid grid-cols-3 gap-1 pt-0.5 text-center">
                    <div className="flex flex-col items-start text-left">
                      <span className="font-label-sm text-[11px] text-outline uppercase font-semibold">
                        Total Bill
                      </span>
                      <span className="font-label-lg text-label-lg font-bold text-on-surface">
                        ₹ {work.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="font-label-sm text-[11px] text-secondary uppercase font-semibold">
                        {isPaid ? 'Cash Collected' : 'Received'}
                      </span>
                      <span className="font-label-lg text-label-lg font-bold text-secondary">
                        ₹ {work.receivedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex flex-col items-end text-right">
                      <span
                        className={`font-label-sm text-[11px] uppercase font-bold ${
                          isPaid ? 'text-secondary' : isPartly ? 'text-primary' : 'text-tertiary'
                        }`}
                      >
                        {isPaid ? 'Balance' : isPartly ? 'Balance Due' : 'Unpaid'}
                      </span>
                      <span
                        className={`font-currency-card text-headline-sm font-extrabold ${
                          isPaid ? 'text-secondary' : isPartly ? 'text-on-primary-container' : 'text-tertiary'
                        }`}
                      >
                        ₹ {work.balanceAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {work.phone && (
                    <a
                      href={`tel:${work.phone}`}
                      className="h-11 px-3.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">call</span>
                      <span>Call</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedWorkForShare(work)}
                    className="h-11 px-3.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center justify-center gap-1 transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">share</span>
                    <span>WhatsApp</span>
                  </button>

                  {!isPaid && canEdit && (
                    <button
                      type="button"
                      onClick={() => setSelectedWorkForPay(work)}
                      className={`flex-1 h-11 px-4 rounded-full font-label-lg text-label-md font-bold flex items-center justify-center gap-1 shadow-xs active:scale-[0.98] transition-transform cursor-pointer ${
                        isPartly ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary text-on-tertiary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isPartly ? 'add_circle' : 'payments'}
                      </span>
                      <span>
                        {isPartly ? '+ Add Payment' : `Collect ₹${work.balanceAmount.toLocaleString('en-IN')}`}
                      </span>
                    </button>
                  )}
                </div>

                {/* Audit Stamp & Edit / Delete row */}
                <div className="flex items-center justify-between text-[11px] text-outline pt-2 border-t border-surface-container">
                  <span className="truncate max-w-[220px]">
                    Added by {work.addedByName || 'Partner'}
                    {work.lastEditedByName && work.lastEditedByName !== work.addedByName && ` • Edited by ${work.lastEditedByName}`}
                  </span>

                  <div className="flex items-center gap-2.5">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setEditingWork(work)}
                        className="text-secondary font-bold hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setWorkToDelete(work)}
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

      {/* Bottom Floating Action Button */}
      {canEdit && (
        <div className="fixed bottom-24 right-4 sm:right-auto sm:left-1/2 sm:translate-x-32 z-40">
          <button
            type="button"
            onClick={() => setCurrentScreen('add-work')}
            className="h-14 px-6 rounded-full bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary shadow-[0_6px_16px_rgba(32,108,59,0.35)] flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
            <span className="font-label-lg text-label-lg font-bold tracking-wide">+ Add Work</span>
          </button>
        </div>
      )}

      {/* Edit Work Modal */}
      {editingWork && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm font-bold text-on-surface">Edit Work Entry</h3>
              <button
                type="button"
                onClick={() => setEditingWork(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Farmer Name</label>
                <input
                  type="text"
                  required
                  value={editingWork.farmerName}
                  onChange={(e) => setEditingWork({ ...editingWork, farmerName: e.target.value })}
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Village</label>
                  <input
                    type="text"
                    value={editingWork.village}
                    onChange={(e) => setEditingWork({ ...editingWork, village: e.target.value })}
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Phone</label>
                  <input
                    type="tel"
                    value={editingWork.phone || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, phone: e.target.value })}
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Service Type</label>
                  <select
                    value={editingWork.serviceType || 'Harvesting'}
                    onChange={(e) => setEditingWork({ ...editingWork, serviceType: e.target.value })}
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
                  >
                    <option value="Harvesting">Harvesting</option>
                    <option value="Spraying By drone">Spraying By drone</option>
                    <option value="Land ploughing">Land ploughing</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Unit</label>
                  <select
                    value={editingWork.unit}
                    onChange={(e) => setEditingWork({ ...editingWork, unit: e.target.value as any })}
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
                  >
                    <option value="acres">Acres</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Quantity ({editingWork.unit})</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formatInputDisplay(editingWork.quantity)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = cleanNumberInput(e.target.value);
                      setEditingWork({ ...editingWork, quantity: val as any });
                    }}
                    placeholder="0"
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-center"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Rate / Unit (₹)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatInputDisplay(editingWork.rate)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = cleanNumberInput(e.target.value);
                      setEditingWork({ ...editingWork, rate: val as any });
                    }}
                    placeholder="0"
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Received Amount (₹)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatInputDisplay(editingWork.receivedAmount)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = cleanNumberInput(e.target.value);
                    setEditingWork({ ...editingWork, receivedAmount: val as any });
                  }}
                  placeholder="0"
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Operator Name</label>
                  <input
                    type="text"
                    value={editingWork.driverName || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, driverName: e.target.value })}
                    placeholder="e.g. Ramesh"
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Operator Phone</label>
                  <input
                    type="tel"
                    value={editingWork.driverPhone || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, driverPhone: e.target.value })}
                    placeholder="e.g. 9842099887"
                    className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWork(null)}
                  className="px-4 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <PaymentDrawer
        isOpen={selectedWorkForPay !== null}
        onClose={() => setSelectedWorkForPay(null)}
        workEntry={selectedWorkForPay}
        onSuccess={(name, amt) => {
          showToast(`Recorded ₹ ${amt.toLocaleString('en-IN')} from ${name}`);
        }}
        onShareWhatsApp={(entry) => setSelectedWorkForShare(entry)}
      />

      <WhatsAppShareModal
        isOpen={selectedWorkForShare !== null}
        onClose={() => setSelectedWorkForShare(null)}
        workEntry={selectedWorkForShare}
      />

      <VoiceEntryModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyParsedWork={(parsed) => {
          setSearchQuery(parsed.farmerName);
          showToast(`Filtered for ${parsed.farmerName}`);
        }}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full font-label-md text-label-md shadow-xl flex items-center gap-2 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
