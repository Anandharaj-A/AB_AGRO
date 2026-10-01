import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';

export const ActivityLogPage: React.FC = () => {
  const { activityLogs } = useHarvester();
  const [filterModule, setFilterModule] = useState<string>('all');

  const filtered = activityLogs.filter((log) => {
    if (filterModule === 'all') return true;
    return log.module === filterModule;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Added</span>;
      case 'update':
        return <span className="bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Edited</span>;
      case 'delete':
        return <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Deleted</span>;
      case 'settle':
        return <span className="bg-secondary text-on-secondary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Settled</span>;
      default:
        return <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{action}</span>;
    }
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 pb-28 gap-4 max-w-xl mx-auto">
      {/* Title */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary-container/60 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[24px]">history</span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
              Activity Audit Log
            </h2>
            <span className="font-body-sm text-xs text-on-surface-variant font-medium">
              Real-time audit trail of all partner changes
            </span>
          </div>
        </div>
      </div>

      {/* Module Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
        {[
          { id: 'all', label: 'All Activities' },
          { id: 'work', label: 'Works' },
          { id: 'expense', label: 'Expenses' },
          { id: 'driver', label: 'Drivers' },
          { id: 'machine_care', label: 'Machine Care' },
          { id: 'settings', label: 'Settings' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterModule(f.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterModule === f.id
                ? 'bg-secondary text-on-secondary shadow-xs'
                : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log Feed */}
      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center text-xs text-outline border border-outline-variant/30">
            No activity logs found.
          </div>
        ) : (
          filtered.map((log) => {
            const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Recently';

            return (
              <div
                key={log.id}
                className="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-outline-variant/30 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-on-surface text-xs capitalize">
                      {log.module.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[11px] text-outline font-medium">{dateStr}</span>
                </div>

                <p className="font-body-sm text-xs text-on-surface leading-snug">
                  {log.summary}
                </p>

                <div className="flex items-center gap-2 pt-1 border-t border-surface-container text-[11px] text-on-surface-variant">
                  <span className="font-semibold text-secondary">
                    By {log.performedByName} ({log.performedByRole})
                  </span>
                  <span>•</span>
                  <span className="text-outline truncate">{log.performedByEmail}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
