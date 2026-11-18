import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Wrench,
  PackagePlus,
  ArrowRight,
  CheckCheck,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import {
  Contract,
  ReturnAction,
  ReturnInspectionChecklist
} from '../types';

const DEFAULT_CHECKLIST: ReturnInspectionChecklist = {
  structuralIntegrity: 'Pass',
  mechanicalOperation: 'Pass',
  safetyLatches: 'Pass',
  dielectricCalibration: 'Pass',
  cleanliness: 'Pass',
  inspectorName: 'Alex Thompson (Chief Inspector)',
  inspectionDate: '2026-11-17',
  notes: 'Visual and mechanical bench verification completed.'
};

const PRESET_OEM_PARTS = [
  {
    partNumber: 'BUR-Y60-SEAL-KIT',
    partName: '60-Ton High-Pressure Urethane Seal Kit',
    unitCost: 145,
    inStock: true,
    vendorName: 'Burndy OEM Parts'
  },
  {
    partNumber: 'BUR-Y60-PISTON-9',
    partName: 'Hard-Chrome Main Ram Piston Assembly',
    unitCost: 335,
    inStock: false,
    vendorName: 'Burndy OEM Parts'
  },
  {
    partNumber: 'TLM-TS20-BRG-SET',
    partName: 'Sealed Tapered Roller Bearing Assembly',
    unitCost: 110,
    inStock: true,
    vendorName: 'Tallman Specialty OEM'
  },
  {
    partNumber: 'TLM-GATE-PIN-20',
    partName: 'Forged Alloy Gate Latch Pin & Spring',
    unitCost: 48,
    inStock: true,
    vendorName: 'Tallman Specialty OEM'
  },
  {
    partNumber: 'CDX-CAP-ROPE-GEAR',
    partName: 'Capstan Worm Gear & Bronze Bushing Set',
    unitCost: 290,
    inStock: false,
    vendorName: 'Condux International'
  }
];

