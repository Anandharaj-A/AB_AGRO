import React, { useState } from 'react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  itemName?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  itemName,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      console.error('Delete action failed:', err);
      alert(err?.message || 'Failed to delete record. Please check your permissions and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full flex flex-col gap-4 shadow-2xl border border-outline-variant/30 animate-in fade-in zoom-in duration-150">
        <div className="w-12 h-12 rounded-2xl bg-error-container/70 text-error flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px]">delete_forever</span>
        </div>

        <div className="text-center flex flex-col gap-1">
          <h3 className="font-headline-sm text-lg font-bold text-on-surface">
            {title}
          </h3>
          {itemName && (
            <p className="text-sm font-bold text-error bg-error-container/30 py-1 px-3 rounded-xl mx-auto truncate max-w-full">
              {itemName}
            </p>
          )}
          <p className="font-body-md text-xs text-on-surface-variant mt-1 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 h-11 rounded-full bg-surface-container text-on-surface font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="flex-1 h-11 rounded-full bg-error text-white font-bold text-xs hover:bg-error/90 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDeleting ? 'hourglass_top' : 'delete'}
            </span>
            <span>{isDeleting ? 'Deleting...' : 'Yes, Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
