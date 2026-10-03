import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { ExpenseCategory, ExpenseEntry, PartnerId, PaymentMode, FuelLogDetails } from '../types';
import { HARVESTER_PHOTO_SQ, FUEL_RECEIPT_IMG } from '../mockData';
import { formatDisplayDate, toISODateString, parseISODate } from '../utils/dateUtils';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const AddExpense: React.FC = () => {
  const {
    addExpenseEntry,
    activePartnerView,
    setCurrentScreen,
    businessSettings,
    isPartner1,
    isPartner2,
    p1Name,
    p2Name,
  } = useHarvester();

  const [date, setDate] = useState(formatDisplayDate(new Date()));
  const [isoDate, setIsoDate] = useState(toISODateString(new Date()));
  const [payer, setPayer] = useState<string>(isPartner2(activePartnerView) ? p2Name : p1Name);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState<number | ''>(4500);
  const [category, setCategory] = useState<ExpenseCategory>('diesel');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');

  // Fuel log specific fields
  const [ratePerLitre, setRatePerLitre] = useState<number | ''>(93.75);
  const [litresFilled, setLitresFilled] = useState<number | ''>(48);
  const [harvestArea, setHarvestArea] = useState<number | ''>(16);

  // Receipt image
  const [hasReceipt, setHasReceipt] = useState<boolean>(true);
  const [receiptImage, setReceiptImage] = useState<string>(FUEL_RECEIPT_IMG);
  const [receiptFileName, setReceiptFileName] = useState<string>(
    'IOCL_Bunk_Receipt_#4192.jpg'
  );

  const [remarks, setRemarks] = useState(
    'Indian Oil bunk near Dharapuram bypass'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mileage calculation
  const numLitres = typeof litresFilled === 'number' ? litresFilled : 0;
  const numArea = typeof harvestArea === 'number' ? harvestArea : 0;
  const consumptionBenchmark =
    numLitres > 0 && numArea > 0
      ? (numLitres / numArea).toFixed(1)
      : null;

  const categories: {
    id: ExpenseCategory;
    label: string;
    icon: string;
  }[] = [
    { id: 'diesel', label: 'Diesel', icon: 'local_gas_station' },
    { id: 'spares', label: 'Spares', icon: 'settings' },
    { id: 'workshop', label: 'Workshop', icon: 'build' },
    { id: 'tools', label: 'Tools', icon: 'handyman' },
    { id: 'food', label: 'Food/Tea', icon: 'restaurant' },
    { id: 'petrol', label: 'Bike Fuel', icon: 'two_wheeler' },
    { id: 'driver', label: 'Driver Pay', icon: 'badge' },
    { id: 'other', label: 'Other', icon: 'more_horiz' },
  ];

  const handleSave = async () => {
    const numericAmount = Number(amount) || 0;
    if (numericAmount <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }

    setIsSaving(true);
    try {
      const canonicalPayer = isPartner2(payer) ? p2Name : p1Name;
      const expensePayload: Omit<ExpenseEntry, 'id'> = {
        date,
        paidBy: canonicalPayer,
        category,
        amount: numericAmount,
        paymentMode,
        remarks: remarks.trim(),
        machinery: 'Kubota DC-68G (KA-04-E-2194)',
        verified: true,
      };

      if (category === 'diesel') {
        expensePayload.fuelLog = {
          ratePerLitre: Number(ratePerLitre) || 93.75,
          litresFilled: Number(litresFilled) || 0,
          harvestAreaAcres: Number(harvestArea) || 0,
          litresPerAcre: Number(consumptionBenchmark) || 3.0,
        };
      }

      if (hasReceipt && receiptImage) {
        expensePayload.receiptImage = receiptImage;
        if (receiptFileName) {
          expensePayload.receiptFileName = receiptFileName;
        }
      }

      await addExpenseEntry(expensePayload);

      const otherPartner = isPartner2(canonicalPayer) ? p1Name : p2Name;
      setToastMessage(`Expense Recorded for ${canonicalPayer} • Synced with ${otherPartner}`);

      setTimeout(() => {
        setCurrentScreen('expense-list');
      }, 1000);
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulatePhotoUpload = () => {
    setHasReceipt(true);
    setReceiptImage(FUEL_RECEIPT_IMG);
    setReceiptFileName(`IOCL_Bunk_Receipt_#${Math.floor(1000 + Math.random() * 9000)}.jpg`);
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto pb-28">
      {/* Top Banner / Heading */}
      <div className="px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-[11px]">
              Field Ledger Entry
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
            Add Expense
          </h2>
        </div>
        <button
          type="button"
          aria-label="Cancel and close"
          onClick={() => setCurrentScreen('home-dashboard')}
          className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">close</span>
        </button>
      </div>

      {/* Transaction Date Card */}
      <div className="px-4 sm:px-6 mt-1 mb-3">
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-xs border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  calendar_today
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant text-[11px]">
                  Transaction Date
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  {date}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setIsoDate(toISODateString(now));
                  setDate(formatDisplayDate(now));
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed/80 cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  setIsoDate(toISODateString(yest));
                  setDate(formatDisplayDate(yest));
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer"
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-outline-variant/20 flex items-center gap-2">
            <input
              type="date"
              value={isoDate}
              onChange={(e) => {
                if (e.target.value) {
                  setIsoDate(e.target.value);
                  setDate(formatDisplayDate(parseISODate(e.target.value)));
                }
              }}
              className="bg-surface-container h-10 px-3 rounded-xl font-body-md text-xs font-bold text-on-surface focus:outline-none w-full cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Who paid from their pocket? */}
      <div className="px-4 sm:px-6 mb-4">
        <label className="font-label-md text-label-md text-on-surface mb-2 font-bold flex items-center gap-1.5">
          <span>Who paid from their pocket?</span>
          <span className="material-symbols-outlined text-primary text-[18px]">
            verified_user
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3" id="partner-selector">
          {/* Partner 1 */}
          <button
            type="button"
            onClick={() => setPayer(p1Name)}
            className={`relative flex flex-col items-start p-3.5 rounded-2xl text-left transition-all shadow-xs active:scale-[0.98] border-2 cursor-pointer ${
              isPartner1(payer)
                ? 'bg-secondary-container/50 border-secondary'
                : 'bg-surface-container-lowest border-transparent'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs ${
                  isPartner1(payer)
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
              </div>
              {isPartner1(payer) && (
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-xs">
                  <span className="material-symbols-outlined text-[16px] font-bold">
                    check
                  </span>
                </span>
              )}
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {p1Name}
            </span>
            <span className="font-label-sm text-label-sm text-on-secondary-container mt-0.5 font-bold text-xs">
              Paid from pocket
            </span>
          </button>

          {/* Partner 2 */}
          <button
            type="button"
            onClick={() => setPayer(p2Name)}
            className={`relative flex flex-col items-start p-3.5 rounded-2xl text-left transition-all shadow-xs active:scale-[0.98] border-2 cursor-pointer ${
              isPartner2(payer)
                ? 'bg-secondary-container/50 border-secondary'
                : 'bg-surface-container-lowest border-transparent'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs ${
                  isPartner2(payer)
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-highest text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  person
                </span>
              </div>
              {isPartner2(payer) && (
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-xs">
                  <span className="material-symbols-outlined text-[16px] font-bold">
                    check
                  </span>
                </span>
              )}
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
              {p2Name}
            </span>
            <span
              className={`font-label-sm text-label-sm mt-0.5 text-xs ${
                isPartner2(payer)
                  ? 'text-on-secondary-container font-bold'
                  : 'text-on-surface-variant font-medium'
              }`}
            >
              Paid from pocket
            </span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 mt-2 px-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            handshake
          </span>
          <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
            Counts towards the 50/50 partnership ledger balance.
          </span>
        </div>
      </div>

      {/* Expense Total Card */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/30">
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="amount-input"
              className="font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider text-[11px]"
            >
              Expense Total
            </label>
            <span className="bg-primary-fixed text-on-primary-fixed-variant px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-bold text-[11px]">
              Harvester Debit
            </span>
          </div>

          <div className="flex items-baseline gap-2 py-1">
            <span className="font-currency-hero text-currency-hero text-primary font-extrabold text-[36px]">
              ₹
            </span>
            <input
              id="amount-input"
              type="text"
              inputMode="numeric"
              value={formatInputDisplay(amount)}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setAmount(cleanNumberInput(e.target.value))}
              placeholder="0"
              className="w-full font-display-lg-mobile text-display-lg-mobile text-on-surface bg-transparent focus:outline-none font-extrabold tracking-tight"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">
              receipt_long
            </span>
            <span className="font-label-sm text-label-sm text-xs">
              High-value purchase: will require verification during monthly audit
            </span>
          </div>
        </div>
      </div>

      {/* Select Category Grid (8 tiles) */}
      <div className="px-4 sm:px-6 mb-4">
        <label className="block font-label-md text-label-md text-on-surface mb-2 font-bold">
          Select Category
        </label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`category-chip flex flex-col items-center justify-center p-2.5 rounded-2xl shadow-xs transition-all active:scale-95 cursor-pointer border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[24px] mb-1 ${
                    isSelected ? 'text-on-primary' : 'text-on-surface-variant'
                  }`}
                  style={isSelected ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {cat.icon}
                </span>
                <span className="font-label-sm text-label-sm font-bold truncate w-full text-center text-xs">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kubota Fuel Log (Shows when Diesel selected) */}
      {category === 'diesel' && (
        <div className="px-4 sm:px-6 mb-4 animate-in fade-in duration-200">
          <div className="bg-primary-fixed/30 rounded-2xl p-4 shadow-xs flex flex-col gap-3 border border-primary-fixed/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">
                    water_drop
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Kubota Fuel Log
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
                    Automatic acreage consumption check
                  </span>
                </div>
              </div>
              <span className="bg-surface-container-lowest text-secondary px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold flex items-center gap-1 shadow-xs text-xs">
                <span className="material-symbols-outlined text-[14px]">
                  speed
                </span>{' '}
                {ratePerLitre} ₹/L
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="bg-surface-container-lowest rounded-xl p-3 shadow-xs border border-outline-variant/20">
                <label
                  htmlFor="diesel-litres"
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold text-xs"
                >
                  Litres Filled
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="diesel-litres"
                    type="text"
                    inputMode="decimal"
                    value={formatInputDisplay(litresFilled)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setLitresFilled(cleanNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full font-currency-card text-currency-card text-on-surface bg-transparent focus:outline-none font-bold"
                  />
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                    L
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-3 shadow-xs border border-outline-variant/20">
                <label
                  htmlFor="acres-covered"
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-1 font-bold text-xs"
                >
                  Harvest Area
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="acres-covered"
                    type="text"
                    inputMode="decimal"
                    value={formatInputDisplay(harvestArea)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setHarvestArea(cleanNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full font-currency-card text-currency-card text-on-surface bg-transparent focus:outline-none font-bold"
                  />
                  <span className="font-label-md text-label-md text-on-surface-variant font-bold">
                    Acre
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-secondary-container/70 rounded-xl p-3 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">
                  bolt
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-bold text-on-secondary-container">
                    {consumptionBenchmark
                      ? `${consumptionBenchmark} Litres per acre`
                      : 'Enter litres & acres'}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-secondary-container text-xs">
                    Good benchmark for wet paddy cutting
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-secondary text-[20px]">
                thumb_up
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Group */}
      <div className="px-4 sm:px-6 mb-4">
        <label className="block font-label-md text-label-md text-on-surface mb-2 font-bold">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setPaymentMode('cash')}
            className={`h-13 py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer border ${
              paymentMode === 'cash'
                ? 'bg-secondary text-on-secondary border-secondary'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/30'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                paymentMode === 'cash'
                  ? 'text-on-secondary'
                  : 'text-on-surface-variant'
              }`}
            >
              payments
            </span>
            <span className="font-label-sm text-label-sm font-bold text-xs">
              Cash
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('upi')}
            className={`h-13 py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer border ${
              paymentMode === 'upi'
                ? 'bg-secondary text-on-secondary border-secondary'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/30'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                paymentMode === 'upi'
                  ? 'text-on-secondary'
                  : 'text-on-surface-variant'
              }`}
            >
              smartphone
            </span>
            <span className="font-label-sm text-label-sm font-bold truncate text-xs">
              GPay / PhonePe
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMode('hpcl_card')}
            className={`h-13 py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer border ${
              paymentMode === 'hpcl_card'
                ? 'bg-secondary text-on-secondary border-secondary'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/30'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                paymentMode === 'hpcl_card'
                  ? 'text-on-secondary'
                  : 'text-on-surface-variant'
              }`}
            >
              credit_card
            </span>
            <span className="font-label-sm text-label-sm font-bold truncate text-xs">
              HPCL Fleet
            </span>
          </button>
        </div>
      </div>

      {/* Receipt / Bunk Invoice & Field Notes */}
      <div className="px-4 sm:px-6 mb-4 flex flex-col gap-3">
        {/* Receipt Upload Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/30">
          <label className="block font-label-md text-label-md text-on-surface mb-2 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[18px]">
                photo_camera
              </span>
              <span>Receipt / Bunk Invoice</span>
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant text-xs">
              Optional
            </span>
          </label>

          {!hasReceipt ? (
            <div
              onClick={handleSimulatePhotoUpload}
              className="bg-surface-container-low rounded-xl p-5 flex items-center justify-center flex-col gap-2 cursor-pointer hover:bg-surface-container transition-colors border border-dashed border-outline-variant"
            >
              <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shadow-xs">
                <span className="material-symbols-outlined text-[26px]">
                  add_a_photo
                </span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  Tap to snap petrol bunk slip
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                  Instantly saved to shared machine book
                </span>
              </div>
            </div>
          ) : (
            <div className="relative mt-1 rounded-xl overflow-hidden shadow-xs border border-outline-variant/30">
              <img
                src={receiptImage}
                alt="Fuel receipt"
                className="w-full h-36 object-cover rounded-xl"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center justify-between text-white text-xs">
                <span className="font-label-sm truncate max-w-[200px]">
                  {receiptFileName}
                </span>
                <button
                  type="button"
                  onClick={() => setHasReceipt(false)}
                  className="text-tertiary-fixed-dim hover:text-white flex items-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Field Notes & Remarks Input */}
        <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-outline-variant/30">
          <label
            htmlFor="remarks-input"
            className="block font-label-md text-label-md text-on-surface mb-1.5 font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              edit_note
            </span>
            <span>Field Notes &amp; Remarks</span>
          </label>
          <input
            id="remarks-input"
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Filter change, driver lunch, bunk location"
            className="w-full h-12 px-3 rounded-xl bg-surface-container text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-secondary/30"
          />
        </div>
      </div>

      {/* Assigned Machinery Card */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="bg-surface-container-high rounded-2xl p-3.5 flex items-center gap-3 border border-outline-variant/30">
          <img
            src={HARVESTER_PHOTO_SQ}
            alt="Kubota DC-68G Paddy Master"
            className="w-14 h-14 rounded-xl object-cover shadow-xs shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider text-[11px]">
              Assigned Machinery
            </span>
            <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
              Kubota DC-68G Paddy Master
            </span>
            <span className="font-body-sm text-body-sm text-on-surface-variant truncate text-xs">
              Reg: KA-04-E-2194 • Operational
            </span>
          </div>
        </div>
      </div>

      {/* Save Button & Hint */}
      <div className="px-4 sm:px-6 mt-2 flex flex-col gap-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="w-full h-14 rounded-full bg-secondary text-on-secondary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[22px]">
            {isSaving ? 'hourglass_top' : 'save'}
          </span>
          <span>
            {isSaving
              ? 'Saving Expense...'
              : `Save Expense (₹ ${Number(amount).toLocaleString('en-IN')})`}
          </span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-center text-on-surface-variant px-2">
          <span className="material-symbols-outlined text-[16px] text-secondary">
            info
          </span>
          <span className="font-body-sm text-body-sm text-xs">
            Will be added to {isPartner1(payer) ? p1Name : p2Name}'s
            expense account and partnership ledger
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-inverse-surface text-inverse-on-surface px-4 py-3.5 rounded-2xl shadow-xl flex items-center justify-between z-50 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold">
              <span className="material-symbols-outlined text-[18px]">
                check
              </span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-label-md text-label-md font-bold">
                Expense Recorded
              </span>
              <span className="font-body-sm text-body-sm text-inverse-on-surface/80 text-xs">
                Ledger synchronized with{' '}
                {isPartner1(payer) ? p2Name : p1Name}
              </span>
            </div>
          </div>
          <span className="font-currency-card text-currency-card text-primary-fixed-dim font-extrabold">
            ₹ {Number(amount).toLocaleString('en-IN')}
          </span>
        </div>
      )}
    </div>
  );
};
