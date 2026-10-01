import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { DriverShift } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const DriverManagement: React.FC = () => {
  const {
    drivers,
    updateDriver,
    deleteDriver,
    driverAdvances,
    addDriverAdvance,
    deleteDriverAdvance,
    driverSalaries,
    addDriverSalary,
    deleteDriverSalary,
    addExpenseEntry,
    businessSettings,
  } = useHarvester();

  const { canEdit, canDelete, appUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'crew' | 'advances' | 'salaries'>('crew');
  const [selectedDriver, setSelectedDriver] = useState<DriverShift | null>(null);
  const [advanceInput, setAdvanceInput] = useState<number | ''>(2000);
  const [advanceNotes, setAdvanceNotes] = useState<string>('Bata cash advance');
  const [salaryMonth, setSalaryMonth] = useState<string>('November 2024');
  const [salaryBonus, setSalaryBonus] = useState<number | ''>(1000);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'driver' | 'advance' | 'salary';
    id: string;
    name: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleGiveAdvance = async () => {
    if (!selectedDriver) return;
    const amt = Number(advanceInput) || 0;
    if (amt <= 0) return;

    // Record advance
    await addDriverAdvance({
      driverId: selectedDriver.id,
      driverName: selectedDriver.driverName,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: amt,
      paymentMode: 'cash',
      paidBy: appUser?.name || businessSettings.partner1Name,
      notes: advanceNotes,
    });

    // Update driver cumulative
    await updateDriver(selectedDriver.id, {
      advancePaid: (selectedDriver.advancePaid || 0) + amt,
    });

    // Also record expense
    await addExpenseEntry({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      paidBy: appUser?.name || businessSettings.partner1Name,
      category: 'driver',
      amount: amt,
      paymentMode: 'cash',
      remarks: `Cash advance paid to ${selectedDriver.driverName} (${advanceNotes})`,
      machinery: businessSettings.harvesterModel,
      verified: true,
    });

    showToast(`₹ ${amt.toLocaleString('en-IN')} advance given to ${selectedDriver.driverName}`);
    setSelectedDriver(null);
  };

  const handleSettleSalary = async () => {
    if (!selectedDriver) return;

    const base = (selectedDriver.dailyBataRate || 1500) * 15; // standard fortnight/month base
    const bonus = Number(salaryBonus) || 0;
    const advanceDeducted = selectedDriver.advancePaid || 0;
    const netPaid = Math.max(0, base + bonus - advanceDeducted);

    await addDriverSalary({
      driverId: selectedDriver.id,
      driverName: selectedDriver.driverName,
      monthOrPeriod: salaryMonth,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      baseAmount: base,
      bonusAmount: bonus,
      deductionsAdvance: advanceDeducted,
      netPaid,
      paidBy: appUser?.name || businessSettings.partner1Name,
      notes: `Settled ${salaryMonth} net payout after deducting advances`,
    });

    // Reset advance on driver
    await updateDriver(selectedDriver.id, {
      advancePaid: 0,
    });

    // Add expense entry
    await addExpenseEntry({
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      paidBy: appUser?.name || businessSettings.partner1Name,
      category: 'driver',
      amount: netPaid,
      paymentMode: 'cash',
      remarks: `${salaryMonth} Salary settled for ${selectedDriver.driverName}`,
      machinery: businessSettings.harvesterModel,
      verified: true,
    });

    showToast(`Salary of ₹ ${netPaid.toLocaleString('en-IN')} settled for ${selectedDriver.driverName}`);
    setShowSalaryModal(false);
    setSelectedDriver(null);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Shift Overview Banner */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-[11px]">
              Active Crew &amp; Bata Ledger
            </span>
          </div>
          <span className="font-label-sm text-xs text-on-surface-variant font-bold">
            {drivers.length} Registered Operators
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => setActiveTab('crew')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'crew'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          Crew Operators ({drivers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('advances')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'advances'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          Advances Given ({driverAdvances.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('salaries')}
          className={`shrink-0 px-4 py-2 rounded-full font-label-md text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'salaries'
              ? 'bg-secondary text-on-secondary shadow-xs'
              : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
          }`}
        >
          Settled Salaries ({driverSalaries.length})
        </button>
      </div>

      {/* TAB 1: CREW */}
      {activeTab === 'crew' && (
        <div className="flex flex-col gap-3">
          {drivers.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-xs text-outline border border-outline-variant/30">
              No drivers added yet. Admin can register drivers in Admin Settings &gt; Driver tab.
            </div>
          ) : (
            drivers.map((drv) => (
              <div
                key={drv.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed/60 flex items-center justify-center text-on-primary-fixed font-extrabold text-lg">
                      {drv.driverName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {drv.driverName}
                      </h4>
                      <span className="font-body-sm text-xs text-on-surface-variant block">
                        {drv.role}
                      </span>
                    </div>
                  </div>

                  {drv.phone && (
                    <a
                      href={`tel:${drv.phone}`}
                      className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-container-high transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[20px]">call</span>
                    </a>
                  )}
                </div>

                {/* Bata calculation strip */}
                <div className="bg-surface-container-low p-3 rounded-xl grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <span className="text-outline block">Daily Base Bata</span>
                    <span className="font-bold text-on-surface text-sm">
                      ₹ {drv.dailyBataRate}
                    </span>
                  </div>
                  <div>
                    <span className="text-outline block">Acre Cutting Bonus</span>
                    <span className="font-bold text-on-surface text-sm">
                      ₹ {drv.acreBonusRate} / acre
                    </span>
                  </div>
                </div>

                {/* Advance and Balance summary */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-surface-container">
                  <div>
                    <span className="text-outline">Unsettled Advances: </span>
                    <span className="font-bold text-tertiary">
                      ₹ {(drv.advancePaid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-outline text-[11px]">
                    Status: <strong className="text-secondary">{drv.status}</strong>
                  </span>
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDriver(drv);
                        setAdvanceInput(2000);
                      }}
                      className="flex-1 h-11 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-secondary-container/80 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                      <span>Pay Advance</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDriver(drv);
                        setShowSalaryModal(true);
                      }}
                      className="px-4 h-11 rounded-full bg-surface-container text-on-surface font-label-md text-xs font-bold flex items-center justify-center gap-1 shadow-xs hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <span>Settle Salary</span>
                    </button>
                  </div>
                )}

                {/* Audit Stamp & Delete */}
                <div className="text-[10px] text-outline pt-1 flex items-center justify-between border-t border-surface-container">
                  <span>
                    Added by {drv.addedByName || 'Admin'}
                    {drv.lastEditedByName && drv.lastEditedByName !== drv.addedByName && ` • Edited by ${drv.lastEditedByName}`}
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'driver', id: drv.id, name: drv.driverName })}
                      className="text-error font-bold hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ADVANCES */}
      {activeTab === 'advances' && (
        <div className="flex flex-col gap-2.5">
          {driverAdvances.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-xs text-outline border border-outline-variant/30">
              No cash advances logged yet.
            </div>
          ) : (
            driverAdvances.map((adv) => (
              <div key={adv.id} className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-on-surface text-sm">{adv.driverName}</span>
                  <span className="text-outline block">{adv.date} • Paid by {adv.paidBy}</span>
                  {adv.notes && <span className="text-[11px] text-secondary italic block">{adv.notes}</span>}
                </div>
                <div className="text-right">
                  <span className="font-bold text-tertiary text-sm">₹ {adv.amount.toLocaleString('en-IN')}</span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'advance', id: adv.id, name: `Advance for ${adv.driverName} (₹ ${adv.amount})` })}
                      className="text-error font-bold block mt-1 hover:underline text-[11px] cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SALARIES */}
      {activeTab === 'salaries' && (
        <div className="flex flex-col gap-2.5">
          {driverSalaries.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-xs text-outline border border-outline-variant/30">
              No settled salaries logged yet.
            </div>
          ) : (
            driverSalaries.map((sal) => (
              <div key={sal.id} className="bg-surface-container-lowest p-3.5 rounded-xl shadow-xs border border-outline-variant/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-on-surface text-sm">{sal.driverName} ({sal.monthOrPeriod})</span>
                  <span className="text-outline block">{sal.date} • Settled by {sal.paidBy}</span>
                  <span className="text-[11px] text-outline block">
                    Base: ₹{sal.baseAmount} + Bonus: ₹{sal.bonusAmount} - Adv: ₹{sal.deductionsAdvance}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-secondary text-sm">Net: ₹ {sal.netPaid.toLocaleString('en-IN')}</span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'salary', id: sal.id, name: `Salary for ${sal.driverName}` })}
                      className="text-error font-bold block mt-1 hover:underline text-[11px] cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pay Advance Modal */}
      {selectedDriver && !showSalaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm font-bold text-on-surface">Pay Cash Advance</h3>
              <button
                type="button"
                onClick={() => setSelectedDriver(null)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-sm text-xs text-on-surface-variant">
              Paying cash advance to <strong>{selectedDriver.driverName}</strong>. Will be logged in driver advances and expense ledger.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Amount (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(advanceInput)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAdvanceInput(cleanNumberInput(e.target.value))}
                placeholder="0"
                className="w-full h-12 px-3 rounded-xl bg-surface-container font-bold text-lg text-on-surface focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Notes</label>
              <input
                type="text"
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
              />
            </div>

            <button
              type="button"
              onClick={handleGiveAdvance}
              className="w-full h-12 rounded-full bg-secondary text-on-secondary font-bold text-sm shadow-md cursor-pointer hover:bg-secondary/90 transition-all mt-1"
            >
              Confirm Advance (₹ {Number(advanceInput || 0).toLocaleString('en-IN')})
            </button>
          </div>
        </div>
      )}

      {/* Settle Salary Modal */}
      {selectedDriver && showSalaryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 max-w-sm w-full flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm font-bold text-on-surface">Settle Month Salary</h3>
              <button
                type="button"
                onClick={() => {
                  setShowSalaryModal(false);
                  setSelectedDriver(null);
                }}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Driver: <strong>{selectedDriver.driverName}</strong>
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Month / Period</label>
              <input
                type="text"
                value={salaryMonth}
                onChange={(e) => setSalaryMonth(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Bonus / Overtime (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(salaryBonus)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setSalaryBonus(cleanNumberInput(e.target.value))}
                placeholder="0"
                className="w-full h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold"
              />
            </div>

            <div className="bg-surface-container-low p-3 rounded-xl text-xs flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Estimated Base Bata:</span>
                <span className="font-bold">₹ {(selectedDriver.dailyBataRate || 1500) * 15}</span>
              </div>
              <div className="flex justify-between text-tertiary">
                <span>Less Prior Advances:</span>
                <span className="font-bold">- ₹ {selectedDriver.advancePaid || 0}</span>
              </div>
              <div className="flex justify-between text-secondary pt-1 border-t border-surface-container font-bold text-sm">
                <span>Net Payable:</span>
                <span>
                  ₹{' '}
                  {Math.max(
                    0,
                    (selectedDriver.dailyBataRate || 1500) * 15 +
                      (Number(salaryBonus) || 0) -
                      (selectedDriver.advancePaid || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSettleSalary}
              className="w-full h-12 rounded-full bg-secondary text-on-secondary font-bold text-sm shadow-md cursor-pointer hover:bg-secondary/90 transition-all"
            >
              Confirm Salary Settlement
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          const target = deleteConfirm;
          if (target.type === 'driver') {
            await deleteDriver(target.id);
            showToast(`Deleted driver ${target.name}`);
          } else if (target.type === 'advance') {
            await deleteDriverAdvance(target.id);
            showToast(`Deleted advance entry`);
          } else if (target.type === 'salary') {
            await deleteDriverSalary(target.id);
            showToast(`Deleted salary record`);
          }
          setDeleteConfirm(null);
        }}
        title="Confirm Deletion"
        itemName={deleteConfirm?.name}
        message="Are you sure you want to delete this record permanently?"
      />

      {/* Toast */}
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
