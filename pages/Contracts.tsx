import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ClipboardCheck,
  Edit3,
  Save,
  FilePlus2,
  Truck,
  CheckCircle2,
  Search,
  X,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ContractStatus, Contract, ShipmentStage } from '../types';

const Contracts: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    contracts,
    customers,
    inventory: items,
    workflowIssues,
    openReVettingModal,
    updateContract,
    convertQuoteToOrder,
    updateShipmentStatus,
    notify
  } = useData();

  const initialId = (location.state as { contractId?: string } | null)?.contractId;
  const [selectedContractId, setSelectedContractId] = useState<string>(
    initialId || contracts[0]?.id || 'T-1001'
  );
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Contract>>({});
  const [renewalDays, setRenewalDays] = useState(14);

  useEffect(() => {
    if (initialId && contracts.some(c => c.id === initialId)) {
      setSelectedContractId(initialId);
      setIsEditing(false);
    }
  }, [initialId, contracts]);

  const selectedContract =
    contracts.find(c => c.id === selectedContractId) || contracts[0] || null;

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const startEditing = () => {
    if (!selectedContract) return;
    setEditFormData({
      startDate: selectedContract.startDate,
      endDate: selectedContract.endDate,
      jobSite: selectedContract.jobSite || '',
      poNumber: selectedContract.poNumber || '',
      notes: selectedContract.notes || '',
      taxRate: selectedContract.taxRate
    });
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!selectedContract || !editFormData) return;
    const selectedItemsList = items.filter(i => selectedContract.items.includes(i.id));
    const subtotalPerDay = selectedItemsList.reduce((acc, i) => acc + i.rate, 0);
    const totalDays = calculateDays(
      editFormData.startDate || selectedContract.startDate,
      editFormData.endDate || selectedContract.endDate
    );
    const newTotal =
      subtotalPerDay * totalDays * (1 + (editFormData.taxRate ?? selectedContract.taxRate));

    const finalData: Partial<Contract> = {
      ...editFormData,
      totalAmount: Number(newTotal.toFixed(2)),
      latestCustomerUpdate: `Contract ${selectedContract.id} terms updated (${editFormData.startDate} to ${editFormData.endDate}) — recalculated total $${newTotal.toFixed(2)}.`
    };
    updateContract(selectedContract.id, finalData);
    setIsEditing(false);
    notify(
      'Contract Updated',
      `Contract ${selectedContract.id} dates & monthly billing total recalculated.`
    );
  };

  const handleRenew = () => {
    if (!selectedContract) return;
    const currentEnd = new Date(selectedContract.endDate);
    currentEnd.setDate(currentEnd.getDate() + renewalDays);
    const newEndStr = currentEnd.toISOString().split('T')[0];

    const selectedItemsList = items.filter(i => selectedContract.items.includes(i.id));
    const subtotalPerDay = selectedItemsList.reduce((acc, i) => acc + i.rate, 0);
    const totalDays = calculateDays(selectedContract.startDate, newEndStr);
    const newTotal = Number(
      (subtotalPerDay * totalDays * (1 + selectedContract.taxRate)).toFixed(2)
    );

    updateContract(selectedContract.id, {
      endDate: newEndStr,
      totalAmount: newTotal,
      status: ContractStatus.ACTIVE,
      flowStage: 'Active On-Rent',
      latestCustomerUpdate: `Extended ${selectedContract.id} by +${renewalDays}d to ${newEndStr}. New total $${newTotal.toLocaleString()}.`
    });
    notify(
      'Contract Extended',
      `${selectedContract.id} extended by ${renewalDays} days. Updated Monthly Statement total: $${newTotal.toLocaleString()}.`
    );
  };

  const filteredContracts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return contracts.filter(c => {
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesSearch =
        !q ||
        c.id.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        (c.jobSite || '').toLowerCase().includes(q) ||
        (c.poNumber || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [contracts, statusFilter, searchTerm]);

  const selectedCustomer = selectedContract
    ? customers.find(c => c.id === selectedContract.customerId)
    : null;
  const selectedItemsList = selectedContract
    ? items.filter(i => selectedContract.items.includes(i.id))
    : [];
  const selectedContractIssues = useMemo(() => {
    if (!selectedContract) return [];
    return workflowIssues.filter(
      issue =>
        issue.contractId === selectedContract.id ||
        issue.customerId === selectedContract.customerId
    );
  }, [workflowIssues, selectedContract]);

  return (
    <div className="space-y-3">
      {/* Header & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Contracts, Multiple Return Dates & Staged Shipments ({contracts.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side contract ledger, 18% APR multiple return dates, staged multi-shipment fulfillment, quotes, and monthly statement sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search contract ID, customer, PO#..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => navigate('/new-order')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap"
            >
              <FilePlus2 size={14} />
              <span>+ New Order / Contract</span>
            </button>
          </div>
        </div>

        {/* Status Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {[
            { label: `All (${contracts.length})`, val: 'ALL' },
            { label: 'Quotes', val: ContractStatus.QUOTE },
            { label: 'Active On-Rent', val: ContractStatus.ACTIVE },
            { label: 'Early Return', val: ContractStatus.EARLY_RETURN },
            { label: 'Multiple Return Dates', val: ContractStatus.PHASED_RETURN },
            { label: 'Partial (+Reorder)', val: ContractStatus.PARTIAL_RETURN },
            { label: 'Overdue (+Surcharge)', val: ContractStatus.OVERDUE },
            { label: 'Inspection / Repair', val: ContractStatus.INSPECTION_PENDING },
            { label: 'Completed / Scrapped', val: ContractStatus.COMPLETED }
          ].map(bucket => (
            <button
              key={bucket.val}
              onClick={() => setStatusFilter(bucket.val)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap ${
                statusFilter === bucket.val
                  ? 'bg-slate-900 text-white'
                  : bucket.val === ContractStatus.QUOTE
                  ? 'bg-yellow-300 text-slate-950 border border-yellow-500 hover:bg-yellow-400 font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {bucket.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master-Detail Split: Contracts Table (7 Cols) + Inspector (5 Cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-medium text-slate-500">
                <tr>
                  <th className="py-2.5 px-3.5">Contract & Stage</th>
                  <th className="py-2.5 px-2.5">Customer & Jobsite</th>
                  <th className="py-2.5 px-2.5">Dates, Tools & Shipments</th>
                  <th className="py-2.5 px-2.5 text-right">Monthly Total</th>
                  <th className="py-2.5 px-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                      No contracts match your current search or status filter.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map(contract => {
                    const isSelected = selectedContract?.id === contract.id;
                    const isQuote = contract.status === ContractStatus.QUOTE;
                    return (
                      <tr
                        key={contract.id}
                        onClick={() => {
                          setSelectedContractId(contract.id);
                          setIsEditing(false);
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 px-3.5">
                          <span className="font-mono font-semibold text-blue-600 block">
                            {contract.id}
                          </span>
                          {isQuote ? (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-yellow-300 text-slate-950 border border-yellow-500 rounded font-extrabold text-[10px] tracking-wide">
                              QUOTE
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-600">
                              {contract.flowStage === 'Phased Return (Off-Schedule)'
                                ? 'Multiple Return Dates'
                                : contract.flowStage}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="font-semibold text-slate-900 block">
                            {contract.customerName}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate block max-w-[230px]">
                            {contract.jobSite}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-[11px] text-slate-600">
                          <div>
                            {contract.startDate} → {contract.endDate}
                          </div>
                          <div className="text-slate-500">
                            {contract.items.length} tools · {contract.annualInterestRate || 18}% APR
                            {contract.shipments && contract.shipments.length > 0 && (
                              <span className="ml-1.5 text-blue-700 font-semibold">
                                · {contract.shipments.length} shipments
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                          <span className="font-semibold text-slate-900 block">
                            ${contract.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {(contract.accruedInterest || 0) > 0 && (
                            <span className="text-[10px] text-amber-700 font-medium">
                              +${contract.accruedInterest?.toFixed(2)} int.
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              navigate('/returns', { state: { contractId: contract.id } });
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-medium rounded-lg"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Light Enterprise Contract Inspector */}
        {selectedContract && (
          <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            {/* Prominent Yellow QUOTE Block when Contract is a Quote and not an Order */}
            {selectedContract.status === ContractStatus.QUOTE && (
              <div className="px-4 py-2.5 bg-yellow-300 text-slate-950 border-b-2 border-yellow-500 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-extrabold text-xs tracking-wide block">
                    QUOTE — NOT AN ACTIVE ORDER
                  </span>
                  {selectedContract.quoteSentAt && (
                    <span className="text-[11px] font-semibold">
                      Sent to {selectedContract.quoteSentTo} ({selectedContract.quoteSentAt})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => convertQuoteToOrder(selectedContract.id)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  Convert Quote to Active Order
                </button>
              </div>
            )}

            {/* Inspector Header */}
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-mono text-blue-600 font-semibold block">
                  {selectedContract.status === ContractStatus.QUOTE ? 'QUOTE' : 'CONTRACT'}{' '}
                  {selectedContract.id}
                  {selectedContract.p21OrderNum ? ` · ${selectedContract.p21OrderNum}` : ''} ·{' '}
                  {selectedContract.flowStage === 'Phased Return (Off-Schedule)'
                    ? 'Multiple Return Dates'
                    : selectedContract.flowStage}
                </span>
                <h2 className="text-sm font-display font-bold text-slate-900 mt-0.5">
                  {selectedContract.customerName}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ship-To: {selectedContract.jobSite || selectedCustomer?.address} ·{' '}
                  {selectedContract.paymentTerms || selectedCustomer?.paymentTerms || 'Net 30'}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isEditing ? (
                  <>
                    <select
                      value={renewalDays}
                      onChange={e => setRenewalDays(Number(e.target.value))}
                      className="bg-white border border-slate-200 text-slate-800 text-[11px] font-mono px-2 py-1 rounded-lg"
                    >
                      <option value={7}>+7d</option>
                      <option value={14}>+14d</option>
                      <option value={28}>+28d</option>
                    </select>
                    <button
                      onClick={handleRenew}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg"
                    >
                      Extend
                    </button>
                    <button
                      onClick={startEditing}
                      title="Edit contract dates, jobsite, PO#"
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                    >
                      <Edit3 size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 text-[11px] font-medium rounded-lg flex items-center gap-1"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                    <button
                      onClick={saveEdits}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1"
                    >
                      <Save size={12} />
                      Save & Recalc
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Inline Oversight Issues for this Contract / Customer */}
              {selectedContractIssues.length > 0 && (
                <div className="p-3.5 bg-amber-50/70 space-y-2">
                  {selectedContractIssues.map(issue => (
                    <div
                      key={issue.id}
                      className="flex flex-wrap items-start justify-between gap-2 text-[11px]"
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
                        <div className="min-w-0">
                          <strong className="text-slate-900 block">{issue.title}</strong>
                          <span className="text-slate-700 block">{issue.errorMessage}</span>
                          <span className="text-slate-800 block mt-0.5">
                            <strong>Fix: </strong>
                            {issue.instructions}
                          </span>
                        </div>
                      </div>
                      {issue.requiresReVetting && selectedCustomer ? (
                        <button
                          type="button"
                          onClick={() => openReVettingModal(selectedCustomer)}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-md flex items-center gap-1 shrink-0"
                        >
                          <UserCheck size={12} />
                          <span>Re-Run Vetting</span>
                        </button>
                      ) : issue.id.startsWith('OV-NOPO') ? (
                        <button
                          type="button"
                          onClick={startEditing}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md shrink-0"
                        >
                          Enter PO #
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(issue.targetRoute, {
                              state: { contractId: selectedContract.id }
                            })
                          }
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md shrink-0"
                        >
                          {issue.actionLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inline Edit Form */}
              {isEditing && (
                <div className="p-3.5 bg-blue-50/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-blue-900">
                      Edit Contract Schedule & Metadata (Auto-Recalculates Total)
                    </p>
                    <span className="text-[10px] font-semibold text-amber-800">
                      Needs Human Input
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.startDate || ''}
                        onChange={e =>
                          setEditFormData({ ...editFormData, startDate: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                        Scheduled Return Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.endDate || ''}
                        onChange={e =>
                          setEditFormData({ ...editFormData, endDate: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                        Jobsite Address
                      </label>
                      <input
                        type="text"
                        value={editFormData.jobSite || ''}
                        onChange={e =>
                          setEditFormData({ ...editFormData, jobSite: e.target.value })
                        }
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-500 flex items-center justify-between mb-0.5">
                        <span>PO Number</span>
                        {!(editFormData.poNumber || '').trim() && (
                          <span className="text-[9px] font-semibold text-amber-700">Required</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={editFormData.poNumber || ''}
                        onChange={e =>
                          setEditFormData({ ...editFormData, poNumber: e.target.value })
                        }
                        placeholder="Enter PO #"
                        className={`w-full px-2 py-1 border rounded-lg font-mono text-xs ${
                          !(editFormData.poNumber || '').trim()
                            ? 'bg-amber-50/50 border-amber-400'
                            : 'bg-white border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Latest Customer Update */}
              <div className="p-3.5">
                <div className="flex justify-between font-semibold text-slate-900 mb-1">
                  <span>Latest Customer & Monthly Billing Update</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {selectedContract.lastUpdatedAt || '2026-11-17'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {selectedContract.latestCustomerUpdate || selectedContract.notes}
                </p>
              </div>

              {/* Staged Fulfillment / Multiple Shipments if present */}
              {selectedContract.shipments && selectedContract.shipments.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    <Truck size={14} className="text-blue-600" />
                    <span>
                      Staged Fulfillment — Multiple Shipments ({selectedContract.shipments.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {selectedContract.shipments.map(sh => (
                      <div
                        key={sh.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-900 block truncate">
                            {sh.label}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 block mt-0.5">
                            {sh.scheduledShipDate} · {sh.carrierMethod} · {sh.itemIds.join(', ')}
                          </span>
                        </div>
                        <select
                          value={sh.status}
                          onChange={e =>
                            updateShipmentStatus(
                              selectedContract.id,
                              sh.id,
                              e.target.value as ShipmentStage['status']
                            )
                          }
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 shrink-0"
                        >
                          <option value="Planned">Planned</option>
                          <option value="Staged in Warehouse">Staged in Warehouse</option>
                          <option value="Dispatched / In Transit">Dispatched / In Transit</option>
                          <option value="Delivered to Jobsite">Delivered to Jobsite</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multiple Return Dates if present */}
              {selectedContract.phases && selectedContract.phases.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <span className="text-xs font-semibold text-slate-900 block">
                    Multiple Return Dates Schedule (18% APR Off-Schedule Interest)
                  </span>
                  <div className="space-y-1.5">
                    {selectedContract.phases.map(ph => (
                      <div
                        key={ph.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 block">{ph.label}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            Return Date: {ph.scheduledDate} · {ph.status}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-amber-700 tabular-nums">
                          Int: ${ph.accruedInterest.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Allocated Tools List */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Allocated Tools & Equipment ({selectedItemsList.length})
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                    Total: ${selectedContract.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {selectedItemsList.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 flex items-center justify-between text-xs bg-white"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-900 block truncate">
                          {item.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {item.id} · SN: {item.serialNumber} · {item.status}
                        </span>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0">
                        <span className="font-semibold text-slate-900">${item.rate}/d</span>
                        <span className="block text-[10px] text-slate-500">
                          MSRP ${item.replacementCost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() =>
                    navigate('/returns', { state: { contractId: selectedContract.id } })
                  }
                  className="w-full py-2 mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <ClipboardCheck size={14} />
                  <span>Open in Returns, Repair & Replacements Workbench</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contracts;
