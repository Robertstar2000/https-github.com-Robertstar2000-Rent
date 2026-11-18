export enum ItemStatus {
  AVAILABLE = 'Available',
  RENTED = 'Rented',
  INSPECTION = 'In Inspection',
  MAINTENANCE = 'In Repair',
  DAMAGED = 'Damaged',
  MISSING = 'Missing',
  SCRAPPED = 'Scrapped',
  RESERVED = 'Reserved',
  UNAVAILABLE = 'Unavailable'
}

export enum ContractStatus {
  QUOTE = 'Quote',
  RESERVATION = 'Reservation',
  ACTIVE = 'Active',
  EARLY_RETURN = 'Early Return',
  PARTIAL_RETURN = 'Partial Return',
  PHASED_RETURN = 'Phased Return',
  OVERDUE = 'Overdue',
  INSPECTION_PENDING = 'Inspection Hold',
  COMPLETED = 'Completed',
  EXPIRED = 'Expired'
}

export type FlowStage =
  | 'Quote & Reservation'
  | 'Active On-Rent'
  | 'Early Return'
  | 'Phased Return (Off-Schedule)'
  | 'Partial Return'
  | 'Late / Overdue'
  | 'Return Inspection'
  | 'Repair Shop'
  | 'Scrap & Write-Off'
  | 'Completed & Billed';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: 'Stringing Blocks' | 'Hydraulic Tools' | 'Hoists & Rigging' | 'Tension & Metering' | 'Dielectric & Grounding' | 'Underground Pulling' | string;
  serialNumber: string;
  status: ItemStatus;
  rate: number; // Daily rate
  weeklyRate?: number; // 7-day POR rate
  monthlyRate?: number; // 28-day POR rate
  location: string;
  p21Id?: string;
  replacementCost: number;
  manufacturer?: string;
  weight?: string;
  capacity?: string;
  modelNumber?: string;
  dimensions?: string;
  lastInspectionDate?: string;
  nextCalibrationDate?: string;
  conditionScore?: number; // 0-100
  totalDaysRented?: number;
}

export interface VettingWebSource {
  title: string;
  uri: string;
}

export interface CustomerVettingData {
  dunsNumber?: string;
  taxId?: string;
  creditScore: number;
  approvedCreditLimit: number;
  dsoDays: number;
  onTimePaymentRate: number;
  damageClaimHistoryCount: number;
  annualRevenueBand: string;
  insuranceCOIStatus: 'Verified Active' | 'Pending COI' | 'Expired';
  riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  vettingStatus: 'Approved' | 'Pending Review' | 'Rejected';
  vettedBy?: string;
  vettedAt?: string;
  vettingNotes?: string;
  disapprovalReason?: string;
  // D&B & Web Intelligence fields
  dnbPaydexScore?: number;
  dnbRating?: string;
  dnbDelinquencyRisk?: string;
  yearFounded?: string;
  employeeCountEstimate?: string;
  headquartersVerified?: string;
  legalEntityStatus?: string;
  liensOrJudgmentsSummary?: string;
  webReputationSummary?: string;
  webSources?: VettingWebSource[];
  researchSource?: 'Live D&B + Web Grounding' | 'P21 Registry Cache' | 'Offline Test Bureau Simulation';
}

export interface Customer {
  id: string;
  name: string;
  dbaName?: string;
  website?: string;
  industrySector?: string;
  email: string;
  operationsEmail?: string;
  phone: string;
  secondaryPhone?: string;
  address: string;
  billingAddress?: string;
  shippingJobsiteAddress?: string;
  paymentTerms?: string;
  taxExemptCert?: string;
  balance: number;
  monthlyBillingTotal?: number;
  billingCycleMonth?: string; // e.g. 'November 2026'
  latestCustomerUpdate?: string;
  lastUpdatedAt?: string;
  creditLimit?: number;
  tags?: string[];
  p21Id?: string;
  p21Synced?: boolean;
  contactPerson?: string;
  billingContactName?: string;
  accountStatus?: 'Good Standing' | 'Watchlist' | 'Credit Hold' | 'Disapproved';
  latePaymentsCount?: number;
  maxDaysOverdue?: number;
  lastPaymentDate?: string;
  vetting?: CustomerVettingData;
}

