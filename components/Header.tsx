import React, { useState } from 'react';
import { Bell, Search, User, ChevronDown, HelpCircle, X, FileText, Settings, Database, Info, Terminal, ShieldCheck, Mail, Send } from 'lucide-react';

const Header: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const helpContent = [
    {
      title: "1. Operational Instructions",
      items: [
        { label: "Dashboard (Day-at-a-Glance)", desc: "Monitor real-time revenue, active contracts, and asset utilization. View recent activities and pending deliveries to manage daily workflows." },
        { label: "Inventory Management", desc: "Track and manage your rental tool inventory. Register new equipment with serial numbers and replacement costs. Tracking updates automatically based on contract status." },
        { label: "Contracts & Quotes", desc: "Create professional quotes for utility partners. Use ReturnDesk™ for intelligent check-ins, damage flagging, and missing item reporting." }
      ]
    },
    {
      title: "2. Complete Feature List",
      items: [
        { label: "Real-Time Inventory", desc: "Automated status tracking across Available, Rented, Maintenance, Missing, and Damaged states." },
        { label: "Scan360 Damage Detection", desc: "Gemini AI-powered visual analysis of returned equipment for structural integrity and condition documentation." },
        { label: "AI Strategic Audit", desc: "Predictive analytics and executive-level reporting on tool health scores and procurement recommendations." },
        { label: "Logistics Manifest", desc: "Real-time dispatching with route prioritization for field deliveries and job-site pickups." }
      ]
    },
    {
      title: "3. Epicor P21 Interface",
      items: [
        { label: "Connection Setup", desc: "Configure API endpoints, Client IDs, and Secrets in the Admin Console. Set sync intervals and bidirectional parity." },
        { label: "Manual Synchronization", desc: "Trigger immediate ERP updates for inventory parity and customer billing records." },
        { label: "Alert Automation", desc: "Configure SendGrid or SMTP credentials to dispatch automated overdue return and unpaid invoice notices." }
      ]
    }
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="relative w-96">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search items, contracts, customers..."
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg text-sm transition-all shadow-inner"
        />
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors flex items-center gap-2 px-3 border border-transparent hover:border-slate-200"
        >
          <HelpCircle size={20} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest hidden lg:block">Help Manual</span>
        </button>

        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <button className="flex items-center gap-3 pl-2 pr-1 py-1 hover:bg-slate-50 rounded-lg transition-colors">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">Alex Thompson</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-tighter">Ops Commander</p>
          </div>
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 shadow-sm">
            <User size={20} />
          </div>
          <ChevronDown size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsHelpOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">TallmanRent Operations Guide</h3>
                    <p className="text-sm text-slate-400 font-medium">System Version 2.4 - Enterprise Edition</p>
                  </div>
               </div>
               <button onClick={() => setIsHelpOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} className="text-white" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 space-y-12 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
               {helpContent.map((section, idx) => (
                  <div key={idx} className="space-y-6">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-4">
                       <span className="w-12 h-0.5 bg-blue-600"></span>
                       {section.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                       {section.items.map((item, i) => (
                          <div key={i} className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex gap-6">
                             <div className="p-4 bg-slate-50 text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-2xl transition-all h-fit">
                                {idx === 0 ? <Terminal size={20} /> : idx === 1 ? <ShieldCheck size={20} /> : <Database size={20} />}
                             </div>
                             <div>
                                <span className="font-black text-slate-900 uppercase tracking-tight text-sm mb-1 block">{item.label}</span>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                  </div>
               ))}

               <div className="p-8 bg-slate-100 rounded-[2.5rem] border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Info size={20} className="text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Administrator Protocol</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Critical system alerts are dispatched via the P21 Bridge Log. Communications must be verified using the automated sweep tool in the Admin Console. Contact IT Infrastructure for core API credential rotation or project-level data archival.
                  </p>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-center">
               <button 
                onClick={() => setIsHelpOpen(false)}
                className="px-12 py-4 bg-slate-900 text-white font-black uppercase text-sm tracking-[0.2em] rounded-2xl hover:bg-black transition-all shadow-2xl active:scale-95"
               >
                 Acknowledge & Close
               </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;