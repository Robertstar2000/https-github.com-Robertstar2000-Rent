import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import {
  InventoryItem,
  Customer,
  Contract,
  ItemStatus,
  ContractStatus,
  MaintenanceRecord,
  Invoice,
  InvoiceLineItem,
  DeliveryStop,
  P21SyncLog,
  ReturnAction,
  ReturnSubmissionPayload,
  WorkOrder,
  ReplacementOrder,
  EmailSettings,
  NotificationSettings,
  ToastNotification,
  FlowStage,
  CustomerVettingData,
  ShipmentStage,
  WorkflowIssue
} from '../types';
import {
  mockItems,
  mockCustomers,
  mockContracts,
  mockStops,
  mockMaintenance,
  mockWorkOrders,
  mockReplacementOrders,
  mockInvoices
} from '../services/mockData';
import { analyzeWorkflowOversight } from '../services/workflowOversight';

interface DataContextType {
  inventory: InventoryItem[];
  customers: Customer[];
  contracts: Contract[];
  maintenance: MaintenanceRecord[];
  invoices: Invoice[];
  workOrders: WorkOrder[];
  replacementOrders: ReplacementOrder[];
  stops: DeliveryStop[];
  syncLogs: P21SyncLog[];
  emailSettings: EmailSettings;
  notificationSettings: NotificationSettings;
  toasts: ToastNotification[];

  disapprovedApplications: Customer[];
  workflowIssues: WorkflowIssue[];
  revetTargetCustomer: Customer | null;
  openReVettingModal: (customer: Customer) => void;
  closeReVettingModal: () => void;

  // Toast helper
  notify: (title: string, message: string, type?: ToastNotification['type']) => void;
  dismissToast: (id: string) => void;

  // Inventory & Customer Operations
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  updateCustomerAfterReVetting: (
    customerId: string,
    updatedData: Omit<Customer, 'id'>
  ) => Customer | null;
  disapproveExistingCustomer: (
    customerId: string,
    reason: string,
    updatedVetting?: CustomerVettingData
  ) => void;
  simulateLatePaymentForTest: (customerId: string, daysOverdue: number) => void;
  postCustomerUpdate: (customerId: string, updateNote: string, amountDelta?: number) => void;
  rejectCustomerApplication: (
    customer: Omit<Customer, 'id'>,
    reason: string
  ) => Customer;
  researchCustomerForVetting: (
    input: {
      name: string;
      dbaName?: string;
      website?: string;
      taxId?: string;
      industrySector?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      billingAddress?: string;
      shippingJobsiteAddress?: string;
      requestedCreditLimit?: number;
      paymentTerms?: string;
      forceFreshResearch?: boolean;
    },
    mode?: 'live' | 'simulation'
  ) => Promise<
    CustomerVettingData & {
      p21MatchFound: boolean;
      matchedP21Id?: string;
      suggestedTerms: string;
      existingBalanceInP21: number;
    }
  >;
  runCustomerVettingLookup: (
    companyName: string,
    taxIdOrDuns?: string
  ) => Promise<
    CustomerVettingData & {
      p21MatchFound: boolean;
      matchedP21Id?: string;
      suggestedTerms: string;
      existingBalanceInP21: number;
    }
  >;

  // Contract & Billing Operations
  addContract: (contract: Omit<Contract, 'id'>) => Contract;
  sendQuote: (contract: Omit<Contract, 'id'>, recipientEmail: string) => Contract;
  convertQuoteToOrder: (contractId: string) => void;
  updateShipmentStatus: (contractId: string, shipmentId: string, status: ShipmentStage['status']) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  runMonthlyBillingCycle: (billingMonth?: string) => void;
  addMaintenance: (record: Omit<MaintenanceRecord, 'id'>) => void;

  // Return Inspection, Work Orders, Replacement Orders & Scrap
  processReturn: (contractId: string, actions: ReturnAction[]) => void;
  processDetailedReturn: (payload: ReturnSubmissionPayload) => void;
  addWorkOrder: (wo: Omit<WorkOrder, 'id'>) => void;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  completeWorkOrder: (id: string) => void;
  scrapWorkOrder: (id: string, scrapReason: string, salvageValue: number) => void;
  receiveReplacementOrder: (id: string) => void;

