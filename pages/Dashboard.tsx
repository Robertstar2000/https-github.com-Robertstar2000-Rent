import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitBranch,
  ClipboardCheck,
  ArrowUpRight,
  FilePlus2,
  Receipt,
  ShieldAlert,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ItemStatus, Contract, ContractStatus } from '../types';
import { FLOW_STAGES } from './FlowChart';
import WorkflowOversightDrawer from '../components/WorkflowOversightDrawer';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    contracts,
    inventory: items,
    customers,
    workOrders,
    replacementOrders,
    invoices,
    workflowIssues,
    openReVettingModal,
    runMonthlyBillingCycle
  } = useData();

  const [isOversightOpen, setIsOversightOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts[1]?.id || contracts[0]?.id || 'T-1002'
  );
  const selectedContract = contracts.find(c => c.id === selectedContractId) || contracts[0];
  const selectedCustomer = customers.find(c => c.id === selectedContract?.customerId);

  const totalMonthlyBilled = customers.reduce(
    (acc, c) => acc + (c.monthlyBillingTotal ?? c.balance),
    0
  );
  const rentedCount = items.filter(i => i.status === ItemStatus.RENTED).length;
  const availableCount = items.filter(i => i.status === ItemStatus.AVAILABLE).length;
  const repairCount = items.filter(
    i => i.status === ItemStatus.MAINTENANCE || i.status === ItemStatus.DAMAGED
  ).length;
  const scrappedCount = items.filter(i => i.status === ItemStatus.SCRAPPED).length;
  const missingCount = items.filter(i => i.status === ItemStatus.MISSING).length;
  const inspectionCount = items.filter(i => i.status === ItemStatus.INSPECTION).length;

  const totalInterestAccrued = contracts.reduce((s, c) => s + (c.interestCharged || 0), 0);
  const totalLateFees = contracts.reduce((s, c) => s + (c.lateFeeTotal || 0), 0);
  const totalRepairCharges = contracts.reduce((s, c) => s + (c.repairCharges || 0), 0);
  const totalScrapAndReorder = contracts.reduce(
    (s, c) => s + (c.scrapCharges || 0) + (c.replacementCharges || 0),
    0
  );
  const totalEarlyCredits = contracts.reduce((s, c) => s + (c.earlyReturnCredit || 0), 0);

  const formatTimeChip = (c: Contract) => {
    const d = c.daysDelta ?? 0;
    if (c.flowStage === 'Early Return') return `${Math.abs(d)}d Early`;
    if (c.flowStage === 'Quote & Reservation') return `Starts ${Math.abs(d)}d`;
    if (c.flowStage === 'Active On-Rent') return `${Math.abs(d)}d Rem`;
    if (c.flowStage === 'Return Inspection') return `Dock 0d`;
    if (c.flowStage === 'Phased Return (Off-Schedule)') return `+${d}d Off-Date`;
    if (c.flowStage === 'Late / Overdue') return `+${d}d Late`;
    if (c.flowStage === 'Partial Return') return `Partial ${Math.abs(d)}d`;
    if (c.flowStage === 'Repair Shop') return `+${d}d Shop`;
    if (c.flowStage === 'Scrap & Write-Off') return `Scrapped`;
    return 'Settled';
  };

  return (
    <div className="space-y-3">
      {/* Row 1: Unified Operations Header + 6-KPI Metric Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[15px] font-display font-bold text-slate-900">
                Operations Command Center
              </h1>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-slate-500">
                Tools & Equipment Only · November 2026 Consolidated Billing
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => runMonthlyBillingCycle('November 2026')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Receipt size={13} className="text-slate-500" />
              <span>Run Nov Billing</span>
            </button>
            <button
              onClick={() => navigate('/new-order')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FilePlus2 size={13} />
              <span>+ New Order / Quote</span>
            </button>
            <button
              onClick={() => navigate('/returns')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <ClipboardCheck size={13} />
              <span>Returns & Repairs</span>
            </button>
          </div>
        </div>

        {/* 6 Crisp KPI Cells */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="p-3 text-left hover:bg-slate-50/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Nov Monthly Billing</span>
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-600" />
            </div>
            <p className="text-lg font-mono font-bold tabular-nums text-emerald-700 mt-0.5">
              ${totalMonthlyBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {invoices.length} statements · {customers.length} accounts
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="p-3 text-left hover:bg-slate-50/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                Tool Inventory ({items.length})
              </span>
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-600" />
            </div>
            <p className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-0.5">
              {rentedCount} Out · {availableCount} Ready
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {inspectionCount} dock · {repairCount} shop · {scrappedCount} scrap
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/returns', { state: { contractId: 'T-1002' } })}
            className="p-3 text-left hover:bg-slate-50/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                Multiple Dates & Late
              </span>
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-amber-600" />
            </div>
            <p className="text-lg font-mono font-bold tabular-nums text-amber-700 mt-0.5">
              +${(totalInterestAccrued + totalLateFees).toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              18% APR (${totalInterestAccrued.toFixed(2)}) + late fees
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/returns', { state: { contractId: 'T-1001' } })}
            className="p-3 text-left hover:bg-slate-50/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                Partial & Scrap Reorders
              </span>
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-purple-600" />
            </div>
            <p className="text-lg font-mono font-bold tabular-nums text-purple-700 mt-0.5">
              +${totalScrapAndReorder.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {replacementOrders.length} OEM POs · {missingCount} missing
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/returns', { state: { contractId: 'T-1003' } })}
            className="p-3 text-left hover:bg-slate-50/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">
                Broken Tool Repairs
              </span>
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-orange-600" />
            </div>
            <p className="text-lg font-mono font-bold tabular-nums text-orange-700 mt-0.5">
              +${totalRepairCharges.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {workOrders.length} WOs · labor, mat & parts
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/returns', { state: { contractId: 'T-1006' } })}
            className="p-3 text-left hover:bg-slate-50/80 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Early Return Credits</span>
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-teal-600" />
            </div>
            <p className="text-lg font-mono font-bold tabular-nums text-teal-700 mt-0.5">
              -${totalEarlyCredits.toFixed(2)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">POR rate tier recalculation</p>
          </button>
        </div>
      </div>

      {/* Row 1.5: AI Workflow Oversight & Exception Monitor */}
      {workflowIssues.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-rose-600" />
              <span className="text-xs font-display font-bold text-slate-900">
                AI Workflow Oversight &amp; Exception Alerts ({workflowIssues.length})
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                · Overdue returns, &gt;61d / repeat late-payment re-vetting, damage/scrap % &amp; human input holds
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOversightOpen(true)}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Inspect All ({workflowIssues.length}) &amp; Run Deep AI Audit →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {workflowIssues.slice(0, 4).map(issue => (
              <div key={issue.id} className="p-3 flex flex-col justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-mono font-semibold flex items-center gap-1 ${
                        issue.severity === 'critical'
                          ? 'text-rose-700'
                          : issue.severity === 'warning'
                          ? 'text-amber-700'
                          : 'text-blue-700'
                      }`}
                    >
                      <AlertTriangle size={11} />
                      {issue.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{issue.entityId}</span>
                  </div>
                  <p className="font-semibold text-slate-900 leading-snug">{issue.title}</p>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                    {issue.errorMessage}
                  </p>
                  <p className="text-[11px] text-slate-800 line-clamp-2 mt-1 leading-snug">
                    <strong className="text-slate-900">Fix: </strong>
                    {issue.instructions}
                  </p>
                </div>
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (issue.requiresReVetting && issue.customerId) {
                        const cust = customers.find(c => c.id === issue.customerId);
                        if (cust) {
                          openReVettingModal(cust);
                          return;
                        }
                      }
                      navigate(issue.targetRoute, {
                        state: { contractId: issue.contractId, customerId: issue.customerId }
                      });
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
                      issue.requiresReVetting
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {issue.requiresReVetting && <UserCheck size={11} />}
                    <span>{issue.actionLabel}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Main 12-Col Split — Left 7 Cols: Customer Lifecycle Flow Matrix | Right 5 Cols: Monthly Statements & Shop Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-blue-600" />
              <span className="text-xs font-display font-semibold text-slate-900">
                Customer Flow Chart (Time Horizon vs. Return Status)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
              <span>Early (-25d)</span>
              <span className="text-slate-300">|</span>
              <span>Dock (0d)</span>
              <span className="text-slate-300">|</span>
              <span>Late (+15d)</span>
              <button
                onClick={() => navigate('/flowchart')}
                className="font-sans font-semibold text-blue-600 hover:underline ml-1"
              >
                Expand →
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {FLOW_STAGES.filter(s => s.stage !== 'Completed & Billed').map(stageCfg => {
              const stageContracts = contracts.filter(c => c.flowStage === stageCfg.stage);
              const Icon = stageCfg.icon;
              return (
                <div
                  key={stageCfg.stage}
                  className="grid grid-cols-12 items-center px-3 py-2 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="col-span-4 pr-3 border-r border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-slate-400">
                        {stageCfg.stepNum}
                      </span>
                      <Icon size={13} className="text-slate-600 shrink-0" />
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {stageCfg.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate pl-5">
                      {stageCfg.billingRule}
                    </p>
                  </div>

                  <div className="col-span-8 pl-3 flex flex-wrap items-center gap-1.5">
                    {stageContracts.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">No contracts in stage</span>
                    ) : (
                      stageContracts.map(c => {
                        const isSel = selectedContract?.id === c.id;
                        const isQuote = c.status === ContractStatus.QUOTE;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setSelectedContractId(c.id)}
                            className={`text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-2 ${
                              isSel
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : isQuote
                                ? 'bg-yellow-300 text-slate-950 border-yellow-500 font-semibold hover:bg-yellow-400'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            {isQuote && (
                              <span className="px-1.5 py-0.5 bg-yellow-400 text-slate-950 border border-yellow-600 rounded font-extrabold text-[10px] leading-none">
                                QUOTE
                              </span>
                            )}
                            <span
                              className={`font-mono text-[11px] font-semibold ${
                                isSel ? 'text-blue-300' : isQuote ? 'text-slate-950' : 'text-blue-600'
                              }`}
                            >
                              {c.id}
                            </span>
                            <span className="font-semibold truncate max-w-[145px]">
                              {c.customerName}
                            </span>
                            <span
                              className={`font-mono text-[10px] ${
                                isSel ? 'text-slate-300' : 'text-slate-500'
                              }`}
                            >
                              {formatTimeChip(c)} · ${c.totalAmount.toLocaleString()}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedContract && (
            <div className="bg-slate-50/80 border-t border-slate-200 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {selectedContract.status === ContractStatus.QUOTE && (
                    <span className="px-1.5 py-0.5 bg-yellow-300 text-slate-950 border border-yellow-500 rounded font-extrabold text-[10px]">
                      QUOTE
                    </span>
                  )}
                  <span className="font-mono font-bold text-blue-600">{selectedContract.id}</span>
                  <span className="font-semibold text-slate-900">
                    {selectedContract.customerName}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-600">
                    {selectedContract.flowStage === 'Phased Return (Off-Schedule)'
                      ? 'Multiple Return Dates'
                      : selectedContract.flowStage}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 truncate mt-0.5">
                  {selectedCustomer?.latestCustomerUpdate || selectedContract.notes}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() =>
                    navigate('/contracts', { state: { contractId: selectedContract.id } })
                  }
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium rounded-lg whitespace-nowrap"
                >
                  Open Contract
                </button>
                <button
                  onClick={() =>
                    navigate('/returns', { state: { contractId: selectedContract.id } })
                  }
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg whitespace-nowrap"
                >
                  Inspect / Process →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: Monthly Consolidated Billing & Shop Queues */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-display font-semibold text-slate-900">
                Nov 2026 Monthly Customer Billing & Latest Updates
              </span>
              <button
                onClick={() => navigate('/customers')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                All Accounts →
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[268px] overflow-y-auto">
              {customers.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate('/customers', { state: { customerId: c.id } })}
                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer flex items-start justify-between gap-2.5 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {c.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {c.lastUpdatedAt?.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                      {c.latestCustomerUpdate}
                    </p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <span className="text-xs font-semibold text-slate-900 block">
                      $
                      {(c.monthlyBillingTotal ?? c.balance).toLocaleString(undefined, {
                        minimumFractionDigits: 2
                      })}
                    </span>
                    <span
                      className={`text-[10px] font-sans font-medium ${
                        c.accountStatus === 'Credit Hold'
                          ? 'text-rose-600'
                          : c.accountStatus === 'Watchlist'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {c.accountStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repair Work Orders & Replacement POs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-display font-semibold text-slate-900">
                Repair Work Orders & Replacement POs ({workOrders.length + replacementOrders.length})
              </span>
              <button
                onClick={() => navigate('/returns')}
                className="text-[11px] text-blue-600 hover:underline font-semibold"
              >
                Open Workbench →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {workOrders.map(wo => (
                <div
                  key={wo.id}
                  onClick={() => navigate('/returns')}
                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-semibold text-orange-700">{wo.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-900 truncate">{wo.itemName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {wo.customerName} ·{' '}
                      {wo.disposition === 'Scrap'
                        ? 'Scrapped (BER)'
                        : `Labor ${wo.laborHours}h · Mat $${wo.materialsCost} · ${wo.parts.length} parts`}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-900 shrink-0 tabular-nums">
                    +${wo.totalCost.toFixed(2)}
                  </span>
                </div>
              ))}
              {replacementOrders.map(ro => (
                <div
                  key={ro.id}
                  onClick={() => navigate('/returns')}
                  className="px-3.5 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-semibold text-purple-700">{ro.id}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-900 truncate">{ro.itemName}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {ro.customerName} · {ro.reason} · {ro.poNumber}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-purple-700 shrink-0 tabular-nums">
                    +${ro.totalBilledToCustomer.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Serialized Tool & Equipment Inventory Snapshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-display font-semibold text-slate-900">
            Serialized Tool & Equipment Inventory ({items.length} Units)
          </span>
          <button
            onClick={() => navigate('/inventory')}
            className="text-[11px] font-semibold text-blue-600 hover:underline"
          >
            Full Tool Catalog →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-medium text-slate-500">
              <tr>
                <th className="px-3.5 py-2">ID & Serial</th>
                <th className="px-3 py-2">Tool Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Rates (D / W / M)</th>
                <th className="px-3 py-2 text-right">MSRP</th>
                <th className="px-3.5 py-2">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.slice(0, 8).map(tool => (
                <tr
                  key={tool.id}
                  onClick={() => navigate('/inventory', { state: { itemId: tool.id } })}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-3.5 py-2 font-mono text-[11px] font-semibold text-blue-600 whitespace-nowrap">
                    {tool.id} · {tool.serialNumber}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">{tool.name}</td>
                  <td className="px-3 py-2 text-slate-600">{tool.category}</td>
                  <td className="px-3 py-2 font-medium text-slate-800">{tool.status}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-[11px] text-slate-700 whitespace-nowrap">
                    ${tool.rate} / ${tool.weeklyRate} / ${tool.monthlyRate}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ${tool.replacementCost.toLocaleString()}
                  </td>
                  <td className="px-3.5 py-2 text-slate-500 truncate max-w-[180px]">
                    {tool.location}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <WorkflowOversightDrawer
        isOpen={isOversightOpen}
        onClose={() => setIsOversightOpen(false)}
      />
    </div>
  );
};

export default Dashboard;