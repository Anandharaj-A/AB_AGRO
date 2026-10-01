export type UserRole = 'admin' | 'partner' | 'viewer';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  createdBy?: string;
}

export interface BusinessSettings {
  businessName: string;
  harvesterModel: string;
  registrationNumber: string;
  partner1Name: string;
  partner2Name: string;
  profitSharePartner1: number; // default 50
  profitSharePartner2: number; // default 50
}

export interface CustomListItem {
  id: string;
  name: string;
  hidden?: boolean;
}

export interface ListSettings {
  services?: CustomListItem[];
  expenseCategories: CustomListItem[];
  paymentModes: CustomListItem[];
  crops: CustomListItem[];
  villages: CustomListItem[];
}

export interface AuditMetadata {
  addedByUid?: string;
  addedByName?: string;
  addedAt?: string;
  lastEditedByUid?: string;
  lastEditedByName?: string;
  lastEditedAt?: string;
}

export type CropType = string;
export type FieldOwnership = 'customer' | 'own';
export type MeasurementUnit = 'acres' | 'hours';
export type PaymentStatus = 'paid' | 'partly_paid' | 'pending';
export type PaymentMode = string;
export type PartnerId = string;
export type ExpenseCategory = string;

export interface WorkEntry extends AuditMetadata {
  id: string;
  farmerName: string;
  village: string;
  phone?: string;
  serviceType?: string; // 'Harvesting' | 'Spraying By drone' | 'Land ploughing'
  crop: CropType;
  cropVariety?: string;
  fieldOwnership: FieldOwnership;
  unit: MeasurementUnit;
  quantity: number;
  rate: number;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  status: PaymentStatus;
  date: string;
  time?: string;
  receivedBy: PartnerId;
  paymentMode: PaymentMode;
  driverName?: string;
  driverPhone?: string;
  remarks?: string;
  receiptNumber?: string;
  verified?: boolean;
}

export interface FuelLogDetails {
  ratePerLitre: number;
  litresFilled: number;
  harvestAreaAcres: number;
  litresPerAcre: number;
}

export interface ExpenseEntry extends AuditMetadata {
  id: string;
  date: string;
  paidBy: PartnerId;
  category: string;
  amount: number;
  paymentMode: PaymentMode;
  fuelLog?: FuelLogDetails;
  receiptImage?: string;
  receiptFileName?: string;
  remarks?: string;
  machinery: string;
  verified?: boolean;
}

export interface SettlementRecord extends AuditMetadata {
  id: string;
  date: string;
  fromPartner: PartnerId;
  toPartner: PartnerId;
  amount: number;
  notes?: string;
}

export interface DriverShift extends AuditMetadata {
  id: string;
  driverName: string;
  role: string;
  phone: string;
  photoUrl?: string;
  acresToday: number;
  engineHoursToday: number;
  dailyBataRate: number;
  acreBonusRate: number;
  advancePaid: number;
  balancePayable: number;
  status: 'active' | 'off_duty';
}

export interface DriverAdvance extends AuditMetadata {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  amount: number;
  paymentMode: PaymentMode;
  paidBy: string;
  notes?: string;
}

export interface DriverSalary extends AuditMetadata {
  id: string;
  driverId: string;
  driverName: string;
  monthOrPeriod: string;
  date: string;
  baseAmount: number;
  bonusAmount: number;
  deductionsAdvance: number;
  netPaid: number;
  paidBy: string;
  notes?: string;
}

export interface MachineCareEntry extends AuditMetadata {
  id: string;
  date: string;
  careType: 'greasing' | 'oil_change' | 'air_filter' | 'chain_tension' | 'blade_sharpening' | 'hydraulic_check' | 'other';
  engineHours: number;
  performedBy: string;
  cost: number;
  paidBy: string;
  notes?: string;
  nextServiceHours?: number;
}

export interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'settle' | 'login' | 'logout' | 'reset_data' | 'export';
  module: 'work' | 'expense' | 'driver' | 'driver_advance' | 'driver_salary' | 'machine_care' | 'settings' | 'user' | 'auth';
  entityId?: string;
  entityName?: string;
  summary: string;
  performedByUid: string;
  performedByName: string;
  performedByEmail: string;
  performedByRole: UserRole;
  timestamp: string;
}
