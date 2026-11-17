
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, Activity, PackageSearch, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GoogleGenAI } from '@google/genai';

const AIInsights: React.FC = () => {
  const { inventory, contracts } = useData();
  const [isThinking, setIsThinking] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const runAIAudit = async () => {
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = {
        inventory: inventory.map(i => ({ name: i.name, status: i.status, category: i.category })),
        contractsCount: contracts.length,
        missingCount: inventory.filter(i => i.status === 'Missing').length,
        damagedCount: inventory.filter(i => i.status === 'Damaged').length
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Analyze this rental tool data: ${JSON.stringify(context)}. 
        Identify immediate risks (shortages due to missing/damaged items), 
        recommend reorder quantities for specific categories, 
        and provide a tool health score (0-100). Be professional and data-driven.`
      });

      setReport(response.text || "Audit failed to generate.");
    } catch (e) {
      console.error(e);
      setReport("AI Reasoning failed. Check API connectivity.");
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
              <BrainCircuit size={28} />
            </div>
            Tool Intelligence
          </h2>
          <p className="text-slate-500 mt-1">Predictive analytics and inventory health auditing powered by Gemini AI.</p>
        </div>
        <button 
          onClick={runAIAudit}
          disabled={isThinking}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
        >
          {isThinking ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {isThinking ? 'Analyzing Tool...' : 'Run Intelligence Audit'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Stats */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                   <AlertTriangle size={24} />
                </div>
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset Shrinkage</h4>
                   <p className="text-2xl font-black text-slate-900">
                     {Math.round((inventory.filter(i => i.status === 'Missing').length / inventory.length) * 100)}%
                   </p>
                </div>
             </div>
             <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full transition-all duration-1000" 
                  style={{ width: `${(inventory.filter(i => i.status === 'Missing').length / inventory.length) * 100}%` }}
                ></div>
             </div>
             <p className="text-[10px] text-slate-400 mt-2 font-medium">Assets currently flagged as 'Missing' in ReturnDesk.</p>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                   <Activity size={24} />
                </div>
                <div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Maintenance Load</h4>
                   <p className="text-2xl font-black text-slate-900">
                     {inventory.filter(i => i.status === 'Damaged' || i.status === 'Maintenance').length} Units
                   </p>
                </div>
             </div>
             <div className="flex gap-2">
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">Repair Pending</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">3 critical</span>
             </div>
           </div>
        </div>

        {/* AI Report Output */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden min-h-[400px]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <PackageSearch size={18} className="text-purple-600" />
                    Strategic Audit Report
                 </h3>
                 {report && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Live Analysis Ready</span>}
              </div>
              
              <div className="flex-1 p-8 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]">
                {isThinking ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                     <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                     <p className="text-slate-500 font-medium animate-pulse italic">Gemini is processing tool health metrics...</p>
                  </div>
                ) : report ? (
                  <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">
                    {report}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                       <BrainCircuit size={48} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">No Active Intelligence Audit</h4>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">
                        Initialize a scan to analyze shortages, predict reorder requirements, and generate high-level executive insights.
                      </p>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