const ReturnsAndRepairs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    contracts,
    customers,
    inventory,
    workOrders,
    replacementOrders,
    workflowIssues,
    openReVettingModal,
    processDetailedReturn,
    completeWorkOrder,
    scrapWorkOrder,
    receiveReplacementOrder
  } = useData();

  const initialContractId =
    (location.state as { contractId?: string })?.contractId ||
    contracts.find(c => c.id === 'T-1007')?.id ||
    contracts[0]?.id ||
    '';

  const [selectedContractId, setSelectedContractId] = useState<string>(initialContractId);
  const [returnMode, setReturnMode] = useState<
    'Standard' | 'Early' | 'Late' | 'Partial' | 'PhasedOffSchedule'
  >('Standard');
  const [returnDate, setReturnDate] = useState<string>('2026-11-18');
  const [inspectorName] = useState<string>('Alex Thompson');

  const [earlyDaysCount, setEarlyDaysCount] = useState<number>(10);
  const [earlyCreditAmount, setEarlyCreditAmount] = useState<number>(320);
  const [lateDaysCount, setLateDaysCount] = useState<number>(5);
  const [offScheduleDaysCount, setOffScheduleDaysCount] = useState<number>(9);
  const [annualInterestRate, setAnnualInterestRate] = useState<number>(18.0);
  const [offScheduleHandlingFee, setOffScheduleHandlingFee] = useState<number>(125);

  const [woFilter, setWoFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL');
  const [itemActions, setItemActions] = useState<Record<string, ReturnAction>>({});

  const selectedContract: Contract | undefined = contracts.find(
    c => c.id === selectedContractId
  );
  const selectedCustomer = customers.find(c => c.id === selectedContract?.customerId);
  const contractTools = selectedContract
    ? inventory.filter(i => selectedContract.items.includes(i.id))
    : [];
  const selectedContractIssues = workflowIssues.filter(
    issue =>
      issue.contractId === selectedContract?.id ||
      (selectedContract?.customerId && issue.customerId === selectedContract.customerId)
  );

  useEffect(() => {
    if (!selectedContract) return;
    if (selectedContract.actualReturnDate) {
      setReturnDate(selectedContract.actualReturnDate);
    } else {
      setReturnDate('2026-11-18');
    }

    if (selectedContract.flowStage === 'Early Return') {
      setReturnMode('Early');
      setEarlyDaysCount(Math.max(1, Math.abs(selectedContract.daysDelta || 10)));
      setEarlyCreditAmount(selectedContract.earlyReturnCredit || 320);
    } else if (selectedContract.flowStage === 'Phased Return (Off-Schedule)') {
      setReturnMode('PhasedOffSchedule');
      setOffScheduleDaysCount(Math.max(1, selectedContract.daysDelta || 9));
    } else if (selectedContract.flowStage === 'Partial Return') {
      setReturnMode('Partial');
    } else if (selectedContract.flowStage === 'Late / Overdue') {
      setReturnMode('Late');
      setLateDaysCount(Math.max(1, selectedContract.daysDelta || 11));
    } else {
      setReturnMode('Standard');
    }

    const initialMap: Record<string, ReturnAction> = {};
    selectedContract.items.forEach(itemId => {
      const isDamaged = selectedContract.damagedItemIds?.includes(itemId);
      const isScrapped = selectedContract.scrappedItemIds?.includes(itemId);
      const isMissing = selectedContract.missingItemIds?.includes(itemId);

      initialMap[itemId] = {
        itemId,
        action: isScrapped
          ? 'DamagedScrap'
          : isDamaged
          ? 'DamagedRepair'
          : isMissing
          ? 'Missing'
          : 'Return',
        inspection: { ...DEFAULT_CHECKLIST },
        defectSummary: isDamaged
          ? 'Failed return load & seal test; requires bearing/seal overhaul.'
          : '',
        laborHours: 2.5,
        laborRate: 115,
        materialsCost: 55,
        materialsDescription: 'Dielectric hydraulic fluid, grease & calibration bench supplies',
        partsToReorder: isDamaged
          ? [PRESET_OEM_PARTS[0], PRESET_OEM_PARTS[2]].map(p => ({
              ...p,
              quantity: 1,
              reorderStatus: p.inStock ? 'In Stock' : 'PO Dispatched',
              poNumber: p.inStock ? undefined : 'PO-9945'
            }))
          : [],
        billCustomerForRepair: true,
        scrapReason: 'Structural load-bearing frame deformed beyond ASME safety limits (BER).',
        salvageValue: 120,
        triggerReplacementOrder: true
      };
    });
    setItemActions(initialMap);
  }, [selectedContractId]);

  // Auto-calculate day variance from returnDate vs. contract.endDate (zero manual math needed)
  const handleReturnDateChange = (newDate: string) => {
    setReturnDate(newDate);
    if (!selectedContract) return;
    const endMs = new Date(selectedContract.endDate).getTime();
    const retMs = new Date(newDate).getTime();
    if (Number.isNaN(endMs) || Number.isNaN(retMs)) return;
    const diffDays = Math.round((retMs - endMs) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      const eDays = Math.abs(diffDays);
      setReturnMode('Early');
      setEarlyDaysCount(eDays);
      setEarlyCreditAmount(Math.round(dailyAggregateRate * 0.25 * eDays));
    } else if (diffDays > 0 && returnMode !== 'PhasedOffSchedule') {
      setReturnMode('Late');
      setLateDaysCount(diffDays);
    } else if (diffDays > 0 && returnMode === 'PhasedOffSchedule') {
      setOffScheduleDaysCount(diffDays);
    }
  };

  const updateItemAction = (itemId: string, updates: Partial<ReturnAction>) => {
    setItemActions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...updates
      }
    }));
  };

  const updateChecklistField = (
    itemId: string,
    field: keyof ReturnInspectionChecklist,
    value: string
  ) => {
    setItemActions(prev => {
      const current = prev[itemId];
      if (!current) return prev;
      return {
        ...prev,
        [itemId]: {
          ...current,
          inspection: {
            ...(current.inspection || DEFAULT_CHECKLIST),
            [field]: value
          }
        }
      };
    });
  };

  const passAllChecks = (itemId: string) => {
    updateItemAction(itemId, {
      action: 'Return',
      inspection: { ...DEFAULT_CHECKLIST }
    });
  };

  const handleAddPresetPart = (itemId: string, presetIdx: number) => {
    const preset = PRESET_OEM_PARTS[presetIdx];
    if (!preset) return;
    const current = itemActions[itemId];
    if (!current) return;
    const existingParts = current.partsToReorder || [];
    updateItemAction(itemId, {
      partsToReorder: [
        ...existingParts,
        {
          partNumber: preset.partNumber,
          partName: preset.partName,
          quantity: 1,
          unitCost: preset.unitCost,
          inStock: preset.inStock,
          reorderStatus: preset.inStock ? 'In Stock' : 'PO Dispatched',
          vendorName: preset.vendorName,
          poNumber: preset.inStock ? undefined : `PO-${Math.floor(9100 + Math.random() * 800)}`
        }
      ]
    });
  };

  const handleRemovePart = (itemId: string, idx: number) => {
    const current = itemActions[itemId];
    if (!current || !current.partsToReorder) return;
    updateItemAction(itemId, {
      partsToReorder: current.partsToReorder.filter((_, i) => i !== idx)
    });
  };

  const dailyAggregateRate = contractTools.reduce((s, t) => s + t.rate, 0);
  const totalAssetReplacementValue = contractTools.reduce(
    (s, t) => s + t.replacementCost,
    0
  );

  const computedEarlyCredit = returnMode === 'Early' ? earlyCreditAmount : 0;
  const computedLateSurcharge =
    returnMode === 'Late' ? Math.round(dailyAggregateRate * 1.5 * lateDaysCount) : 0;
  const computedOffScheduleFee =
    returnMode === 'PhasedOffSchedule' ? offScheduleHandlingFee : 0;

  const activeVarianceDays =
    returnMode === 'Late'
      ? lateDaysCount
      : returnMode === 'PhasedOffSchedule'
      ? offScheduleDaysCount
      : 0;
  const computedInterest =
    activeVarianceDays > 0
      ? Number(
          (
            ((totalAssetReplacementValue + (selectedContract?.totalAmount || 1000)) *
              (annualInterestRate / 100) *
              activeVarianceDays) /
            365
          ).toFixed(2)
        )
      : 0;

  let liveReplacementTotal = 0;
  let liveRepairLaborMatTotal = 0;
  let liveRepairPartsTotal = 0;
  let liveScrapTotal = 0;

  contractTools.forEach(tool => {
    const act = itemActions[tool.id];
    if (!act) return;
    if (act.action === 'Missing') {
      const procFee = Math.round(tool.replacementCost * 0.08);
      liveReplacementTotal += tool.replacementCost + procFee;
    } else if (act.action === 'DamagedRepair' && act.billCustomerForRepair !== false) {
      const lHrs = act.laborHours ?? 2.5;
      const lRate = act.laborRate ?? 115;
      const mCost = act.materialsCost ?? 55;
      const pCost = (act.partsToReorder || []).reduce(
        (s, p) => s + p.quantity * p.unitCost,
        0
      );
      liveRepairLaborMatTotal += lHrs * lRate + mCost;
      liveRepairPartsTotal += pCost;
    } else if (act.action === 'DamagedScrap') {
      const salvage = act.salvageValue ?? 120;
      liveScrapTotal += Math.max(0, tool.replacementCost - salvage);
    }
  });

  const netMonthlyStatementAdjustment =
    -computedEarlyCredit +
    computedLateSurcharge +
    computedOffScheduleFee +
    computedInterest +
    liveReplacementTotal +
    liveRepairLaborMatTotal +
    liveRepairPartsTotal +
    liveScrapTotal;

  const handleCommitInspectionAndBilling = () => {
    if (!selectedContract) return;
    const actionsList = Object.values(itemActions);
    processDetailedReturn({
      contractId: selectedContract.id,
      returnDate,
      returnMode,
      actions: actionsList,
      earlyReturnCredit: computedEarlyCredit,
      lateDays: lateDaysCount,
      lateSurcharge: computedLateSurcharge,
      offScheduleDays: offScheduleDaysCount,
      annualInterestRate,
      accruedInterest: computedInterest,
      offScheduleFee: computedOffScheduleFee,
      inspectorName
    });
  };

  const quickQueue = contracts.filter(c =>
    ['Return Inspection', 'Late / Overdue', 'Phased Return (Off-Schedule)', 'Partial Return', 'Repair Shop'].includes(
      c.flowStage
    )
  );

  const visibleWorkOrders = workOrders.filter(wo => {
    if (woFilter === 'OPEN') return wo.status !== 'Completed' && wo.status !== 'Scrapped - BER';
    if (woFilter === 'DONE') return wo.status === 'Completed' || wo.status === 'Scrapped - BER';
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Header & Quick Exception Dock Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Returns, 5-Point Inspection, Repair Work Orders & Replacement Orders
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Process Early credits, Late & Multiple Return Dates 18% APR interest, Partial replacement POs, Repair labor/materials/parts & BER scrap.
            </p>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>Customers & Monthly Billing</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Quick Queue Switcher */}
        {quickQueue.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 mr-1">
              Priority Dock Queue:
            </span>
            {quickQueue.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedContractId(c.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                  selectedContractId === c.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono font-semibold mr-1">{c.id}</span>
                <span>
                  {c.flowStage === 'Phased Return (Off-Schedule)'
                    ? 'Multiple Dates'
                    : c.flowStage}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        {/* Left 8 Cols: Contract, Return Mode, and Per-Tool Inspection */}
        <div className="xl:col-span-8 space-y-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Contract to Inspect / Return
                </label>
                <select
                  value={selectedContractId}
                  onChange={e => setSelectedContractId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                >
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.customerName} ({c.flowStage})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Return Timing Scenario
                </label>
                <select
                  value={returnMode}
                  onChange={e => setReturnMode(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                >
                  <option value="Standard">Standard On-Schedule</option>
                  <option value="Early">Early Return (-Tier Credit)</option>
                  <option value="Late">Late Return (1.5x + 18% APR)</option>
                  <option value="Partial">Partial Return (+Replacement PO)</option>
                  <option value="PhasedOffSchedule">Multiple Return Dates (+18% APR)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Return Date</span>
                  <span className="text-[10px] font-mono text-blue-700">Auto-Calcs Days</span>
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => handleReturnDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Inline Workflow Oversight Alerts for Selected Contract */}
            {selectedContractIssues.length > 0 && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1.5">
                {selectedContractIssues.map(issue => (
                  <div
                    key={issue.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <AlertTriangle
                        size={14}
                        className={
                          issue.severity === 'critical'
                            ? 'text-rose-600 shrink-0 mt-0.5'
                            : 'text-amber-600 shrink-0 mt-0.5'
                        }
                      />
                      <div>
                        <strong className="text-slate-900">{issue.title}: </strong>
                        <span className="text-slate-700">{issue.errorMessage} </span>
                        <span className="text-slate-900 font-medium">Fix: {issue.instructions}</span>
                      </div>
                    </div>
                    {issue.requiresReVetting && selectedCustomer && (
                      <button
                        type="button"
                        onClick={() => openReVettingModal(selectedCustomer)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold rounded flex items-center gap-1 shrink-0"
                      >
                        <UserCheck size={11} />
                        <span>Re-Run Vetting</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {returnMode === 'Early' && (
              <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-lg grid grid-cols-3 gap-2.5 items-center text-xs">
                <div>
                  <label className="text-[11px] font-medium text-teal-900 block mb-0.5">
                    Days Early
                  </label>
                  <input
                    type="number"
                    value={earlyDaysCount}
                    onChange={e => setEarlyDaysCount(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-teal-200 rounded font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-teal-900 block mb-0.5">
                    Monthly Credit ($)
                  </label>
                  <input
                    type="number"
                    value={earlyCreditAmount}
                    onChange={e => setEarlyCreditAmount(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-teal-200 rounded font-mono font-semibold text-teal-800"
                  />
                </div>
                <div className="text-[11px] text-teal-900">
                  Re-rates unused monthly days to weekly/daily tier on Nov Statement.
                </div>
              </div>
            )}

            {returnMode === 'Late' && (
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg grid grid-cols-3 gap-2.5 items-center text-xs">
                <div>
                  <label className="text-[11px] font-medium text-rose-900 block mb-0.5">
                    Overdue Days
                  </label>
                  <input
                    type="number"
                    value={lateDaysCount}
                    onChange={e => setLateDaysCount(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-rose-200 rounded font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-rose-900 block mb-0.5">
                    Holdover APR (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualInterestRate}
                    onChange={e => setAnnualInterestRate(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-rose-200 rounded font-mono font-semibold"
                  />
                </div>
                <div className="font-mono text-[11px] text-rose-900 font-semibold">
                  1.5x Fee: +${computedLateSurcharge} · Int: +${computedInterest}
                </div>
              </div>
            )}

            {returnMode === 'PhasedOffSchedule' && (
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg grid grid-cols-3 gap-2.5 items-center text-xs">
                <div>
                  <label className="text-[11px] font-medium text-amber-900 block mb-0.5">
                    Days Off Return Date
                  </label>
                  <input
                    type="number"
                    value={offScheduleDaysCount}
                    onChange={e => setOffScheduleDaysCount(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-amber-900 block mb-0.5">
                    Holdover APR (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={annualInterestRate}
                    onChange={e => setAnnualInterestRate(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-amber-900 block mb-0.5">
                    Variance Fee ($)
                  </label>
                  <input
                    type="number"
                    value={offScheduleHandlingFee}
                    onChange={e => setOffScheduleHandlingFee(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-amber-300 rounded font-mono font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Per-Tool 5-Point Inspection & Disposition Cards */}
          {contractTools.map(tool => {
            const act = itemActions[tool.id];
            if (!act) return null;
            const chk = act.inspection || DEFAULT_CHECKLIST;

            return (
              <div
                key={tool.id}
                className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] p-3.5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-blue-600">
                      {tool.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{tool.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      SN: {tool.serialNumber} · ${tool.rate}/d · MSRP ${tool.replacementCost.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => passAllChecks(tool.id)}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-medium flex items-center gap-1"
                  >
                    <CheckCheck size={12} />
                    <span>Pass All 5</span>
                  </button>
                </div>

                {/* 5 Disposition Buttons */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] font-semibold text-amber-800">
                    Needs Human Input · Physical Bench Disposition &amp; 5-Point Inspection
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      id: 'Return',
                      label: 'Pass (Return to Shelf)',
                      activeClass: 'bg-emerald-600 text-white border-emerald-600'
                    },
                    {
                      id: 'KeepOnRent',
                      label: 'Partial (Keep Out)',
                      activeClass: 'bg-blue-600 text-white border-blue-600'
                    },
                    {
                      id: 'Missing',
                      label: 'Unreturned -> Replace PO',
                      activeClass: 'bg-purple-600 text-white border-purple-600'
                    },
                    {
                      id: 'DamagedRepair',
                      label: 'Broken -> Repair WO',
                      activeClass: 'bg-orange-600 text-white border-orange-600'
                    },
                    {
                      id: 'DamagedScrap',
                      label: 'Broken -> Scrap (BER)',
                      activeClass: 'bg-red-700 text-white border-red-700'
                    }
                  ].map(btn => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => updateItemAction(tool.id, { action: btn.id as any })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        act.action === btn.id
                          ? btn.activeClass
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* 5-Point Inspection Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-amber-50/40 p-2 rounded-lg border border-amber-200">
                  {[
                    { key: 'structuralIntegrity', label: '1. Frame' },
                    { key: 'mechanicalOperation', label: '2. Mechanical' },
                    { key: 'safetyLatches', label: '3. Latch/Gate' },
                    { key: 'dielectricCalibration', label: '4. Dielectric' },
                    { key: 'cleanliness', label: '5. Clean' }
                  ].map(checkItem => {
                    const val = (chk as any)[checkItem.key];
                    return (
                      <div
                        key={checkItem.key}
                        className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-slate-200"
                      >
                        <span className="text-[11px] font-medium text-slate-600">
                          {checkItem.label}
                        </span>
                        <select
                          value={val}
                          onChange={e =>
                            updateChecklistField(
                              tool.id,
                              checkItem.key as keyof ReturnInspectionChecklist,
                              e.target.value
                            )
                          }
                          className={`text-[11px] font-semibold rounded px-1 py-0.5 ${
                            val === 'Pass'
                              ? 'text-emerald-700 bg-emerald-50'
                              : val === 'Fail'
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          <option value="Pass">Pass</option>
                          <option value="Warn">Warn</option>
                          <option value="Fail">Fail</option>
                        </select>
                      </div>
                    );
                  })}
                </div>

                {/* Conditional Disposition Details */}
                {act.action === 'Missing' && (
                  <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg flex items-center justify-between text-xs">
                    <span className="text-purple-900 font-medium">
                      Unreturned in Partial Return: Auto-creates OEM Replacement Order (MSRP ${tool.replacementCost} + 8% fee) on Monthly Bill.
                    </span>
                    <span className="font-mono font-bold text-purple-900">
                      +${(tool.replacementCost + Math.round(tool.replacementCost * 0.08)).toFixed(2)}
                    </span>
                  </div>
                )}

                {act.action === 'DamagedRepair' && (
                  <div className="p-2.5 bg-orange-50/60 border border-orange-200 rounded-lg space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-5">
                        <label className="text-[11px] font-medium text-slate-700 block mb-0.5">
                          Defect Finding
                        </label>
                        <input
                          type="text"
                          value={act.defectSummary || ''}
                          onChange={e =>
                            updateItemAction(tool.id, { defectSummary: e.target.value })
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-slate-700 block mb-0.5">
                          Labor Hrs (@$115)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          value={act.laborHours ?? 2.5}
                          onChange={e =>
                            updateItemAction(tool.id, { laborHours: Number(e.target.value) })
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-medium text-slate-700 block mb-0.5">
                          Shop Mat ($)
                        </label>
                        <input
                          type="number"
                          value={act.materialsCost ?? 55}
                          onChange={e =>
                            updateItemAction(tool.id, { materialsCost: Number(e.target.value) })
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] font-medium text-slate-700 block mb-0.5">
                          Add OEM Part Reorder
                        </label>
                        <select
                          onChange={e => {
                            if (e.target.value !== '') {
                              handleAddPresetPart(tool.id, Number(e.target.value));
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
                        >
                          <option value="" disabled>
                            + Select OEM Part...
                          </option>
                          {PRESET_OEM_PARTS.map((p, idx) => (
                            <option key={p.partNumber} value={idx}>
                              {p.partNumber} (${p.unitCost})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(act.partsToReorder || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(act.partsToReorder || []).map((part, pIdx) => (
                          <div
                            key={pIdx}
                            className="px-2 py-1 bg-white border border-orange-200 rounded text-[11px] flex items-center gap-2"
                          >
                            <span className="font-mono font-semibold text-slate-900">
                              {part.partNumber}
                            </span>
                            <span className="text-slate-600">{part.partName}</span>
                            <span className="font-mono font-semibold text-orange-700">
                              ${part.unitCost}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(tool.id, pIdx)}
                              className="text-rose-600 font-bold"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {act.action === 'DamagedScrap' && (
                  <div className="p-2.5 bg-red-50/60 border border-red-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs">
                    <div className="sm:col-span-7">
                      <label className="text-[11px] font-medium text-red-900 block mb-0.5">
                        BER Scrap Condemnation Reason
                      </label>
                      <input
                        type="text"
                        value={act.scrapReason || ''}
                        onChange={e => updateItemAction(tool.id, { scrapReason: e.target.value })}
                        className="w-full px-2 py-1 bg-white border border-red-200 rounded text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-medium text-red-900 block mb-0.5">
                        Salvage ($)
                      </label>
                      <input
                        type="number"
                        value={act.salvageValue ?? 120}
                        onChange={e =>
                          updateItemAction(tool.id, { salvageValue: Number(e.target.value) })
                        }
                        className="w-full px-2 py-1 bg-white border border-red-200 rounded text-xs font-mono font-semibold"
                      />
                    </div>
                    <div className="sm:col-span-3 text-right font-mono font-bold text-red-800">
                      Net Scrap: +${Math.max(0, tool.replacementCost - (act.salvageValue ?? 120)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right 4 Cols: Crisp Light Live Settlement Calculator */}
        <div className="xl:col-span-4 xl:sticky xl:top-16">
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-semibold text-blue-600 block">
                  LIVE MONTHLY BILLING SETTLEMENT
                </span>
                <h3 className="text-sm font-display font-bold text-slate-900 truncate">
                  {selectedContract?.customerName} ({selectedContract?.id})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 shrink-0">Nov 2026</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span className="font-sans">Current Contract Base Amount</span>
                  <span className="font-semibold text-slate-900">
                    ${(selectedContract?.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                {computedEarlyCredit > 0 && (
                  <div className="flex justify-between text-teal-700">
                    <span className="font-sans">Early Return Rate Tier Credit</span>
                    <span className="font-semibold">-${computedEarlyCredit.toFixed(2)}</span>
                  </div>
                )}

                {computedLateSurcharge > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span className="font-sans">Late Surcharge ({lateDaysCount}d @ 1.5x)</span>
                    <span className="font-semibold">+${computedLateSurcharge.toFixed(2)}</span>
                  </div>
                )}

                {computedOffScheduleFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span className="font-sans">Multiple Return Date Variance Fee</span>
                    <span className="font-semibold">+${computedOffScheduleFee.toFixed(2)}</span>
                  </div>
                )}

                {computedInterest > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span className="font-sans">
                      Accrued Interest ({annualInterestRate}% APR / {activeVarianceDays}d)
                    </span>
                    <span className="font-semibold">+${computedInterest.toFixed(2)}</span>
                  </div>
                )}

                {liveReplacementTotal > 0 && (
                  <div className="flex justify-between text-purple-700">
                    <span className="font-sans">Replacement Orders (RO + 8% Fee)</span>
                    <span className="font-semibold">+${liveReplacementTotal.toFixed(2)}</span>
                  </div>
                )}

                {liveRepairLaborMatTotal > 0 && (
                  <div className="flex justify-between text-orange-700">
                    <span className="font-sans">Repair Labor & Materials (WO)</span>
                    <span className="font-semibold">+${liveRepairLaborMatTotal.toFixed(2)}</span>
                  </div>
                )}

                {liveRepairPartsTotal > 0 && (
                  <div className="flex justify-between text-orange-700">
                    <span className="font-sans">OEM Part Reorders (PO)</span>
                    <span className="font-semibold">+${liveRepairPartsTotal.toFixed(2)}</span>
                  </div>
                )}

                {liveScrapTotal > 0 && (
                  <div className="flex justify-between text-red-700">
                    <span className="font-sans">Scrapped Tool BER Net Charge</span>
                    <span className="font-semibold">+${liveScrapTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="font-sans text-xs font-bold text-slate-900">
                    Updated Monthly Statement Total
                  </span>
                  <span className="text-xl font-bold text-emerald-700">
                    $
                    {Math.max(
                      0,
                      (selectedContract?.totalAmount || 0) + netMonthlyStatementAdjustment
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCommitInspectionAndBilling}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ClipboardCheck size={15} />
                <span>Commit Inspection & Post to Monthly Statement</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 12-Col Grid: Repair Shop WOs + Replacement Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Wrench size={14} className="text-orange-600" />
              <h2 className="text-xs font-display font-bold text-slate-900">
                Repair Shop WOs & Part Reorders ({visibleWorkOrders.length})
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {(['ALL', 'OPEN', 'DONE'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setWoFilter(tab)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    woFilter === tab
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'OPEN' ? 'Open' : 'Closed'}
                </button>
              ))}
              <span className="text-[11px] font-mono font-semibold text-slate-700 ml-1">
                ${visibleWorkOrders.reduce((s, w) => s + w.totalCost, 0).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {visibleWorkOrders.map(wo => (
              <div key={wo.id} className="p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900">
                    {wo.id} · {wo.itemName}
                  </span>
                  <span className="font-mono font-semibold text-orange-700 tabular-nums">
                    ${wo.totalCost.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">{wo.defectSummary}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>
                    Labor: {wo.laborHours}h · Mat: ${wo.materialsCost} · Parts: {wo.parts.length}
                  </span>
                  <span className="font-semibold text-slate-700">{wo.status}</span>
                </div>
                {wo.status !== 'Completed' && wo.status !== 'Scrapped - BER' && (
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => completeWorkOrder(wo.id)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-md"
                    >
                      Complete Repair
                    </button>
                    <button
                      onClick={() =>
                        scrapWorkOrder(wo.id, 'Escalated BER from repair bench', 120)
                      }
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded-md"
                    >
                      Scrap (BER)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <PackagePlus size={14} className="text-purple-600" />
              <h2 className="text-xs font-display font-bold text-slate-900">
                Replacement Orders (RO) ({replacementOrders.length})
              </h2>
            </div>
            <span className="text-[11px] font-mono font-semibold text-purple-700 tabular-nums">
              ${replacementOrders.reduce((s, r) => s + r.totalBilledToCustomer, 0).toLocaleString()}
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {replacementOrders.map(ro => (
              <div key={ro.id} className="p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-purple-700">
                    {ro.id} ({ro.poNumber})
                  </span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    ${ro.totalBilledToCustomer.toFixed(2)}
                  </span>
                </div>
                <p className="font-semibold text-slate-900">{ro.itemName}</p>
                <p className="text-[11px] text-slate-600">
                  {ro.reason} · Billed to {ro.customerName} ({ro.contractId})
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-blue-700 font-medium">
                    {ro.status}
                  </span>
                  {ro.status !== 'Received & Inventory Indexed' && (
                    <button
                      onClick={() => receiveReplacementOrder(ro.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md"
                    >
                      Receive & Index
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsAndRepairs;
