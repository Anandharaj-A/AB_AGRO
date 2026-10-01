import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { MachineCareEntry } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const MachineCarePage: React.FC = () => {
  const { machineCareEntries, addMachineCare, updateMachineCare, deleteMachineCare, businessSettings } = useHarvester();
  const { canEdit, canDelete, appUser } = useAuth();

  const [careType, setCareType] = useState<MachineCareEntry['careType']>('greasing');
  const [engineHours, setEngineHours] = useState<number | ''>(142.5);
  const [performedBy, setPerformedBy] = useState<string>('Ramesh Operator');
  const [cost, setCost] = useState<number | ''>(850);
  const [paidBy, setPaidBy] = useState<string>(appUser?.name || 'Anand');
  const [notes, setNotes] = useState<string>('Cutter bar and roller grease nipples serviced');
  const [nextHours, setNextHours] = useState<number | ''>(192.5);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [careToDelete, setCareToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMachineCare(editingId, {
        careType,
        engineHours: Number(engineHours) || 0,
        performedBy: performedBy.trim(),
        cost: Number(cost) || 0,
        paidBy: paidBy.trim(),
        notes: notes.trim(),
        nextServiceHours: Number(nextHours) || 0,
      });
      setEditingId(null);
    } else {
      await addMachineCare({
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        careType,
        engineHours: Number(engineHours) || 0,
        performedBy: performedBy.trim(),
        cost: Number(cost) || 0,
        paidBy: paidBy.trim(),
        notes: notes.trim(),
        nextServiceHours: Number(nextHours) || 0,
      });
    }

    setNotes('');
    setCost(0);
  };

  const careOptions = [
    { id: 'greasing', label: 'Greasing Points' },
    { id: 'oil_change', label: 'Engine Oil Change' },
    { id: 'air_filter', label: 'Air Filter Cleaning' },
    { id: 'chain_tension', label: 'Track / Chain Tension' },
    { id: 'blade_sharpening', label: 'Blade Section Sharpening' },
    { id: 'hydraulic_check', label: 'Hydraulic Oil Check' },
    { id: 'other', label: 'Other Maintenance' },
  ];

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Title */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-fixed/60 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[24px]">construction</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Machine Care &amp; Maintenance
            </h2>
            <span className="font-body-sm text-xs text-on-surface-variant font-medium">
              {businessSettings.harvesterModel} ({businessSettings.registrationNumber})
            </span>
          </div>
        </div>
      </div>

      {/* Entry Form */}
      {canEdit && (
        <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-3">
          <h3 className="font-headline-sm text-sm font-bold text-on-surface">
            {editingId ? 'Edit Maintenance Record' : 'Record Service / Machine Care'}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Service Type</label>
              <select
                value={careType}
                onChange={(e) => setCareType(e.target.value as any)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-semibold focus:outline-none"
              >
                {careOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Engine Hours</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={formatInputDisplay(engineHours)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setEngineHours(cleanNumberInput(e.target.value))}
                placeholder="0"
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-center"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Cost (₹)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(cost)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setCost(cleanNumberInput(e.target.value))}
                placeholder="0"
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface font-bold text-center"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Paid By</label>
              <input
                type="text"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Mechanic / Serviced By</label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-on-surface">Field Notes / Parts Replaced</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5 grease cartridges used, radiator cleared"
              className="h-11 px-3 rounded-xl bg-surface-container text-xs text-on-surface"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 h-11 rounded-full bg-secondary text-on-secondary font-bold text-xs shadow-xs cursor-pointer"
            >
              {editingId ? 'Update Record' : 'Save Service Record'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 h-11 rounded-full bg-surface-container text-on-surface text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* History */}
      <div className="flex flex-col gap-3">
        <h3 className="font-headline-sm text-sm font-bold text-on-surface px-1">
          Maintenance History ({machineCareEntries.length})
        </h3>

        {machineCareEntries.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-6 text-center text-xs text-outline border border-outline-variant/30">
            No machine care records yet. Log regular greasing and oil changes to maintain harvester health.
          </div>
        ) : (
          machineCareEntries.map((care) => (
            <div
              key={care.id}
              className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-on-surface text-sm capitalize">
                    {care.careType.replace('_', ' ')}
                  </h4>
                  <span className="text-outline text-xs block">
                    {care.date} • At {care.engineHours} Engine Hours
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-on-surface text-sm">₹ {care.cost}</span>
                  <span className="text-[11px] text-outline block">Paid by {care.paidBy}</span>
                </div>
              </div>

              {care.notes && (
                <p className="bg-surface-container-low p-2 rounded-lg text-xs text-on-surface-variant">
                  {care.notes}
                </p>
              )}

              {/* Audit stamp */}
              <div className="text-[10px] text-outline pt-1 flex items-center justify-between border-t border-surface-container">
                <span>
                  Added by {care.addedByName || 'Partner'}
                  {care.lastEditedByName && care.lastEditedByName !== care.addedByName && ` • Edited by ${care.lastEditedByName}`}
                </span>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(care.id);
                        setCareType(care.careType);
                        setEngineHours(care.engineHours);
                        setPerformedBy(care.performedBy);
                        setCost(care.cost);
                        setPaidBy(care.paidBy);
                        setNotes(care.notes || '');
                      }}
                      className="text-secondary font-bold hover:underline"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setCareToDelete({ id: care.id, name: care.careType.replace('_', ' ') })}
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

      <ConfirmDeleteModal
        isOpen={careToDelete !== null}
        onClose={() => setCareToDelete(null)}
        onConfirm={async () => {
          if (careToDelete) {
            const target = careToDelete;
            await deleteMachineCare(target.id);
            setCareToDelete(null);
          }
        }}
        title="Delete Machine Care Record"
        itemName={careToDelete?.name}
        message="Are you sure you want to permanently delete this maintenance record?"
      />
    </div>
  );
};
