import React, { useState } from 'react';
import { useHarvester } from '../context/HarvesterContext';
import { useAuth } from '../context/AuthContext';
import { VoiceEntryModal } from './VoiceEntryModal';
import { formatDisplayDate, toISODateString, parseISODate } from '../utils/dateUtils';
import { cleanNumberInput, formatInputDisplay } from '../utils/numberUtils';

export const AddWork: React.FC = () => {
  const { addWorkEntry, businessSettings, listSettings, setCurrentScreen, drivers } = useHarvester();
  const { appUser } = useAuth();

  const [dateOfWork, setDateOfWork] = useState(formatDisplayDate(new Date()));
  const [isoDate, setIsoDate] = useState(toISODateString(new Date()));
  const [serviceType, setServiceType] = useState<string>('Harvesting');
  const [customerName, setCustomerName] = useState('');
  const [villageName, setVillageName] = useState(listSettings.villages[0]?.name || 'Maddur');
  const [phone, setPhone] = useState('');
  const [crop, setCrop] = useState<string>(listSettings.crops[0]?.name || 'Paddy (நெல்)');
  const [fieldOwnership, setFieldOwnership] = useState<'customer' | 'own'>('customer');
  const [unit, setUnit] = useState<'acres' | 'hours'>('acres');
  const [quantity, setQuantity] = useState<number | ''>(4.0);
  const [rate, setRate] = useState<number | ''>(2800);
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [collectedBy, setCollector] = useState<string>(appUser?.name || businessSettings.partner1Name);
  const [paymentMode, setPaymentMode] = useState<string>('Cash');
  const [driverName, setDriverName] = useState<string>(drivers[0]?.driverName || 'Ramesh');
  const [driverPhone, setDriverPhone] = useState<string>(drivers[0]?.phone || '9842099887');
  const [remarks, setRemarks] = useState('');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Math
  const numQty = quantity === '' ? 0 : Number(quantity);
  const numRate = rate === '' ? 0 : Number(rate);
  const numRecv = amountReceived === '' ? 0 : Number(amountReceived);
  const totalAmount = Math.round(numQty * numRate);
  const balance = Math.max(0, totalAmount - numRecv);

  const handlePaidInFull = () => {
    setAmountReceived(totalAmount);
  };

  const handleDriverSelect = (selectedName: string) => {
    setDriverName(selectedName);
    const matched = drivers.find((d) => d.driverName.toLowerCase() === selectedName.toLowerCase());
    if (matched && matched.phone) {
      setDriverPhone(matched.phone);
    }
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      alert('Please enter the customer / farmer name');
      return;
    }

    const newStatus =
      balance === 0 ? 'paid' : numRecv > 0 ? 'partly_paid' : 'pending';

    await addWorkEntry({
      farmerName: customerName.trim(),
      village: villageName.trim() || 'Local Village',
      phone: phone.trim(),
      serviceType,
      crop,
      cropVariety: crop,
      fieldOwnership,
      unit,
      quantity: Number(quantity) || 1,
      rate: Number(rate) || 2800,
      totalAmount,
      receivedAmount: Number(amountReceived) || 0,
      balanceAmount: balance,
      status: newStatus,
      date: dateOfWork,
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      receivedBy: collectedBy,
      paymentMode,
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      remarks: remarks.trim(),
      verified: true,
    });

    setToastMessage(`Work recorded for ${customerName}!`);
    setTimeout(() => {
      setCurrentScreen('work-list');
    }, 1000);
  };

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto pb-28">
      {/* Friendly Assistant Tip Banner */}
      <div className="px-4 sm:px-6 pt-2">
        <div className="bg-secondary-container/40 p-3 rounded-2xl flex items-center gap-3 shadow-xs border border-secondary/20">
          <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0 text-secondary">
            <span className="material-symbols-outlined text-[22px]">calculate</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-label-md text-label-md text-on-secondary-container font-bold">
              Field Work Entry
            </span>
            <span className="font-body-sm text-body-sm text-on-secondary-variant leading-tight">
              Amounts and partner allocations calculate automatically!
            </span>
          </div>
        </div>
      </div>

      {/* Main Work Entry Form */}
      <div className="px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* 1. Date Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-label-md text-label-md text-on-surface flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
              Date of Work
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setIsoDate(toISODateString(now));
                  setDateOfWork(formatDisplayDate(now));
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
                  setDateOfWork(formatDisplayDate(yest));
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high cursor-pointer"
              >
                Yesterday
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest h-14 px-3.5 rounded-2xl flex items-center justify-between shadow-xs border border-outline-variant/30 gap-2">
            <input
              type="date"
              value={isoDate}
              onChange={(e) => {
                if (e.target.value) {
                  setIsoDate(e.target.value);
                  setDateOfWork(formatDisplayDate(parseISODate(e.target.value)));
                }
              }}
              className="bg-transparent font-headline-sm text-sm sm:text-base text-on-surface font-bold focus:outline-none w-full cursor-pointer"
            />
            <span className="text-xs font-semibold text-secondary shrink-0 hidden sm:inline-block">
              {dateOfWork}
            </span>
          </div>
        </div>

        {/* 2. Agro Service Selection */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-2.5">
          <label className="font-label-md text-label-md text-on-surface font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-secondary">handyman</span>
              <span>Agro Service Provided</span>
            </span>
            <span className="text-[11px] font-bold text-secondary uppercase bg-secondary-container/60 px-2 py-0.5 rounded-full">
              {serviceType}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Harvesting', label: 'Harvesting', icon: 'agriculture' },
              { id: 'Spraying By drone', label: 'Spraying By drone', icon: 'flight' },
              { id: 'Land ploughing', label: 'Land ploughing', icon: 'precision_manufacturing' },
            ].map((srv) => (
              <button
                key={srv.id}
                type="button"
                onClick={() => setServiceType(srv.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  serviceType === srv.id
                    ? 'bg-secondary text-on-secondary border-secondary shadow-md font-bold scale-[1.02]'
                    : 'bg-surface-container text-on-surface border-transparent hover:bg-surface-container-high font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] mb-1">{srv.icon}</span>
                <span className="text-[11px] leading-tight font-bold">{srv.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 & 4. Customer Details */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cust-name"
              className="font-label-md text-label-md text-on-surface font-bold flex items-center justify-between"
            >
              <span>Customer Name</span>
              <span className="font-label-sm text-label-sm text-secondary bg-secondary-container/50 px-2 py-0.5 rounded-full font-bold">
                Farmer
              </span>
            </label>
            <div className="relative flex items-center">
              <input
                id="cust-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramasamy Gounder"
                className="w-full h-14 bg-surface-container-low px-4 pr-12 rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors border border-transparent focus:border-secondary/40 font-medium"
              />
              <button
                type="button"
                onClick={() => setIsVoiceOpen(true)}
                className="absolute right-3 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-secondary cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">mic</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="village-name"
                className="font-label-md text-label-md text-on-surface font-bold flex items-center justify-between"
              >
                <span>Village / Area</span>
                <span className="font-label-sm text-label-sm text-outline">Location</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">
                  location_on
                </span>
                <input
                  id="village-name"
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="e.g. Semmipalayam"
                  className="w-full h-14 bg-surface-container-low pl-11 pr-4 rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors border border-transparent focus:border-secondary/40 font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="cust-phone"
                className="font-label-md text-label-md text-on-surface font-bold flex items-center justify-between"
              >
                <span>Phone Number</span>
                <span className="font-label-sm text-label-sm text-outline">WhatsApp</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-outline text-[20px]">
                  call
                </span>
                <input
                  id="cust-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9842012345"
                  className="w-full h-14 bg-surface-container-low pl-11 pr-4 rounded-xl font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest transition-colors border border-transparent focus:border-secondary/40 font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4 & 5. Crop Selection & Field Ownership */}
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-bold">
              Crop Harvested
            </label>
            <div className="flex flex-wrap gap-2">
              {listSettings.crops.filter((c) => !c.hidden).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCrop(c.name)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    crop === c.name
                      ? 'bg-secondary text-on-secondary shadow-xs'
                      : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-bold">
              Field Ownership
            </label>
            <div className="grid grid-cols-2 gap-2.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setFieldOwnership('customer')}
                className={`h-14 rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg font-bold transition-all active:scale-[0.98] cursor-pointer ${
                  fieldOwnership === 'customer'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface'
                }`}
              >
                <span>Customer Field</span>
              </button>

              <button
                type="button"
                onClick={() => setFieldOwnership('own')}
                className={`h-14 rounded-xl flex items-center justify-center gap-2 font-label-lg text-label-lg font-bold transition-all active:scale-[0.98] cursor-pointer ${
                  fieldOwnership === 'own'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface'
                }`}
              >
                <span>Our Own Field</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6 & 7. Measurement & Rate */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3.5">
          <div className="flex items-center justify-between pb-1">
            <span className="font-label-md text-label-md text-on-surface font-bold">
              Measurement Unit
            </span>
            <div className="inline-flex bg-surface-container p-1 rounded-full">
              <button
                type="button"
                onClick={() => setUnit('acres')}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                  unit === 'acres' ? 'bg-secondary text-on-secondary shadow-xs' : 'text-on-surface'
                }`}
              >
                Acres
              </button>
              <button
                type="button"
                onClick={() => setUnit('hours')}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-all cursor-pointer ${
                  unit === 'hours' ? 'bg-secondary text-on-secondary shadow-xs' : 'text-on-surface'
                }`}
              >
                Hours
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="work-qty" className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                Total {unit === 'acres' ? 'Acres' : 'Hours'}
              </label>
              <input
                id="work-qty"
                type="text"
                inputMode="decimal"
                value={formatInputDisplay(quantity)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setQuantity(cleanNumberInput(e.target.value))}
                placeholder="0"
                className="w-full h-14 bg-surface-container-low px-3 rounded-xl font-headline-md text-headline-md text-on-surface text-center focus:outline-none focus:bg-surface-container-lowest shadow-inner font-extrabold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="work-rate" className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                Rate / {unit === 'acres' ? 'Acre' : 'Hour'} (₹)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 font-headline-sm text-headline-sm text-outline font-bold">₹</span>
                <input
                  id="work-rate"
                  type="text"
                  inputMode="numeric"
                  value={formatInputDisplay(rate)}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setRate(cleanNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full h-14 bg-surface-container-low pl-8 pr-3 rounded-xl font-headline-md text-headline-md text-on-surface text-right focus:outline-none focus:bg-surface-container-lowest shadow-inner font-extrabold"
                />
              </div>
            </div>
          </div>

          {/* Total Amount Highlight Banner */}
          <div className="bg-secondary-container/60 p-4 rounded-xl flex items-center justify-between border border-secondary/20">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-secondary-container uppercase tracking-wider font-bold">
                Total Work Amount
              </span>
              <span className="font-body-sm text-body-sm text-secondary font-medium">
                {numQty} {unit} × ₹ {numRate.toLocaleString('en-IN')}
              </span>
            </div>
            <span className="font-currency-card text-currency-card font-extrabold text-[26px] text-on-secondary-container">
              ₹ {totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Received & Partner Assignment */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label htmlFor="amount-received" className="font-label-md text-label-md text-on-surface font-bold">
                Amount Received Now (₹)
              </label>
              <button
                type="button"
                onClick={handlePaidInFull}
                className="font-label-sm text-label-sm text-primary font-bold active:opacity-60 underline cursor-pointer"
              >
                Paid in Full
              </button>
            </div>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-display-lg-mobile text-display-lg-mobile text-secondary font-extrabold">
                ₹
              </span>
              <input
                id="amount-received"
                type="text"
                inputMode="numeric"
                value={formatInputDisplay(amountReceived)}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setAmountReceived(cleanNumberInput(e.target.value))}
                placeholder="0"
                className="w-full h-16 bg-surface-container-low pl-11 pr-4 rounded-xl font-display-lg-mobile text-display-lg-mobile text-on-surface font-extrabold focus:outline-none focus:bg-surface-container-lowest shadow-inner"
              />
            </div>
          </div>

          {/* Received By Partner Selector */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="font-label-md text-label-md text-on-surface font-bold">
              Cash Collected By Partner
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[businessSettings.partner1Name, businessSettings.partner2Name].map((pName) => (
                <div
                  key={pName}
                  onClick={() => setCollector(pName)}
                  className={`p-3 rounded-xl flex items-center gap-2.5 cursor-pointer shadow-xs border-2 transition-all ${
                    collectedBy === pName
                      ? 'bg-primary/10 border-primary'
                      : 'bg-surface-container-low border-transparent'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      collectedBy === pName
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-highest text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                    {pName}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Pending */}
          {balance <= 0 ? (
            <div className="bg-secondary-container/50 p-4 rounded-xl flex items-center justify-between border border-secondary/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
                <span className="font-label-sm font-bold text-on-secondary-container uppercase">
                  Fully Settled
                </span>
              </div>
              <div className="font-currency-card text-secondary font-extrabold">₹ 0 (Paid)</div>
            </div>
          ) : (
            <div className="bg-error-container/60 p-4 rounded-xl flex items-center justify-between border border-error/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-error">pending_actions</span>
                <span className="font-label-sm font-bold text-on-error-container uppercase">
                  Pending Balance
                </span>
              </div>
              <div className="font-currency-card text-error font-extrabold">
                ₹ {balance.toLocaleString('en-IN')}
              </div>
            </div>
          )}
        </div>

        {/* Operator / Driver In-Charge */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="font-label-md text-label-md text-on-surface font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[20px] text-secondary">engineering</span>
              <span>Operator / Driver Details</span>
            </label>
            <span className="font-label-sm text-[11px] text-outline font-semibold">Prints on Receipt</span>
          </div>

          {drivers.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-on-surface-variant">Select from Registered Drivers</label>
              <select
                value={drivers.some((d) => d.driverName.toLowerCase() === driverName.toLowerCase()) ? driverName : ''}
                onChange={(e) => {
                  if (e.target.value) handleDriverSelect(e.target.value);
                }}
                className="w-full h-11 px-3 rounded-xl bg-surface-container text-xs font-bold text-on-surface focus:outline-none border border-transparent"
              >
                <option value="">-- Choose Driver (or enter below) --</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.driverName}>
                    {drv.driverName} {drv.phone ? `(${drv.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Operator Name</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Ramesh"
                className="w-full h-12 bg-surface-container-low px-3.5 rounded-xl font-body-md text-sm text-on-surface focus:outline-none font-medium border border-transparent focus:border-secondary/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface">Operator Phone Number</label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="e.g. 9842099887"
                className="w-full h-12 bg-surface-container-low px-3.5 rounded-xl font-body-md text-sm text-on-surface focus:outline-none font-medium border border-transparent focus:border-secondary/40"
              />
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-1.5">
          <label htmlFor="work-remarks" className="font-label-md text-label-md text-on-surface font-bold">
            Remarks &amp; Field Location
          </label>
          <input
            id="work-remarks"
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Near lake, clean straw"
            className="w-full h-14 bg-surface-container-low px-4 rounded-xl font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>

        {/* Save Button */}
        <div className="sticky bottom-3 z-30 pt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-14 bg-secondary text-on-secondary rounded-full font-label-lg text-label-lg font-bold flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(32,108,59,0.35)] active:translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">save</span>
            <span>Save Work Entry (₹ {totalAmount.toLocaleString('en-IN')})</span>
          </button>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceEntryModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onApplyParsedWork={(parsed) => {
          setCustomerName(parsed.farmerName);
          setVillageName(parsed.village);
          setQuantity(parsed.quantity);
          setRate(parsed.rate);
          setAmountReceived(parsed.amountReceived);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 max-w-[90%] bg-inverse-surface text-inverse-on-surface px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-50 animate-in fade-in duration-200">
          <span className="material-symbols-outlined text-secondary-fixed text-[20px]">
            check_circle
          </span>
          <span className="font-label-md text-label-md font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
