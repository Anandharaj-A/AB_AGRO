import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { logActivity } from '../services/activityLogger';
import {
  toISODateString,
  parseISODate,
  formatMonthYear,
  formatDisplayDate,
  addDays,
  addMonths,
  MONTH_NAMES,
  doesEntryMatchDate,
  doesEntryMatchMonth,
} from '../utils/dateUtils';
import {
  WorkEntry,
  WorkPayment,
  ExpenseEntry,
  DriverShift,
  DriverAdvance,
  DriverSalary,
  MachineCareEntry,
  SettlementRecord,
  BusinessSettings,
  ListSettings,
  ActivityLog,
  CustomListItem
} from '../types';

export type ScreenType =
  | 'home-dashboard'
  | 'work-list'
  | 'add-work'
  | 'add-expense'
  | 'expense-list'
  | 'driver-management'
  | 'machine-care'
  | 'admin-settings'
  | 'activity-log'
  | 'reports';

const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: 'Harvester Book',
  harvesterModel: 'Kubota DC-68G Paddy Master',
  registrationNumber: 'KA-04-E-2194',
  partner1Name: 'Anand',
  partner2Name: 'Boopathi',
  profitSharePartner1: 50,
  profitSharePartner2: 50,
};

const DEFAULT_LIST_SETTINGS: ListSettings = {
  services: [
    { id: 'harvesting', name: 'Harvesting' },
    { id: 'drone_spraying', name: 'Spraying By drone' },
    { id: 'land_ploughing', name: 'Land ploughing' },
  ],
  expenseCategories: [
    { id: 'diesel', name: 'Diesel' },
    { id: 'spares', name: 'Spares' },
    { id: 'workshop', name: 'Workshop' },
    { id: 'tools', name: 'Tools' },
    { id: 'food', name: 'Food/Tea' },
    { id: 'petrol', name: 'Bike Fuel' },
    { id: 'driver', name: 'Driver Pay' },
    { id: 'other', name: 'Other' },
  ],
  paymentModes: [
    { id: 'cash', name: 'Cash' },
    { id: 'upi', name: 'GPay / PhonePe / UPI' },
    { id: 'bank', name: 'Bank Transfer' },
    { id: 'hpcl_card', name: 'HPCL Fleet Card' },
  ],
  crops: [
    { id: 'paddy', name: 'Paddy (நெல்)' },
    { id: 'ragi', name: 'Ragi (கேழ்வரகு)' },
    { id: 'maize', name: 'Maize (மக்காச்சோளம்)' },
    { id: 'groundnut', name: 'Groundnut (வேர்க்கடலை)' },
  ],
  villages: [
    { id: 'maddur', name: 'Maddur' },
    { id: 'semmipalayam', name: 'Semmipalayam' },
    { id: 'koppa', name: 'Koppa' },
    { id: 'pongalur', name: 'Pongalur' },
    { id: 'kethanur', name: 'Kethanur' },
  ],
};

