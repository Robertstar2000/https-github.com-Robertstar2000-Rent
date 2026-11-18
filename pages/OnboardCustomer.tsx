import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, FilePlus2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CustomerOnboardingWorkbench from '../components/CustomerOnboardingWorkbench';
import { Customer } from '../types';

const OnboardCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { customers, disapprovedApplications } = useData();
  const [logFilter, setLogFilter] = useState<'ALL' | 'Approved' | 'Disapproved'>('ALL');

  const combinedLog = useMemo(() => {
    const approvedRows = customers.map(c => ({
      ...c,
      decision: 'Approved' as const
    }));
    const disapprovedRows = disapprovedApplications.map(c => ({
      ...c,
      decision: 'Disapproved' as const
    }));
    const all = [...disapprovedRows, ...approvedRows];
    if (logFilter === 'ALL') return all;
    return all.filter(r => r.decision === logFilter);
  }, [customers, disapprovedApplications, logFilter]);

  const approvedCount = customers.length;
  const watchlistCount = customers.filter(
    c => c.accountStatus === 'Watchlist' || c.accountStatus === 'Credit Hold'
  ).length;
  const avgCreditScore = useMemo(() => {
    const withVetting = customers.filter(c => c.vetting?.creditScore);
    if (withVetting.length === 0) return 760;
    return Math.round(
      withVetting.reduce((s, c) => s + (c.vetting?.creditScore || 0), 0) / withVetting.length
    );
  }, [customers]);

  return (
    <div className="space-y-3">
      {/* Header & 4-KPI Onboarding Summary Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <UserPlus size={16} />
            </div>
            <div>
              <h1 className="text-[15px] font-display font-bold text-slate-900">
                Onboard New Rental Customer — D&B, Web Research & Credit Vetting
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Collect customer profile, contacts & addresses, automatically research D&B and the web, and approve or disapprove accounts for Epicor P21.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/customers')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Customers & Billing</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 font-mono tabular-nums">
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Approved P21 Accounts
            </span>
            <span className="text-lg font-bold text-emerald-700">{approvedCount}</span>
          </div>
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Avg Commercial Credit Score
            </span>
            <span className="text-lg font-bold text-slate-900">{avgCreditScore} / 850</span>
          </div>
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Watchlist / Credit Hold
            </span>
            <span className="text-lg font-bold text-amber-700">{watchlistCount}</span>
          </div>
          <div className="p-3">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Disapproved Applications
            </span>
            <span className="text-lg font-bold text-rose-700">
              {disapprovedApplications.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Customer Intake + D&B/Web Research Workbench */}
      <CustomerOnboardingWorkbench />

      {/* Onboarding & Vetting Decision Log (Approved & Disapproved) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-display font-bold text-slate-900">
              Customer Vetting & Onboarding Decisions ({combinedLog.length})
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {(['ALL', 'Approved', 'Disapproved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setLogFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  logFilter === tab
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'ALL' ? 'All Decisions' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-medium text-slate-500">
              <tr>
                <th className="py-2 px-3.5">Company & P21 ID</th>
                <th className="py-2 px-2.5">Primary Contact / Phone / Email</th>
                <th className="py-2 px-2.5">D&B PAYDEX / Credit</th>
                <th className="py-2 px-2.5">Decision & Risk</th>
                <th className="py-2 px-2.5 text-right">Approved Limit</th>
                <th className="py-2 px-3.5 text-right">Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {combinedLog.map((cust: Customer & { decision: 'Approved' | 'Disapproved' }) => (
                <tr key={cust.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3.5">
                    <span className="font-semibold text-slate-900 block">{cust.name}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {cust.p21Id || cust.id} · {cust.paymentTerms || 'Net 30'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="text-slate-800 font-medium block">
                      {cust.contactPerson || 'Operations Contact'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {cust.phone} · {cust.email}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 font-mono tabular-nums">
                    {cust.vetting ? (
                      <>
                        <span className="font-semibold text-slate-900 block">
                          Score {cust.vetting.creditScore} · PAYDEX {cust.vetting.dnbPaydexScore ?? '—'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {cust.vetting.dsoDays}d DSO · {cust.vetting.researchSource || 'P21 Verified'}
                        </span>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500">Legacy P21 Verified</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span
                      className={`text-[11px] font-semibold block ${
                        cust.decision === 'Approved' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {cust.decision}
                      {cust.vetting?.riskTier ? ` · ${cust.vetting.riskTier}` : ''}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                      {cust.decision === 'Disapproved'
                        ? cust.vetting?.disapprovalReason || cust.latestCustomerUpdate
                        : cust.accountStatus || 'Good Standing'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {cust.decision === 'Approved'
                      ? `$${(cust.creditLimit ?? cust.vetting?.approvedCreditLimit ?? 0).toLocaleString()}`
                      : '$0'}
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    {cust.decision === 'Approved' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => navigate('/new-order')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-md inline-flex items-center gap-1"
                        >
                          <FilePlus2 size={11} />
                          <span>New Order</span>
                        </button>
                        <button
                          onClick={() => navigate('/customers', { state: { customerId: cust.id } })}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium rounded-md"
                        >
                          Ledger
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-rose-700">Blocked from P21</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OnboardCustomer;
