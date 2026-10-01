import React, { useState } from 'react';
import { WorkEntry } from '../types';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workEntry: WorkEntry | null;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  workEntry,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !workEntry) return null;

  const operatorLine = workEntry.driverName
    ? `📞 Operator ${workEntry.driverName}${workEntry.driverPhone ? `: ${workEntry.driverPhone}` : ''}`
    : '📞 Company Contact: AB AGRO SERVICES';

  const serviceLine = workEntry.serviceType
    ? `🛠️ *Service:* ${workEntry.serviceType}\n`
    : '';

  const receiptMessage = `🌾 *AB AGRO SERVICE BILL*
${serviceLine}Machine: Jhon Deer
Receipt #: ${workEntry.receiptNumber || 'HB-2026-REC'}
Date: ${workEntry.date}

👨‍🌾 *Farmer Name:* ${workEntry.farmerName}
📍 *Village / Location:* ${workEntry.village}
🌾 *Crop:* ${workEntry.cropVariety || (workEntry.crop === 'paddy' ? 'Paddy' : workEntry.crop || 'Paddy')}
📐 *Area / Quantity:* ${workEntry.quantity} ${workEntry.unit === 'acres' ? 'Acres' : 'Hours'} @ ₹${workEntry.rate.toLocaleString('en-IN')}/${workEntry.unit === 'acres' ? 'ac' : 'hr'}

💰 *Total Amount:* ₹ ${workEntry.totalAmount.toLocaleString('en-IN')}
✅ *Amount Paid:* ₹ ${workEntry.receivedAmount.toLocaleString('en-IN')}
${
  workEntry.balanceAmount > 0
    ? `⏳ *Balance Due:* ₹ ${workEntry.balanceAmount.toLocaleString('en-IN')}`
    : '✨ *Status:* FULLY SETTLED'
}

🚜 *Company:* AB AGRO SERVICES
${operatorLine}
Thank you for choosing AB AGRO SERVICES! 🙏`;

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleWhatsAppRedirect = () => {
    const encoded = encodeURIComponent(receiptMessage);
    const cleanPhone = workEntry.phone ? workEntry.phone.replace(/[^0-9]/g, '') : '';
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center p-3 sm:p-4">
      <div className="bg-surface-container-lowest rounded-2xl p-5 w-full max-w-md mx-auto shadow-2xl flex flex-col gap-4 border border-outline-variant/30 animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[20px]">
                receipt_long
              </span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                Digital Field Receipt
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Send to {workEntry.farmerName}
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

        {/* Formatted Bill Preview Card */}
        <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-2 font-mono text-xs text-on-surface whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
          {receiptMessage}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleWhatsAppRedirect}
            className="w-full h-13 rounded-full bg-secondary text-on-secondary font-label-md text-label-md font-bold shadow-md hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span>Send Directly on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full h-11 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {copied ? 'check' : 'content_copy'}
            </span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Bill Text'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