interface HarvesterContextType {
  workEntries: WorkEntry[];
  expenseEntries: ExpenseEntry[];
  drivers: DriverShift[];
  driverAdvances: DriverAdvance[];
  driverSalaries: DriverSalary[];
  machineCareEntries: MachineCareEntry[];
  settlements: SettlementRecord[];
  activityLogs: ActivityLog[];
  businessSettings: BusinessSettings;
  listSettings: ListSettings;
  currentScreen: ScreenType;
  selectedDate: string;
  selectedMonth: string;
  dateFilterMode: 'month' | 'day' | 'all';
  activePartnerView: string;
  filteredWorkEntries: WorkEntry[];
  filteredExpenseEntries: ExpenseEntry[];
  // Metrics
  totalIncome: number;
  totalReceived: number;
  totalPending: number;
  pendingCount: number;
  totalWorkCount: number;
  totalExpenses: number;
  billedProfit: number;
  cashProfit: number;
  netProfit: number;
  profitViewMode: 'cash' | 'billed';
  setProfitViewMode: (mode: 'cash' | 'billed') => void;
  netProfitPartner1: number;
  netProfitPartner2: number;
  p1Name: string;
  p2Name: string;
  isPartner1: (name?: string) => boolean;
  isPartner2: (name?: string) => boolean;
  partner1Spent: number;
  partner2Spent: number;
  partner1Received: number;
  partner2Received: number;
  partner1Collected: number;
  partner2Collected: number;
  partner1SettledOut: number;
  partner1SettledIn: number;
  partner2SettledOut: number;
  partner2SettledIn: number;
  netAnand: number;
  netBoopathi: number;
  totalNet: number;
  fairShareAnand: number;
  fairShareBoopathi: number;
  anandOwes: number;
  settlementDirective: {
    from: string;
    to: string;
    amount: number;
    isSettled: boolean;
    text: string;
  };
  settlementOwed: {
    from: string;
    to: string;
    amount: number;
    difference: number;
  };
  billedShare1: number;
  billedShare2: number;
  cashShare1: number;
  cashShare2: number;
  pendingShare1: number;
  pendingShare2: number;
  partner1AdvanceDeducted: number;
  partner2AdvanceDeducted: number;
  partner1RemainingShare: number;
  partner2RemainingShare: number;
  // Navigation & partner view
  setCurrentScreen: (screen: ScreenType) => void;
  setSelectedDate: (date: string) => void;
  setSelectedMonth: (month: string) => void;
  setDateFilterMode: (mode: 'month' | 'day' | 'all') => void;
  stepDate: (direction: -1 | 1) => void;
  setActivePartnerView: (name: string) => void;
  // CRUD - Works
  addWorkEntry: (entry: Omit<WorkEntry, 'id'>) => Promise<void>;
  updateWorkEntry: (id: string, entry: Partial<WorkEntry>) => Promise<void>;
  deleteWorkEntry: (id: string) => Promise<void>;
  recordPayment: (workId: string, amount: number, collectedBy: string, paymentMode?: string) => Promise<void>;
  // CRUD - Expenses
  addExpenseEntry: (entry: Omit<ExpenseEntry, 'id'>) => Promise<void>;
  updateExpenseEntry: (id: string, entry: Partial<ExpenseEntry>) => Promise<void>;
  deleteExpenseEntry: (id: string) => Promise<void>;
  // CRUD - Drivers
  addDriver: (driver: Omit<DriverShift, 'id'>) => Promise<void>;
  updateDriver: (id: string, driver: Partial<DriverShift>) => Promise<void>;
  deleteDriver: (id: string) => Promise<void>;
  // Driver Advances & Salaries
  addDriverAdvance: (adv: Omit<DriverAdvance, 'id'>) => Promise<void>;
  updateDriverAdvance: (id: string, adv: Partial<DriverAdvance>) => Promise<void>;
  deleteDriverAdvance: (id: string) => Promise<void>;
  addDriverSalary: (sal: Omit<DriverSalary, 'id'>) => Promise<void>;
  updateDriverSalary: (id: string, sal: Partial<DriverSalary>) => Promise<void>;
  deleteDriverSalary: (id: string) => Promise<void>;
  // Machine Care
  addMachineCare: (care: Omit<MachineCareEntry, 'id'>) => Promise<void>;
  updateMachineCare: (id: string, care: Partial<MachineCareEntry>) => Promise<void>;
  deleteMachineCare: (id: string) => Promise<void>;
  // Settlements
  settlePartnerAccount: (fromPartner?: string, toPartner?: string, amount?: number, notes?: string) => Promise<void>;
  deleteSettlement: (id: string) => Promise<void>;
  // Settings
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  updateListSettings: (settings: Partial<ListSettings>) => Promise<void>;
  // Data Tools
  clearAllDemoData: () => Promise<void>;
  exportDataToCSV: () => void;
}

const HarvesterContext = createContext<HarvesterContextType | undefined>(undefined);