export interface ContractPhase {
  id: string;
  phaseNumber: number;
  label: string;
  scheduledDate: string;
  actualReturnDate?: string;
  itemIds: string[];
  status: 'Scheduled' | 'Returned On-Time' | 'Returned Early' | 'Returned Late (Off-Schedule)' | 'Partial / Split' | 'Overdue';
  varianceDays: number; // positive = days late past phase schedule, negative = days early
  accruedInterest: number;
  offScheduleFee: number;
  notes?: string;
}

export interface ShipmentStage {
  id: string;
  shipmentNumber: number;
  label: string;
  scheduledShipDate: string;
  carrierMethod: string;
  trackingOrBol?: string;
  itemIds: string[];
  status: 'Planned' | 'Staged in Warehouse' | 'Dispatched / In Transit' | 'Delivered to Jobsite';
}

export interface Contract {
  id: string;
  customerId: string;
  customerName: string;
  jobSite?: string;
  poNumber?: string;
  customerAddress?: string;
  billingAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  contactPerson?: string;
  paymentTerms?: string;
  deliveryMethod?: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  totalAmount: number;
  status: ContractStatus;
  flowStage: FlowStage;
  items: string[];
  shipments?: ShipmentStage[];
  quoteSentAt?: string;
  quoteSentTo?: string;
  returnedItemIds?: string[];
  damagedItemIds?: string[];
  missingItemIds?: string[];
  scrappedItemIds?: string[];
  p21OrderNum?: string;
  p21Synced?: boolean;
  p21SyncTimestamp?: string;
  isSigned: boolean;
  signedAt?: string;
  termsAccepted: boolean;
  notes?: string;
  latestCustomerUpdate?: string;
  lastUpdatedAt?: string;
  taxRate: number;
  // Advanced POR Financial & Return Fields
  billingCycle?: 'Monthly Consolidated' | '28-Day Monthly' | 'Phased Monthly';
  damageWaiverRate?: number; // e.g. 0.10 (10%)
  damageWaiverIncluded?: boolean;
  annualInterestRate?: number; // e.g. 18.0 (% APR / 1.5% Monthly for off-schedule phased returns or overdue balances)
  dailyLateMultiplier?: number; // e.g. 1.5x daily rate
  phases?: ContractPhase[];
  earlyReturnCredit?: number;
  lateFeeTotal?: number;
  interestCharged?: number;
  replacementCharges?: number;
  repairCharges?: number;
  scrapCharges?: number;
  daysDelta?: number; // Negative = days early, Positive = days overdue, 0 = on schedule
}

export interface ReturnInspectionChecklist {
  structuralIntegrity: 'Pass' | 'Fail' | 'Warn';
  mechanicalOperation: 'Pass' | 'Fail' | 'Warn';
  safetyLatches: 'Pass' | 'Fail' | 'Warn';
  dielectricCalibration: 'Pass' | 'Fail' | 'N/A';
  cleanliness: 'Pass' | 'Needs Cleaning';
  inspectorName: string;
  inspectionDate: string;
  notes: string;
}

export interface RepairPartOrder {
  id: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost: number;
  inStock: boolean;
  reorderStatus: 'In Stock' | 'PO Dispatched' | 'Backordered' | 'Received';
  vendorName: string;
  poNumber?: string;
}

export interface WorkOrder {
  id: string;
  itemId: string;
  itemName: string;
  serialNumber: string;
  contractId?: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
  status: 'Open - Awaiting Parts' | 'In Repair' | 'Quality Check' | 'Completed' | 'Scrapped - BER';
  disposition: 'Repair' | 'Scrap';
  technician: string;
  defectSummary: string;
  laborHours: number;
  laborRate: number;
  materialsCost: number;
  materialsDescription: string;
  parts: RepairPartOrder[];
  totalCost: number;
  billToCustomer: boolean;
  invoiceId?: string;
  inspectionChecklist?: ReturnInspectionChecklist;
  scrapReason?: string;
  salvageValue?: number;
  replacementReorderId?: string;
}

export interface ReplacementOrder {
  id: string;
  contractId: string;
  customerId: string;
  customerName: string;
  itemId: string;
  itemName: string;
  serialNumber: string;
  modelNumber: string;
  reason: 'Partial Return - Unreturned' | 'Missing on Return' | 'Scrapped - Beyond Repair';
  orderDate: string;
  vendor: string;
  poNumber: string;
  replacementCost: number;
  procurementFee: number;
  totalBilledToCustomer: number;
  status: 'PO Generated' | 'In Transit from OEM' | 'Received & Inventory Indexed';
  invoiceId?: string;
}

