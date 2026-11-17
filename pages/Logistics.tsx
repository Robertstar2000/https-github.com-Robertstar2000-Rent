import React from 'react';
import { 
  Truck, MapPin, Clock, CheckCircle, AlertTriangle, ChevronRight, Navigation, Check, Layers
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const Logistics: React.FC = () => {
  const { stops, updateStopStatus } = useData();

  const handleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStopStatus(id, 'Completed');
  };

  const handleStart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStopStatus(id, 'In Progress');
  };

  // Helper to determine task completion percentage for the progress bar
  const getCompletionPercentage = (status: string) => {
    switch (status) {
      case 'Completed': return 100;
      case 'In Progress': return 45;
      case 'Pending': return 10;
      default: return 0;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Logistics & Dispatch</h2>
          <p className="text-slate-500">Route optimization and strategic mobilization tracking.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 border border-slate-200 bg-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Optimize</button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95">Assign Manifest</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 h-[calc(100vh-180px)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Manifest</h3>
               <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100">{stops.length} STOPS</span>
            </div>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {stops.map((stop) => (
                <div 
                  key={stop.id} 
                  className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                    stop.status === 'Completed' ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/5'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                      stop.type === 'Delivery' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-orange-500 text-white shadow-lg shadow-orange-900/20'
                    }`}>
                      {stop.type}
                    </span>
                    {stop.status === 'Completed' ? (
                      <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1 uppercase tracking-tighter bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100"><Check size={10} /> Success</span>
                    ) : (
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                        stop.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'text-slate-400'
                      }`}>
                        {stop.priority}
                      </span>
                    )}
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{stop.customerName}</h4>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 font-bold uppercase truncate">
                      <MapPin size={12} className="shrink-0 text-blue-500" />
                      {stop.address}
                    </div>
                  </div>

                  {/* Visual Progress Section */}
                  <div className="mt-5 space-y-2 relative z-10">
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                       <span>Task Completion</span>
                       <span>{getCompletionPercentage(stop.status)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                       <div 
                         className={`h-full transition-all duration-700 ${stop.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-600'}`} 
                         style={{ width: `${getCompletionPercentage(stop.status)}%` }}
                       ></div>
                    </div>
                  </div>
                  
                  {stop.status !== 'Completed' && (
                    <div className="mt-5 flex items-center justify-between relative z-10 pt-3 border-t border-slate-50">
                      {stop.status === 'Pending' ? (
                        <button 
                          onClick={(e) => handleStart(stop.id, e)}
                          className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Initiate mobilization
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => handleComplete(stop.id, e)}
                          className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest active:scale-95 transition-all"
                        >
                          Finalize fulfillment
                        </button>
                      )}
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 h-[550px] relative overflow-hidden shadow-2xl bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:30px_30px]">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/grid.png')]"></div>
            
            {/* Live Units Indicator */}
            <div className="absolute top-10 left-10 p-6 bg-slate-800/80 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl w-72">
              <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em] mb-4">Active Status</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-2xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[11px] font-bold text-slate-200">Truck #12 — Mike R.</span>
                  </div>
                  <Navigation size={14} className="text-blue-500 rotate-45" />
                </div>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
               <div className="w-[400px] h-[400px] bg-blue-600/10 rounded-full animate-ping absolute"></div>
               <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl flex items-center justify-center border-4 border-slate-900 relative">
                  <Truck size={32} />
               </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-3">
               <Layers size={24} className="text-blue-600" />
               Logistics Performance Ledger
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-[1.5rem] border border-blue-100 shadow-sm">
                  <Truck size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</p>
                  <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">75% <span className="text-xs text-emerald-500 font-bold ml-1">↑ 5%</span></p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.5rem] border border-orange-100 shadow-sm">
                  <Clock size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On-Time mobilization</p>
                  <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">92% <span className="text-xs text-rose-500 font-bold ml-1">↓ 2%</span></p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed Fulfilment</p>
                  <p className="text-3xl font-black text-slate-900 mt-1 tracking-tighter">{stops.filter(s => s.status === 'Completed').length} stops</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logistics;