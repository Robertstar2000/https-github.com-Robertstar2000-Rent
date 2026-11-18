import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  UserPlus,
  Search,
  Wrench,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Database,
  Check,
  Send,
  Truck,
  Plus,
  Trash2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ContractStatus, ContractPhase, ItemStatus, Customer, ShipmentStage } from '../types';
import CustomerOnboardingModal from '../components/CustomerOnboardingModal';
import { getCustomerPaymentRisk } from '../services/workflowOversight';

const NewOrder: React.FC = () => {
  const navigate = useNavigate();
  const {
    customers,
    inventory,
    contracts,
    invoices,
    syncLogs,
    openReVettingModal,
    addContract,
    sendQuote,
    notify
  } = useData();

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [sentQuoteInfo, setSentQuoteInfo] = useState<{
    id: string;
    email: string;
    p21Ref: string;
    total: number;
  } | null>(null);

  // Active Rental Contract Form State (Auto-filled from Customer / P21)
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || 'C1');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [billingAddress, setBillingAddress] = useState<string>('');
  const [jobSite, setJobSite] = useState<string>('');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [deliveryMethod, setDeliveryMethod] = useState<string>('Jobsite Freight Carrier');
  const [coordinator, setCoordinator] = useState<string>('Alex Thompson (Sr. Tool Dispatcher)');
  const [poNumber, setPoNumber] = useState<string>(`PO-${Math.floor(40000 + Math.random() * 50000)}`);

  const [contractType, setContractType] = useState<ContractStatus>(ContractStatus.ACTIVE);
  const [startDate, setStartDate] = useState<string>('2026-11-17');
  const [endDate, setEndDate] = useState<string>('2026-12-15');
  const [rateOptimization, setRateOptimization] = useState<'best_rate' | 'daily_only'>('best_rate');
  const [includeDamageWaiver, setIncludeDamageWaiver] = useState<boolean>(true);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(18.0);
  const [dailyLateMultiplier, setDailyLateMultiplier] = useState<number>(1.5);
  const [taxRate] = useState<number>(0.08);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true);
  const [signedByCustomer, setSignedByCustomer] = useState<string>('');
  const [notes, setNotes] = useState<string>(
    'Standard TallmanRent utility tool rental contract. Early returns re-rate to best tier on Monthly Statement; overdue or off-schedule return dates accrue 18.0% APR interest.'
  );

  // Tool selection & filtering
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [showAvailableOnly, setShowAvailableOnly] = useState<boolean>(true);
  const [showSelectedOnly, setShowSelectedOnly] = useState<boolean>(false);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(() => {
    const avail = inventory.filter(i => i.status === ItemStatus.AVAILABLE).slice(0, 2);
    return avail.map(i => i.id);
  });

  // Multiple return dates schedule builder
  const [enablePhasedSchedule, setEnablePhasedSchedule] = useState<boolean>(false);
  const [phases, setPhases] = useState<
    Array<{ id: string; label: string; scheduledDate: string; itemIds: string[] }>
  >([
    {
      id: 'RET-1',
      label: 'Return Date 1: Primary Pulling & Rigging Tools',
      scheduledDate: '2026-11-28',
      itemIds: []
    },
    {
      id: 'RET-2',
      label: 'Return Date 2: Termination, Crimping & Testing',
      scheduledDate: '2026-12-15',
      itemIds: []
    }
  ]);

  // Staged fulfillment / multiple shipments builder
  const [enableStagedShipments, setEnableStagedShipments] = useState<boolean>(false);
  const [shipments, setShipments] = useState<
    Array<{
      id: string;
      label: string;
      scheduledShipDate: string;
      carrierMethod: string;
      itemIds: string[];
    }>
  >([
    {
      id: 'SHP-1',
      label: 'Shipment #1: Primary Dispatch',
      scheduledShipDate: '2026-11-17',
      carrierMethod: 'Jobsite Freight Carrier',
      itemIds: []
    },
    {
      id: 'SHP-2',
      label: 'Shipment #2: Follow-Up Dispatch',
      scheduledShipDate: '2026-11-24',
      carrierMethod: 'Hot-Shot Utility Delivery',
      itemIds: []
    }
  ]);

  const selectedCustomer = customers.find(c => c.id === customerId);

  useEffect(() => {
    if (!selectedCustomer) return;
    setContactPerson(selectedCustomer.contactPerson || '');
    setCustomerPhone(selectedCustomer.phone || '');
    setCustomerEmail(selectedCustomer.email || '');
    setBillingAddress(selectedCustomer.billingAddress || selectedCustomer.address || '');
    setJobSite(
      selectedCustomer.shippingJobsiteAddress ||
        selectedCustomer.address ||
        'Primary Utility Jobsite'
    );
    setPaymentTerms(selectedCustomer.paymentTerms || 'Net 30');
    setSignedByCustomer(selectedCustomer.contactPerson || selectedCustomer.name);
  }, [customerId, selectedCustomer]);

  const handleCustomerOnboarded = (newCust: Customer) => {
    setCustomerId(newCust.id);
    setContactPerson(newCust.contactPerson || '');
    setCustomerPhone(newCust.phone || '');
    setCustomerEmail(newCust.email || '');
    setBillingAddress(newCust.billingAddress || newCust.address || '');
    setJobSite(newCust.shippingJobsiteAddress || newCust.address || '');
    setPaymentTerms(newCust.paymentTerms || 'Net 30');
    setSignedByCustomer(newCust.contactPerson || newCust.name);
  };

  const categories = useMemo(() => {
    const set = new Set<string>(inventory.map(i => i.category));
    return ['ALL', ...Array.from(set)];
  }, [inventory]);

  const filteredTools = useMemo(() => {
    return inventory.filter(item => {
      if (showSelectedOnly && !selectedToolIds.includes(item.id)) {
        return false;
      }
      if (
        showAvailableOnly &&
        item.status !== ItemStatus.AVAILABLE &&
        !selectedToolIds.includes(item.id)
      ) {
        return false;
      }
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.serialNumber.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.modelNumber || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventory, showAvailableOnly, showSelectedOnly, categoryFilter, searchTerm, selectedToolIds]);

  const selectedTools = useMemo(
    () => inventory.filter(i => selectedToolIds.includes(i.id)),
    [inventory, selectedToolIds]
  );

  const selectedCustomerRisk = useMemo(
    () => (selectedCustomer ? getCustomerPaymentRisk(selectedCustomer, invoices) : null),
    [selectedCustomer, invoices]
  );

  const effectiveTaxRate = selectedCustomer?.taxExemptCert ? 0 : taxRate;

  const isInvalidDateRange = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    return !Number.isNaN(s) && !Number.isNaN(e) && e < s;
  }, [startDate, endDate]);

  const unavailableSelectedTools = useMemo(
    () => selectedTools.filter(t => t.status !== ItemStatus.AVAILABLE),
    [selectedTools]
  );

  const rentalDays = useMemo(() => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff || 1);
  }, [startDate, endDate]);

  const pricingSummary = useMemo(() => {
    let rawDailyTotal = 0;
    let bestRateSubtotal = 0;
    let totalReplacementMsrp = 0;

    const months = Math.floor(rentalDays / 28);
    const remAfterMonths = rentalDays % 28;
    const weeks = Math.floor(remAfterMonths / 7);
    const days = remAfterMonths % 7;

    selectedTools.forEach(tool => {
      const dRate = tool.rate;
      const wRate = tool.weeklyRate || dRate * 4;
      const mRate = tool.monthlyRate || dRate * 12;

      const rawToolCost = dRate * rentalDays;
      rawDailyTotal += rawToolCost;
      totalReplacementMsrp += tool.replacementCost;

      if (rateOptimization === 'best_rate') {
        const optimizedCost = months * mRate + weeks * wRate + days * dRate;
        const cappedCost = Math.min(rawToolCost, optimizedCost);
        bestRateSubtotal += cappedCost;
      } else {
        bestRateSubtotal += rawToolCost;
      }
    });

    const bestRateSavings = Math.max(0, rawDailyTotal - bestRateSubtotal);
    const waiverAmount = includeDamageWaiver ? Math.round(bestRateSubtotal * 0.1 * 100) / 100 : 0;
    const taxAmount = Math.round((bestRateSubtotal + waiverAmount) * effectiveTaxRate * 100) / 100;
    const grandTotal = Number((bestRateSubtotal + waiverAmount + taxAmount).toFixed(2));

    return {
      months,
      weeks,
      days,
      rawDailyTotal,
      bestRateSubtotal,
      bestRateSavings,
      waiverAmount,
      taxAmount,
      grandTotal,
      totalReplacementMsrp
    };
  }, [selectedTools, rentalDays, rateOptimization, includeDamageWaiver, effectiveTaxRate]);

  const preflightErrors = useMemo(() => {
    const list: Array<{ title: string; error: string; fix: string; severity: 'critical' | 'warning' }> = [];
    if (selectedCustomer && selectedCustomerRisk?.requiresReVetting) {
      list.push({
        severity: 'critical',
        title: `Vetted Customer Payment-Risk Alert (${selectedCustomer.name})`,
        error: `Account triggers mandatory re-vetting (${selectedCustomerRisk.triggerReason}).`,
        fix: 'Click "Re-Run Vetting Process" below to refresh D&B & web credit approval before dispatching.'
      });
    } else if (selectedCustomer?.accountStatus === 'Credit Hold') {
      list.push({
        severity: 'critical',
        title: `Customer on Credit Hold (${selectedCustomer.name})`,
        error: `Current balance ($${selectedCustomer.balance.toLocaleString()}) exceeds P21 release threshold.`,
        fix: 'Send as Quote instead of Active Order, or Re-Run Vetting / collect payment first.'
      });
    }
    if (
      selectedCustomer &&
      pricingSummary.grandTotal + selectedCustomer.balance > (selectedCustomer.creditLimit || 25000)
    ) {
      list.push({
        severity: 'warning',
        title: 'Credit Line Exposure Exceeded',
        error: `Projected balance ($${(
          pricingSummary.grandTotal + selectedCustomer.balance
        ).toLocaleString()}) exceeds P21 credit limit ($${(
          selectedCustomer.creditLimit || 25000
        ).toLocaleString()}).`,
        fix: 'Increase credit limit via Re-Run Vetting Process or split fulfillment shipments.'
      });
    }
    if (isInvalidDateRange) {
      list.push({
        severity: 'critical',
        title: 'Invalid Return Date Consistency Error',
        error: `Scheduled Return Date (${endDate}) is earlier than Start Date (${startDate}).`,
        fix: 'Update Scheduled Return Date to be on or after the Start Date.'
      });
    }
    if (unavailableSelectedTools.length > 0) {
      list.push({
        severity: 'critical',
        title: `Tool Availability Conflict (${unavailableSelectedTools.length} Selected)`,
        error: `${unavailableSelectedTools
          .map(t => `${t.id} (${t.status})`)
          .join(', ')} cannot be allocated to a new active order.`,
        fix: 'Uncheck unavailable/in-repair tools below and pick Available units.'
      });
    }
    return list;
  }, [
    selectedCustomer,
    selectedCustomerRisk,
    pricingSummary.grandTotal,
    isInvalidDateRange,
    startDate,
    endDate,
    unavailableSelectedTools
  ]);

  const toggleToolSelection = (id: string) => {
    setSelectedToolIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const applyKitPreset = (presetType: 'stringing' | 'crimping' | 'underground') => {
    const matchCategories =
      presetType === 'stringing'
        ? ['Stringing Blocks', 'Tension & Metering']
        : presetType === 'crimping'
        ? ['Hydraulic Tools', 'Dielectric & Grounding']
        : ['Underground Pulling', 'Hoists & Rigging'];

    const matchingIds = inventory
      .filter(
        i =>
          matchCategories.includes(i.category) &&
          (i.status === ItemStatus.AVAILABLE || !showAvailableOnly)
      )
      .map(i => i.id);

    if (matchingIds.length > 0) {
      setSelectedToolIds(matchingIds);
      notify(
        'Tool Kit Applied',
        `Loaded ${matchingIds.length} serialized tools for ${presetType.toUpperCase()} package.`,
        'info'
      );
    } else {
      setShowAvailableOnly(false);
      const allInCat = inventory
        .filter(i => matchCategories.includes(i.category))
        .slice(0, 3)
        .map(i => i.id);
      setSelectedToolIds(allInCat);
    }
  };

  const toggleToolInShipment = (shipmentIdx: number, toolId: string) => {
    setShipments(prev =>
      prev.map((sh, idx) => {
        if (idx === shipmentIdx) {
          const exists = sh.itemIds.includes(toolId);
          return {
            ...sh,
            itemIds: exists ? sh.itemIds.filter(id => id !== toolId) : [...sh.itemIds, toolId]
          };
        }
        return {
          ...sh,
          itemIds: sh.itemIds.filter(id => id !== toolId)
        };
      })
    );
  };

  const addShipmentStage = () => {
    const nextNum = shipments.length + 1;
    setShipments(prev => [
      ...prev,
      {
        id: `SHP-${nextNum}`,
        label: `Shipment #${nextNum}: Staged Dispatch`,
        scheduledShipDate: endDate,
        carrierMethod: deliveryMethod,
        itemIds: []
      }
    ]);
  };

  const removeShipmentStage = (idx: number) => {
    if (shipments.length <= 1) return;
    setShipments(prev => prev.filter((_, i) => i !== idx));
  };

  const buildContractPayload = (finalStatus: ContractStatus) => {
    const cust = customers.find(c => c.id === customerId);

    const builtPhases: ContractPhase[] | undefined = enablePhasedSchedule
      ? phases.map((ph, idx) => ({
          id: ph.id,
          phaseNumber: idx + 1,
          label: ph.label,
          scheduledDate: ph.scheduledDate,
          itemIds:
            ph.itemIds.length > 0
              ? ph.itemIds
              : selectedToolIds.filter((_, i) => i % phases.length === idx),
          status: 'Scheduled',
          varianceDays: 0,
          accruedInterest: 0,
          offScheduleFee: 0
        }))
      : undefined;

    const builtShipments: ShipmentStage[] | undefined = enableStagedShipments
      ? shipments.map((sh, idx) => ({
          id: sh.id,
          shipmentNumber: idx + 1,
          label: sh.label,
          scheduledShipDate: sh.scheduledShipDate,
          carrierMethod: sh.carrierMethod,
          trackingOrBol: `BOL-${Math.floor(81000 + Math.random() * 9000)}-${idx + 1}`,
          itemIds:
            sh.itemIds.length > 0
              ? sh.itemIds.filter(id => selectedToolIds.includes(id))
              : selectedToolIds.filter((_, i) => i % shipments.length === idx),
          status: 'Planned'
        }))
      : undefined;

    return {
      customerId,
      customerName: cust?.name || 'Utility Customer',
      jobSite,
      poNumber,
      customerAddress: jobSite,
      billingAddress,
      customerPhone,
      customerEmail,
      contactPerson,
      paymentTerms,
      deliveryMethod,
      startDate,
      endDate,
      totalAmount: pricingSummary.grandTotal,
      status: finalStatus,
      flowStage: (
        finalStatus === ContractStatus.QUOTE || finalStatus === ContractStatus.RESERVATION
          ? 'Quote & Reservation'
          : 'Active On-Rent'
      ) as any,
      daysDelta: -rentalDays,
      items: selectedToolIds,
      shipments: builtShipments,
      returnedItemIds: [],
      missingItemIds: [],
      damagedItemIds: [],
      scrappedItemIds: [],
      phases: builtPhases,
      billingCycle: 'Monthly Consolidated' as const,
      damageWaiverRate: 0.1,
      damageWaiverIncluded: includeDamageWaiver,
      annualInterestRate,
      dailyLateMultiplier,
      accruedInterest: 0,
      lateFeeTotal: 0,
      earlyReturnCredit: 0,
      repairCharges: 0,
      replacementCharges: 0,
      scrapCharges: 0,
      isSigned: finalStatus !== ContractStatus.QUOTE,
      signedAt: finalStatus !== ContractStatus.QUOTE ? new Date().toISOString() : undefined,
      termsAccepted: true,
      notes: `${notes} [Authorized by: ${signedByCustomer || contactPerson} · Dispatch: ${deliveryMethod} · Coordinator: ${coordinator}]`,
      taxRate: effectiveTaxRate
    };
  };

  const handlePlaceOrder = (overrideStatus?: ContractStatus) => {
    if (isInvalidDateRange) {
      notify(
        'Date Error: Fix Scheduled Return Date',
        `Scheduled Return Date (${endDate}) cannot be earlier than Start Date (${startDate}).`,
        'error'
      );
      return;
    }
    if (unavailableSelectedTools.length > 0 && (overrideStatus || contractType) === ContractStatus.ACTIVE) {
      notify(
        'Tool Availability Conflict',
        `Swap out non-available tools (${unavailableSelectedTools.map(t => t.id).join(', ')}) before placing an Active Order.`,
        'error'
      );
      return;
    }
    if (selectedToolIds.length === 0) {
      notify(
        'Select Tools Required',
        'Please select at least one tool or equipment item for the rental contract.',
        'warning'
      );
      return;
    }
    if (!termsAccepted) {
      notify(
        'Contract Signature Required',
        'Confirm rental terms acceptance before transmitting order to Epicor P21.',
        'warning'
      );
      return;
    }

    const finalStatus = overrideStatus || contractType;
    if (finalStatus === ContractStatus.QUOTE) {
      handleSendQuote();
      return;
    }

    addContract(buildContractPayload(finalStatus));
    navigate('/contracts');
  };

  const handleSendQuote = () => {
    if (selectedToolIds.length === 0) {
      notify(
        'Select Tools Required',
        'Please select at least one tool or equipment item before sending a Quote.',
        'warning'
      );
      return;
    }
    const targetEmail = customerEmail.trim() || selectedCustomer?.email || 'billing@customer.com';
    setContractType(ContractStatus.QUOTE);
    const createdQuote = sendQuote(buildContractPayload(ContractStatus.QUOTE), targetEmail);
    setSentQuoteInfo({
      id: createdQuote.id,
      email: targetEmail,
      p21Ref: createdQuote.p21OrderNum || 'P21-QT',
      total: createdQuote.totalAmount
    });
  };

  const jobsiteOptions = useMemo(() => {
    const list: string[] = [];
    if (selectedCustomer?.shippingJobsiteAddress) {
      list.push(selectedCustomer.shippingJobsiteAddress);
    }
    if (selectedCustomer?.address && selectedCustomer.address !== selectedCustomer.shippingJobsiteAddress) {
      list.push(selectedCustomer.address);
    }
    list.push('Substation 230kV Feeder & Tie-Line Upgrade Yard');
    list.push('Regional Underground Duct Bank Laydown Lot B');
    return Array.from(new Set(list));
  }, [selectedCustomer]);

  const nextContractId = `T-${1000 + contracts.length + 1}`;
  const nextP21OrderId = `P21-ORD-${5000 + contracts.length + 1}`;

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <FilePlus2 size={17} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[15px] font-display font-bold text-slate-900">
                New Rental Order / Contract Entry
              </h1>
              {contractType === ContractStatus.QUOTE ? (
                <span className="px-2.5 py-0.5 bg-yellow-300 text-slate-950 border border-yellow-500 rounded font-extrabold text-[11px] tracking-wide">
                  QUOTE — NOT AN ACTIVE ORDER
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-500">
                  {nextContractId} · Target {nextP21OrderId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a P21 Customer to auto-fill addresses & credit terms, configure multiple shipments or return dates, send a Quote, or place an Order.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSendQuote}
            className="px-3.5 py-1.5 bg-yellow-300 hover:bg-yellow-400 text-slate-950 border border-yellow-500 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5"
          >
            <Send size={13} />
            <span>Send Quote</span>
          </button>
          <button
            type="button"
            onClick={() => handlePlaceOrder(ContractStatus.ACTIVE)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 size={14} />
            <span>Place Order & Push to Epicor P21</span>
          </button>
        </div>
      </div>

      {/* Prominent Yellow QUOTE Status Block */}
      {(contractType === ContractStatus.QUOTE || sentQuoteInfo) && (
        <div className="bg-yellow-300 text-slate-950 border-2 border-yellow-500 px-4 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-extrabold">
            {sentQuoteInfo ? (
              <span>
                QUOTE SENT ({sentQuoteInfo.id} · {sentQuoteInfo.p21Ref}) — Emailed to{' '}
                {sentQuoteInfo.email} (${sentQuoteInfo.total.toLocaleString()}). Tools are NOT locked and Monthly Billing is NOT charged until converted to an active order.
              </span>
            ) : (
              <span>
                QUOTE — NOT AN ACTIVE ORDER: Contract status is set to Quote. Click &ldquo;Send Quote&rdquo; to email the proposal or &ldquo;Place Order&rdquo; to activate.
              </span>
            )}
          </div>
          {sentQuoteInfo && (
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg shrink-0"
            >
              View Quote in Contracts →
            </button>
          )}
        </div>
      )}

      {/* AI Oversight Pre-Flight Errors & Re-Vetting Warning */}
      {preflightErrors.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-3 space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          {preflightErrors.map((err, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs ${
                err.severity === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <AlertTriangle
                  size={15}
                  className={
                    err.severity === 'critical'
                      ? 'text-rose-600 shrink-0 mt-0.5'
                      : 'text-amber-600 shrink-0 mt-0.5'
                  }
                />
                <div>
                  <strong className="block">{err.title}</strong>
                  <span className="text-[11px] block mt-0.5">
                    <strong>Issue:</strong> {err.error} <strong>Instructions:</strong> {err.fix}
                  </span>
                </div>
              </div>
              {selectedCustomer &&
                (selectedCustomerRisk?.requiresReVetting ||
                  selectedCustomer.accountStatus === 'Credit Hold') &&
                idx === 0 && (
                  <button
                    type="button"
                    onClick={() => openReVettingModal(selectedCustomer)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 shrink-0"
                  >
                    <UserCheck size={13} />
                    <span>Re-Run Vetting Process</span>
                  </button>
                )}
            </div>
          ))}
        </div>
      )}

      {/* Main 12-Col Workstation */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        {/* Left 8 Cols */}
        <div className="xl:col-span-8 space-y-3">
          {/* Section 1: Customer & Contract Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-display font-bold text-slate-900">
                  1. Customer Account &amp; Epicor P21 Auto-Fill
                </span>
                {selectedCustomer?.p21Id && (
                  <span className="text-[11px] font-mono text-blue-700 font-semibold flex items-center gap-1">
                    <Database size={11} />
                    Auto-Filled · {selectedCustomer.p21Id}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <UserPlus size={13} />
                <span>+ Onboard &amp; Vet New Customer (P21)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
              <div className="md:col-span-5">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Customer Account (Auto-Fills P21 Data)
                </label>
                <select
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:border-blue-500 outline-none"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.p21Id || c.id}) — {c.accountStatus || 'Good Standing'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Jobsite / Ship-To Address</span>
                  <span className="text-[10px] font-mono text-blue-700">Auto-Filled</span>
                </label>
                <select
                  value={jobSite}
                  onChange={e => setJobSite(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-blue-50/20 border border-blue-200 rounded-lg text-xs font-medium text-slate-900"
                >
                  {jobsiteOptions.map(addr => (
                    <option key={addr} value={addr}>
                      {addr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Customer PO #</span>
                  <span className="text-[10px] font-semibold text-amber-800">Human Input</span>
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  placeholder="Enter PO #"
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono font-semibold text-slate-900 ${
                    !poNumber.trim()
                      ? 'bg-amber-50/50 border-amber-400'
                      : 'bg-amber-50/20 border-amber-300'
                  }`}
                />
              </div>
            </div>

            {/* Auto-Filled Contact & Billing Strip */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-blue-50/30 p-2.5 rounded-lg border border-blue-200/70">
              <div className="md:col-span-5">
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  Billing Address (Auto-Filled · P21)
                </label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={e => setBillingAddress(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-900"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  Primary Contact (P21)
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  Phone (P21)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  Billing Email (P21)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-900"
                />
              </div>
            </div>

            {selectedCustomer && (
              <div className="px-3 py-2 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-600">
                  <span>
                    Vetting:{' '}
                    <strong className="text-emerald-700">
                      {selectedCustomer.vetting?.vettingStatus || 'Approved'} (
                      {selectedCustomer.vetting?.riskTier || 'Low Risk'})
                    </strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    Credit Score:{' '}
                    <strong className="font-mono text-slate-900">
                      {selectedCustomer.vetting?.creditScore || 780}
                    </strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    On-Time:{' '}
                    <strong className="font-mono text-slate-900">
                      {selectedCustomer.vetting?.onTimePaymentRate || 96}%
                    </strong>
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>
                    Limit:{' '}
                    <strong className="font-mono text-slate-900">
                      ${(selectedCustomer.creditLimit || 25000).toLocaleString()}
                    </strong>
                  </span>
                </div>
                <span className="font-mono tabular-nums text-slate-600">
                  Nov Monthly Bill:{' '}
                  <strong className="text-slate-900">
                    ${(selectedCustomer.monthlyBillingTotal ?? selectedCustomer.balance).toLocaleString()}
                  </strong>
                </span>
              </div>
            )}

            {/* Terms & Schedule Row */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Contract Status
                </label>
                <select
                  value={contractType}
                  onChange={e => setContractType(e.target.value as ContractStatus)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                >
                  <option value={ContractStatus.ACTIVE}>Active Rental Order</option>
                  <option value={ContractStatus.RESERVATION}>Reservation</option>
                  <option value={ContractStatus.QUOTE}>Quote</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                >
                  <option value="Net 30">Net 30 (Monthly)</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 15">Net 15</option>
                  <option value="COD / Card">COD / Card</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Dispatch Method
                </label>
                <select
                  value={deliveryMethod}
                  onChange={e => setDeliveryMethod(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                >
                  <option value="Jobsite Freight Carrier">Freight Carrier</option>
                  <option value="Will-Call Counter Pickup">Will-Call Pickup</option>
                  <option value="Substation Yard Staging">Yard Staging</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Scheduled Return
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  POR Rate Tier
                </label>
                <select
                  value={rateOptimization}
                  onChange={e => setRateOptimization(e.target.value as any)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                >
                  <option value="best_rate">POR Auto Best-Rate</option>
                  <option value="daily_only">Daily Rate Only</option>
                </select>
              </div>
            </div>

            {/* Coordinator, APR & Fulfillment/Return Options */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 items-end">
              <div className="sm:col-span-3">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Tool Coordinator
                </label>
                <select
                  value={coordinator}
                  onChange={e => setCoordinator(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option>Alex Thompson (Sr. Tool Dispatcher)</option>
                  <option>Sarah Chen (Utility Account Desk)</option>
                  <option>Marcus Bell (Credit & Return Ops)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Holdover APR (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={annualInterestRate}
                  onChange={e => setAnnualInterestRate(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Late Multiplier
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={dailyLateMultiplier}
                  onChange={e => setDailyLateMultiplier(Number(e.target.value))}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
              </div>
              <div className="sm:col-span-5 flex flex-wrap items-center gap-4 pb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableStagedShipments}
                    onChange={e => setEnableStagedShipments(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <Truck size={14} className="text-blue-600" />
                  <span>Fulfill in Stages (Multiple Shipments)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enablePhasedSchedule}
                    onChange={e => setEnablePhasedSchedule(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600"
                  />
                  <Layers size={14} className="text-amber-600" />
                  <span>Multiple Return Dates</span>
                </label>
              </div>
            </div>

            {enableStagedShipments && (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                    <Truck size={14} className="text-blue-600" />
                    Staged Fulfillment Plan ({shipments.length} Shipments)
                  </span>
                  <button
                    type="button"
                    onClick={addShipmentStage}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-md flex items-center gap-1"
                  >
                    <Plus size={12} />
                    Add Shipment Stage
                  </button>
                </div>

                <div className="space-y-2">
                  {shipments.map((sh, idx) => (
                    <div
                      key={sh.id}
                      className="p-2.5 bg-white border border-blue-200 rounded-lg space-y-1.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-semibold text-blue-700 shrink-0">
                          {sh.id}
                        </span>
                        <input
                          type="text"
                          value={sh.label}
                          onChange={e => {
                            const next = [...shipments];
                            next[idx].label = e.target.value;
                            setShipments(next);
                          }}
                          className="flex-1 min-w-[160px] px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                        />
                        <input
                          type="date"
                          value={sh.scheduledShipDate}
                          onChange={e => {
                            const next = [...shipments];
                            next[idx].scheduledShipDate = e.target.value;
                            setShipments(next);
                          }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                        />
                        <select
                          value={sh.carrierMethod}
                          onChange={e => {
                            const next = [...shipments];
                            next[idx].carrierMethod = e.target.value;
                            setShipments(next);
                          }}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
                        >
                          <option value="Jobsite Freight Carrier">Jobsite Freight Carrier</option>
                          <option value="Hot-Shot Utility Delivery">Hot-Shot Utility Delivery</option>
                          <option value="Will-Call Counter Pickup">Will-Call Counter Pickup</option>
                          <option value="Substation Yard Staging">Substation Yard Staging</option>
                        </select>
                        {shipments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeShipmentStage(idx)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Remove shipment stage"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {selectedTools.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[11px] text-slate-500 mr-1">
                            Assign tools to Stage {idx + 1}:
                          </span>
                          {selectedTools.map(tool => {
                            const inThisStage = sh.itemIds.includes(tool.id);
                            return (
                              <button
                                key={tool.id}
                                type="button"
                                onClick={() => toggleToolInShipment(idx, tool.id)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border transition-colors ${
                                  inThisStage
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {tool.id}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enablePhasedSchedule && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {phases.map((ph, idx) => (
                  <div
                    key={ph.id}
                    className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono font-semibold text-amber-900 shrink-0">{ph.id}</span>
                    <input
                      type="text"
                      value={ph.label}
                      onChange={e => {
                        const next = [...phases];
                        next[idx].label = e.target.value;
                        setPhases(next);
                      }}
                      className="flex-1 px-2 py-1 bg-white border border-amber-200 rounded text-xs font-medium"
                    />
                    <input
                      type="date"
                      value={ph.scheduledDate}
                      onChange={e => {
                        const next = [...phases];
                        next[idx].scheduledDate = e.target.value;
                        setPhases(next);
                      }}
                      className="px-2 py-1 bg-white border border-amber-200 rounded text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Serialized Tool & Equipment Selector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Wrench size={14} className="text-blue-600" />
                <span className="text-xs font-display font-bold text-slate-900">
                  2. Rental Contract Tool & Equipment Schedule ({selectedToolIds.length} Selected)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyKitPreset('stringing')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium"
                >
                  230kV Stringing Kit
                </button>
                <button
                  type="button"
                  onClick={() => applyKitPreset('crimping')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium"
                >
                  Substation Crimping Kit
                </button>
                <button
                  type="button"
                  onClick={() => applyKitPreset('underground')}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 rounded-md text-[11px] font-medium"
                >
                  Underground Pulling Kit
                </button>
              </div>
            </div>

            <div className="p-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="relative w-56">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search tool, serial #, model..."
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAvailableOnly}
                    onChange={e => setShowAvailableOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Available Only
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-blue-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSelectedOnly}
                    onChange={e => setShowSelectedOnly(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Selected Only ({selectedToolIds.length})
                </label>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-medium text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2 px-3 w-8">Pick</th>
                    <th className="py-2 px-2.5">Tool ID & Name</th>
                    <th className="py-2 px-2.5">Serial & Model</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5 text-right">Day / Wk / Mo Rate</th>
                    <th className="py-2 px-3 text-right">MSRP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTools.map(tool => {
                    const isSelected = selectedToolIds.includes(tool.id);
                    return (
                      <tr
                        key={tool.id}
                        onClick={() => toggleToolSelection(tool.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600"
                          />
                        </td>
                        <td className="py-2 px-2.5">
                          <span className="font-mono font-semibold text-blue-600 mr-1.5">
                            {tool.id}
                          </span>
                          <span className="font-semibold text-slate-900">{tool.name}</span>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[11px] text-slate-600">
                          {tool.serialNumber} · {tool.modelNumber || 'STD'}
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`text-[11px] font-semibold ${
                              tool.status === ItemStatus.AVAILABLE
                                ? 'text-emerald-700'
                                : 'text-blue-700'
                            }`}
                          >
                            {tool.status}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono tabular-nums text-[11px]">
                          <strong className="text-slate-900">${tool.rate}/d</strong> · $
                          {tool.weeklyRate || tool.rate * 4}/w ·{' '}
                          <span className="text-blue-700 font-semibold">
                            ${tool.monthlyRate || tool.rate * 12}/m
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono tabular-nums text-[11px] text-slate-600">
                          ${tool.replacementCost.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Clean Sticky Financial & Signature Ledger */}
        <div className="xl:col-span-4 space-y-3 xl:sticky xl:top-16">
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            {contractType === ContractStatus.QUOTE && (
              <div className="px-4 py-2 bg-yellow-300 text-slate-950 border-b-2 border-yellow-500 font-extrabold text-xs tracking-wide text-center">
                QUOTE — NOT AN ACTIVE ORDER
              </div>
            )}

            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] font-mono font-semibold text-blue-600 block">
                  {contractType === ContractStatus.QUOTE
                    ? 'PROPOSED QUOTE SUMMARY'
                    : 'CONTRACT LEDGER & P21 SYNC'}
                </span>
                <h2 className="text-sm font-display font-bold text-slate-900 truncate">
                  {selectedCustomer?.name || 'Select Customer'}
                </h2>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedCustomer?.p21Id} · {paymentTerms} ·{' '}
                  {enableStagedShipments ? `${shipments.length} Shipments` : deliveryMethod}
                </p>
              </div>
              <div className="text-right font-mono shrink-0">
                <span className="text-xs font-bold text-slate-900">{rentalDays} Days</span>
                <span className="block text-[11px] text-slate-500">
                  {pricingSummary.months}m · {pricingSummary.weeks}w · {pricingSummary.days}d
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* Selected Tools Mini List */}
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {selectedTools.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded-lg border border-slate-200/70"
                  >
                    <div className="truncate pr-2">
                      <span className="font-mono text-blue-600 font-semibold mr-1.5">{t.id}</span>
                      <span className="text-slate-800 font-medium">{t.name}</span>
                    </div>
                    <span className="font-mono tabular-nums text-slate-700 font-semibold shrink-0">
                      ${t.rate}/d
                    </span>
                  </div>
                ))}
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-1.5 pt-2.5 border-t border-slate-100 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">Raw Daily Rate ({rentalDays}d)</span>
                  <span>${pricingSummary.rawDailyTotal.toFixed(2)}</span>
                </div>
                {pricingSummary.bestRateSavings > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="font-sans">POR Best-Rate Optimization</span>
                    <span>-${pricingSummary.bestRateSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-900 font-semibold pt-1 border-t border-slate-100">
                  <span className="font-sans">Net Tool Rental Subtotal</span>
                  <span>${pricingSummary.bestRateSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <label className="font-sans flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDamageWaiver}
                      onChange={e => setIncludeDamageWaiver(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>10% Tool Protection Plan</span>
                  </label>
                  <span>+${pricingSummary.waiverAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">
                    {selectedCustomer?.taxExemptCert
                      ? `Utility Tax Exempt (${selectedCustomer.taxExemptCert} · P21)`
                      : 'Estimated Utility Tax (8%)'}
                  </span>
                  <span>+${pricingSummary.taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 flex items-baseline justify-between">
                  <div>
                    <span className="font-sans text-xs font-bold text-slate-900 block">
                      Contract Total (Nov Monthly Bill)
                    </span>
                    <span className="font-sans text-[11px] text-slate-500">
                      MSRP Exposure: ${pricingSummary.totalReplacementMsrp.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xl font-bold text-emerald-700">
                    ${pricingSummary.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Execution & P21 Signature Box */}
              <div
                className={`p-3 rounded-lg border space-y-2 text-[11px] ${
                  !termsAccepted
                    ? 'bg-amber-50/60 border-amber-400'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Contract Execution &amp; Human Sign-Off
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800">
                    Needs Human Input
                  </span>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">
                    Customer Authorized Sign-Off
                  </label>
                  <input
                    type="text"
                    value={signedByCustomer}
                    onChange={e => setSignedByCustomer(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-900 font-medium"
                  />
                </div>
                <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 mt-0.5"
                  />
                  <span>
                    Accept TallmanRent monthly billing terms ({annualInterestRate}% APR overdue/multiple return dates interest, {dailyLateMultiplier}x late surcharge, 5-point return inspection & BER scrap liability).
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSendQuote}
                  className="py-2.5 px-3 bg-yellow-300 hover:bg-yellow-400 text-slate-950 border border-yellow-500 font-extrabold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  <span>Send Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlaceOrder(ContractStatus.ACTIVE)}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 size={14} />
                  <span>Place Order (P21)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Simulated Epicor P21 Sync Feed */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-3.5 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Database size={13} className="text-blue-600" />
                <span className="text-xs font-semibold text-slate-900">
                  Epicor P21 Activity Feed
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-medium">
                Sandbox Ready
              </span>
            </div>
            <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto px-3 py-1.5 text-[11px]">
              {syncLogs.slice(0, 5).map(log => (
                <div key={log.id} className="py-1.5 flex items-start gap-2">
                  <Check size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="font-mono font-semibold text-slate-700 mr-1.5">
                      [{log.entity}]
                    </span>
                    <span className="text-slate-600">{log.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CustomerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCustomerOnboarded={handleCustomerOnboarded}
      />
    </div>
  );
};

export default NewOrder;