export interface MaintenanceRecord {
  id: string;
  itemId: string;
  date: string;
  description: string;
  cost: number;
  technician?: string;
  workOrderId?: string;
  laborCost?: number;
  materialsCost?: number;
  partsCost?: number;
}

export interface InvoiceLineItem {
  description: string;
  category:
    | 'Base Rental'
    | 'Early Return Credit'
    | 'Late Return Surcharge'
    | 'Phased Schedule Interest'
    | 'Replacement Order'
    | 'Repair Labor & Materials'
    | 'Replacement Parts Reorder'
    | 'Scrap / BER Write-Off'
    | 'Damage Waiver'
    | 'Tax';
  amount: number;
}

export interface Invoice {
  id: string;
  contractId: string;
  customerId?: string;
  customerName?: string;
  billingMonth?: string; // e.g. 'November 2026'
  invoiceDate: string;
  dueDate: string;
  daysOverdue?: number;
  amount: number;
  status: 'Unpaid' | 'Paid' | 'Overdue';
  description?: string;
  latestCustomerUpdate?: string;
  lastUpdatedAt?: string;
  invoiceType?:
    | 'Monthly Consolidated Statement'
    | 'Standard Rental'
    | 'Early Return Settlement'
    | 'Late Return & Interest'
    | 'Phased Off-Schedule Billing'
    | 'Partial Return & Replacement'
    | 'Repair & Parts Chargeback'
    | 'Scrap Total Loss Charge';
  lineItems?: InvoiceLineItem[];
}

export interface DeliveryStop {
  id: string;
  contractId: string;
  customerName: string;
  address: string;
  type: 'Delivery' | 'Pickup' | 'Field Swap';
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  scheduledWindow?: string;
  equipmentCount?: number;
}

export interface P21SyncLog {
  id: string;
  timestamp: string;
  entity: 'Inventory' | 'Customer' | 'Order' | 'WorkOrder' | 'Billing';
  status: 'Success' | 'Error' | 'Pending';
  message: string;
}

export interface ReturnAction {
  itemId: string;
  action: 'Return' | 'KeepOnRent' | 'Missing' | 'DamagedRepair' | 'DamagedScrap' | 'Extend';
  fee?: number;
  newEndDate?: string;
  phaseId?: string;
  inspection?: ReturnInspectionChecklist;
  // Repair fields if DamagedRepair
  defectSummary?: string;
  laborHours?: number;
  laborRate?: number;
  materialsCost?: number;
  materialsDescription?: string;
  partsToReorder?: Omit<RepairPartOrder, 'id'>[];
  billCustomerForRepair?: boolean;
  // Scrap fields if DamagedScrap
  scrapReason?: string;
  salvageValue?: number;
  triggerReplacementOrder?: boolean;
}

export interface ReturnSubmissionPayload {
  contractId: string;
  returnDate: string;
  returnMode: 'Standard' | 'Early' | 'Late' | 'Partial' | 'PhasedOffSchedule';
  actions: ReturnAction[];
  earlyReturnCredit?: number;
  lateDays?: number;
  lateSurcharge?: number;
  offScheduleDays?: number;
  annualInterestRate?: number;
  accruedInterest?: number;
  offScheduleFee?: number;
  inspectorName: string;
  notes?: string;
}

export interface EmailSettings {
  provider: 'SMTP' | 'SendGrid' | 'Mailchimp';
  apiKey: string;
  fromAddress: string;
  senderName: string;
}

export interface NotificationSettings {
  overdueInvoices: boolean;
  lateReturns: boolean;
  lowStockAlerts: boolean;
  dailyDigest: boolean;
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

export interface WorkflowIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category:
    | 'Overdue Return'
    | 'Late Payment & Re-Vetting'
    | 'High Damage / Scrap Rate'
    | 'Data Inconsistency'
    | 'Human Input Required';
  title: string;
  errorMessage: string;
  instructions: string;
  entityType: 'customer' | 'contract' | 'invoice' | 'inventory' | 'workOrder';
  entityId: string;
  customerId?: string;
  contractId?: string;
  requiresReVetting?: boolean;
  actionLabel: string;
  targetRoute: string;
}
