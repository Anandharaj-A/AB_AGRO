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
  netProfit: number;
  netProfitPartner1: number;
  netProfitPartner2: number;
  partner1Spent: number;
  partner2Spent: number;
  partner1Collected: number;
  partner2Collected: number;
  settlementOwed: {
    from: string;
    to: string;
    amount: number;
    difference: number;
  };
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
  recordPayment: (workId: string, amount: number, collectedBy: string) => Promise<void>;
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
  settlePartnerAccount: (notes?: string) => Promise<void>;
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
  const netProfit = totalIncome - totalExpenses;

  const share1Ratio = (businessSettings.profitSharePartner1 || 50) / 100;
  const share2Ratio = (businessSettings.profitSharePartner2 || 50) / 100;
  const netProfitPartner1 = Math.round(netProfit * share1Ratio);
  const netProfitPartner2 = Math.round(netProfit * share2Ratio);

  const p1Name = businessSettings.partner1Name || 'Anand';
  const p2Name = businessSettings.partner2Name || 'Boopathi';

  const partner1Spent = expenseEntries
    .filter((e) => (e.paidBy || '').toLowerCase() === p1Name.toLowerCase())
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const partner2Spent = expenseEntries
    .filter((e) => (e.paidBy || '').toLowerCase() === p2Name.toLowerCase())
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const partner1Collected = workEntries
    .filter((w) => (w.receivedBy || '').toLowerCase() === p1Name.toLowerCase())
    .reduce((sum, w) => sum + (Number(w.receivedAmount) || 0), 0);

  const partner2Collected = workEntries
    .filter((w) => (w.receivedBy || '').toLowerCase() === p2Name.toLowerCase())
    .reduce((sum, w) => sum + (Number(w.receivedAmount) || 0), 0);

  // Equalization logic:
  // If Partner 1 spent more, Partner 2 owes Partner 1 difference * share2Ratio
  const difference = partner1Spent - partner2Spent;
  const settlementOwed = {
    from: difference >= 0 ? p2Name : p1Name,
    to: difference >= 0 ? p1Name : p2Name,
    amount: Math.round(Math.abs(difference) * (difference >= 0 ? share2Ratio : share1Ratio)),
    difference: Math.abs(difference),
  };

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

  // CRUD Implementations
  const addWorkEntry = async (entry: Omit<WorkEntry, 'id'>) => {
    const newDocRef = doc(collection(db, 'works'));
    const workData: WorkEntry = {
      ...entry,
      id: newDocRef.id,
      receiptNumber: entry.receiptNumber || `HB-2024-${Math.floor(100 + Math.random() * 900)}`,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, workData);
    await logActivity(appUser, 'create', 'work', `Created work for ${entry.farmerName} (₹ ${entry.totalAmount})`, newDocRef.id, entry.farmerName);
  };

  const updateWorkEntry = async (id: string, entry: Partial<WorkEntry>) => {
    const docRef = doc(db, 'works', id);
    const updatePayload = {
      ...entry,
      ...getAuditStamp(true),
    };
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

  const recordPayment = async (workId: string, amount: number, collectedBy: string) => {
    const work = workEntries.find((w) => w.id === workId);
    if (!work) return;
    const newReceived = (Number(work.receivedAmount) || 0) + amount;
    const newBalance = Math.max(0, (Number(work.totalAmount) || 0) - newReceived);
    const newStatus = newBalance === 0 ? 'paid' : 'partly_paid';
    await updateWorkEntry(workId, {
      receivedAmount: newReceived,
      balanceAmount: newBalance,
      status: newStatus,
      receivedBy: collectedBy,
    });
    await logActivity(appUser, 'update', 'work', `Collected ₹ ${amount} cash from ${work.farmerName} by ${collectedBy}`, workId, work.farmerName);
  };

  const addExpenseEntry = async (entry: Omit<ExpenseEntry, 'id'>) => {
    const newDocRef = doc(collection(db, 'expenses'));
    const expData: ExpenseEntry = {
      ...entry,
      id: newDocRef.id,
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, expData);
    await logActivity(appUser, 'create', 'expense', `Added ${entry.category} expense ₹ ${entry.amount} paid by ${entry.paidBy}`, newDocRef.id, entry.category);
  };

  const updateExpenseEntry = async (id: string, entry: Partial<ExpenseEntry>) => {
    const docRef = doc(db, 'expenses', id);
    await updateDoc(docRef, {
      ...entry,
      ...getAuditStamp(true),
    });
    await logActivity(appUser, 'update', 'expense', `Updated expense entry ${id} (₹ ${entry.amount || ''})`, id, entry.category);
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
    await setDoc(newDocRef, drvData);
    await logActivity(appUser, 'create', 'driver', `Added driver ${driver.driverName}`, newDocRef.id, driver.driverName);
  };

  const updateDriver = async (id: string, driver: Partial<DriverShift>) => {
    const docRef = doc(db, 'drivers', id);
    await updateDoc(docRef, {
      ...driver,
      ...getAuditStamp(true),
    });
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
    await setDoc(newDocRef, data);
    await logActivity(appUser, 'create', 'driver_advance', `Gave ₹ ${adv.amount} advance to ${adv.driverName}`, newDocRef.id, adv.driverName);
  };

  const updateDriverAdvance = async (id: string, adv: Partial<DriverAdvance>) => {
    await updateDoc(doc(db, 'driver_advances', id), {
      ...adv,
      ...getAuditStamp(true),
    });
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
    await setDoc(newDocRef, data);
    await logActivity(appUser, 'create', 'driver_salary', `Settled ₹ ${sal.netPaid} salary for ${sal.driverName}`, newDocRef.id, sal.driverName);
  };

  const updateDriverSalary = async (id: string, sal: Partial<DriverSalary>) => {
    await updateDoc(doc(db, 'driver_salaries', id), {
      ...sal,
      ...getAuditStamp(true),
    });
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
    await setDoc(newDocRef, data);
    await logActivity(appUser, 'create', 'machine_care', `Recorded ${care.careType} at ${care.engineHours} hrs (₹ ${care.cost})`, newDocRef.id, care.careType);
  };

  const updateMachineCare = async (id: string, care: Partial<MachineCareEntry>) => {
    await updateDoc(doc(db, 'machine_care', id), {
      ...care,
      ...getAuditStamp(true),
    });
    await logActivity(appUser, 'update', 'machine_care', `Updated maintenance record ${care.careType || id}`, id);
  };

  const deleteMachineCare = async (id: string) => {
    await deleteDoc(doc(db, 'machine_care', id));
    await logActivity(appUser, 'delete', 'machine_care', `Deleted machine care entry ${id}`, id);
  };

  const settlePartnerAccount = async (notes?: string) => {
    if (settlementOwed.amount <= 0) return;
    const newDocRef = doc(collection(db, 'settlements'));
    const newSettlement: SettlementRecord = {
      id: newDocRef.id,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      fromPartner: settlementOwed.from,
      toPartner: settlementOwed.to,
      amount: settlementOwed.amount,
      notes: notes || 'Partner equalized payout',
      ...getAuditStamp(false),
    };
    await setDoc(newDocRef, newSettlement);

    // Also insert adjustment expense
    await addExpenseEntry({
      date: newSettlement.date,
      paidBy: settlementOwed.from,
      category: 'other',
      amount: settlementOwed.difference,
      paymentMode: 'upi',
      remarks: `Partner Settlement Payout to ${settlementOwed.to} (Equalized Shares)`,
      machinery: businessSettings.harvesterModel,
      verified: true,
    });

    await logActivity(appUser, 'settle', 'work', `${settlementOwed.from} paid ${settlementOwed.to} ₹ ${settlementOwed.amount} to settle up`, newDocRef.id);
  };

  const deleteSettlement = async (id: string) => {
    await deleteDoc(doc(db, 'settlements', id));
    await logActivity(appUser, 'delete', 'work', `Deleted settlement record ${id}`, id);
  };

  const updateBusinessSettings = async (settings: Partial<BusinessSettings>) => {
    const updated = { ...businessSettings, ...settings };
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
        netProfit,
        netProfitPartner1,
        netProfitPartner2,
        partner1Spent,
        partner2Spent,
        partner1Collected,
        partner2Collected,
        settlementOwed,
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
