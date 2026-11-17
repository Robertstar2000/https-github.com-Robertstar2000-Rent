
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Package, DollarSign, Download, Filter, Activity } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ItemStatus } from '../types';

const Reports: React.FC = () => {
  const { inventory, contracts, customers } = useData();

  // Derived metrics from "database"
  const totalYtdRev = contracts.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const avgOrder = totalYtdRev / (contracts.length || 1);
  const totalCustomers = customers.length;
  
  const categoryCounts = inventory.reduce((acc: any, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat]
  }));

  const currentUtilizationRate = Math.round((inventory.filter(i => i.status === ItemStatus.RENTED).length / inventory.length) * 100);

  // Mocked 6-month historical utilization data
  const utilizationHistory = [
    { month: 'Jan', rate: 68 },
    { month: 'Feb', rate: 72 },
    { month: 'Mar', rate: 75 },
    { month: 'Apr', rate: 82 },
    { month: 'May', rate: 88 },
    { month: 'Jun', rate: currentUtilizationRate },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Business Intelligence</h2>
          <p className="text-slate-500">Comprehensive analytics derived from live rental tool data.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all text-sm">
            <Filter size={18} />
            Parameters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md text-sm">
            <Download size={18} />
            Export BI Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'YTD Revenue', value: `$${totalYtdRev.toLocaleString()}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg. Order Size', value: `$${Math.round(avgOrder).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Assets', value: inventory.length.toString(), icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'New Customers', value: totalCustomers.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color} w-fit mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Utilization Trend Chart - New Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
               <Activity size={20} />
             </div>
             <h3 className="text-lg font-bold text-slate-900">Historical Tool Utilization (6 Months)</h3>
          </div>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-100">
             Target: 85%
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={utilizationHistory}>
              <defs>
                <linearGradient id="colorUtil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Area type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorUtil)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Inventory Distribution</h3>
          <div className="h-80 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Asset Health Snapshot</h3>
          <div className="space-y-4">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-600 uppercase">
                  <span>{cat.name}</span>
                  <span>{cat.value} Units</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${(cat.value / inventory.length) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