export const HarvesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appUser, currentUser } = useAuth();

  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([]);
  const [expenseEntries, setExpenseEntries] = useState<ExpenseEntry[]>([]);
  const [drivers, setDrivers] = useState<DriverShift[]>([]);
  const [driverAdvances, setDriverAdvances] = useState<DriverAdvance[]>([]);
  const [driverSalaries, setDriverSalaries] = useState<DriverSalary[]>([]);
  const [machineCareEntries, setMachineCareEntries] = useState<MachineCareEntry[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_BUSINESS_SETTINGS);
  const [listSettings, setListSettings] = useState<ListSettings>(DEFAULT_LIST_SETTINGS);

  const now = new Date();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home-dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(toISODateString(now));
  const [selectedMonth, setSelectedMonth] = useState<string>(formatMonthYear(now));
  const [dateFilterMode, setDateFilterMode] = useState<'month' | 'day' | 'all'>('month');
  const [activePartnerView, setActivePartnerView] = useState<string>('Anand');
  const [profitViewMode, setProfitViewMode] = useState<'cash' | 'billed'>('cash');

  const stepDate = (direction: -1 | 1) => {
    if (dateFilterMode === 'day') {
      const cur = parseISODate(selectedDate);
      const next = addDays(cur, direction);
      setSelectedDate(toISODateString(next));
      setSelectedMonth(formatMonthYear(next));
    } else {
      // Month mode (or all mode)
      const parts = selectedMonth.trim().split(' ');
      const mName = parts[0];
      const yr = parseInt(parts[1], 10) || new Date().getFullYear();
      const mIdx = MONTH_NAMES.indexOf(mName);
      const cur = new Date(yr, mIdx !== -1 ? mIdx : new Date().getMonth(), 1);
      const next = addMonths(cur, direction);
      setSelectedMonth(formatMonthYear(next));
      setSelectedDate(toISODateString(next));
    }
  };

  // Sync settings from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const unsubBiz = onSnapshot(doc(db, 'settings', 'business'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as BusinessSettings;
        setBusinessSettings({ ...DEFAULT_BUSINESS_SETTINGS, ...data });
        if (data.partner1Name) setActivePartnerView(data.partner1Name);
      } else {
        // Initialize default business settings doc
        setDoc(doc(db, 'settings', 'business'), DEFAULT_BUSINESS_SETTINGS).catch(console.error);
      }
    });

    const unsubList = onSnapshot(doc(db, 'settings', 'lists'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ListSettings;
        setListSettings({ ...DEFAULT_LIST_SETTINGS, ...data });
      } else {
        setDoc(doc(db, 'settings', 'lists'), DEFAULT_LIST_SETTINGS).catch(console.error);
      }
    });

    return () => {
      unsubBiz();
      unsubList();
    };
  }, [currentUser]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser) {
      setWorkEntries([]);
      setExpenseEntries([]);
      setDrivers([]);
      setDriverAdvances([]);
      setDriverSalaries([]);
      setMachineCareEntries([]);
      setSettlements([]);
      setActivityLogs([]);
      return;
    }

    const unsubWorks = onSnapshot(collection(db, 'works'), (snap) => {
      const items: WorkEntry[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as WorkEntry));
      setWorkEntries(items);
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snap) => {
      const items: ExpenseEntry[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as ExpenseEntry));
      setExpenseEntries(items);
    });

    const unsubDrivers = onSnapshot(collection(db, 'drivers'), (snap) => {
      const items: DriverShift[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as DriverShift));
      setDrivers(items);
    });

    const unsubAdvances = onSnapshot(collection(db, 'driver_advances'), (snap) => {
      const items: DriverAdvance[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as DriverAdvance));
      setDriverAdvances(items);
    });

    const unsubSalaries = onSnapshot(collection(db, 'driver_salaries'), (snap) => {
      const items: DriverSalary[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as DriverSalary));
      setDriverSalaries(items);
    });

    const unsubCare = onSnapshot(collection(db, 'machine_care'), (snap) => {
      const items: MachineCareEntry[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as MachineCareEntry));
      setMachineCareEntries(items);
    });

    const unsubSettlements = onSnapshot(collection(db, 'settlements'), (snap) => {
      const items: SettlementRecord[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as SettlementRecord));
      setSettlements(items);
    });

    const unsubLogs = onSnapshot(collection(db, 'activity_logs'), (snap) => {
      const items: ActivityLog[] = [];
      snap.forEach((d) => items.push({ id: d.id, ...d.data() } as ActivityLog));
      items.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setActivityLogs(items);
    });

    return () => {
      unsubWorks();
      unsubExpenses();
      unsubDrivers();
      unsubAdvances();
      unsubSalaries();
      unsubCare();
      unsubSettlements();
      unsubLogs();
    };
  }, [currentUser]);

  // Dynamic filtering based on selected date / month / all
  const filteredWorkEntries = workEntries.filter((w) => {
    if (dateFilterMode === 'all') return true;
    if (dateFilterMode === 'day') return doesEntryMatchDate(w.date, selectedDate);
    return doesEntryMatchMonth(w.date, selectedMonth);
  });

  const filteredExpenseEntries = expenseEntries.filter((e) => {
    if (dateFilterMode === 'all') return true;
    if (dateFilterMode === 'day') return doesEntryMatchDate(e.date, selectedDate);
    return doesEntryMatchMonth(e.date, selectedMonth);
  });

  // Dynamic calculations based strictly on real live entered data
  const totalWorkCount = filteredWorkEntries.length;
  const totalIncome = filteredWorkEntries.reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0);
  const totalReceived = filteredWorkEntries.reduce((sum, w) => sum + (Number(w.receivedAmount) || 0), 0);
  const totalPending = filteredWorkEntries.reduce((sum, w) => sum + (Number(w.balanceAmount) || 0), 0);
  const pendingCount = filteredWorkEntries.filter((w) => (w.balanceAmount || 0) > 0).length;

  const totalExpenses = filteredExpenseEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const billedProfit = totalIncome - totalExpenses; // Billed profit = total billed − expenses
  const cashProfit = totalReceived - totalExpenses; // Cash profit = total received − expenses

  const p1Name = (businessSettings.partner1Name || 'Anand').trim();
  const p2Name = (businessSettings.partner2Name || 'Boopathi').trim();

  const isPartner1 = (name?: string): boolean => {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    const p1 = p1Name.toLowerCase();
    return n === p1 || n === 'anand' || n === 'partner 1' || n === 'partner1';
  };

  const isPartner2 = (name?: string): boolean => {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    const p2 = p2Name.toLowerCase();
    return n === p2 || n === 'boopathi' || n === 'partner 2' || n === 'partner2';
  };

  // Cash received per partner across all jobs and payments
  let partner1Received = 0;
  let partner2Received = 0;

  workEntries.forEach((w) => {
    if (w.payments && w.payments.length > 0) {
      w.payments.forEach((p) => {
        const amt = Number(p.amount) || 0;
        if (isPartner2(p.receivedBy)) {
          partner2Received += amt;
        } else {
          partner1Received += amt;
        }
      });
    } else {
      const amt = Number(w.receivedAmount) || 0;
      if (amt > 0) {
        if (isPartner2(w.receivedBy)) {
          partner2Received += amt;
        } else {
          partner1Received += amt;
        }
      }
    }
  });

  const partner1Collected = partner1Received;
  const partner2Collected = partner2Received;

  // Expenses spent from pocket per partner
  const partner1Spent = expenseEntries
    .filter((e) => isPartner1(e.paidBy))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const partner2Spent = expenseEntries
    .filter((e) => isPartner2(e.paidBy))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Settlement transfers between partners
  const partner1SettledOut = settlements
    .filter((s) => isPartner1(s.fromPartner))
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const partner1SettledIn = settlements
    .filter((s) => isPartner1(s.toPartner))
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const partner2SettledOut = settlements
    .filter((s) => isPartner2(s.fromPartner))
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const partner2SettledIn = settlements
    .filter((s) => isPartner2(s.toPartner))
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // Net cash position per partner:
  // net = received - spent - settledOut + settledIn;
  const netAnand = partner1Received - partner1Spent - partner1SettledOut + partner1SettledIn;
  const netBoopathi = partner2Received - partner2Spent - partner2SettledOut + partner2SettledIn;

  // totals
  const totalNet = netAnand + netBoopathi;

  const share1Ratio = (businessSettings.profitSharePartner1 || 50) / 100;
  const share2Ratio = (businessSettings.profitSharePartner2 || 50) / 100;

  const fairShareAnand = totalNet * share1Ratio;
  const fairShareBoopathi = totalNet * share2Ratio;

  // positive = Anand holds extra money and must pay Boopathi
  // negative = Boopathi holds extra money and must pay Anand
  const anandOwes = Math.round(netAnand - fairShareAnand);

  let settlementDirective: {
    from: string;
    to: string;
    amount: number;
    isSettled: boolean;
    text: string;
  };

  if (anandOwes > 0) {
    settlementDirective = {
      from: p1Name,
      to: p2Name,
      amount: anandOwes,
      isSettled: false,
      text: `${p1Name} pays ${p2Name} ₹ ${anandOwes.toLocaleString('en-IN')}`,
    };
  } else if (anandOwes < 0) {
    settlementDirective = {
      from: p2Name,
      to: p1Name,
      amount: Math.abs(anandOwes),
      isSettled: false,
      text: `${p2Name} pays ${p1Name} ₹ ${Math.abs(anandOwes).toLocaleString('en-IN')}`,
    };
  } else {
    settlementDirective = {
      from: p1Name,
      to: p2Name,
      amount: 0,
      isSettled: true,
      text: 'Settled',
    };
  }

  const settlementOwed = {
    from: settlementDirective.from,
    to: settlementDirective.to,
    amount: settlementDirective.amount,
    difference: Math.abs(partner1Spent - partner2Spent),
  };

  // Profit calculations based on active view mode
  const netProfit = profitViewMode === 'billed' ? billedProfit : cashProfit;

  const billedShare1 = Math.round(billedProfit * share1Ratio);
  const billedShare2 = Math.round(billedProfit * share2Ratio);

  const cashShare1 = Math.round(cashProfit * share1Ratio);
  const cashShare2 = Math.round(cashProfit * share2Ratio);

  const pendingShare1 = Math.round(totalPending * share1Ratio);
  const pendingShare2 = Math.round(totalPending * share2Ratio);

  // Remaining profit to be distributed:
  // When accounts are settled, each partner has already pocketed their full share of current cash profit.
  // Any remaining profit comes from uncollected dues from farmers.
  const partner1RemainingShare = settlementDirective.isSettled
    ? pendingShare1
    : Math.max(0, cashShare1 - netAnand) + pendingShare1;

  const partner2RemainingShare = settlementDirective.isSettled
    ? pendingShare2
    : Math.max(0, cashShare2 - netBoopathi) + pendingShare2;

  const partner1AdvanceDeducted = partner1Received;
  const partner2AdvanceDeducted = partner2Received;

  const netProfitPartner1 = profitViewMode === 'billed' ? billedShare1 : Math.round(cashProfit * share1Ratio);
  const netProfitPartner2 = profitViewMode === 'billed' ? billedShare2 : Math.round(cashProfit * share2Ratio);

  const getAuditStamp = (isEdit: boolean = false) => {
    const now = new Date().toISOString();
    if (!isEdit) {
      return {
        addedByUid: appUser?.uid || '',
        addedByName: appUser?.name || 'Anonymous',
        addedAt: now,
        lastEditedByUid: appUser?.uid || '',
        lastEditedByName: appUser?.name || 'Anonymous',
        lastEditedAt: now,
      };
    }
    return {
      lastEditedByUid: appUser?.uid || '',
      lastEditedByName: appUser?.name || 'Anonymous',
      lastEditedAt: now,
    };
  };

  // Helper to remove any undefined values before writing to Firestore
  const stripUndefined = <T,>(obj: T): T => {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => stripUndefined(item)) as unknown as T;
    }
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = stripUndefined(value);
      }
    }
    return clean as T;
  };

  // CRUD Implementations
  const addWorkEntry = async (entry: Omit<WorkEntry, 'id'>) => {
    const newDocRef = doc(collection(db, 'works'));
    const workData: WorkEntry = {
      ...entry,
      id: newDocRef.id,
      receiptNumber: entry.receiptNumber || `HB-2024-${Math.floor(100 + Math.random() * 900)}`,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, stripUndefined(workData));
    await logActivity(appUser, 'create', 'work', `Created work for ${entry.farmerName} (₹ ${entry.totalAmount})`, newDocRef.id, entry.farmerName);
  };

  const updateWorkEntry = async (id: string, entry: Partial<WorkEntry>) => {
    const docRef = doc(db, 'works', id);
    const updatePayload = stripUndefined({
      ...entry,
      ...getAuditStamp(true),
    });
    await updateDoc(docRef, updatePayload);
    await logActivity(appUser, 'update', 'work', `Updated work entry ${entry.farmerName || id}`, id, entry.farmerName);
  };

  const deleteWorkEntry = async (id: string) => {
    const item = workEntries.find((w) => w.id === id);
    setWorkEntries((prev) => prev.filter((w) => w.id !== id));
    try {
      await deleteDoc(doc(db, 'works', id));
      await logActivity(appUser, 'delete', 'work', `Deleted work entry for ${item?.farmerName || id}`, id, item?.farmerName);
    } catch (err) {
      console.error('Failed to delete work entry from firestore:', err);
      if (item) {
        setWorkEntries((prev) => [...prev, item]);
      }
      throw err;
    }
  };

  const recordPayment = async (workId: string, amount: number, collectedBy: string, paymentMode: string = 'cash') => {
    const work = workEntries.find((w) => w.id === workId);
    if (!work) return;

    const canonicalCollector = isPartner2(collectedBy) ? p2Name : p1Name;
    const newReceived = (Number(work.receivedAmount) || 0) + amount;
    const newBalance = Math.max(0, (Number(work.totalAmount) || 0) - newReceived);
    const newStatus = newBalance === 0 ? 'paid' : 'partly_paid';

    const newPayment: WorkPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      amount,
      receivedBy: canonicalCollector,
      date: formatDisplayDate(new Date()),
      mode: paymentMode,
    };

    const existingPayments: WorkPayment[] = work.payments && work.payments.length > 0
      ? [...work.payments]
      : (Number(work.receivedAmount) || 0) > 0
        ? [
            {
              id: `init-${work.id}`,
              amount: Number(work.receivedAmount) || 0,
              receivedBy: isPartner2(work.receivedBy) ? p2Name : p1Name,
              date: work.date,
              mode: work.paymentMode || 'cash',
            },
          ]
        : [];

    const updatedPayments = [...existingPayments, newPayment];

    await updateWorkEntry(workId, {
      receivedAmount: newReceived,
      balanceAmount: newBalance,
      status: newStatus,
      receivedBy: canonicalCollector,
      payments: updatedPayments,
    });
    await logActivity(
      appUser,
      'update',
      'work',
      `Collected ₹ ${amount} cash from ${work.farmerName} by ${canonicalCollector}`,
      workId,
      work.farmerName
    );
  };

  const addExpenseEntry = async (entry: Omit<ExpenseEntry, 'id'>) => {
    const canonicalPayer = isPartner2(entry.paidBy) ? p2Name : p1Name;
    const newDocRef = doc(collection(db, 'expenses'));
    const expData: ExpenseEntry = {
      ...entry,
      paidBy: canonicalPayer,
      id: newDocRef.id,
      ...getAuditStamp(false),
    };
    const sanitized = stripUndefined(expData);
    // Optimistic update
    setExpenseEntries((prev) => [sanitized, ...prev]);
    await setDoc(newDocRef, sanitized);
    await logActivity(
      appUser,
      'create',
      'expense',
      `Added ${entry.category} expense ₹ ${entry.amount} paid by ${canonicalPayer}`,
      newDocRef.id,
      entry.category
    );
  };

  const updateExpenseEntry = async (id: string, entry: Partial<ExpenseEntry>) => {
    const updatedEntry = {
      ...entry,
      ...(entry.paidBy ? { paidBy: isPartner2(entry.paidBy) ? p2Name : p1Name } : {}),
    };
    const sanitized = stripUndefined({
      ...updatedEntry,
      ...getAuditStamp(true),
    });
    // Optimistic update
    setExpenseEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...sanitized } : e)));
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, sanitized);
    await logActivity(
      appUser,
      'update',
      'expense',
      `Updated expense entry ${id} (₹ ${entry.amount || ''})`,
      id,
      entry.category
    );
  };

  const deleteExpenseEntry = async (id: string) => {
    const item = expenseEntries.find((e) => e.id === id);
    setExpenseEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await logActivity(appUser, 'delete', 'expense', `Deleted ${item?.category || 'expense'} (₹ ${item?.amount})`, id, item?.category);
    } catch (err) {
      console.error('Failed to delete expense entry from firestore:', err);
      if (item) {
        setExpenseEntries((prev) => [...prev, item]);
      }
      throw err;
    }
  };

  const addDriver = async (driver: Omit<DriverShift, 'id'>) => {
    const newDocRef = doc(collection(db, 'drivers'));
    const drvData: DriverShift = {
      ...driver,
      id: newDocRef.id,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, stripUndefined(drvData));
    await logActivity(appUser, 'create', 'driver', `Added driver ${driver.driverName}`, newDocRef.id, driver.driverName);
  };

  const updateDriver = async (id: string, driver: Partial<DriverShift>) => {
    const docRef = doc(db, 'drivers', id);
    await updateDoc(docRef, stripUndefined({
      ...driver,
      ...getAuditStamp(true),
    }));
    await logActivity(appUser, 'update', 'driver', `Updated driver ${driver.driverName || id}`, id, driver.driverName);
  };

  const deleteDriver = async (id: string) => {
    const item = drivers.find((d) => d.id === id);
    await deleteDoc(doc(db, 'drivers', id));
    await logActivity(appUser, 'delete', 'driver', `Deleted driver ${item?.driverName || id}`, id, item?.driverName);
  };

  const addDriverAdvance = async (adv: Omit<DriverAdvance, 'id'>) => {
    const newDocRef = doc(collection(db, 'driver_advances'));
    const data: DriverAdvance = {
      ...adv,
      id: newDocRef.id,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, stripUndefined(data));
    await logActivity(appUser, 'create', 'driver_advance', `Gave ₹ ${adv.amount} advance to ${adv.driverName}`, newDocRef.id, adv.driverName);
  };

  const updateDriverAdvance = async (id: string, adv: Partial<DriverAdvance>) => {
    await updateDoc(doc(db, 'driver_advances', id), stripUndefined({
      ...adv,
      ...getAuditStamp(true),
    }));
    await logActivity(appUser, 'update', 'driver_advance', `Updated advance for ${adv.driverName || id}`, id);
  };

  const deleteDriverAdvance = async (id: string) => {
    await deleteDoc(doc(db, 'driver_advances', id));
    await logActivity(appUser, 'delete', 'driver_advance', `Deleted driver advance ${id}`, id);
  };

  const addDriverSalary = async (sal: Omit<DriverSalary, 'id'>) => {
    const newDocRef = doc(collection(db, 'driver_salaries'));
    const data: DriverSalary = {
      ...sal,
      id: newDocRef.id,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, stripUndefined(data));
    await logActivity(appUser, 'create', 'driver_salary', `Settled ₹ ${sal.netPaid} salary for ${sal.driverName}`, newDocRef.id, sal.driverName);
  };

  const updateDriverSalary = async (id: string, sal: Partial<DriverSalary>) => {
    await updateDoc(doc(db, 'driver_salaries', id), stripUndefined({
      ...sal,
      ...getAuditStamp(true),
    }));
    await logActivity(appUser, 'update', 'driver_salary', `Updated salary for ${sal.driverName || id}`, id);
  };

  const deleteDriverSalary = async (id: string) => {
    await deleteDoc(doc(db, 'driver_salaries', id));
    await logActivity(appUser, 'delete', 'driver_salary', `Deleted driver salary ${id}`, id);
  };

  const addMachineCare = async (care: Omit<MachineCareEntry, 'id'>) => {
    const newDocRef = doc(collection(db, 'machine_care'));
    const data: MachineCareEntry = {
      ...care,
      id: newDocRef.id,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, stripUndefined(data));
    await logActivity(appUser, 'create', 'machine_care', `Recorded ${care.careType} at ${care.engineHours} hrs (₹ ${care.cost})`, newDocRef.id, care.careType);
  };

  const updateMachineCare = async (id: string, care: Partial<MachineCareEntry>) => {
    await updateDoc(doc(db, 'machine_care', id), stripUndefined({
      ...care,
      ...getAuditStamp(true),
    }));
    await logActivity(appUser, 'update', 'machine_care', `Updated maintenance record ${care.careType || id}`, id);
  };

  const deleteMachineCare = async (id: string) => {
    await deleteDoc(doc(db, 'machine_care', id));
    await logActivity(appUser, 'delete', 'machine_care', `Deleted machine care entry ${id}`, id);
  };

  const settlePartnerAccount = async (fromPartner?: string, toPartner?: string, amount?: number, notes?: string) => {
    const fromP = fromPartner || settlementDirective.from;
    const toP = toPartner || settlementDirective.to;
    const amt = amount !== undefined ? amount : settlementDirective.amount;

    if (amt <= 0) return;

    const newDocRef = doc(collection(db, 'settlements'));
    const newSettlement: SettlementRecord = {
      id: newDocRef.id,
      date: formatDisplayDate(new Date()),
      fromPartner: fromP,
      toPartner: toP,
      amount: amt,
      notes: notes || `Partner Equalization Settlement: ${fromP} paid ${toP} ₹${amt}`,
      ...getAuditStamp(false),
    };

    const sanitized = stripUndefined(newSettlement);
    // Optimistic update
    setSettlements((prev) => [sanitized, ...prev]);

    await setDoc(newDocRef, sanitized);
    await logActivity(
      appUser,
      'settle',
      'work',
      `${fromP} paid ${toP} ₹ ${amt} to settle up`,
      newDocRef.id
    );
  };

  const deleteSettlement = async (id: string) => {
    const item = settlements.find((s) => s.id === id);
    setSettlements((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, 'settlements', id));
      await logActivity(appUser, 'delete', 'work', `Deleted settlement record ${id}`, id);
    } catch (err) {
      console.error('Failed to delete settlement doc:', err);
      if (item) setSettlements((prev) => [...prev, item]);
      throw err;
    }
  };

  const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
    const updated = stripUndefined({ ...businessSettings, ...settings });
    await setDoc(doc(db, 'settings', 'business'), updated);
    await logActivity(appUser, 'update', 'settings', `Updated business profile & partners`);
  };

  const updateListSettings = async (settings: Partial<ListSettings>) => {
    const updated = { ...listSettings, ...settings };
    await setDoc(doc(db, 'settings', 'lists'), updated);
    await logActivity(appUser, 'update', 'settings', `Updated dropdown list configurations`);
  };

  // Admin Data Tools
  const clearAllDemoData = async () => {
    if (appUser?.role !== 'admin') {
      alert('Only Admin can clear database entries.');
      return;
    }

    const collectionsToClear = [
      'works',
      'expenses',
      'drivers',
      'driver_advances',
      'driver_salaries',
      'machine_care',
      'settlements',
    ];

    for (const colName of collectionsToClear) {
      const snap = await getDocs(collection(db, colName));
      const batch = writeBatch(db);
      snap.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }

    await logActivity(appUser, 'reset_data', 'settings', 'Cleared all harvester records from database');
  };

  const exportDataToCSV = () => {
    const csvRows: string[] = [];

    csvRows.push('--- WORKS ---');
    csvRows.push('ID,Farmer Name,Village,Phone,Crop,Quantity,Rate,Total,Received,Balance,Status,Date,Received By,Added By,Last Edited By');
    workEntries.forEach((w) => {
      csvRows.push(`"${w.id}","${w.farmerName}","${w.village}","${w.phone || ''}","${w.crop}",${w.quantity},${w.rate},${w.totalAmount},${w.receivedAmount},${w.balanceAmount},"${w.status}","${w.date}","${w.receivedBy}","${w.addedByName || ''}","${w.lastEditedByName || ''}"`);
    });

    csvRows.push('\n--- EXPENSES ---');
    csvRows.push('ID,Date,Category,Amount,Paid By,Payment Mode,Remarks,Added By,Last Edited By');
    expenseEntries.forEach((e) => {
      csvRows.push(`"${e.id}","${e.date}","${e.category}",${e.amount},"${e.paidBy}","${e.paymentMode}","${e.remarks || ''}","${e.addedByName || ''}","${e.lastEditedByName || ''}"`);
    });

    csvRows.push('\n--- DRIVER ADVANCES ---');
    csvRows.push('ID,Date,Driver Name,Amount,Payment Mode,Paid By,Notes');
    driverAdvances.forEach((d) => {
      csvRows.push(`"${d.id}","${d.date}","${d.driverName}",${d.amount},"${d.paymentMode}","${d.paidBy}","${d.notes || ''}"`);
    });

    csvRows.push('\n--- MACHINE CARE ---');
    csvRows.push('ID,Date,Care Type,Engine Hours,Cost,Performed By,Paid By');
    machineCareEntries.forEach((m) => {
      csvRows.push(`"${m.id}","${m.date}","${m.careType}",${m.engineHours},${m.cost},"${m.performedBy}","${m.paidBy}"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `HarvesterBook_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logActivity(appUser, 'export', 'settings', 'Exported complete database to CSV');
  };

  return (
    <HarvesterContext.Provider
      value={{
        workEntries,
        expenseEntries,
        drivers,
        driverAdvances,
        driverSalaries,
        machineCareEntries,
        settlements,
        activityLogs,
        businessSettings,
        listSettings,
        currentScreen,
        selectedDate,
        selectedMonth,
        dateFilterMode,
        activePartnerView,
        filteredWorkEntries,
        filteredExpenseEntries,
        totalIncome,
        totalReceived,
        totalPending,
        pendingCount,
        totalWorkCount,
        totalExpenses,
        billedProfit,
        cashProfit,
        netProfit,
        profitViewMode,
        setProfitViewMode,
        netProfitPartner1,
        netProfitPartner2,
        p1Name,
        p2Name,
        isPartner1,
        isPartner2,
        partner1Spent,
        partner2Spent,
        partner1Received,
        partner2Received,
        partner1Collected,
        partner2Collected,
        partner1SettledOut,
        partner1SettledIn,
        partner2SettledOut,
        partner2SettledIn,
        netAnand,
        netBoopathi,
        totalNet,
        fairShareAnand,
        fairShareBoopathi,
        anandOwes,
        settlementDirective,
        settlementOwed,
        billedShare1,
        billedShare2,
        cashShare1,
        cashShare2,
        pendingShare1,
        pendingShare2,
        partner1AdvanceDeducted,
        partner2AdvanceDeducted,
        partner1RemainingShare,
        partner2RemainingShare,
        setCurrentScreen,
        setSelectedDate,
        setSelectedMonth,
        setDateFilterMode,
        stepDate,
        setActivePartnerView,
        addWorkEntry,
        updateWorkEntry,
        deleteWorkEntry,
        recordPayment,
        addExpenseEntry,
        updateExpenseEntry,
        deleteExpenseEntry,
        addDriver,
        updateDriver,
        deleteDriver,
        addDriverAdvance,
        updateDriverAdvance,
        deleteDriverAdvance,
        addDriverSalary,
        updateDriverSalary,
        deleteDriverSalary,
        addMachineCare,
        updateMachineCare,
        deleteMachineCare,
        settlePartnerAccount,
        deleteSettlement,
        updateBusinessSettings,
        updateListSettings,
        clearAllDemoData,
        exportDataToCSV,
      }}
    >
      {children}
    </HarvesterContext.Provider>
  );
};

export const useHarvester = () => {
  const context = useContext(HarvesterContext);
  if (!context) {
    throw new Error('useHarvester must be used within HarvesterProvider');
  }
  return context;
};