  // Admin & Settings
  updateEmailSettings: (settings: EmailSettings) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  sendOverdueAlerts: () => Promise<number>;
  runP21Sync: () => Promise<void>;
  runOrderSync: () => Promise<void>;
  exportBackup: () => void;
  importBackup: (data: string) => void;
  updateItemStatus: (id: string, status: ItemStatus) => void;
  updateContractStatus: (id: string, status: ContractStatus, flowStage?: FlowStage) => void;
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
  const [disapprovedApplications, setDisapprovedApplications] = useState<Customer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(mockMaintenance);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [replacementOrders, setReplacementOrders] = useState<ReplacementOrder[]>(mockReplacementOrders);
  const [stops, setStops] = useState<DeliveryStop[]>(mockStops);
  const [syncLogs, setSyncLogs] = useState<P21SyncLog[]>([
    {
      id: 'P21-INIT-01',
      timestamp: '2026-11-17T08:00:00Z',
      entity: 'Customer',
      status: 'Success',
      message: 'Epicor P21 Customer Master synced: 9 utility & contractor accounts verified (P21-CUST-1001..1009).'
    },
    {
      id: 'P21-INIT-02',
      timestamp: '2026-11-17T09:15:00Z',
      entity: 'Order',
      status: 'Success',
      message: 'Epicor P21 Order Ledger parity confirmed for November 2026 consolidated tool contracts.'
    }
  ]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [revetTargetCustomer, setRevetTargetCustomer] = useState<Customer | null>(null);

  const openReVettingModal = (customer: Customer) => setRevetTargetCustomer(customer);
  const closeReVettingModal = () => setRevetTargetCustomer(null);

  const workflowIssues = useMemo(
    () =>
      analyzeWorkflowOversight({
        customers,
        contracts,
        inventory,
        invoices,
        workOrders,
        replacementOrders
      }),
    [customers, contracts, inventory, invoices, workOrders, replacementOrders]
  );

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

  const notify = (title: string, message: string, type: ToastNotification['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getTimestamp = () => {
    const now = new Date();
    return `2026-11-17 ${now.toTimeString().slice(0, 5)} EST`;
  };

  // Helper to update a customer's monthly statement & latest update simultaneously
  const appendToCustomerMonthlyBilling = (
    customerId: string,
    contractId: string,
    updateText: string,
    newLineItems: InvoiceLineItem[],
    invoiceType?: Invoice['invoiceType']
  ) => {
    const timestamp = getTimestamp();
    const deltaAmount = newLineItems.reduce((sum, li) => sum + li.amount, 0);

    setCustomers(prev =>
      prev.map(c => {
        if (c.id !== customerId) return c;
        const newBal = Math.max(0, Number((c.balance + deltaAmount).toFixed(2)));
        const newMonthly = Math.max(0, Number(((c.monthlyBillingTotal ?? c.balance) + deltaAmount).toFixed(2)));
        return {
          ...c,
          balance: newBal,
          monthlyBillingTotal: newMonthly,
          billingCycleMonth: 'November 2026',
          latestCustomerUpdate: updateText,
          lastUpdatedAt: timestamp,
          accountStatus: newBal > 3500 ? 'Credit Hold' : newBal > 1800 ? 'Watchlist' : 'Good Standing'
        };
      })
    );

    setInvoices(prev => {
      const existingIdx = prev.findIndex(
        inv => inv.customerId === customerId && inv.billingMonth === 'November 2026'
      );
      if (existingIdx > -1) {
        const existing = prev[existingIdx];
        const mergedLines = [...(existing.lineItems || []), ...newLineItems];
        const updatedAmount = Math.max(
          0,
          Number((existing.amount + deltaAmount).toFixed(2))
        );
        const updatedInv: Invoice = {
          ...existing,
          amount: updatedAmount,
          invoiceType: invoiceType || existing.invoiceType,
          latestCustomerUpdate: updateText,
          lastUpdatedAt: timestamp,
          lineItems: mergedLines
        };
        const copy = [...prev];
        copy[existingIdx] = updatedInv;
        return copy;
      } else {
        const cust = customers.find(c => c.id === customerId);
        const newInv: Invoice = {
          id: `STM-2026-11-${customerId}`,
          contractId,
          customerId,
          customerName: cust?.name || 'Customer',
          billingMonth: 'November 2026',
          invoiceDate: '2026-11-30',
          dueDate: '2026-12-15',
          amount: Math.max(0, Number(deltaAmount.toFixed(2))),
          status: 'Unpaid',
          invoiceType: invoiceType || 'Monthly Consolidated Statement',
          description: `November 2026 Monthly Consolidated Statement — ${updateText}`,
          latestCustomerUpdate: updateText,
          lastUpdatedAt: timestamp,
          lineItems: newLineItems
        };
        return [newInv, ...prev];
      }
    });
  };

  const postCustomerUpdate = (customerId: string, updateNote: string, amountDelta: number = 0) => {
    const timestamp = getTimestamp();
    const contract = contracts.find(c => c.customerId === customerId);
    if (amountDelta !== 0) {
      appendToCustomerMonthlyBilling(
        customerId,
        contract?.id || 'GENERAL',
        updateNote,
        [
          {
            description: updateNote,
            category: amountDelta > 0 ? 'Base Rental' : 'Early Return Credit',
            amount: amountDelta
          }
        ]
      );
    } else {
      setCustomers(prev =>
        prev.map(c =>
          c.id === customerId
            ? { ...c, latestCustomerUpdate: updateNote, lastUpdatedAt: timestamp }
            : c
        )
      );
      setInvoices(prev =>
        prev.map(inv =>
          inv.customerId === customerId
            ? { ...inv, latestCustomerUpdate: updateNote, lastUpdatedAt: timestamp }
            : inv
        )
      );
    }
    if (contract) {
      setContracts(prev =>
        prev.map(c =>
          c.customerId === customerId
            ? { ...c, latestCustomerUpdate: updateNote, lastUpdatedAt: timestamp }
            : c
        )
      );
    }
    notify('Monthly Billing & Customer Updated', updateNote, 'info');
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `TL-${101 + inventory.length}`,
      weeklyRate: item.weeklyRate || item.rate * 4,
      monthlyRate: item.monthlyRate || item.rate * 12,
      conditionScore: item.conditionScore ?? 100,
      lastInspectionDate: '2026-11-17'
    };
    setInventory(prev => [newItem, ...prev]);
    notify('Tool Indexed', `${newItem.name} (${newItem.serialNumber}) added to tool inventory.`);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory(prev => prev.map(item => (item.id === id ? { ...item, ...updates } : item)));
    notify('Tool Updated', `Inventory specifications updated for ${id}.`);
  };

  const researchCustomerForVetting = async (
    input: {
      name: string;
      dbaName?: string;
      website?: string;
      taxId?: string;
      industrySector?: string;
      contactPerson?: string;
      email?: string;
      phone?: string;
      billingAddress?: string;
      shippingJobsiteAddress?: string;
      requestedCreditLimit?: number;
      paymentTerms?: string;
      forceFreshResearch?: boolean;
    },
    mode: 'live' | 'simulation' = 'live'
  ): Promise<
    CustomerVettingData & {
      p21MatchFound: boolean;
      matchedP21Id?: string;
      suggestedTerms: string;
      existingBalanceInP21: number;
    }
  > => {
    const companyName = input.name.trim();
    const q = companyName.toLowerCase();
    const existing = customers.find(c => c.name.toLowerCase() === q);

    if (existing && existing.vetting && !input.forceFreshResearch) {
      return {
        ...existing.vetting,
        researchSource: 'P21 Registry Cache',
        dnbPaydexScore: existing.vetting.dnbPaydexScore ?? 82,
        dnbRating: existing.vetting.dnbRating ?? '3A2',
        dnbDelinquencyRisk: existing.vetting.dnbDelinquencyRisk ?? 'Low Risk (11/100)',
        headquartersVerified: existing.vetting.headquartersVerified ?? (existing.billingAddress || existing.address),
        legalEntityStatus: existing.vetting.legalEntityStatus ?? 'Active / Verified P21 Account',
        liensOrJudgmentsSummary: existing.vetting.liensOrJudgmentsSummary ?? 'No active liens recorded in Epicor P21 master.',
        webReputationSummary:
          existing.vetting.webReputationSummary ??
          `Verified existing TallmanRent utility customer (${existing.p21Id || existing.id}) in ${existing.accountStatus || 'Good Standing'}.`,
        p21MatchFound: true,
        matchedP21Id: existing.p21Id,
        suggestedTerms: existing.paymentTerms || 'Net 30',
        existingBalanceInP21: existing.balance
      };
    }

    const nextP21Id = existing?.p21Id || `P21-CUST-${1001 + customers.length}`;

    if (mode === 'live') {
      const response = await fetch('/api/customers/vet-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          dbaName: input.dbaName,
          website: input.website,
          taxIdOrDuns: input.taxId,
          industrySector: input.industrySector,
          contactPerson: input.contactPerson,
          email: input.email,
          phone: input.phone,
          billingAddress: input.billingAddress,
          shippingJobsiteAddress: input.shippingJobsiteAddress,
          requestedCreditLimit: input.requestedCreditLimit,
          paymentTerms: input.paymentTerms
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const err = new Error(
          data.error || `D&B & Web vetting research failed (HTTP ${response.status}).`
        ) as Error & { code?: string };
        err.code = data.code || 'API_ERROR';
        throw err;
      }

      return {
        dunsNumber: data.dunsNumber,
        taxId: data.taxId,
        creditScore: data.creditScore,
        approvedCreditLimit: data.approvedCreditLimit,
        dsoDays: data.dsoDays,
        onTimePaymentRate: data.onTimePaymentRate,
        damageClaimHistoryCount: data.damageClaimHistoryCount,
        annualRevenueBand: data.annualRevenueBand,
        insuranceCOIStatus: data.insuranceCOIStatus,
        riskTier: data.riskTier,
        vettingStatus: 'Pending Review',
        vettingNotes: data.vettingNotes,
        dnbPaydexScore: data.dnbPaydexScore,
        dnbRating: data.dnbRating,
        dnbDelinquencyRisk: data.dnbDelinquencyRisk,
        yearFounded: data.yearFounded,
        employeeCountEstimate: data.employeeCountEstimate,
        headquartersVerified: data.headquartersVerified,
        legalEntityStatus: data.legalEntityStatus,
        liensOrJudgmentsSummary: data.liensOrJudgmentsSummary,
        webReputationSummary: data.webReputationSummary,
        webSources: data.webSources || [],
        researchSource: 'Live D&B + Web Grounding',
        p21MatchFound: false,
        matchedP21Id: nextP21Id,
        suggestedTerms: data.suggestedTerms || input.paymentTerms || 'Net 30',
        existingBalanceInP21: 0
      };
    }

    // Explicit offline test bureau simulation mode
    await new Promise(resolve => setTimeout(resolve, 650));
    const isWatchlistTest =
      q.includes('high') || q.includes('risk') || q.includes('delta') || q.includes('sub');
    const hash = companyName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    const creditScore = isWatchlistTest ? 645 : 740 + (hash % 85);
    const dnbPaydexScore = isWatchlistTest ? 58 : 79 + (hash % 15);
    const onTimePaymentRate = isWatchlistTest ? 82 : 94 + (hash % 6);
    const dsoDays = isWatchlistTest ? 46 : 21 + (hash % 14);
    const damageClaimHistoryCount = isWatchlistTest ? 2 : 0;
    const approvedCreditLimit = isWatchlistTest ? 15000 : 35000 + ((hash % 4) * 5000);
    const riskTier: CustomerVettingData['riskTier'] =
      creditScore >= 730 && onTimePaymentRate >= 92
        ? 'Low Risk'
        : creditScore >= 670
        ? 'Moderate Risk'
        : 'High Risk';

    return {
      dunsNumber: `0${(hash % 8) + 1}-${100 + (hash % 890)}-${1000 + (hash % 8900)}`,
      taxId: input.taxId?.trim() || `${40 + (hash % 55)}-${1100000 + (hash % 8000000)}`,
      creditScore,
      dnbPaydexScore,
      dnbRating: isWatchlistTest ? '1R3' : '3A2',
      dnbDelinquencyRisk: isWatchlistTest ? 'Moderate-High (48/100)' : 'Low Risk (12/100)',
      approvedCreditLimit,
      dsoDays,
      onTimePaymentRate,
      damageClaimHistoryCount,
      annualRevenueBand: isWatchlistTest ? '$45M Regional Contractor' : '$850M+ Utility & Grid Contractor',
      yearFounded: isWatchlistTest ? '2016' : '1998',
      employeeCountEstimate: isWatchlistTest ? '140–210 FTE' : '1,800+ FTE',
      headquartersVerified: input.billingAddress?.trim() || 'Verified Corporate HQ',
      legalEntityStatus: 'Active Corporation / Good Standing',
      liensOrJudgmentsSummary: isWatchlistTest
        ? '1 prior subcontractor mechanic lien resolved in 2024; 2 equipment settlement delays noted.'
        : 'Zero active federal tax liens, bankruptcies, or unresolved equipment judgments found.',
      insuranceCOIStatus: isWatchlistTest ? 'Pending COI' : 'Verified Active',
      riskTier,
      vettingStatus: 'Pending Review',
      webReputationSummary: isWatchlistTest
        ? `${companyName} is an active regional excavation & subsurface contractor. D&B trade tape shows slower 46-day DSO on seasonal projects; verify insurance COI prior to heavy hydraulic dispatch.`
        : `${companyName} operates established transmission & utility grid infrastructure contracts with consistent A/P settlement velocity, active safety compliance, and strong trade references.`,
      webSources: [],
      researchSource: 'Offline Test Bureau Simulation',
      vettingNotes: isWatchlistTest
        ? 'D&B PAYDEX 58 with 2 prior equipment claim delays (DSO 46d). Recommend Net 15 terms & mandatory 10% Tool Protection Waiver.'
        : 'Strong D&B & commercial credit profile, zero historical rental defaults, COI verified for high-voltage & pulling tools.',
      p21MatchFound: false,
      matchedP21Id: nextP21Id,
      suggestedTerms: isWatchlistTest ? 'Net 15' : 'Net 30',
      existingBalanceInP21: 0
    };
  };

  const runCustomerVettingLookup = async (
    companyName: string,
    taxIdOrDuns?: string
  ) => {
    return researchCustomerForVetting({ name: companyName, taxId: taxIdOrDuns }, 'simulation');
  };

  const addCustomer = (customer: Omit<Customer, 'id'>): Customer => {
    const timestamp = getTimestamp();
    const newNum = customers.length + 1;
    const p21CustId = customer.p21Id || `P21-CUST-${1000 + newNum}`;
    const newCustomer: Customer = {
      ...customer,
      id: `C${newNum}`,
      p21Id: p21CustId,
      p21Synced: true,
      billingAddress: customer.billingAddress || customer.address,
      shippingJobsiteAddress: customer.shippingJobsiteAddress || customer.address,
      paymentTerms: customer.paymentTerms || 'Net 30',
      billingCycleMonth: 'November 2026',
      monthlyBillingTotal: customer.balance || 0,
      latestCustomerUpdate:
        customer.latestCustomerUpdate ||
        `Customer vetted & onboarded into Epicor P21 (${p21CustId}) and November 2026 Monthly Billing.`,
      lastUpdatedAt: timestamp,
      accountStatus:
        customer.vetting?.riskTier === 'High Risk'
          ? 'Watchlist'
          : customer.balance > 1000
          ? 'Credit Hold'
          : 'Good Standing'
    };
    setCustomers(prev => [...prev, newCustomer]);

    const syncEntry: P21SyncLog = {
      id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      entity: 'Customer',
      status: 'Success',
      message: `Customer ${newCustomer.name} vetted (${newCustomer.vetting?.riskTier || 'Approved'}) & pushed to Epicor P21 Master (${p21CustId}).`
    };
    setSyncLogs(prev => [syncEntry, ...prev]);

    notify(
      'Customer Vetted, Onboarded & Synced to P21',
      `${newCustomer.name} assigned ${p21CustId} and enrolled in Monthly Consolidated Billing.`
    );
    return newCustomer;
  };

  const rejectCustomerApplication = (
    customerInput: Omit<Customer, 'id'>,
    reason: string
  ): Customer => {
    const timestamp = getTimestamp();
    const declinedId = `DEC-${disapprovedApplications.length + 101}`;
    const rejectedCustomer: Customer = {
      ...customerInput,
      id: declinedId,
      p21Synced: false,
      accountStatus: 'Disapproved',
      lastUpdatedAt: timestamp,
      latestCustomerUpdate: `Onboarding disapproved (${timestamp}): ${reason}`,
      vetting: customerInput.vetting
        ? {
            ...customerInput.vetting,
            vettingStatus: 'Rejected',
            vettedAt: '2026-11-17',
            vettedBy: 'Operations Credit Approver',
            disapprovalReason: reason
          }
        : undefined
    };

    setDisapprovedApplications(prev => [rejectedCustomer, ...prev]);

    const syncEntry: P21SyncLog = {
      id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      entity: 'Customer',
      status: 'Error',
      message: `Onboarding DISAPPROVED for ${rejectedCustomer.name}: ${reason}. Blocked from Epicor P21 Master.`
    };
    setSyncLogs(prev => [syncEntry, ...prev]);

    notify(
      'Customer Onboarding Disapproved',
      `${rejectedCustomer.name} marked as Disapproved (${reason}) and blocked from Epicor P21 rental credit.`,
      'warning'
    );
    return rejectedCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const timestamp = getTimestamp();
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, lastUpdatedAt: timestamp } : c))
    );
    notify('Customer Record Updated', 'Customer profile, P21 metadata, and monthly billing saved.');
  };

  const updateCustomerAfterReVetting = (
    customerId: string,
    updatedData: Omit<Customer, 'id'>
  ): Customer | null => {
    const existing = customers.find(c => c.id === customerId);
    if (!existing) return null;
    const timestamp = getTimestamp();
    const nextCreditLimit =
      updatedData.creditLimit ?? updatedData.vetting?.approvedCreditLimit ?? existing.creditLimit ?? 25000;
    const nextRiskTier = updatedData.vetting?.riskTier || existing.vetting?.riskTier || 'Low Risk';
    const nextStatus: Customer['accountStatus'] =
      nextRiskTier === 'High Risk' ? 'Watchlist' : 'Good Standing';

    const mergedCustomer: Customer = {
      ...existing,
      ...updatedData,
      id: existing.id,
      p21Id: existing.p21Id || updatedData.p21Id,
      p21Synced: true,
      balance: existing.balance,
      monthlyBillingTotal: existing.monthlyBillingTotal ?? existing.balance,
      creditLimit: nextCreditLimit,
      latePaymentsCount: 0,
      maxDaysOverdue: 0,
      accountStatus: nextStatus,
      lastUpdatedAt: timestamp,
      latestCustomerUpdate: `Re-Vetting Approved (${timestamp}): Fresh D&B/web underwriting completed. Credit limit $${nextCreditLimit.toLocaleString()} (${updatedData.paymentTerms || existing.paymentTerms}), account cleared from payment-risk hold.`,
      vetting: updatedData.vetting
        ? {
            ...updatedData.vetting,
            vettingStatus: 'Approved',
            vettedAt: '2026-11-18',
            vettedBy: 'Operations Credit Approver (Re-Vetted)'
          }
        : existing.vetting
    };

    setCustomers(prev => prev.map(c => (c.id === customerId ? mergedCustomer : c)));
    setInvoices(prev =>
      prev.map(inv =>
        inv.customerId === customerId && inv.status === 'Overdue'
          ? {
              ...inv,
              status: 'Unpaid',
              daysOverdue: 0,
              latestCustomerUpdate: `Customer re-vetted on 2026-11-18; balance rescheduled under ${mergedCustomer.paymentTerms}.`
            }
          : inv
      )
    );

    const syncEntry: P21SyncLog = {
      id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      entity: 'Customer',
      status: 'Success',
      message: `Re-Vetting Approved for ${mergedCustomer.name} (${mergedCustomer.p21Id}): Credit limit $${nextCreditLimit.toLocaleString()}, terms ${mergedCustomer.paymentTerms} synced to Epicor P21.`
    };
    setSyncLogs(prev => [syncEntry, ...prev]);

    notify(
      'Customer Re-Vetted & Synced to P21',
      `${mergedCustomer.name} re-vetting approved without re-entering profile data.`
    );
    return mergedCustomer;
  };

  const disapproveExistingCustomer = (
    customerId: string,
    reason: string,
    updatedVetting?: CustomerVettingData
  ) => {
    const existing = customers.find(c => c.id === customerId);
    if (!existing) return;
    const timestamp = getTimestamp();

    const updatedCust: Customer = {
      ...existing,
      accountStatus: 'Credit Hold',
      lastUpdatedAt: timestamp,
      latestCustomerUpdate: `Re-Vetting DISAPPROVED (${timestamp}): ${reason}. Account locked on Credit Hold.`,
      vetting: updatedVetting
        ? {
            ...updatedVetting,
            vettingStatus: 'Rejected',
            vettedAt: '2026-11-18',
            disapprovalReason: reason
          }
        : existing.vetting
        ? {
            ...existing.vetting,
            vettingStatus: 'Rejected',
            vettedAt: '2026-11-18',
            disapprovalReason: reason
          }
        : undefined
    };

    setCustomers(prev => prev.map(c => (c.id === customerId ? updatedCust : c)));
    setDisapprovedApplications(prev => [updatedCust, ...prev]);
    setSyncLogs(prev => [
      {
        id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        timestamp: new Date().toISOString(),
        entity: 'Customer',
        status: 'Error',
        message: `Re-Vetting Disapproved for ${existing.name} (${existing.p21Id}): ${reason}. Placed on P21 Credit Hold.`
      },
      ...prev
    ]);

    notify(
      'Re-Vetting Disapproved — Credit Hold Applied',
      `${existing.name} moved to Credit Hold (${reason}).`,
      'warning'
    );
  };

  const simulateLatePaymentForTest = (customerId: string, daysOverdue: number) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;
    const timestamp = getTimestamp();
    const nextLateCount = (cust.latePaymentsCount || 0) + 1;
    const nextMaxDays = Math.max(cust.maxDaysOverdue || 0, daysOverdue);

    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? {
              ...c,
              latePaymentsCount: nextLateCount,
              maxDaysOverdue: nextMaxDays,
              accountStatus: nextMaxDays > 61 ? 'Credit Hold' : 'Watchlist',
              latestCustomerUpdate: `Payment-risk alert (${timestamp}): ${nextLateCount} late payment(s), max ${nextMaxDays} days overdue.`,
              lastUpdatedAt: timestamp
            }
          : c
      )
    );

    setInvoices(prev => {
      const idx = prev.findIndex(i => i.customerId === customerId && i.status !== 'Paid');
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        status: 'Overdue',
        daysOverdue: Math.max(copy[idx].daysOverdue || 0, daysOverdue),
        lastUpdatedAt: timestamp
      };
      return copy;
    });

    notify(
      'Late Payment Triggered for Oversight Check',
      `${cust.name} now reflects ${nextLateCount} late payment(s) (${nextMaxDays}d overdue). AI Oversight flagged Re-Vetting warning.`,
      'warning'
    );
  };

  const addContract = (contract: Omit<Contract, 'id'>): Contract => {
    const timestamp = getTimestamp();
    const newId = `T-${1000 + contracts.length + 1}`;
    const p21OrdId = contract.p21OrderNum || `P21-ORD-${5000 + contracts.length + 1}`;
    const updateMsg = `New ${contract.status} ${newId} (${p21OrdId}) placed (${contract.items.length} tools). Transmitted to Epicor P21 & posted to November 2026 Monthly Statement.`;

    const newContract: Contract = {
      ...contract,
      id: newId,
      p21OrderNum: p21OrdId,
      p21Synced: true,
      p21SyncTimestamp: timestamp,
      flowStage:
        contract.status === ContractStatus.QUOTE || contract.status === ContractStatus.RESERVATION
          ? 'Quote & Reservation'
          : 'Active On-Rent',
      billingCycle: contract.billingCycle || 'Monthly Consolidated',
      annualInterestRate: contract.annualInterestRate ?? 18.0,
      dailyLateMultiplier: contract.dailyLateMultiplier ?? 1.5,
      latestCustomerUpdate: updateMsg,
      lastUpdatedAt: timestamp
    };
    setContracts(prev => [newContract, ...prev]);

    const cust = customers.find(c => c.id === contract.customerId);
    const p21CustRef = cust?.p21Id || `P21-CUST-${contract.customerId}`;

    const syncEntry: P21SyncLog = {
      id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      entity: 'Order',
      status: 'Success',
      message: `Rental Contract ${newId} placed for ${contract.customerName} (${p21CustRef}) -> Created Epicor P21 Sales Order ${p21OrdId} ($${contract.totalAmount.toFixed(2)}).`
    };
    setSyncLogs(prev => [syncEntry, ...prev]);

    if (contract.status === ContractStatus.ACTIVE) {
      contract.items.forEach(itemId => {
        updateItemStatus(itemId, ItemStatus.RENTED);
      });
      appendToCustomerMonthlyBilling(
        contract.customerId,
        newId,
        updateMsg,
        [
          {
            description: `Contract ${newId} (${p21OrdId}) Tool Rental Allocation (${contract.startDate} to ${contract.endDate})`,
            category: 'Base Rental',
            amount: Number(contract.totalAmount.toFixed(2))
          }
        ],
        'Monthly Consolidated Statement'
      );
    }
    notify(
      'Contract Placed & Synced to Epicor P21',
      `Contract ${newId} transmitted to P21 as ${p21OrdId} and linked to Monthly Billing.`
    );
    return newContract;
  };

  const sendQuote = (contract: Omit<Contract, 'id'>, recipientEmail: string): Contract => {
    const timestamp = getTimestamp();
    const newId = `Q-${1000 + contracts.length + 1}`;
    const p21QuoteRef = `P21-QT-${5000 + contracts.length + 1}`;
    const updateMsg = `Quote ${newId} ($${contract.totalAmount.toFixed(2)}) emailed to ${recipientEmail} on ${timestamp}. Pending customer approval before Epicor P21 order activation.`;

    const newQuote: Contract = {
      ...contract,
      id: newId,
      status: ContractStatus.QUOTE,
      flowStage: 'Quote & Reservation',
      p21OrderNum: p21QuoteRef,
      p21Synced: true,
      p21SyncTimestamp: timestamp,
      quoteSentAt: timestamp,
      quoteSentTo: recipientEmail,
      billingCycle: contract.billingCycle || 'Monthly Consolidated',
      annualInterestRate: contract.annualInterestRate ?? 18.0,
      dailyLateMultiplier: contract.dailyLateMultiplier ?? 1.5,
      latestCustomerUpdate: updateMsg,
      lastUpdatedAt: timestamp
    };

    setContracts(prev => [newQuote, ...prev]);

    const syncEntry: P21SyncLog = {
      id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      entity: 'Order',
      status: 'Success',
      message: `Quote ${newId} (${p21QuoteRef}) dispatched to ${recipientEmail} for ${contract.customerName} ($${contract.totalAmount.toFixed(2)}).`
    };
    setSyncLogs(prev => [syncEntry, ...prev]);

    notify(
      'Quote Sent to Customer',
      `Quote ${newId} emailed to ${recipientEmail} and logged as ${p21QuoteRef} (not billed until converted to active order).`,
      'info'
    );
    return newQuote;
  };

  const convertQuoteToOrder = (contractId: string) => {
    const quote = contracts.find(c => c.id === contractId);
    if (!quote) return;
    const timestamp = getTimestamp();
    const p21OrdId = `P21-ORD-${5000 + contracts.length + 1}`;
    const updateMsg = `Quote ${contractId} converted to Active Rental Order (${p21OrdId}). Tools allocated and added to November 2026 Monthly Billing.`;

    setContracts(prev =>
      prev.map(c =>
        c.id === contractId
          ? {
              ...c,
              status: ContractStatus.ACTIVE,
              flowStage: 'Active On-Rent',
              p21OrderNum: p21OrdId,
              p21Synced: true,
              p21SyncTimestamp: timestamp,
              latestCustomerUpdate: updateMsg,
              lastUpdatedAt: timestamp
            }
          : c
      )
    );

    quote.items.forEach(itemId => updateItemStatus(itemId, ItemStatus.RENTED));

    appendToCustomerMonthlyBilling(
      quote.customerId,
      contractId,
      updateMsg,
      [
        {
          description: `Converted Order ${contractId} (${p21OrdId}) Tool Rental Allocation (${quote.startDate} to ${quote.endDate})`,
          category: 'Base Rental',
          amount: Number(quote.totalAmount.toFixed(2))
        }
      ],
      'Monthly Consolidated Statement'
    );

    const syncEntry: P21SyncLog = {
      id: `P21-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      entity: 'Order',
      status: 'Success',
      message: `Quote ${contractId} converted to Active Order ${p21OrdId} for ${quote.customerName}.`
    };
    setSyncLogs(prev => [syncEntry, ...prev]);

    notify(
      'Quote Converted to Active Order',
      `${contractId} is now Active (${p21OrdId}) and posted to Monthly Billing.`
    );
  };

  const updateShipmentStatus = (
    contractId: string,
    shipmentId: string,
    status: ShipmentStage['status']
  ) => {
    const timestamp = getTimestamp();
    setContracts(prev =>
      prev.map(c => {
        if (c.id !== contractId || !c.shipments) return c;
        const nextShipments = c.shipments.map(s =>
          s.id === shipmentId ? { ...s, status } : s
        );
        return {
          ...c,
          shipments: nextShipments,
          lastUpdatedAt: timestamp,
          latestCustomerUpdate: `Shipment stage ${shipmentId} on ${contractId} updated to "${status}" (${timestamp}).`
        };
      })
    );
    notify('Shipment Stage Updated', `${contractId} · ${shipmentId} marked as ${status}.`, 'info');
  };

  const updateContract = (id: string, updates: Partial<Contract>) => {
    const timestamp = getTimestamp();
    setContracts(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, lastUpdatedAt: timestamp } : c))
    );
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const timestamp = getTimestamp();
    const newInvoice: Invoice = {
      ...invoice,
      id: `STM-2026-11-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      billingMonth: invoice.billingMonth || 'November 2026',
      lastUpdatedAt: timestamp
    };
    setInvoices(prev => [newInvoice, ...prev]);
    notify('Monthly Statement Generated', `Statement ${newInvoice.id} added to billing ledger.`);
  };

  const updateInvoiceStatus = (id: string, status: Invoice['status']) => {
    const inv = invoices.find(i => i.id === id);
    const timestamp = getTimestamp();
    const nextInvoices = invoices.map(i =>
      i.id === id
        ? {
            ...i,
            status,
            daysOverdue: status === 'Paid' ? 0 : i.daysOverdue,
            latestCustomerUpdate: `Monthly statement ${id} marked as ${status} on Nov 18.`,
            lastUpdatedAt: timestamp
          }
        : i
    );
    setInvoices(nextInvoices);
    if (inv && status === 'Paid' && inv.customerId) {
      const remainingOverdueDays = nextInvoices
        .filter(i => i.customerId === inv.customerId && i.status === 'Overdue')
        .reduce((max, i) => Math.max(max, i.daysOverdue || 0), 0);

      setCustomers(prev =>
        prev.map(c =>
          c.id === inv.customerId
            ? {
                ...c,
                balance: Math.max(0, Number((c.balance - inv.amount).toFixed(2))),
                maxDaysOverdue: remainingOverdueDays,
                lastPaymentDate: '2026-11-18',
                accountStatus: remainingOverdueDays > 61 ? 'Credit Hold' : 'Good Standing',
                latestCustomerUpdate: `Monthly Statement ${inv.id} ($${inv.amount.toLocaleString()}) paid in full.`,
                lastUpdatedAt: timestamp
              }
            : c
        )
      );
    }
    notify('Statement Updated', `Statement ${id} status updated to ${status}.`);
  };

  const runMonthlyBillingCycle = (billingMonth: string = 'November 2026') => {
    const timestamp = getTimestamp();
    let updatedCount = 0;
    customers.forEach(cust => {
      const custContracts = contracts.filter(c => c.customerId === cust.id);
      if (custContracts.length === 0) return;
      updatedCount++;
    });
    setInvoices(prev =>
      prev.map(inv => ({
        ...inv,
        billingMonth,
        lastUpdatedAt: timestamp,
        latestCustomerUpdate:
          inv.latestCustomerUpdate || `Consolidated in ${billingMonth} Monthly Billing Run.`
      }))
    );
    notify(
      'Monthly Billing Run Complete',
      `Consolidated ${updatedCount} customer statements for ${billingMonth} including all latest return, repair, interest, and replacement updates.`
    );
  };

  const addMaintenance = (record: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = {
      ...record,
      id: `MNT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    };
    setMaintenance(prev => [newRecord, ...prev]);
  };

  const addWorkOrder = (wo: Omit<WorkOrder, 'id'>) => {
    const newWo: WorkOrder = {
      ...wo,
      id: `WO-${800 + workOrders.length + 1}`
    };
    setWorkOrders(prev => [newWo, ...prev]);
    updateItemStatus(wo.itemId, wo.disposition === 'Scrap' ? ItemStatus.SCRAPPED : ItemStatus.MAINTENANCE);

    if (wo.billToCustomer && wo.customerId) {
      const partsCost = wo.parts.reduce((s, p) => s + p.quantity * p.unitCost, 0);
      const laborAndMat = wo.laborHours * wo.laborRate + wo.materialsCost;
      const updateNote =
        wo.disposition === 'Scrap'
          ? `Scrap Write-Off (${newWo.id}): ${wo.itemName} condemned as Beyond Economical Repair. $${wo.totalCost.toFixed(2)} billed to Monthly Statement.`
          : `Repair Work Order ${newWo.id} (${wo.itemName}): Labor/Materials ($${laborAndMat.toFixed(2)}) + Parts Reorder ($${partsCost.toFixed(2)}) billed to Monthly Statement.`;

      const lineItems: InvoiceLineItem[] =
        wo.disposition === 'Scrap'
          ? [
              {
                description: `${newWo.id}: Total Loss Scrap Write-Off — ${wo.itemName} (${wo.serialNumber})`,
                category: 'Scrap / BER Write-Off',
                amount: wo.totalCost
              }
            ]
          : [
              {
                description: `${newWo.id}: Repair Labor (${wo.laborHours}h @ $${wo.laborRate}/hr) & Shop Materials (${wo.itemName})`,
                category: 'Repair Labor & Materials',
                amount: laborAndMat
              },
              ...(partsCost > 0
                ? [
                    {
                      description: `${newWo.id}: OEM Replacement Parts Reorder (${wo.parts.map(p => p.partName).join(', ')})`,
                      category: 'Replacement Parts Reorder' as const,
                      amount: partsCost
                    }
                  ]
                : [])
            ];

      appendToCustomerMonthlyBilling(
        wo.customerId,
        wo.contractId || 'SHOP-WO',
        updateNote,
        lineItems,
        wo.disposition === 'Scrap' ? 'Scrap Total Loss Charge' : 'Repair & Parts Chargeback'
      );
    }

    notify('Work Order Created', `${newWo.id} opened for ${wo.itemName}.`);
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders(prev => prev.map(wo => (wo.id === id ? { ...wo, ...updates } : wo)));
    notify('Work Order Updated', `${id} updated.`);
  };

  const completeWorkOrder = (id: string) => {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;
    setWorkOrders(prev => prev.map(w => (w.id === id ? { ...w, status: 'Completed' } : w)));
    updateItemStatus(wo.itemId, ItemStatus.AVAILABLE);
    setInventory(prev =>
      prev.map(i =>
        i.id === wo.itemId
          ? {
              ...i,
              status: ItemStatus.AVAILABLE,
              conditionScore: 96,
              location: 'Rack A — Ready for Rent',
              lastInspectionDate: '2026-11-17'
            }
          : i
      )
    );
    if (wo.customerId) {
      postCustomerUpdate(
        wo.customerId,
        `Repair Work Order ${wo.id} completed for ${wo.itemName}. Tool restored to Available inventory; final repair charges confirmed on Monthly Statement.`
      );
    }
    notify('Repair Completed', `${wo.itemName} passed QC and returned to Available inventory.`);
  };

  const scrapWorkOrder = (id: string, scrapReason: string, salvageValue: number) => {
    const wo = workOrders.find(w => w.id === id);
    if (!wo) return;
    const item = inventory.find(i => i.id === wo.itemId);
    const replacementCost = item?.replacementCost || 1500;
    const netLossCharge = Math.max(0, replacementCost - salvageValue);
    const newRoId = `RO-${400 + replacementOrders.length + 1}`;

    setWorkOrders(prev =>
      prev.map(w =>
        w.id === id
          ? {
              ...w,
              status: 'Scrapped - BER',
              disposition: 'Scrap',
              scrapReason,
              salvageValue,
              totalCost: netLossCharge,
              replacementReorderId: newRoId
            }
          : w
      )
    );

    setInventory(prev =>
      prev.map(i =>
        i.id === wo.itemId
          ? {
              ...i,
              status: ItemStatus.SCRAPPED,
              conditionScore: 0,
              location: 'Scrap Quarantine Cage',
              nextCalibrationDate: 'SCRAPPED'
            }
          : i
      )
    );

    if (wo.customerId) {
      const newRo: ReplacementOrder = {
        id: newRoId,
        contractId: wo.contractId || 'T-1003',
        customerId: wo.customerId,
        customerName: wo.customerName || 'Customer',
        itemId: wo.itemId,
        itemName: wo.itemName,
        serialNumber: wo.serialNumber,
        modelNumber: item?.modelNumber || 'STD-OEM',
        reason: 'Scrapped - Beyond Repair',
        orderDate: '2026-11-17',
        vendor: `${item?.manufacturer || 'Tallman'} OEM Supply`,
        poNumber: `PO-${Math.floor(8900 + Math.random() * 900)}`,
        replacementCost,
        procurementFee: 0,
        totalBilledToCustomer: netLossCharge,
        status: 'PO Generated'
      };
      setReplacementOrders(prev => [newRo, ...prev]);

      const updateMsg = `Tool ${wo.itemName} (${wo.serialNumber}) condemned as SCRAPPED (BER): ${scrapReason}. Net Scrap Charge ($${netLossCharge.toFixed(2)}) & Replacement Order ${newRoId} added to Monthly Statement.`;
      appendToCustomerMonthlyBilling(
        wo.customerId,
        wo.contractId || 'T-1003',
        updateMsg,
        [
          {
            description: `Scrap / Total Loss Write-Off (${wo.itemName} - ${newRoId}) — $${replacementCost} MSRP less $${salvageValue} salvage`,
            category: 'Scrap / BER Write-Off',
            amount: netLossCharge
          }
        ],
        'Scrap Total Loss Charge'
      );
    }

    notify(
      'Tool Condemned & Scrapped',
      `${wo.itemName} marked Scrapped. Replacement Order ${newRoId} & Monthly Billing charge posted.`,
      'warning'
    );
  };

  const receiveReplacementOrder = (id: string) => {
    const ro = replacementOrders.find(r => r.id === id);
    if (!ro) return;
    setReplacementOrders(prev =>
      prev.map(r => (r.id === id ? { ...r, status: 'Received & Inventory Indexed' } : r))
    );
    setInventory(prev =>
      prev.map(item =>
        item.id === ro.itemId
          ? {
              ...item,
              status: ItemStatus.AVAILABLE,
              serialNumber: `${item.serialNumber.split('-')[0]}-NEW-${Math.floor(100 + Math.random() * 899)}`,
              conditionScore: 100,
              location: 'Rack A — Newly Received Replacement',
              lastInspectionDate: '2026-11-17'
            }
          : item
      )
    );
    notify(
      'Replacement Tool Received',
      `Replacement for ${ro.itemName} (${ro.id}) received from vendor and indexed as Available.`
    );
  };

  // Comprehensive POR Return Inspection & Billing Settlement Engine
  const processDetailedReturn = (payload: ReturnSubmissionPayload) => {
    const contract = contracts.find(c => c.id === payload.contractId);
    if (!contract) return;

    const timestamp = getTimestamp();
    const newLineItems: InvoiceLineItem[] = [];
    const summaryParts: string[] = [];

    let returnedIds = [...(contract.returnedItemIds || [])];
    let damagedIds = [...(contract.damagedItemIds || [])];
    let missingIds = [...(contract.missingItemIds || [])];
    let scrappedIds = [...(contract.scrappedItemIds || [])];

    let allReturnedOrResolved = true;
    let hasDamagedRepair = false;
    let hasScrapped = false;
    let hasMissingOrPartial = false;

    let totalReplacementAdded = 0;
    let totalRepairAdded = 0;
    let totalScrapAdded = 0;

    // 1. Handle timing adjustments (Early Return Credit, Late Surcharges, Phased Off-Schedule Interest)
    if (payload.returnMode === 'Early' && payload.earlyReturnCredit && payload.earlyReturnCredit > 0) {
      newLineItems.push({
        description: `Early Return Rate Tier Recalculation Credit (${contract.id})`,
        category: 'Early Return Credit',
        amount: -Math.abs(payload.earlyReturnCredit)
      });
      summaryParts.push(`Early return credit (-$${payload.earlyReturnCredit.toFixed(2)})`);
    }

    if (payload.lateSurcharge && payload.lateSurcharge > 0) {
      newLineItems.push({
        description: `Late Return Surcharge (${payload.lateDays || 1} days overdue @ 1.5x daily rate)`,
        category: 'Late Return Surcharge',
        amount: payload.lateSurcharge
      });
      summaryParts.push(`Late fee (+$${payload.lateSurcharge.toFixed(2)})`);
    }

    if (payload.offScheduleFee && payload.offScheduleFee > 0) {
      newLineItems.push({
        description: `Phased Return Off-Schedule Variance Fee (${payload.offScheduleDays || 1} days out-of-sequence)`,
        category: 'Late Return Surcharge',
        amount: payload.offScheduleFee
      });
      summaryParts.push(`Phased variance fee (+$${payload.offScheduleFee.toFixed(2)})`);
    }

    if (payload.accruedInterest && payload.accruedInterest > 0) {
      newLineItems.push({
        description: `Accrued Holdover / Phased Schedule Interest (${payload.annualInterestRate || 18}% APR / 1.5% Monthly)`,
        category: 'Phased Schedule Interest',
        amount: payload.accruedInterest
      });
      summaryParts.push(`Interest @ ${payload.annualInterestRate || 18}% APR (+$${payload.accruedInterest.toFixed(2)})`);
    }

    // 2. Process each item's return inspection & disposition
    payload.actions.forEach(act => {
      const item = inventory.find(i => i.id === act.itemId);
      if (!item) return;

      if (act.action === 'Return') {
        updateItemStatus(act.itemId, ItemStatus.AVAILABLE);
        setInventory(prev =>
          prev.map(i =>
            i.id === act.itemId
              ? {
                  ...i,
                  status: ItemStatus.AVAILABLE,
                  location: 'Rack A — Inspected & Ready',
                  lastInspectionDate: payload.returnDate,
                  conditionScore: 95
                }
              : i
          )
        );
        if (!returnedIds.includes(act.itemId)) returnedIds.push(act.itemId);
      } else if (act.action === 'KeepOnRent' || act.action === 'Extend') {
        allReturnedOrResolved = false;
        hasMissingOrPartial = true;
      } else if (act.action === 'Missing') {
        hasMissingOrPartial = true;
        updateItemStatus(act.itemId, ItemStatus.MISSING);
        if (!missingIds.includes(act.itemId)) missingIds.push(act.itemId);

        const procFee = Math.round(item.replacementCost * 0.08);
        const totalRoBill = item.replacementCost + procFee;
        totalReplacementAdded += totalRoBill;

        const roId = `RO-${400 + replacementOrders.length + 1 + Math.floor(Math.random() * 20)}`;
        const newRo: ReplacementOrder = {
          id: roId,
          contractId: contract.id,
          customerId: contract.customerId,
          customerName: contract.customerName,
          itemId: item.id,
          itemName: item.name,
          serialNumber: item.serialNumber,
          modelNumber: item.modelNumber || 'OEM-STD',
          reason:
            payload.returnMode === 'Partial' ? 'Partial Return - Unreturned' : 'Missing on Return',
          orderDate: payload.returnDate,
          vendor: `${item.manufacturer || 'Tallman Specialty'} Supply`,
          poNumber: `PO-${Math.floor(8850 + Math.random() * 900)}`,
          replacementCost: item.replacementCost,
          procurementFee: procFee,
          totalBilledToCustomer: totalRoBill,
          status: 'PO Generated'
        };
        setReplacementOrders(prev => [newRo, ...prev]);

        newLineItems.push({
          description: `Replacement Order ${roId}: Unreturned ${item.name} (${item.serialNumber}) — MSRP $${item.replacementCost} + $${procFee} procurement`,
          category: 'Replacement Order',
          amount: totalRoBill
        });
        summaryParts.push(`Replacement Order ${roId} for ${item.name} (+$${totalRoBill.toFixed(2)})`);
      } else if (act.action === 'DamagedRepair') {
        hasDamagedRepair = true;
        updateItemStatus(act.itemId, ItemStatus.MAINTENANCE);
        if (!returnedIds.includes(act.itemId)) returnedIds.push(act.itemId);
        if (!damagedIds.includes(act.itemId)) damagedIds.push(act.itemId);

        const laborHrs = act.laborHours ?? 2.5;
        const laborRate = act.laborRate ?? 115;
        const matCost = act.materialsCost ?? 45;
        const partsList: WorkOrder['parts'] = (act.partsToReorder || []).map((p, idx) => ({
          ...p,
          id: `PRT-${Date.now()}-${idx}`
        }));
        const partsTotal = partsList.reduce((s, p) => s + p.quantity * p.unitCost, 0);
        const laborMatTotal = laborHrs * laborRate + matCost;
        const woTotal = laborMatTotal + partsTotal;

        const woId = `WO-${800 + workOrders.length + 1 + Math.floor(Math.random() * 20)}`;
        const newWo: WorkOrder = {
          id: woId,
          itemId: item.id,
          itemName: item.name,
          serialNumber: item.serialNumber,
          contractId: contract.id,
          customerId: contract.customerId,
          customerName: contract.customerName,
          createdAt: payload.returnDate,
          status: partsList.some(p => !p.inStock) ? 'Open - Awaiting Parts' : 'In Repair',
          disposition: 'Repair',
          technician: payload.inspectorName || 'Robert J.',
          defectSummary:
            act.defectSummary ||
            act.inspection?.notes ||
            'Failed return inspection; mechanical & seal overhaul required.',
          laborHours: laborHrs,
          laborRate,
          materialsCost: matCost,
          materialsDescription:
            act.materialsDescription || 'Shop consumables, dielectric lubricants & bench test.',
          parts: partsList,
          totalCost: woTotal,
          billToCustomer: act.billCustomerForRepair !== false,
          inspectionChecklist: act.inspection
        };
        setWorkOrders(prev => [newWo, ...prev]);

        addMaintenance({
          itemId: item.id,
          date: payload.returnDate,
          description: `${woId}: ${newWo.defectSummary}`,
          cost: woTotal,
          technician: payload.inspectorName,
          workOrderId: woId,
          laborCost: laborHrs * laborRate,
          materialsCost: matCost,
          partsCost: partsTotal
        });

        if (act.billCustomerForRepair !== false) {
          totalRepairAdded += woTotal;
          newLineItems.push({
            description: `${woId} Repair Labor (${laborHrs}h @ $${laborRate}/hr) & Shop Materials — ${item.name}`,
            category: 'Repair Labor & Materials',
            amount: laborMatTotal
          });
          if (partsTotal > 0) {
            newLineItems.push({
              description: `${woId} Replacement Parts Reorder (${partsList.map(p => `${p.quantity}x ${p.partName}`).join(', ')})`,
              category: 'Replacement Parts Reorder',
              amount: partsTotal
            });
          }
          summaryParts.push(`Repair ${woId} for ${item.name} (+$${woTotal.toFixed(2)})`);
        }
      } else if (act.action === 'DamagedScrap') {
        hasScrapped = true;
        updateItemStatus(act.itemId, ItemStatus.SCRAPPED);
        if (!returnedIds.includes(act.itemId)) returnedIds.push(act.itemId);
        if (!scrappedIds.includes(act.itemId)) scrappedIds.push(act.itemId);

        const salvage = act.salvageValue ?? 100;
        const netScrapBill = Math.max(0, item.replacementCost - salvage);
        totalScrapAdded += netScrapBill;

        const roId = `RO-${400 + replacementOrders.length + 2 + Math.floor(Math.random() * 20)}`;
        const woId = `WO-${800 + workOrders.length + 2 + Math.floor(Math.random() * 20)}`;

        const newRo: ReplacementOrder = {
          id: roId,
          contractId: contract.id,
          customerId: contract.customerId,
          customerName: contract.customerName,
          itemId: item.id,
          itemName: item.name,
          serialNumber: item.serialNumber,
          modelNumber: item.modelNumber || 'OEM-STD',
          reason: 'Scrapped - Beyond Repair',
          orderDate: payload.returnDate,
          vendor: `${item.manufacturer || 'Tallman Specialty'} Supply`,
          poNumber: `PO-${Math.floor(8950 + Math.random() * 900)}`,
          replacementCost: item.replacementCost,
          procurementFee: 0,
          totalBilledToCustomer: netScrapBill,
          status: 'PO Generated'
        };
        setReplacementOrders(prev => [newRo, ...prev]);

        const scrapWo: WorkOrder = {
          id: woId,
          itemId: item.id,
          itemName: item.name,
          serialNumber: item.serialNumber,
          contractId: contract.id,
          customerId: contract.customerId,
          customerName: contract.customerName,
          createdAt: payload.returnDate,
          status: 'Scrapped - BER',
          disposition: 'Scrap',
          technician: payload.inspectorName || 'Robert J.',
          defectSummary: act.scrapReason || 'Condemned on Return Inspection as Beyond Economical Repair (BER).',
          laborHours: 1,
          laborRate: 115,
          materialsCost: 0,
          materialsDescription: 'Decommissioning & scrap condemnation inspection.',
          parts: [],
          totalCost: netScrapBill,
          billToCustomer: true,
          scrapReason: act.scrapReason || 'Severe structural deformation — unsafe for utility line service.',
          salvageValue: salvage,
          replacementReorderId: roId,
          inspectionChecklist: act.inspection
        };
        setWorkOrders(prev => [scrapWo, ...prev]);

        newLineItems.push({
          description: `Scrapped Tool Total Loss Charge (${item.name} — $${item.replacementCost} MSRP less $${salvage} salvage, Reorder ${roId})`,
          category: 'Scrap / BER Write-Off',
          amount: netScrapBill
        });
        summaryParts.push(`Scrapped ${item.name} & Reorder ${roId} (+$${netScrapBill.toFixed(2)})`);
      }
    });

    // Determine new Contract Status & FlowStage
    let newStatus = ContractStatus.COMPLETED;
    let newFlowStage: FlowStage = 'Completed & Billed';

    if (hasScrapped) {
      newStatus = ContractStatus.COMPLETED;
      newFlowStage = 'Scrap & Write-Off';
    } else if (hasDamagedRepair) {
      newStatus = ContractStatus.INSPECTION_PENDING;
      newFlowStage = 'Repair Shop';
    } else if (payload.returnMode === 'PhasedOffSchedule') {
      newStatus = allReturnedOrResolved ? ContractStatus.COMPLETED : ContractStatus.PHASED_RETURN;
      newFlowStage = 'Phased Return (Off-Schedule)';
    } else if (!allReturnedOrResolved || hasMissingOrPartial || payload.returnMode === 'Partial') {
      newStatus = ContractStatus.PARTIAL_RETURN;
      newFlowStage = 'Partial Return';
    } else if (payload.returnMode === 'Early') {
      newStatus = ContractStatus.EARLY_RETURN;
      newFlowStage = 'Early Return';
    }

    const netBillingDelta = newLineItems.reduce((s, li) => s + li.amount, 0);
    const updateHeadline =
      summaryParts.length > 0
        ? `Return Inspection (${payload.returnDate}): ${summaryParts.join(' · ')}. Synced to November Monthly Statement.`
        : `Return Inspection (${payload.returnDate}): All tools inspected and checked in clean by ${payload.inspectorName}. Monthly Statement finalized.`;

    setContracts(prev =>
      prev.map(c => {
        if (c.id !== contract.id) return c;
        return {
          ...c,
          actualReturnDate: payload.returnDate,
          status: newStatus,
          flowStage: newFlowStage,
          returnedItemIds: returnedIds,
          damagedItemIds: damagedIds,
          missingItemIds: missingIds,
          scrappedItemIds: scrappedIds,
          totalAmount: Math.max(0, Number((c.totalAmount + netBillingDelta).toFixed(2))),
          earlyReturnCredit: (c.earlyReturnCredit || 0) + (payload.earlyReturnCredit || 0),
          lateFeeTotal: (c.lateFeeTotal || 0) + (payload.lateSurcharge || 0) + (payload.offScheduleFee || 0),
          interestCharged: (c.interestCharged || 0) + (payload.accruedInterest || 0),
          replacementCharges: (c.replacementCharges || 0) + totalReplacementAdded,
          repairCharges: (c.repairCharges || 0) + totalRepairAdded,
          scrapCharges: (c.scrapCharges || 0) + totalScrapAdded,
          latestCustomerUpdate: updateHeadline,
          lastUpdatedAt: timestamp
        };
      })
    );

    if (newLineItems.length > 0) {
      appendToCustomerMonthlyBilling(
        contract.customerId,
        contract.id,
        updateHeadline,
        newLineItems,
        hasScrapped
          ? 'Scrap Total Loss Charge'
          : hasDamagedRepair
          ? 'Repair & Parts Chargeback'
          : payload.returnMode === 'PhasedOffSchedule'
          ? 'Phased Off-Schedule Billing'
          : hasMissingOrPartial
          ? 'Partial Return & Replacement'
          : payload.returnMode === 'Early'
          ? 'Early Return Settlement'
          : 'Monthly Consolidated Statement'
      );
    } else {
      postCustomerUpdate(contract.customerId, updateHeadline, 0);
    }

    notify('Return Inspection & Monthly Billing Updated', updateHeadline, 'success');
  };

  // Legacy quick return wrapper
  const processReturn = (contractId: string, actions: ReturnAction[]) => {
    processDetailedReturn({
      contractId,
      returnDate: '2026-11-17',
      returnMode: 'Standard',
      actions,
      inspectorName: 'Alex Thompson'
    });
  };

  const updateEmailSettings = (settings: EmailSettings) => {
    setEmailSettings(settings);
    notify('Email Settings Saved', `Configured ${settings.provider} transactional dispatch.`);
  };

  const updateNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings);
    notify('Alert Triggers Updated', 'Automated monthly statement and overdue alert preferences saved.');
  };

  const sendOverdueAlerts = async () => {
    const overdueContracts = contracts.filter(
      c => c.status === ContractStatus.OVERDUE || c.status === ContractStatus.PHASED_RETURN
    );
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
    await new Promise(resolve => setTimeout(resolve, 800));
    const totalSent = overdueContracts.length + overdueInvoices.length;
    notify(
      'Monthly Statement Alerts Dispatched',
      `Sent ${totalSent} overdue tool return and monthly statement notices to utility customers.`
    );
    return totalSent;
  };

  const runP21Sync = async () => {
    await new Promise(resolve => setTimeout(resolve, 900));
    const log: P21SyncLog = {
      id: Math.random().toString(36).substring(2, 7).toUpperCase(),
      timestamp: new Date().toISOString(),
      entity: 'Inventory',
      status: 'Success',
      message: `Epicor P21 Tool & Equipment Parity Sync: ${inventory.length} serialized tools verified.`
    };
    setSyncLogs(prev => [log, ...prev]);
    notify('P21 Tool Inventory Synced', log.message);
  };

  const runOrderSync = async () => {
    await new Promise(resolve => setTimeout(resolve, 900));
    const log: P21SyncLog = {
      id: Math.random().toString(36).substring(2, 7).toUpperCase(),
      timestamp: new Date().toISOString(),
      entity: 'Billing',
      status: 'Success',
      message: `P21 Monthly Billing Sync: ${invoices.length} customer monthly statements & ${replacementOrders.length} replacement POs transmitted.`
    };
    setSyncLogs(prev => [log, ...prev]);
    notify('P21 Monthly Billing Synced', log.message);
  };

  const exportBackup = () => {
    const data = JSON.stringify({
      inventory,
      customers,
      contracts,
      maintenance,
      invoices,
      workOrders,
      replacementOrders,
      stops
    });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tallmanrent_tools_backup_2026-11-17.json`;
    a.click();
    notify('Backup Exported', 'Full tool inventory, contracts, and monthly billing ledger exported.');
  };

  const importBackup = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.inventory) setInventory(parsed.inventory);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.contracts) setContracts(parsed.contracts);
      if (parsed.maintenance) setMaintenance(parsed.maintenance);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.workOrders) setWorkOrders(parsed.workOrders);
      if (parsed.replacementOrders) setReplacementOrders(parsed.replacementOrders);
      if (parsed.stops) setStops(parsed.stops);
      notify('Backup Restored', 'System state restored from JSON archive.');
    } catch (e) {
      console.error('Data import failed', e);
      notify('Restore Failed', 'Invalid backup JSON file format.', 'error');
    }
  };

  const updateItemStatus = (id: string, status: ItemStatus) => {
    setInventory(prev => prev.map(item => (item.id === id ? { ...item, status } : item)));
  };

  const updateContractStatus = (id: string, status: ContractStatus, flowStage?: FlowStage) => {
    setContracts(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status, ...(flowStage ? { flowStage } : {}) } : c
      )
    );
  };

  const updateStopStatus = (id: string, status: DeliveryStop['status']) => {
    setStops(prev => prev.map(s => (s.id === id ? { ...s, status } : s)));
    notify('Dock Queue Updated', `Warehouse dock event ${id} marked as ${status}.`);
  };

  return (
    <DataContext.Provider
      value={{
        inventory,
        customers,
        disapprovedApplications,
        workflowIssues,
        revetTargetCustomer,
        openReVettingModal,
        closeReVettingModal,
        contracts,
        maintenance,
        invoices,
        workOrders,
        replacementOrders,
        stops,
        syncLogs,
        emailSettings,
        notificationSettings,
        toasts,
        notify,
        dismissToast,
        addInventoryItem,
        updateInventoryItem,
        addCustomer,
        updateCustomer,
        updateCustomerAfterReVetting,
        disapproveExistingCustomer,
        simulateLatePaymentForTest,
        postCustomerUpdate,
        rejectCustomerApplication,
        researchCustomerForVetting,
        runCustomerVettingLookup,
        addContract,
        sendQuote,
        convertQuoteToOrder,
        updateShipmentStatus,
        updateContract,
        addInvoice,
        updateInvoiceStatus,
        runMonthlyBillingCycle,
        addMaintenance,
        processReturn,
        processDetailedReturn,
        addWorkOrder,
        updateWorkOrder,
        completeWorkOrder,
        scrapWorkOrder,
        receiveReplacementOrder,
        updateEmailSettings,
        updateNotificationSettings,
        sendOverdueAlerts,
        runP21Sync,
        runOrderSync,
        exportBackup,
        importBackup,
        updateItemStatus,
        updateContractStatus,
        updateStopStatus
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
