import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { ExpenseEntry } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const ExpenseList: React.FC = () => {
  const {
    expenseEntries,
    totalExpenses,
    partner1Spent,
    partner2Spent,
    setCurrentScreen,
    deleteExpenseEntry,
    updateExpenseEntry,
    businessSettings,
    isPartner1,
    isPartner2,
    p1Name,
    p2Name,
  } = useHarvester();

  const { canEdit, canDelete } = useAuth();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<ExpenseEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredExpenses = expenseEntries.filter((exp) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'p1') return isPartner1(exp.paidBy);
    if (activeFilter === 'p2') return isPartner2(exp.paidBy);
    return exp.category === activeFilter;
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'diesel':
        return 'local_gas_station';
      case 'spares':
        return 'settings';
      case 'workshop':
        return 'build';
      case 'tools':
        return 'handyman';
      case 'food':
        return 'restaurant';
      case 'petrol':
        return 'two_wheeler';
      case 'driver':
        return 'badge';
      default:
        return 'receipt';
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const canonicalPayer = isPartner2(editingExpense.paidBy) ? p2Name : p1Name;
    await updateExpenseEntry(editingExpense.id, {
      ...editingExpense,
      paidBy: canonicalPayer,
      amount: Number(editingExpense.amount) || 0,
    });
    showToast(`Updated expense for ${canonicalPayer}`);
    setEditingExpense(null);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Overview Tally Strip */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider text-[11px]">
            Total Machine Expenses
          </span>
          <span className="bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full font-label-sm text-xs font-bold">
            {businessSettings.harvesterModel}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-extrabold tracking-tight">
            ₹ {totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-high">
          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-[11px] text-outline font-semibold block">
              {p1Name} Spent
            </span>
            <span className="font-headline-sm text-headline-sm text-secondary font-bold">
              ₹ {partner1Spent.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-surface-container-low p-2.5 rounded-xl">
            <span className="text-[11px] text-outline font-semibold block">
              {p2Name} Spent
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              ₹ {partner2Spent.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          All Outlays ({expenseEntries.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('diesel')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'diesel'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          Diesel Fuel
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('spares')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'spares'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          Spares
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('p1')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'p1'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          By {p1Name}
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('p2')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'p2'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          By {p2Name}
        </button>
      </div>

      {/* Expense List Stream */}
      <div className="flex flex-col gap-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-xs text-outline border border-outline-variant/30">
            No expenses recorded yet. Tap <strong>+ Add Expense</strong> below to log a purchase or fuel fill.
          </div>
        ) : (
          filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-[20px]">
                      {getCategoryIcon(exp.category)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold capitalize">
                      {exp.category}
                    </h4>
                    <span className="font-body-sm text-xs text-on-surface-variant">
                      {exp.date} • {exp.machinery}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-currency-card text-currency-card text-on-surface font-extrabold">
                    ₹ {exp.amount.toLocaleString('en-IN')}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-label-sm text-[11px] text-on-surface font-semibold">
                      {exp.paidBy} Paid
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {exp.remarks && (
                <p className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg text-xs leading-relaxed">
                  {exp.remarks}
                </p>
              )}

              {/* Fuel log details if any */}
              {exp.fuelLog && (
                <div className="bg-primary-fixed/20 p-2.5 rounded-xl flex items-center justify-between text-xs text-on-primary-fixed-variant font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      local_gas_station
                    </span>
                    <span>
                      {exp.fuelLog.litresFilled} L @ ₹{exp.fuelLog.ratePerLitre}/L
                    </span>
                  </div>
                  <span className="font-bold text-secondary">
                    {exp.fuelLog.litresPerAcre} L/Acre
                  </span>
                </div>
              )}

              {/* Receipt Attachment Thumbnail */}
              {exp.receiptImage && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(exp)}
                    className="inline-flex items-center gap-1.5 text-xs text-secondary font-bold hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">image</span>
                    <span>View Receipt Slip</span>
                  </button>
                  <span className="text-[11px] text-outline uppercase font-semibold">
                    {exp.paymentMode}
                  </span>
                </div>
              )}

              {/* Audit Stamp & Edit / Delete row */}
              <div className="flex items-center justify-between text-[11px] text-outline pt-2 border-t border-surface-container">
                <span className="truncate max-w-[220px]">
                  Added by {exp.addedByName || 'Partner'}
                  {exp.lastEditedByName && exp.lastEditedByName !== exp.addedByName && ` • Edited by ${exp.lastEditedByName}`}
                </span>

                <div className="flex items-center gap-2.5">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditingExpense(exp)}
                      className="text-secondary font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setExpenseToDelete(exp)}
                      className="text-error font-bold hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Add Expense Button */}
      {canEdit && (
        <div className="fixed bottom-24 right-4 sm:right-auto sm:left-1/2 sm:translate-x-32 z-40">
          <button
            type="button"
            onClick={() => setCurrentScreen('add-expense')}
            className="h-14 px-6 rounded-full bg-primary-container text-on-primary-container font-label-lg text-label-lg font-bold shadow-[0_6px_16px_rgba(212,155,36,0.35)] flex items-center gap-2 active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            <span>+ Add Expense</span>
          </button>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm font-bold text-on-surface">Edit Expense</h3>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditSave} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Amount (₹)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={formatInputDisplay(editingExpense.amount)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const val = cleanNumberInput(e.target.value);
                    setEditingExpense({ ...editingExpense, amount: val as any });
                  }}
                  placeholder="0"
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-lg"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-on-surface">Paid By (Partner)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExpense({ ...editingExpense, paidBy: p1Name })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPartner1(editingExpense.paidBy)
                        ? 'bg-secondary-container/60 text-secondary border-secondary'
                        : 'bg-surface-container text-on-surface-variant border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>{p1Name}</span>
                    {isPartner1(editingExpense.paidBy) && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingExpense({ ...editingExpense, paidBy: p2Name })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isPartner2(editingExpense.paidBy)
                        ? 'bg-secondary-container/60 text-secondary border-secondary'
                        : 'bg-surface-container text-on-surface-variant border-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    <span>{p2Name}</span>
                    {isPartner2(editingExpense.paidBy) && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Remarks</label>
                <input
                  type="text"
                  value={editingExpense.remarks || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, remarks: e.target.value })}
                  className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-4 max-w-sm w-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface text-sm">
                {selectedReceipt.receiptFileName || 'Bunk Receipt'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <img
              src={selectedReceipt.receiptImage}
              alt="Receipt"
              className="w-full h-auto rounded-xl object-contain max-h-[60vh]"
            />
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span>₹ {selectedReceipt.amount.toLocaleString('en-IN')}</span>
              <span>Paid by {selectedReceipt.paidBy}</span>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={expenseToDelete !== null}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={async () => {
          if (expenseToDelete) {
            const target = expenseToDelete;
            await deleteExpenseEntry(target.id);
            showToast(`Deleted ${target.category} expense of ₹ ${target.amount}`);
            setExpenseToDelete(null);
          }
        }}
        title="Delete Expense Entry"
        itemName={expenseToDelete ? `₹ ${expenseToDelete.amount} - ${expenseToDelete.category}` : undefined}
        message="Are you sure you want to permanently remove this expense from the books?"
      />

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
