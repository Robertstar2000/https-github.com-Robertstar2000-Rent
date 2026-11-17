import React, { useState } from 'react';
import { 
  TrendingUp, FileText, Activity, Clock, ArrowUpRight, ArrowDownRight, 
  PackageCheck, Truck, X, DollarSign, ChevronRight, BarChart3, 
  PieChart as PieIcon, ListFilter, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { useData } from '../contexts/DataContext';
import { ContractStatus, ItemStatus } from '../types';

type DetailType = 'revenue' | 'contracts' | 'utilization' | 'logistics' | null;

const Dashboard: React.FC = () => {
  const { contracts, inventory: items, stops } = useData();
  const [activeDetail, setActiveDetail] = useState<DetailType>(null);
  
  const totalRevenue = contracts.reduce((acc, c) => acc + c.totalAmount, 0);
  const activeContractsList = contracts.filter(c => c.status === ContractStatus.ACTIVE);
  const activeContractsCount = activeContractsList.length;
  const utilization = Math.round((items.filter(i => i.status === ItemStatus.RENTED).length / items.length) * 100) || 0;
  const pendingStops = stops.filter(s => s.status !== 'Completed');

  const stats = [
    { id: 'revenue' as const, label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+12.5%', isUp: true, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'contracts' as const, label: 'Active Contracts', value: activeContractsCount.toString(), change: '+3', isUp: true, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'utilization' as const, label: 'Asset Utilization', value: `${utilization}%`, change: '-2.1%', isUp: false, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'logistics' as const, label: 'Pending Deliveries', value: pendingStops.length.toString(), change: '5 today', isUp: true, icon: Truck, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const chartData = [
    { name: 'Mon', revenue: 1200 },
    { name: 'Tue', revenue: 2100 },
    { name: 'Wed', revenue: 1800 },
    { name: 'Thu', revenue: 2800 },
    { name: 'Fri', revenue: 3500 },
    { name: 'Sat', revenue: 2400 },
    { name: 'Sun', revenue: 1100 },
  ];

  const COLORS = ['#2563eb', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

  const renderDetail = () => {
    switch (activeDetail) {
      case 'revenue':
        return (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-emerald-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Revenue Contribution Audit</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Master Ledger Drill-down</p>
                </div>
              </div>
              <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">High-Value Contracts</h4>
                <div className="space-y-3">
                  {[...contracts].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all group">
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{c.customerName}</p>
                        <p className="text-[10px] text-slate-500 font-bold">INV: {c.id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">${c.totalAmount.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">{c.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                <BarChart3 size={40} className="text-slate-200 mb-2" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue by Asset Category</p>
                <div className="w-full h-full p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                      <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
      case 'contracts':
        return (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-sm">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Active Operational Projects</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{activeContractsCount} LIVE AGREEMENTS</p>
                </div>
              </div>
              <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeContractsList.map(c => (
                  <div key={c.id} className="p-5 border border-slate-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-3">
                       <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{c.id}</span>
                       <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Clock size={10}/> {c.endDate}</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-4">{c.customerName}</h4>
                    <div className="flex items-center justify-between">
                       <div className="flex -space-x-2">
                         {c.items.slice(0, 3).map((_, i) => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                             {i+1}
                           </div>
                         ))}
                         {c.items.length > 3 && <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600">+{c.items.length - 3}</div>}
                       </div>
                       <p className="text-sm font-black text-slate-700">${c.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'utilization':
        const statusCounts = [
          { name: 'Rented', value: items.filter(i => i.status === ItemStatus.RENTED).length },
          { name: 'Available', value: items.filter(i => i.status === ItemStatus.AVAILABLE).length },
          { name: 'Maintenance', value: items.filter(i => i.status === ItemStatus.MAINTENANCE).length },
          { name: 'Other', value: items.filter(i => ![ItemStatus.RENTED, ItemStatus.AVAILABLE, ItemStatus.MAINTENANCE].includes(i.status)).length },
        ];
        return (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-purple-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shadow-sm">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Utilization Dynamics</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{utilization}% OF AGGREGATE CAPACITY</p>
                </div>
              </div>
              <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
               <div className="lg:col-span-1 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusCounts}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="lg:col-span-2 space-y-6 flex flex-col justify-center">
                  {statusCounts.map((status, idx) => (
                    <div key={status.name} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          <span className="text-sm font-black text-slate-700 uppercase tracking-tight">{status.name}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-sm font-black text-slate-900">{status.value} Units</span>
                          <span className="text-xs font-bold text-slate-400 w-12 text-right">{Math.round((status.value / items.length) * 100)}%</span>
                       </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory</p>
                     <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">{items.length} Assets</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case 'logistics':
        return (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-orange-50/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shadow-sm">
                  <Truck size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Logistic Dispatch Status</h3>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{pendingStops.length} PENDING FIELD EVENTS</p>
                </div>
              </div>
              <button onClick={() => setActiveDetail(null)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>
            <div className="p-8">
               <div className="space-y-3">
                  {pendingStops.map(stop => (
                    <div key={stop.id} className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${stop.type === 'Delivery' ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                             <Truck size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{stop.customerName}</p>
                             <p className="text-[10px] text-slate-500 font-bold truncate max-w-[200px]">{stop.address}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                               stop.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                             }`}>
                                {stop.priority} Priority
                             </span>
                             <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">{stop.status}</p>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 font-medium">Strategic oversight for TallmanRent operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Real-time Data Sync Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <button 
            key={stat.label} 
            onClick={() => setActiveDetail(activeDetail === stat.id ? null : stat.id)}
            className={`text-left p-6 rounded-[2rem] border transition-all hover:shadow-2xl hover:scale-[1.03] group relative overflow-hidden ${
              activeDetail === stat.id ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.05]' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-all duration-700 group-hover:scale-150 opacity-10 ${
              activeDetail === stat.id ? 'bg-white' : stat.bg
            }`}></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className={`p-3 rounded-2xl shadow-sm transition-colors ${
                activeDetail === stat.id ? 'bg-white/10 text-white' : `${stat.bg} ${stat.color}`
              }`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                activeDetail === stat.id ? 'bg-white/10 text-white' : (stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')
              }`}>
                {stat.change}
                {stat.isUp ? <ArrowUpRight size={14} className="ml-1" /> : <ArrowDownRight size={14} className="ml-1" />}
              </div>
            </div>
            
            <div className="relative z-10">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 transition-colors ${
                activeDetail === stat.id ? 'text-slate-400' : 'text-slate-400'
              }`}>{stat.label}</p>
              <h3 className="text-3xl font-black tracking-tighter group-hover:translate-x-1 transition-transform">{stat.value}</h3>
            </div>

            {activeDetail === stat.id && (
              <div className="absolute bottom-4 right-6 animate-pulse">
                <ChevronRight size={20} className="text-slate-500" />
              </div>
            )}
          </button>
        ))}
      </div>

      {activeDetail && renderDetail()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lifecycle Revenue Projection</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Rolling 7-day performance metrics</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
               <button className="px-4 py-1.5 bg-white text-[10px] font-black uppercase tracking-widest text-slate-900 rounded-lg shadow-sm border border-slate-200">Weekly</button>
               <button className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Monthly</button>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }}
                  cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
          <h3 className="text-lg font-black text-white mb-8 uppercase tracking-tight flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <ListFilter size={18} className="text-white" />
             </div>
             Activity Log
          </h3>
          <div className="space-y-6 flex-1 overflow-auto pr-2 custom-scrollbar">
            {[...contracts].reverse().slice(0, 6).map((contract) => (
              <div key={contract.id} className="flex gap-4 group cursor-pointer">
                <div className={`mt-1 p-2.5 rounded-2xl h-fit border transition-all group-hover:scale-110 shadow-lg ${
                  contract.status === ContractStatus.ACTIVE ? 'bg-blue-500 border-blue-400 text-white' :
                  contract.status === ContractStatus.RESERVATION ? 'bg-orange-500 border-orange-400 text-white' :
                  'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {contract.status === ContractStatus.RESERVATION ? <Clock size={16} /> : <PackageCheck size={16} />}
                </div>
                <div className="flex-1 border-b border-white/5 pb-4">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-black text-white uppercase tracking-tight">
                      {contract.status === ContractStatus.RESERVATION ? 'New Reservation' : 'Contract Activated'}
                    </p>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Just Now</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest">{contract.customerName}</p>
                  <div className="mt-3 flex items-center justify-between">
                     <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-blue-400 font-black border border-white/5 uppercase">{contract.id}</span>
                     <ArrowRight size={14} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;