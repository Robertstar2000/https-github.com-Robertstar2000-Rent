
export enum ItemStatus {
  AVAILABLE = 'Available',
  RENTED = 'Rented',
  MAINTENANCE = 'Maintenance',
  UNAVAILABLE = 'Unavailable',
  MISSING = 'Missing',
  DAMAGED = 'Damaged'
}

export enum ContractStatus {
  QUOTE = 'Quote',
  RESERVATION = 'Reservation',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  PARTIAL_RETURN = 'Partial Return',
  EXPIRED = 'Expired'
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  serialNumber: string;
  status: ItemStatus;
  rate: number;
  location: string;
  p21Id?: string;
  replacementCost: number;
  manufacturer?: string;
  weight?: string;
  capacity?: string;
  modelNumber?: string;
  dimensions?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  balance: number;
  tags?: string[];
  p21Id?: string;
}

export interface Contract {
  id: string;
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: ContractStatus;
  items: string[]; 
  p21OrderNum?: string;
  isSigned: boolean;
  signedAt?: string;
  termsAccepted: boolean;
  notes?: string;
  taxRate: number;
}

export interface MaintenanceRecord {
  id: string;
  itemId: string;
  date: string;
  description: string;
  cost: number;
  technician?: string;
}

export interface Invoice {
  id: string;
  contractId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: 'Unpaid' | 'Paid' | 'Overdue';
  description?: string;
}

export interface DeliveryStop {
  id: string;
  contractId: string;
  customerName: string;
  address: string;
  type: 'Delivery' | 'Pickup';
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
}

export interface P21SyncLog {
  id: string;
  timestamp: string;
  entity: 'Inventory' | 'Customer' | 'Order';
  status: 'Success' | 'Error' | 'Pending';
  message: string;
}

export interface ReturnAction {
  itemId: string;
  action: 'Return' | 'Missing' | 'Damaged' | 'Extend';
  fee?: number;
  newEndDate?: string;
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
