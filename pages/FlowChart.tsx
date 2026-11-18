import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Trash2,
  PackagePlus,
  CalendarClock,
  Search,
  Percent,
  ClipboardCheck,
  RotateCcw
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Contract, FlowStage, ContractStatus } from '../types';

export interface StageConfig {
  stage: FlowStage;
  stepNum: string;
  label: string;
  shortDesc: string;
  billingRule: string;
  badgeClass: string;
  nodeBorder: string;
  dotColor: string;
  icon: React.ElementType;
}

export const FLOW_STAGES: StageConfig[] = [
  {
    stage: 'Quote & Reservation',
    stepNum: '01',
    label: 'Quote & Staged Reservation',
    shortDesc: 'Tools reserved or proposed via active Quote awaiting check-out',
    billingRule: 'Unbilled until Quote converts to Active Order',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300',
    nodeBorder: 'border-slate-300 hover:border-slate-500',
    dotColor: 'bg-slate-500',
    icon: CalendarClock
  },
  {
    stage: 'Active On-Rent',
    stepNum: '02',
    label: 'Active On-Rent (On Schedule)',
    shortDesc: 'Tools deployed on utility jobsite within contract window',
    billingRule: 'Standard Monthly Cycle Billing',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    nodeBorder: 'border-blue-300 hover:border-blue-600',
    dotColor: 'bg-blue-600',
    icon: Clock
  },
  {
    stage: 'Early Return',
    stepNum: '03',
    label: 'Early Return (Rate Tier Credit)',
    shortDesc: 'Returned ahead of schedule; re-rated to optimal POR tier',
    billingRule: 'Early Return Credit on Monthly Bill',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-200',
    nodeBorder: 'border-teal-300 hover:border-teal-600',
    dotColor: 'bg-teal-600',
    icon: RotateCcw
  },
  {
    stage: 'Phased Return (Off-Schedule)',
    stepNum: '04',
    label: 'Multiple Return Dates (Off-Schedule + Interest)',
    shortDesc: 'Out-of-sequence or delayed return drop-offs vs. scheduled return dates',
    billingRule: '18.0% APR Interest + Variance Fee',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
    nodeBorder: 'border-amber-300 hover:border-amber-600',
    dotColor: 'bg-amber-600',
    icon: Percent
  },
  {
    stage: 'Partial Return',
    stepNum: '05',
    label: 'Partial Return (+ Replacement Order)',
    shortDesc: 'Partial tool return with unreturned items requiring replacement PO',
    billingRule: 'Replacement Order billed to customer',
    badgeClass: 'bg-purple-50 text-purple-900 border-purple-200',
    nodeBorder: 'border-purple-300 hover:border-purple-600',
    dotColor: 'bg-purple-600',
    icon: PackagePlus
  },
  {
    stage: 'Late / Overdue',
    stepNum: '06',
    label: 'Late / Overdue (+ Surcharge & Interest)',
    shortDesc: 'Past contract maturity date without extension',
    billingRule: '1.5x Daily Surcharge + 18% APR Interest',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-200',
    nodeBorder: 'border-rose-300 hover:border-rose-600',
    dotColor: 'bg-rose-600',
    icon: AlertTriangle
  },
  {
    stage: 'Return Inspection',
    stepNum: '07',
    label: 'Return Inspection Gate (Dock Queue)',
    shortDesc: 'Multi-point structural, mechanical, latch & dielectric check',
    billingRule: 'Holds Monthly Statement lock',
    badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    nodeBorder: 'border-indigo-300 hover:border-indigo-600',
    dotColor: 'bg-indigo-600',
    icon: ClipboardCheck
  },
  {
    stage: 'Repair Shop',
    stepNum: '08',
    label: 'Broken Return -> Repair Work Order',
    shortDesc: 'Damaged tools requiring labor, materials & part reorders',
    billingRule: 'Labor + Mat + Parts PO billed',
    badgeClass: 'bg-orange-50 text-orange-900 border-orange-200',
    nodeBorder: 'border-orange-300 hover:border-orange-600',
    dotColor: 'bg-orange-600',
    icon: Wrench
  },
  {
    stage: 'Scrap & Write-Off',
    stepNum: '09',
    label: 'Broken Return -> Scrapped (BER)',
    shortDesc: 'Condemned tools decommissioned; replacement unit reordered',
    billingRule: 'MSRP - Salvage + Reorder billed',
    badgeClass: 'bg-red-50 text-red-900 border-red-200',
    nodeBorder: 'border-red-300 hover:border-red-600',
    dotColor: 'bg-red-700',
    icon: Trash2
  },
  {
    stage: 'Completed & Billed',
    stepNum: '10',
    label: 'Completed & Settled on Monthly Bill',
    shortDesc: 'All tools accounted for on customer monthly statement',
    billingRule: 'Settled on Monthly Statement',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    nodeBorder: 'border-emerald-300 hover:border-emerald-600',
    dotColor: 'bg-emerald-600',
    icon: CheckCircle2
  }
];

