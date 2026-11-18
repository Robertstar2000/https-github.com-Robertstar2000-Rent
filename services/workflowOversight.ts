import {
  Customer,
  Contract,
  InventoryItem,
  Invoice,
  WorkOrder,
  ReplacementOrder,
  ContractStatus,
  ItemStatus,
  WorkflowIssue
} from '../types';

const REFERENCE_TODAY = '2026-11-18';

function diffDays(earlierIso: string, laterIso: string): number {
  const a = new Date(earlierIso).getTime();
  const b = new Date(laterIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function getCustomerPaymentRisk(
  customer: Customer,
  invoices: Invoice[]
): {
  latePaymentsCount: number;
  maxDaysOverdue: number;
  unpaidOverdueBalance: number;
  requiresReVetting: boolean;
  triggerReason: string | null;
} {
  const custInvoices = invoices.filter(i => i.customerId === customer.id);
  const overdueOrLateInvoices = custInvoices.filter(
    i =>
      i.status === 'Overdue' ||
      (i.status === 'Unpaid' && diffDays(i.dueDate, REFERENCE_TODAY) > 0)
  );

  const computedMaxOverdue = overdueOrLateInvoices.reduce((max, inv) => {
    const d = inv.daysOverdue ?? Math.max(0, diffDays(inv.dueDate, REFERENCE_TODAY));
    return Math.max(max, d);
  }, 0);

  const maxDaysOverdue = Math.max(customer.maxDaysOverdue || 0, computedMaxOverdue);
  const latePaymentsCount = Math.max(
    customer.latePaymentsCount || 0,
    overdueOrLateInvoices.length
  );

  const unpaidOverdueBalance = overdueOrLateInvoices.reduce((s, i) => s + i.amount, 0);
  const isAlreadyVetted = customer.vetting?.vettingStatus === 'Approved';

  const over61 = maxDaysOverdue > 61;
  const repeatLate = latePaymentsCount >= 2;
  const requiresReVetting = Boolean(isAlreadyVetted && (over61 || repeatLate));

  let triggerReason: string | null = null;
  if (requiresReVetting) {
    if (over61 && repeatLate) {
      triggerReason = `${latePaymentsCount} late payments & ${maxDaysOverdue} days overdue (>61-day threshold)`;
    } else if (over61) {
      triggerReason = `Payment ${maxDaysOverdue} days overdue (exceeds 61-day policy limit)`;
    } else {
      triggerReason = `${latePaymentsCount} late payments recorded since last vetting`;
    }
  }

  return {
    latePaymentsCount,
    maxDaysOverdue,
    unpaidOverdueBalance,
    requiresReVetting,
    triggerReason
  };
}

export function analyzeWorkflowOversight(params: {
  customers: Customer[];
  contracts: Contract[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  workOrders: WorkOrder[];
  replacementOrders: ReplacementOrder[];
}): WorkflowIssue[] {
  const { customers, contracts, inventory, invoices, workOrders, replacementOrders } = params;
  const issues: WorkflowIssue[] = [];

  // 1. Check vetted customers for >=2 late payments or >61 days overdue -> Warning + Re-Vetting option
  customers.forEach(cust => {
    const risk = getCustomerPaymentRisk(cust, invoices);
    if (risk.requiresReVetting) {
      const over61 = risk.maxDaysOverdue > 61;
      issues.push({
        id: `OV-REVET-${cust.id}`,
        severity: over61 ? 'critical' : 'warning',
        category: 'Late Payment & Re-Vetting',
        title: `Re-Vetting Required: ${cust.name}`,
        errorMessage: `Customer was vetted on ${
          cust.vetting?.vettedAt || 'file'
        } (${cust.vetting?.riskTier || 'Approved'}) but now shows ${
          risk.triggerReason
        }. Outstanding monthly/overdue exposure: $${(
          cust.monthlyBillingTotal ?? cust.balance
        ).toLocaleString(undefined, { minimumFractionDigits: 2 })}.`,
        instructions: over61
          ? `1. Hold further tool dispatches immediately. 2. Click "Re-Run Vetting Process" (pre-filled from P21) to pull fresh D&B PAYDEX, public liens & credit standing. 3. Collect past-due balance before restoring Net terms.`
          : `1. Click "Re-Run Vetting Process" to refresh D&B PAYDEX and web credit review. 2. Tighten payment terms (Net 15 / COD) or lower approved credit limit ($${(
              cust.creditLimit || 25000
            ).toLocaleString()}) if DSO continues rising.`,
        entityType: 'customer',
        entityId: cust.id,
        customerId: cust.id,
        requiresReVetting: true,
        actionLabel: 'Re-Run Vetting Process',
        targetRoute: '/customers'
      });
    } else if (cust.accountStatus === 'Credit Hold') {
      issues.push({
        id: `OV-HOLD-${cust.id}`,
        severity: 'warning',
        category: 'Late Payment & Re-Vetting',
        title: `Credit Hold Active: ${cust.name}`,
        errorMessage: `${cust.name} (${cust.p21Id || cust.id}) is currently placed on Credit Hold with $${cust.balance.toLocaleString()} balance.`,
        instructions: `Review open statements under Customers & Monthly Billing and verify payment receipt before releasing new orders.`,
        entityType: 'customer',
        entityId: cust.id,
        customerId: cust.id,
        requiresReVetting: true,
        actionLabel: 'Review & Re-Vet',
        targetRoute: '/customers'
      });
    }
  });

  // 2. Check Overdue Returns & Out-of-Schedule Multiple Return Dates
  contracts.forEach(c => {
    if (c.status === ContractStatus.OVERDUE || c.flowStage === 'Late / Overdue') {
      const daysLate = Math.max(1, c.daysDelta || diffDays(c.endDate, REFERENCE_TODAY));
      issues.push({
        id: `OV-LATE-${c.id}`,
        severity: 'critical',
        category: 'Overdue Return',
        title: `Overdue Tool Return: ${c.id} (${c.customerName})`,
        errorMessage: `Contract ${c.id} matured on ${c.endDate} and is ${daysLate} days overdue with ${c.items.length} serialized tools still unreturned.`,
        instructions: `1. Contact ${c.contactPerson || 'site supervisor'} to confirm jobsite demobilization. 2. Send Overdue Notice via ERP Console or dispatch carrier pickup. 3. Check tools in via Returns & Repairs to stop 1.5x daily surcharge + ${c.annualInterestRate ?? 18}% APR accrual.`,
        entityType: 'contract',
        entityId: c.id,
        customerId: c.customerId,
        contractId: c.id,
        actionLabel: 'Process Return',
        targetRoute: '/returns'
      });
    } else if (c.flowStage === 'Phased Return (Off-Schedule)') {
      const overduePhases = (c.phases || []).filter(p => p.status === 'Overdue');
      issues.push({
        id: `OV-PHASE-${c.id}`,
        severity: 'warning',
        category: 'Overdue Return',
        title: `Off-Schedule Multiple Return Dates: ${c.id}`,
        errorMessage: `${c.customerName} deviated from scheduled return milestones (${overduePhases.length} overdue phase${
          overduePhases.length === 1 ? '' : 's'
        }, +$${(c.interestCharged || 0).toFixed(2)} interest accrued).`,
        instructions: `Open Returns & Repairs for ${c.id} to reconcile off-schedule milestone return dates, verify 18% APR holdover interest, and push updated charges to Monthly Billing.`,
        entityType: 'contract',
        entityId: c.id,
        customerId: c.customerId,
        contractId: c.id,
        actionLabel: 'Reconcile Dates',
        targetRoute: '/returns'
      });
    }

    // 3. Check High Damaged / Scrapped Return Percentage per Contract & Customer
    const totalTools = c.items.length || 1;
    const damagedCount = (c.damagedItemIds?.length || 0) + (c.scrappedItemIds?.length || 0);
    const damagePct = Math.round((damagedCount / totalTools) * 100);
    if (damagePct >= 35 && damagedCount > 0) {
      issues.push({
        id: `OV-DMG-${c.id}`,
        severity: 'critical',
        category: 'High Damage / Scrap Rate',
        title: `${damagePct}% Damaged/Scrapped Return Rate on ${c.id}`,
        errorMessage: `${c.customerName} returned ${damagedCount} of ${totalTools} tool(s) damaged or condemned BER on contract ${c.id} ($${(
          (c.repairCharges || 0) + (c.scrapCharges || 0)
        ).toLocaleString()} recovery charges).`,
        instructions: `1. Enforce mandatory 10% Tool Damage Waiver & pre-dispatch Scan360 photo sign-off on future orders for ${c.customerName}. 2. Verify all Shop Work Orders & OEM Replacement POs are billed on November Monthly Statement.`,
        entityType: 'contract',
        entityId: c.id,
        customerId: c.customerId,
        contractId: c.id,
        actionLabel: 'Audit Repairs & BER',
        targetRoute: '/returns'
      });
    }

    // 4. Data Inconsistencies & Human Input Needed
    if (c.flowStage === 'Return Inspection' || c.status === ContractStatus.INSPECTION_PENDING) {
      if ((c.damagedItemIds?.length || 0) === 0 && (c.scrappedItemIds?.length || 0) === 0) {
        issues.push({
          id: `OV-DOCK-${c.id}`,
          severity: 'warning',
          category: 'Human Input Required',
          title: `Human Inspection Required: ${c.id} at Dock`,
          errorMessage: `Tools (${c.items.join(', ')}) for ${c.customerName} arrived at Return Dock on ${
            c.actualReturnDate || REFERENCE_TODAY
          } and are blocking inventory release & Monthly Statement lock.`,
          instructions: `Open Returns & Repairs -> Select ${c.id} -> Complete the 5-point physical & dielectric checklist to release tools back to Available racks.`,
          entityType: 'contract',
          entityId: c.id,
          customerId: c.customerId,
          contractId: c.id,
          actionLabel: 'Complete Inspection',
          targetRoute: '/returns'
        });
      }
    }

    if (c.status === ContractStatus.PARTIAL_RETURN && (c.missingItemIds?.length || 0) > 0) {
      issues.push({
        id: `OV-PARTIAL-${c.id}`,
        severity: 'info',
        category: 'Data Inconsistency',
        title: `Partial Return & Missing Asset Parity: ${c.id}`,
        errorMessage: `Contract ${c.id} (${c.customerName}) has ${
          c.missingItemIds?.length
        } unreturned/missing tool(s) (${c.missingItemIds?.join(', ')}) while remaining tools stay on rent.`,
        instructions: `Confirm OEM Replacement PO delivery under Replacement POs when vendor ships replacement serial, or check in remaining on-rent tools upon job completion.`,
        entityType: 'contract',
        entityId: c.id,
        customerId: c.customerId,
        contractId: c.id,
        actionLabel: 'Inspect Partial Return',
        targetRoute: '/returns'
      });
    }

    if (c.status !== ContractStatus.QUOTE && (!c.poNumber || !c.poNumber.trim())) {
      issues.push({
        id: `OV-NOPO-${c.id}`,
        severity: 'info',
        category: 'Data Inconsistency',
        title: `Missing Customer PO # on ${c.id}`,
        errorMessage: `Active/billed contract ${c.id} (${c.customerName}) is missing a Customer PO reference for Epicor P21 reconciliation.`,
        instructions: `Open Contracts & Return Dates -> Edit ${c.id} -> Enter the customer's PO # (highlighted as Needs Human Input) to prevent A/P invoice rejection.`,
        entityType: 'contract',
        entityId: c.id,
        customerId: c.customerId,
        contractId: c.id,
        actionLabel: 'Enter Missing PO #',
        targetRoute: '/contracts'
      });
    }
  });

  // 5. Inventory-wide Disrupted / Damaged Ratio Check
  const disruptedTools = inventory.filter(
    i =>
      i.status === ItemStatus.MAINTENANCE ||
      i.status === ItemStatus.DAMAGED ||
      i.status === ItemStatus.SCRAPPED ||
      i.status === ItemStatus.MISSING
  );
  const fleetDisruptedPct = Math.round((disruptedTools.length / (inventory.length || 1)) * 100);
  if (fleetDisruptedPct >= 15) {
    const openWOs = workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Scrapped - BER').length;
    const openROs = replacementOrders.filter(r => r.status !== 'Received & Inventory Indexed').length;
    issues.push({
      id: 'OV-FLEET-DMG',
      severity: 'warning',
      category: 'High Damage / Scrap Rate',
      title: `${fleetDisruptedPct}% of Tool Inventory Disrupted (${disruptedTools.length}/${inventory.length} Units)`,
      errorMessage: `${disruptedTools.length} serialized tools are currently In Repair, Damaged, Missing, or Scrapped BER — creating potential dispatch shortages across ${openWOs} open Work Orders & ${openROs} OEM Replacement POs.`,
      instructions: `1. Expedite QC sign-off on completed Repair Work Orders in Returns & Repairs. 2. Mark received OEM Replacement POs as Indexed to restore rack availability.`,
      entityType: 'inventory',
      entityId: 'INVENTORY',
      actionLabel: 'Clear Shop Queue',
      targetRoute: '/returns'
    });
  }

  return issues;
}
