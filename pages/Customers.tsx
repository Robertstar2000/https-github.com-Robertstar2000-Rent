import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Receipt,
  CheckCircle2,
  Download,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Customer, Invoice } from '../types';
import CustomerOnboardingModal from '../components/CustomerOnboardingModal';
import { getCustomerPaymentRisk } from '../services/workflowOversight';

const Customers: React.FC = () => {
  const location = useLocation();
  const {
    customers,
    invoices,
    postCustomerUpdate,
    runMonthlyBillingCycle,
    updateInvoiceStatus,
    openReVettingModal,
    simulateLatePaymentForTest,
    notify
  } = useData();

  const initialCustId = (location.state as { customerId?: string } | null)?.customerId;
  const [searchTerm, setSearchTerm] = useState('');
  const [standingFilter, setStandingFilter] = useState<string>('ALL');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<
    'ALL' | 'Unpaid' | 'Overdue' | 'Paid'
  >('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustId || customers[0]?.id || 'C1'
  );
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [newUpdateText, setNewUpdateText] = useState('');
  const [newUpdateAmount, setNewUpdateAmount] = useState<number>(0);

  useEffect(() => {
    if (initialCustId && customers.some(c => c.id === initialCustId)) {
      setSelectedCustomerId(initialCustId);
    }
  }, [initialCustId, customers]);

  const selectedCustomer: Customer | undefined =
    customers.find(c => c.id === selectedCustomerId) || customers[0];

  const selectedRisk = useMemo(
    () => (selectedCustomer ? getCustomerPaymentRisk(selectedCustomer, invoices) : null),
    [selectedCustomer, invoices]
  );

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.p21Id || '').toLowerCase().includes(q) ||
        (c.latestCustomerUpdate || '').toLowerCase().includes(q);
      const matchesStanding =
        standingFilter === 'ALL' || (c.accountStatus || 'Good Standing') === standingFilter;
      return matchesSearch && matchesStanding;
    });
  }, [customers, searchTerm, standingFilter]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm.trim() ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      inv.contractId.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handlePostCustomerUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newUpdateText.trim()) return;
    postCustomerUpdate(selectedCustomer.id, newUpdateText.trim(), newUpdateAmount);
    setNewUpdateText('');
    setNewUpdateAmount(0);
  };

  const downloadStatementCsv = (inv: Invoice) => {
    const rows = [
      ['Statement ID', 'Customer', 'Billing Month', 'Contract Ref', 'Due Date', 'Status', 'Total ($)']
        .join(','),
      [
        inv.id,
        `"${inv.customerName || ''}"`,
        inv.billingMonth || 'November 2026',
        inv.contractId,
        inv.dueDate,
        inv.status,
        inv.amount.toFixed(2)
      ].join(','),
      '',
      ['Category', 'Line Description', 'Amount ($)'].join(','),
      ...(inv.lineItems || []).map(li =>
        [`"${li.category}"`, `"${li.description.replace(/"/g, '""')}"`, li.amount.toFixed(2)].join(',')
      )
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${inv.id}-statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Statement Exported', `Downloaded ${inv.id}-statement.csv.`);
  };

  const totalMonthlyReceivables = customers.reduce(
    (acc, c) => acc + (c.monthlyBillingTotal ?? c.balance),
    0
  );
  const paidStatementsTotal = invoices
    .filter(i => i.status === 'Paid')
    .reduce((s, i) => s + i.amount, 0);
  const unpaidOverdueTotal = invoices
    .filter(i => i.status !== 'Paid')
    .reduce((s, i) => s + i.amount, 0);
  const overdueCount = invoices.filter(i => i.status === 'Overdue').length;

  return (
    <div className="space-y-3">
      {/* Header & 4-KPI Consolidated Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Customers & Monthly Consolidated Billing ({customers.length} Accounts · {invoices.length} Statements)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated November 2026 Monthly Billing ledger: latest customer updates, early credits, 18% APR interest, repairs & replacement POs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => runMonthlyBillingCycle('November 2026')}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Run Nov 2026 Billing Cycle
            </button>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
            >
              <UserPlus size={14} />
              <span>Onboard & Vet Customer</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 font-mono tabular-nums">
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Nov Monthly Billing Total
            </span>
            <span className="text-lg font-bold text-slate-900">
              ${totalMonthlyReceivables.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Paid Statements
            </span>
            <span className="text-lg font-bold text-emerald-700">
              ${paidStatementsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Open / Unpaid Statements
            </span>
            <span className="text-lg font-bold text-amber-700">
              ${unpaidOverdueTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Overdue / Escalated
            </span>
            <span className="text-lg font-bold text-rose-700">{overdueCount} Statements</span>
          </div>
        </div>
      </div>

      {/* Master-Detail Customer Ledger & Monthly Statement Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="relative w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer, P21 ID, update..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {['ALL', 'Good Standing', 'Watchlist', 'Credit Hold'].map(st => (
                <button
                  key={st}
                  onClick={() => setStandingFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    standingFilter === st
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Accounts' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-medium text-slate-500">
                  <th className="py-2.5 px-3.5">Customer Account & P21 ID</th>
                  <th className="py-2.5 px-2.5">Latest Customer & Billing Update</th>
                  <th className="py-2.5 px-2.5">Standing / Vetting</th>
                  <th className="py-2.5 px-3.5 text-right">Nov Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(customer => {
                  const isSelected = selectedCustomer?.id === customer.id;
                  const risk = getCustomerPaymentRisk(customer, invoices);
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-2.5 px-3.5">
                        <p className="font-semibold text-slate-900">{customer.name}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          {customer.p21Id || customer.id} · {customer.contactPerson || customer.email}
                        </p>
                      </td>
                      <td className="py-2.5 px-2.5 max-w-xs">
                        <span className="text-[10px] font-mono text-blue-600 block">
                          {customer.lastUpdatedAt || '2026-11-17'}
                        </span>
                        <p className="text-[11px] text-slate-700 line-clamp-2">
                          {customer.latestCustomerUpdate}
                        </p>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <span
                          className={`text-[11px] font-semibold block ${
                            customer.accountStatus === 'Credit Hold'
                              ? 'text-rose-700'
                              : customer.accountStatus === 'Watchlist'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {customer.accountStatus || 'Good Standing'}
                        </span>
                        {risk.requiresReVetting ? (
                          <span className="text-[10px] font-semibold text-rose-700 block">
                            Re-Vet: {risk.maxDaysOverdue > 61 ? `${risk.maxDaysOverdue}d overdue` : `${risk.latePaymentsCount} late pmts`}
                          </span>
                        ) : (
                          customer.vetting && (
                            <span className="text-[10px] font-mono text-slate-500">
                              Score {customer.vetting.creditScore} · {customer.vetting.riskTier}
                            </span>
                          )
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                        $
                        {(customer.monthlyBillingTotal ?? customer.balance).toLocaleString(undefined, {
                          minimumFractionDigits: 2
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Clean Light Enterprise Customer Dossier & Monthly Statement */}
        {selectedCustomer && (
          <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-200 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] font-mono font-semibold text-blue-600 block">
                  MONTHLY STATEMENT · {selectedCustomer.p21Id || selectedCustomer.id} · P21 Synced
                </span>
                <h2 className="text-sm font-display font-bold text-slate-900 mt-0.5 truncate">
                  {selectedCustomer.name}
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {selectedCustomer.billingAddress || selectedCustomer.address}
                </p>
              </div>
              <div className="text-right font-mono tabular-nums shrink-0">
                <span className="text-base font-bold text-emerald-700">
                  $
                  {(selectedCustomer.monthlyBillingTotal ?? selectedCustomer.balance).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2 }
                  )}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {selectedCustomer.paymentTerms || 'Net 30'} · {selectedCustomer.accountStatus}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Automated Payment-Risk Re-Vetting Alert (>=2 late payments OR >61d overdue) */}
              {selectedRisk?.requiresReVetting && (
                <div className="p-3.5 bg-rose-50 border-b border-rose-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="font-display font-bold text-rose-950 block">
                        Oversight Warning: Vetted Customer Payment Risk — Re-Vetting Recommended
                      </span>
                      <p className="text-[11px] text-rose-900 mt-0.5 leading-relaxed">
                        Customer was previously vetted ({selectedCustomer.vetting?.vettedAt || 'on file'}), but now has{' '}
                        <strong>{selectedRisk.triggerReason}</strong>. Hold net extensions or re-verify commercial credit via D&amp;B before issuing additional tool rentals.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openReVettingModal(selectedCustomer)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1.5 shadow-sm"
                    >
                      <UserCheck size={13} />
                      <span>Re-Run Vetting Process (Auto-Filled P21)</span>
                    </button>
                  </div>
                </div>
              )}

              {selectedCustomer.vetting && (
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-mono font-semibold text-blue-700">
                      Auto-Filled · Epicor P21 &amp; Vetting Dossier
                    </span>
                    <div className="flex items-center gap-2">
                      {!selectedRisk?.requiresReVetting && (
                        <>
                          <button
                            type="button"
                            onClick={() => simulateLatePaymentForTest(selectedCustomer.id, 65)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium"
                          >
                            Test +65d Overdue Alert
                          </button>
                          <button
                            type="button"
                            onClick={() => openReVettingModal(selectedCustomer)}
                            className="px-2 py-0.5 bg-white hover:bg-slate-50 text-blue-700 border border-slate-200 rounded text-[10px] font-semibold"
                          >
                            Re-Vet Account
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                    <div>
                      <span className="font-sans text-[10px] text-slate-500 block">Credit Score</span>
                      <strong className="text-slate-900">{selectedCustomer.vetting.creditScore}</strong>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-slate-500 block">On-Time %</span>
                      <strong className="text-emerald-700">
                        {selectedCustomer.vetting.onTimePaymentRate}%
                      </strong>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-slate-500 block">Late / Max OD</span>
                      <strong
                        className={
                          (selectedRisk?.maxDaysOverdue || 0) > 61 ||
                          (selectedRisk?.latePaymentsCount || 0) >= 2
                            ? 'text-rose-700'
                            : 'text-slate-900'
                        }
                      >
                        {selectedRisk?.latePaymentsCount || 0} · {selectedRisk?.maxDaysOverdue || 0}d
                      </strong>
                    </div>
                    <div>
                      <span className="font-sans text-[10px] text-slate-500 block">Credit Limit</span>
                      <strong className="text-slate-900">
                        ${selectedCustomer.vetting.approvedCreditLimit.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5">
                <div className="flex justify-between font-semibold text-slate-900 mb-1">
                  <span>Latest Customer Update (Synced to Statement)</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {selectedCustomer.lastUpdatedAt}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {selectedCustomer.latestCustomerUpdate}
                </p>
              </div>

              <form onSubmit={handlePostCustomerUpdate} className="p-3.5 bg-amber-50/30 border-y border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Post Customer Update & Monthly Adjustment
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800">
                    Needs Human Input
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      required
                      value={newUpdateText}
                      onChange={e => setNewUpdateText(e.target.value)}
                      placeholder="Enter return, shipment, or repair update note..."
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="number"
                      step="0.01"
                      value={newUpdateAmount}
                      onChange={e => setNewUpdateAmount(Number(e.target.value))}
                      placeholder="Delta ($)"
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg"
                >
                  Append Update to November Monthly Statement
                </button>
              </form>

              <div className="p-3.5 space-y-2.5">
                {invoices
                  .filter(inv => inv.customerId === selectedCustomer.id)
                  .map(inv => (
                    <div
                      key={inv.id}
                      className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                      <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-semibold text-blue-600 mr-2">
                            {inv.id}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Due {inv.dueDate} · {inv.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 mr-1">
                            ${inv.amount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => downloadStatementCsv(inv)}
                            title="Export Statement CSV"
                            className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600"
                          >
                            <Download size={12} />
                          </button>
                          {inv.status !== 'Paid' && (
                            <button
                              onClick={() => updateInvoiceStatus(inv.id, 'Paid')}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold rounded"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="p-2.5 divide-y divide-slate-100 font-mono tabular-nums text-[11px]">
                        {(inv.lineItems || []).map((li, i) => (
                          <div key={i} className="py-1 flex justify-between gap-2">
                            <span className="font-sans text-slate-700">{li.description}</span>
                            <span
                              className={`font-semibold shrink-0 ${
                                li.amount < 0 ? 'text-teal-700' : 'text-slate-900'
                              }`}
                            >
                              {li.amount < 0
                                ? `-$${Math.abs(li.amount).toFixed(2)}`
                                : `$${li.amount.toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consolidated Monthly Billing Statements Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-emerald-600" />
            <h2 className="text-xs font-display font-bold text-slate-900">
              Consolidated November 2026 Monthly Billing Statements ({filteredInvoices.length})
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {(['ALL', 'Unpaid', 'Overdue', 'Paid'] as const).map(st => (
              <button
                key={st}
                onClick={() => setInvoiceStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  invoiceStatusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-medium text-slate-500">
              <tr>
                <th className="py-2 px-3.5">Statement ID & Contract</th>
                <th className="py-2 px-2.5">Customer & Month</th>
                <th className="py-2 px-2.5">Latest Update Included on Statement</th>
                <th className="py-2 px-2.5">Status & Due</th>
                <th className="py-2 px-2.5 text-right">Statement Total</th>
                <th className="py-2 px-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => (
                <tr
                  key={inv.id}
                  onClick={() => inv.customerId && setSelectedCustomerId(inv.customerId)}
                  className={`cursor-pointer transition-colors ${
                    inv.customerId === selectedCustomerId ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2 px-3.5 font-mono">
                    <span className="font-semibold text-blue-600 block">{inv.id}</span>
                    <span className="text-[11px] text-slate-500">Contract {inv.contractId}</span>
                  </td>
                  <td className="py-2 px-2.5">
                    <span className="font-semibold text-slate-900 block">{inv.customerName}</span>
                    <span className="text-[11px] text-slate-500">
                      {inv.billingMonth || 'November 2026'} · {(inv.lineItems || []).length} lines
                    </span>
                  </td>
                  <td className="py-2 px-2.5 max-w-md">
                    <p className="text-[11px] text-slate-700 line-clamp-2">
                      {inv.latestCustomerUpdate || inv.description}
                    </p>
                  </td>
                  <td className="py-2 px-2.5">
                    <span
                      className={`text-[11px] font-semibold block ${
                        inv.status === 'Paid'
                          ? 'text-emerald-700'
                          : inv.status === 'Overdue'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">Due {inv.dueDate}</span>
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                    ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          downloadStatementCsv(inv);
                        }}
                        className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                        title="Export CSV"
                      >
                        <Download size={12} />
                      </button>
                      {inv.status !== 'Paid' ? (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            updateInvoiceStatus(inv.id, 'Paid');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 size={12} />
                          Settled
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CustomerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onCustomerOnboarded={cust => setSelectedCustomerId(cust.id)}
      />
    </div>
  );
};

export default Customers;