const FlowChart: React.FC = () => {
  const navigate = useNavigate();
  const {
    contracts,
    customers,
    inventory,
    workOrders,
    replacementOrders,
    invoices,
    updateContract,
    postCustomerUpdate
  } = useData();

  const [viewMode, setViewMode] = useState<'timelineMatrix' | 'pipelineFlow'>('timelineMatrix');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    contracts[1]?.id || contracts[0]?.id || null
  );
  const [quickUpdateNote, setQuickUpdateNote] = useState('');

  const selectedContract = contracts.find(c => c.id === selectedContractId) || null;
  const selectedCustomer = selectedContract
    ? customers.find(c => c.id === selectedContract.customerId)
    : null;
  const selectedInvoice = selectedContract
    ? invoices.find(i => i.customerId === selectedContract.customerId)
    : null;
  const contractWorkOrders = selectedContract
    ? workOrders.filter(w => w.contractId === selectedContract.id)
    : [];
  const contractReplacements = selectedContract
    ? replacementOrders.filter(r => r.contractId === selectedContract.id)
    : [];

  const filteredContracts = contracts.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.customerName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.jobSite || '').toLowerCase().includes(q);
    const matchesStage = stageFilter === 'ALL' || c.flowStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const getTimeAxisPercent = (daysDelta: number = 0) => {
    const clamped = Math.max(-25, Math.min(15, daysDelta));
    return Math.round(((clamped + 25) / 40) * 84 + 8);
  };

  const formatTimeLabel = (c: Contract) => {
    const d = c.daysDelta ?? 0;
    if (c.flowStage === 'Early Return') return `${Math.abs(d)}d Early`;
    if (c.flowStage === 'Quote & Reservation') return `Starts ${Math.abs(d)}d`;
    if (c.flowStage === 'Active On-Rent') return `${Math.abs(d)}d Rem`;
    if (c.flowStage === 'Return Inspection') return `Dock (0d)`;
    if (c.flowStage === 'Phased Return (Off-Schedule)') return `+${d}d Off-Date`;
    if (c.flowStage === 'Late / Overdue') return `+${d}d Overdue`;
    if (c.flowStage === 'Partial Return') return `Partial (${Math.abs(d)}d)`;
    if (c.flowStage === 'Repair Shop') return `+${d}d Shop`;
    if (c.flowStage === 'Scrap & Write-Off') return `Scrapped`;
    return 'Settled';
  };

  const getFinancialBadge = (c: Contract) => {
    if (c.scrapCharges && c.scrapCharges > 0) {
      return `+$${c.scrapCharges.toLocaleString()} Scrap`;
    }
    if (c.repairCharges && c.repairCharges > 0) {
      return `+$${c.repairCharges.toLocaleString()} WO Repair`;
    }
    if (c.replacementCharges && c.replacementCharges > 0) {
      return `+$${c.replacementCharges.toLocaleString()} RO Bill`;
    }
    if (c.interestCharged && c.interestCharged > 0) {
      const totalExtra = (c.interestCharged || 0) + (c.lateFeeTotal || 0);
      return `+$${totalExtra.toFixed(2)} Int`;
    }
    if (c.earlyReturnCredit && c.earlyReturnCredit > 0) {
      return `-$${c.earlyReturnCredit.toLocaleString()} Credit`;
    }
    return `$${c.totalAmount.toLocaleString()}`;
  };

  const handleStageMove = (contract: Contract, newStage: FlowStage) => {
    let newStatus = contract.status;
    if (newStage === 'Active On-Rent') newStatus = ContractStatus.ACTIVE;
    if (newStage === 'Early Return') newStatus = ContractStatus.EARLY_RETURN;
    if (newStage === 'Phased Return (Off-Schedule)') newStatus = ContractStatus.PHASED_RETURN;
    if (newStage === 'Partial Return') newStatus = ContractStatus.PARTIAL_RETURN;
    if (newStage === 'Late / Overdue') newStatus = ContractStatus.OVERDUE;
    if (newStage === 'Return Inspection' || newStage === 'Repair Shop')
      newStatus = ContractStatus.INSPECTION_PENDING;
    if (newStage === 'Scrap & Write-Off' || newStage === 'Completed & Billed')
      newStatus = ContractStatus.COMPLETED;

    updateContract(contract.id, { flowStage: newStage, status: newStatus });
    postCustomerUpdate(
      contract.customerId,
      `Flow Stage moved to "${newStage}" for Contract ${contract.id}. Monthly Statement synced.`
    );
  };

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract || !quickUpdateNote.trim()) return;
    postCustomerUpdate(selectedContract.customerId, quickUpdateNote.trim());
    setQuickUpdateNote('');
  };

  const visibleStages = FLOW_STAGES.filter(
    s => s.stage !== 'Completed & Billed' && (stageFilter === 'ALL' || stageFilter === s.stage)
  );

  return (
    <div className="space-y-3">
      {/* Control Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Interactive Customer Time & Return Status Flow Chart
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              All {contracts.length} rental customers plotted by schedule horizon (-25d Early to +15d Late/Off-Schedule) and Return/Repair/Scrap status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-52">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter customer or contract..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('timelineMatrix')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === 'timelineMatrix'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2D Time vs. Status Plot
              </button>
              <button
                onClick={() => setViewMode('pipelineFlow')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  viewMode === 'pipelineFlow'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Decision Flow Graph
              </button>
            </div>

            <button
              onClick={() =>
                navigate('/returns', {
                  state: { contractId: selectedContract?.id || 'T-1007' }
                })
              }
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <ClipboardCheck size={13} />
              <span>Open Return Workbench</span>
            </button>
          </div>
        </div>

        {/* Interactive Stage Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 pt-2 border-t border-slate-100">
          <button
            onClick={() => setStageFilter('ALL')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
              stageFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stages ({contracts.length})
          </button>
          {FLOW_STAGES.filter(s => s.stage !== 'Completed & Billed').map(st => {
            const cnt = contracts.filter(c => c.flowStage === st.stage).length;
            if (cnt === 0) return null;
            return (
              <button
                key={st.stage}
                onClick={() => setStageFilter(st.stage)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  stageFilter === st.stage
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.stepNum}. {st.stage === 'Phased Return (Off-Schedule)' ? 'Multiple Dates' : st.stage} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          {viewMode === 'timelineMatrix' ? (
            <div>
              {/* Crisp X-Axis Time Header */}
              <div className="bg-slate-50/80 px-3 py-2.5 border-b border-slate-200 grid grid-cols-12 items-center text-[11px] font-mono tabular-nums">
                <div className="col-span-4 font-sans font-semibold text-slate-700">
                  Return & Inspection Stage (Y-Axis)
                </div>
                <div className="col-span-8 grid grid-cols-4 text-center">
                  <span className="text-teal-700 font-semibold">← Early (-25d..-10d)</span>
                  <span className="text-blue-700 font-semibold">On-Rent (-9d..-1d)</span>
                  <span className="text-indigo-700 font-semibold">Due / Dock (0d)</span>
                  <span className="text-rose-700 font-semibold">Late / Off-Date (+1d..+15d) →</span>
                </div>
              </div>

              {/* Dynamic Anti-Overlap Swimlane Rows */}
              <div className="divide-y divide-slate-200">
                {visibleStages.map(stageCfg => {
                  const stageContracts = filteredContracts.filter(
                    c => c.flowStage === stageCfg.stage
                  );
                  const IconComponent = stageCfg.icon;
                  const rowHeightPx = Math.max(56, stageContracts.length * 48 + 10);

                  return (
                    <div
                      key={stageCfg.stage}
                      className="grid grid-cols-12 items-stretch hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Stage Label (4 Cols) */}
                      <div className="col-span-4 px-3 py-2 border-r border-slate-200 bg-slate-50/40 flex flex-col justify-center">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-mono text-slate-400">
                              {stageCfg.stepNum}
                            </span>
                            <IconComponent size={13} className="text-slate-700 shrink-0" />
                            <h3 className="text-xs font-semibold text-slate-900 truncate">
                              {stageCfg.label}
                            </h3>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-slate-500">
                            {stageContracts.length}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate pl-5 mt-0.5">
                          {stageCfg.billingRule}
                        </p>
                      </div>

                      {/* 2D Time Plot Area with Vertical Stacking (Zero Overlap!) */}
                      <div
                        className="col-span-8 relative px-2 py-1 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px)] [background-size:25%_100%]"
                        style={{ minHeight: `${rowHeightPx}px` }}
                      >
                        <div
                          className="absolute top-0 bottom-0 w-px bg-indigo-300 pointer-events-none"
                          style={{ left: '62.5%' }}
                        />

                        {stageContracts.map((contract, idx) => {
                          const leftPct = getTimeAxisPercent(contract.daysDelta ?? 0);
                          const finText = getFinancialBadge(contract);
                          const isSelected = selectedContractId === contract.id;
                          const isQuote = contract.status === ContractStatus.QUOTE;
                          const topOffset = 6 + idx * 46;

                          return (
                            <button
                              key={contract.id}
                              onClick={() => setSelectedContractId(contract.id)}
                              style={{
                                left: `clamp(1%, calc(${leftPct}% - 105px), calc(100% - 218px))`,
                                top: `${topOffset}px`
                              }}
                              className={`absolute w-[212px] text-left px-2.5 py-1.5 rounded-lg border transition-all ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900 shadow-md z-20 ring-2 ring-blue-500/40'
                                  : isQuote
                                  ? 'bg-yellow-300 text-slate-950 border-yellow-500 shadow-sm hover:bg-yellow-400 z-10'
                                  : `bg-white text-slate-900 ${stageCfg.nodeBorder} shadow-sm hover:shadow z-10`
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                                <span
                                  className={`font-semibold ${
                                    isSelected
                                      ? 'text-blue-300'
                                      : isQuote
                                      ? 'text-slate-950 font-extrabold'
                                      : 'text-blue-600'
                                  }`}
                                >
                                  {isQuote ? 'QUOTE ' : ''}
                                  {contract.id} · {formatTimeLabel(contract)}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    isSelected
                                      ? 'text-emerald-300'
                                      : isQuote
                                      ? 'text-slate-950'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {finText}
                                </span>
                              </div>
                              <p
                                className={`text-[11px] font-semibold truncate mt-1 leading-tight ${
                                  isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {contract.customerName}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Branching Decision Flow Graph View */
            <div className="p-3.5 space-y-3 bg-slate-50/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {FLOW_STAGES.slice(0, 2).map(st => {
                  const list = contracts.filter(c => c.flowStage === st.stage);
                  return (
                    <div key={st.stage} className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex justify-between text-xs font-semibold text-slate-900 mb-2">
                        <span>{st.stepNum}. {st.label}</span>
                        <span className="font-mono text-slate-500">{list.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {list.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedContractId(c.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs flex justify-between items-center ${
                              selectedContractId === c.id
                                ? 'bg-slate-900 text-white border-slate-900'
                                : c.status === ContractStatus.QUOTE
                                ? 'bg-yellow-300 text-slate-950 border-yellow-500 font-bold'
                                : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            <span className="font-semibold truncate">
                              {c.status === ContractStatus.QUOTE ? 'QUOTE ' : ''}
                              {c.id} · {c.customerName}
                            </span>
                            <span className="font-mono text-[11px] shrink-0 ml-2">
                              {formatTimeLabel(c)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[11px] font-medium text-slate-500">
                ↓ Branches by Return Timing (Early, Multiple Return Dates + Interest, Partial + Reorder, Late) ↓
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {FLOW_STAGES.slice(2, 6).map(st => {
                  const list = contracts.filter(c => c.flowStage === st.stage);
                  return (
                    <div key={st.stage} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-900">
                        {st.stepNum}. {st.label}
                      </div>
                      <p className="text-[11px] text-slate-500">{st.billingRule}</p>
                      {list.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedContractId(c.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs ${
                            selectedContractId === c.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="font-semibold">{c.id}</span>
                            <span>{getFinancialBadge(c)}</span>
                          </div>
                          <div className="font-semibold truncate mt-0.5">{c.customerName}</div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="text-center text-[11px] font-medium text-slate-500">
                ↓ Multi-Point Return Inspection Gate → Repair Shop (WO) or Scrap (BER) → Monthly Statement ↓
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {FLOW_STAGES.slice(6, 9).map(st => {
                  const list = contracts.filter(c => c.flowStage === st.stage);
                  return (
                    <div key={st.stage} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="text-xs font-semibold text-slate-900">
                        {st.stepNum}. {st.label}
                      </div>
                      {list.map(c => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedContractId(c.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs ${
                            selectedContractId === c.id
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between font-mono text-[10px]">
                            <span className="font-semibold">{c.id}</span>
                            <span>{getFinancialBadge(c)}</span>
                          </div>
                          <div className="font-semibold truncate mt-0.5">{c.customerName}</div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 4 Cols: Light Enterprise Customer & Monthly Billing Inspector */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden xl:sticky xl:top-16">
          {selectedContract && selectedCustomer ? (
            <div>
              {selectedContract.status === ContractStatus.QUOTE && (
                <div className="px-4 py-2 bg-yellow-300 text-slate-950 border-b border-yellow-500 font-extrabold text-xs tracking-wide">
                  QUOTE — NOT AN ACTIVE ORDER
                </div>
              )}
              <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-mono text-blue-600 font-semibold">
                  <span>
                    {selectedContract.id} ·{' '}
                    {selectedContract.flowStage === 'Phased Return (Off-Schedule)'
                      ? 'Multiple Return Dates'
                      : selectedContract.flowStage}
                  </span>
                  <span className="text-slate-500">{formatTimeLabel(selectedContract)}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2 mt-0.5">
                  <h2 className="text-sm font-display font-bold text-slate-900 truncate">
                    {selectedCustomer.name}
                  </h2>
                  <span className="text-sm font-mono font-bold text-emerald-700 shrink-0 tabular-nums">
                    ${(selectedCustomer.monthlyBillingTotal ?? selectedCustomer.balance).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {/* Latest Customer Update + Quick Post */}
                <div className="p-3.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-900">
                    <span>Latest Customer Update</span>
                    <span className="font-mono text-slate-500">
                      {selectedCustomer.lastUpdatedAt?.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {selectedCustomer.latestCustomerUpdate || selectedContract.notes}
                  </p>
                  <form onSubmit={handleQuickNoteSubmit} className="mt-2 flex gap-1.5">
                    <input
                      type="text"
                      value={quickUpdateNote}
                      onChange={e => setQuickUpdateNote(e.target.value)}
                      placeholder="Add live customer update..."
                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] outline-none focus:border-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg"
                    >
                      Post
                    </button>
                  </form>
                </div>

                {/* Multiple Return Dates (if present) */}
                {selectedContract.phases && selectedContract.phases.length > 0 && (
                  <div className="p-3.5 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-900">
                      <span>Multiple Return Dates (18% APR Interest)</span>
                      <span className="font-mono text-amber-700">
                        +${(selectedContract.interestCharged || 0).toFixed(2)} Int
                      </span>
                    </div>
                    {selectedContract.phases.map(ph => (
                      <div
                        key={ph.id}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50/50 border border-amber-200 text-[11px] flex justify-between"
                      >
                        <span className="font-medium text-slate-800 truncate">{ph.label}</span>
                        <span className="font-mono text-amber-900 shrink-0 ml-2">
                          {ph.varianceDays > 0
                            ? `+${ph.varianceDays}d ($${ph.accruedInterest.toFixed(2)})`
                            : 'Scheduled'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assigned Tools */}
                <div className="p-3.5 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-900 block">
                    Contract Tools ({selectedContract.items.length})
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                    {selectedContract.items.map(itemId => {
                      const tool = inventory.find(i => i.id === itemId);
                      if (!tool) return null;
                      return (
                        <div key={itemId} className="px-2.5 py-1.5 flex justify-between text-[11px]">
                          <span className="font-medium text-slate-900 truncate">
                            {tool.id}: {tool.name}
                          </span>
                          <span className="font-mono text-slate-600 shrink-0 ml-2">
                            {tool.status} · ${tool.rate}/d
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Linked Work Orders & Replacement Orders */}
                {(contractWorkOrders.length > 0 || contractReplacements.length > 0) && (
                  <div className="p-3.5 space-y-1.5">
                    <span className="text-xs font-semibold text-slate-900 block">
                      Linked Repair WOs & Replacement POs
                    </span>
                    {contractWorkOrders.map(wo => (
                      <div
                        key={wo.id}
                        className="px-2.5 py-1.5 rounded-lg border border-orange-200 bg-orange-50/50 text-[11px] flex justify-between"
                      >
                        <span className="truncate font-medium">
                          {wo.id}: {wo.disposition} ({wo.parts.length} parts)
                        </span>
                        <span className="font-mono font-semibold text-orange-800">
                          +${wo.totalCost.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {contractReplacements.map(ro => (
                      <div
                        key={ro.id}
                        className="px-2.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 text-[11px] flex justify-between"
                      >
                        <span className="truncate font-medium">
                          {ro.id}: {ro.itemName} ({ro.poNumber})
                        </span>
                        <span className="font-mono font-semibold text-purple-800">
                          +${ro.totalBilledToCustomer.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Monthly Statement Lines */}
                {selectedInvoice && selectedInvoice.lineItems && (
                  <div className="p-3.5 bg-slate-50/50 space-y-1.5 text-[11px] font-mono tabular-nums">
                    <div className="font-sans font-semibold text-slate-900 flex justify-between">
                      <span>Nov 2026 Statement ({selectedInvoice.id})</span>
                      <span className="font-mono">${selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.lineItems.map((li, i) => (
                      <div key={i} className="flex justify-between gap-2 text-[11px]">
                        <span className="font-sans text-slate-600 truncate">{li.description}</span>
                        <span className="font-semibold text-slate-900 shrink-0">
                          {li.amount < 0
                            ? `-$${Math.abs(li.amount).toFixed(2)}`
                            : `$${li.amount.toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Controls */}
                <div className="p-3.5 flex items-center gap-2">
                  <select
                    value={selectedContract.flowStage}
                    onChange={e =>
                      handleStageMove(selectedContract, e.target.value as FlowStage)
                    }
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800"
                  >
                    {FLOW_STAGES.map(st => (
                      <option key={st.stage} value={st.stage}>
                        Move: {st.stepNum}. {st.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() =>
                      navigate('/returns', { state: { contractId: selectedContract.id } })
                    }
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shrink-0"
                  >
                    Inspect / Bill →
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FlowChart;
