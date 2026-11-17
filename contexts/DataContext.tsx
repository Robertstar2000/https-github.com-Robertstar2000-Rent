import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  InventoryItem, Customer, Contract, ItemStatus, ContractStatus, 
  MaintenanceRecord, Invoice, DeliveryStop, P21SyncLog, ReturnAction,
  EmailSettings, NotificationSettings
} from '../types';
import { mockItems, mockCustomers, mockContracts, mockStops, mockMaintenance } from '../services/mockData';

interface DataContextType {
  inventory: InventoryItem[];
  customers: Customer[];
  contracts: Contract[];
  maintenance: MaintenanceRecord[];
  invoices: Invoice[];
  stops: DeliveryStop[];
  syncLogs: P21SyncLog[];
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  
  // Operations
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addContract: (contract: Omit<Contract, 'id'>) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  addMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;
  processReturn: (contractId: string, actions: ReturnAction[]) => void;
  updateEmailSettings: (settings: EmailSettings) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  sendOverdueAlerts: () => Promise<number>;
  
  // Admin & P21
  runP21Sync: () => Promise<void>;
  runOrderSync: () => Promise<void>;
  exportBackup: () => void;
  importBackup: (data: string) => void;
  updateItemStatus: (id: string, status: ItemStatus) => void;
  updateContractStatus: (id: string, status: ContractStatus) => void;
  updateStopStatus: (id: string, status: DeliveryStop['status']) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockItems);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(mockMaintenance);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stops, setStops] = useState<DeliveryStop[]>(mockStops);
  const [syncLogs, setSyncLogs] = useState<P21SyncLog[]>([]);
  
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    provider: 'SendGrid',
    apiKey: 'SG.************************',
    fromAddress: 'billing@tallmanrent.com',
    senderName: 'TallmanRent Operations'
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    overdueInvoices: true,
    lateReturns: true,
    lowStockAlerts: true,
    dailyDigest: false
  });

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substr(2, 9).toUpperCase() } as InventoryItem;
    setInventory(prev => [...prev, newItem]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const addCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customer, id: `C${customers.length + 1}` } as Customer;
    setCustomers(prev => [...prev, newCustomer]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addContract = (contract: Omit<Contract, 'id'>) => {
    const newContract = { ...contract, id: `T-${1000 + contracts.length + 1}` } as Contract;
    setContracts(prev => [...prev, newContract]);
  };

  const updateContract = (id: string, updates: Partial<Contract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice = { ...invoice, id: `INV-${Math.random().toString(36).substr(2, 5).toUpperCase()}` } as Invoice;
    setInvoices(prev => [...prev, newInvoice]);
  };

  const addMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord = { ...record, id: `MNT-${Math.random().toString(36).substr(2, 5).toUpperCase()}` } as MaintenanceRecord;
    setMaintenance(prev => [...prev, newRecord]);
  };

  const updateEmailSettings = (settings: EmailSettings) => setEmailSettings(settings);
  const updateNotificationSettings = (settings: NotificationSettings) => setNotificationSettings(settings);

  const sendOverdueAlerts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueContracts = contracts.filter(c => c.status === ContractStatus.ACTIVE && c.endDate < today);
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    await new Promise(resolve => setTimeout(resolve, 1500));
    const totalSent = overdueContracts.length + overdueInvoices.length;
    return totalSent;
  };

  const processReturn = (contractId: string, actions: ReturnAction[]) => {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;

    let allItemsReturned = true;
    let anyItemsExtended = false;

    actions.forEach(act => {
      const item = inventory.find(i => i.id === act.itemId);
      if (!item) return;

      switch (act.action) {
        case 'Return':
          updateItemStatus(act.itemId, ItemStatus.AVAILABLE);
          break;
        case 'Missing':
          updateItemStatus(act.itemId, ItemStatus.MISSING);
          addInvoice({
            contractId,
            invoiceDate: new Date().toISOString().split('T')[0],
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amount: item.replacementCost,
            status: 'Unpaid',
            description: `REPLACEMENT FEE: Missing Asset ${item.name}`
          });
          break;
        case 'Damaged':
          updateItemStatus(act.itemId, ItemStatus.DAMAGED);
          addMaintenance({
            itemId: act.itemId,
            date: new Date().toISOString().split('T')[0],
            description: `RETURN DAMAGE: Assessment required for ${item.name}`,
            cost: 0,
            technician: 'ReturnDesk'
          });
          if (act.fee) {
             addInvoice({
              contractId,
              invoiceDate: new Date().toISOString().split('T')[0],
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              amount: act.fee,
              status: 'Unpaid',
              description: `DAMAGE PENALTY: ${item.name}`
            });
          }
          break;
        case 'Extend':
          allItemsReturned = false;
          anyItemsExtended = true;
          break;
      }
    });

    if (allItemsReturned && !anyItemsExtended) {
      updateContractStatus(contractId, ContractStatus.COMPLETED);
    } else {
      updateContractStatus(contractId, ContractStatus.PARTIAL_RETURN);
    }
    
    const primaryExtension = actions.find(a => a.action === 'Extend' && a.newEndDate);
    if (primaryExtension && primaryExtension.newEndDate) {
      setContracts(prev => prev.map(c => c.id === contractId ? { ...c, endDate: primaryExtension.newEndDate! } : c));
    }
  };

  const runP21Sync = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const log: P21SyncLog = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      timestamp: new Date().toISOString(),
      entity: 'Inventory',
      status: 'Success',
      message: 'Epicor P21 Data Synchronization Successful: 154 Items updated.'
    };
    setSyncLogs(prev => [log, ...prev]);
  };

  const runOrderSync = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    const log: P21SyncLog = {
      id: Math.random().toString(36).substr(2, 5).toUpperCase(),
      timestamp: new Date().toISOString(),
      entity: 'Order',
      status: 'Success',
      message: 'P21 Order Sync: 12 new contracts transmitted, 8 statuses updated.'
    };
    setSyncLogs(prev => [log, ...prev]);
  };

  const exportBackup = () => {
    const data = JSON.stringify({ inventory, customers, contracts, maintenance, invoices, stops });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tallman_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importBackup = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.inventory) setInventory(parsed.inventory);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.contracts) setContracts(parsed.contracts);
      if (parsed.maintenance) setMaintenance(parsed.maintenance);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.stops) setStops(parsed.stops);
      alert("Backup restored successfully!");
    } catch (e) {
      console.error('Data import failed', e);
      alert("Restore failed: Invalid backup format.");
    }
  };

  const updateItemStatus = (id: string, status: ItemStatus) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const updateContractStatus = (id: string, status: ContractStatus) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateStopStatus = (id: string, status: DeliveryStop['status']) => {
    setStops(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  return (
    <DataContext.Provider value={{ 
      inventory, customers, contracts, maintenance, invoices, stops, syncLogs,
      emailSettings, notificationSettings,
      addInventoryItem, updateInventoryItem, addCustomer, updateCustomer, addContract, updateContract, addInvoice, addMaintenance, processReturn,
      updateEmailSettings, updateNotificationSettings, sendOverdueAlerts,
      runP21Sync, runOrderSync, exportBackup, importBackup, updateItemStatus, updateContractStatus, updateStopStatus
    }}>
      {children}
    </DataContext.Provider>
  );
};
