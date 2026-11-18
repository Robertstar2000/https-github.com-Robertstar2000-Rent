import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Download } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ItemStatus } from '../types';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { inventory, contracts, customers, workOrders, replacementOrders, notify } = useData();
  const [timeframe, setTimeframe] = useState<'6M' | '3M'>('6M');

  const totalYtdRev = contracts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const avgOrder = totalYtdRev / (contracts.length || 1);
  const totalInterest = contracts.reduce((acc, c) => acc + (c.accruedInterest || 0), 0);
  const totalRepairAndReplace =
    workOrders.reduce((s, w) => s + w.totalCost, 0) +
    replacementOrders.reduce((s, r) => s + r.totalBilledToCustomer, 0);

  const categoryCounts = inventory.reduce((acc: Record<string, number>, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const currentUtilizationRate = Math.round(
    (inventory.filter(i => i.status === ItemStatus.RENTED).length / (inventory.length || 1)) * 100
  );

  const fullHistory = [
    { month: 'Jun', rate: 68, revenue: 14200 },
    { month: 'Jul', rate: 72, revenue: 16800 },
    { month: 'Aug', rate: 75, revenue: 18400 },
    { month: 'Sep', rate: 82, revenue: 21100 },
    { month: 'Oct', rate: 88, revenue: 23900 },
    { month: 'Nov', rate: currentUtilizationRate, revenue: Math.round(totalYtdRev) }
  ];

  const utilizationHistory = timeframe === '3M' ? fullHistory.slice(-3) : fullHistory;
  const COLORS = ['#2563eb', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  const exportAnalyticsCsv = () => {
    const header = [
      'Customer',
      'P21 ID',
      'Standing',
      'Active Contracts',
      'Monthly Statement ($)',
      'On-Time %',
      'Avg DSO (d)'
    ].join(',');

    const rows = customers.map(c => {
      const custContracts = contracts.filter(ct => ct.customerId === c.id).length;
      return [
        `"${c.name}"`,
        c.p21Id || c.id,
        c.accountStatus || 'Good Standing',
        custContracts,
        (c.monthlyBillingTotal ?? c.balance).toFixed(2),
        c.vetting?.onTimePaymentRate ?? 96,
        c.vetting?.dsoDays ?? 28
      ].join(',');
    });

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tallmanrent-analytics-nov-2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify('Analytics Exported', 'Downloaded tallmanrent-analytics-nov-2026.csv.');
  };

  return (
    <div className="space-y-3">
      {/* Unified Header + 4-KPI Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Tool Utilization, Monthly Revenue & Exception Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Live metrics across {inventory.length} serialized tools, {contracts.length} contracts, and {customers.length} monthly customer statements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {(['3M', '6M'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md font-medium ${
                    timeframe === tf ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              onClick={exportAnalyticsCsv}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 font-mono tabular-nums">
          <div className="p-3.5">
            <p className="font-sans text-[11px] font-medium text-slate-500">
              Active Contract Volume
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              ${totalYtdRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3.5">
            <p className="font-sans text-[11px] font-medium text-slate-500">
              Avg. Contract Value
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              ${Math.round(avgOrder).toLocaleString()}
            </h3>
          </div>
          <div className="p-3.5">
            <p className="font-sans text-[11px] font-medium text-slate-500">
              18% APR Interest Accrued
            </p>
            <h3 className="text-lg font-bold text-amber-700 mt-0.5">
              ${totalInterest.toFixed(2)}
            </h3>
          </div>
          <div className="p-3.5">
            <p className="font-sans text-[11px] font-medium text-slate-500">
              Repair & Replacement Recovery
            </p>
            <h3 className="text-lg font-bold text-blue-700 mt-0.5">
              ${totalRepairAndReplace.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts & Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-display font-bold text-slate-900">
              Tool Utilization Trend ({timeframe})
            </h3>
            <span className="text-xs font-mono font-semibold text-blue-600">
              Current: {currentUtilizationRate}%
            </span>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  name="Utilization %"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="#dbeafe"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <h3 className="text-xs font-display font-bold text-slate-900 mb-3">
            Tool Inventory Distribution
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="42%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2.5">
          <h3 className="text-xs font-display font-bold text-slate-900">Category Share</h3>
          {categoryData.map((cat, idx) => (
            <div key={cat.name} className="space-y-1">
              <div className="flex justify-between text-[11px] font-medium text-slate-700">
                <span className="truncate pr-2">{cat.name}</span>
                <span className="font-mono shrink-0">{cat.value} units</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(cat.value / (inventory.length || 1)) * 100}%`,
                    backgroundColor: COLORS[idx % COLORS.length]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer Revenue & Exception Recovery Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-display font-bold text-slate-900">
            Customer Account Revenue & Monthly Exposure Breakdown
          </h3>
          <span className="text-[11px] text-slate-500">Click any row to open Monthly Statement</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-medium text-slate-500">
              <tr>
                <th className="py-2 px-3.5">Customer Account</th>
                <th className="py-2 px-2.5">P21 ID & Standing</th>
                <th className="py-2 px-2.5 text-right">Contracts</th>
                <th className="py-2 px-2.5 text-right">Credit Score / DSO</th>
                <th className="py-2 px-3.5 text-right">Nov Monthly Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(c => {
                const custContracts = contracts.filter(ct => ct.customerId === c.id);
                return (
                  <tr
                    key={c.id}
                    onClick={() => navigate('/customers', { state: { customerId: c.id } })}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-3.5 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-2 px-2.5 text-slate-600">
                      <span className="font-mono text-[11px] text-slate-500 mr-2">
                        {c.p21Id || c.id}
                      </span>
                      <span
                        className={`font-semibold ${
                          c.accountStatus === 'Credit Hold'
                            ? 'text-rose-700'
                            : c.accountStatus === 'Watchlist'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {c.accountStatus || 'Good Standing'}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right font-mono">{custContracts.length}</td>
                    <td className="py-2 px-2.5 text-right font-mono text-slate-600">
                      {c.vetting?.creditScore ?? 780} · {c.vetting?.dsoDays ?? 28}d
                    </td>
                    <td className="py-2 px-3.5 text-right font-mono tabular-nums font-semibold text-slate-900">
                      $
                      {(c.monthlyBillingTotal ?? c.balance).toLocaleString(undefined, {
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
    </div>
  );
};

export default Reports;
