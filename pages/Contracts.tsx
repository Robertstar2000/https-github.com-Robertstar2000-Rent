import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Calendar, ArrowRight, ChevronRight, MoreHorizontal, X, User, Package, CreditCard, Receipt, CheckCircle, Clock, RotateCcw, AlertCircle, ShieldAlert, Mail, Send, PenTool, CheckCircle2, ShieldCheck, FileSignature, Info, RefreshCw, Edit3, Save, RotateCw, Ruler, Hash, Weight, Activity
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ContractStatus, Contract, ReturnAction } from '../types';

const Contracts: React.FC = () => {
  const { contracts, customers, inventory: items, invoices, addContract, updateContract, updateContractStatus, addInvoice, processReturn } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [returnActions, setReturnActions] = useState<ReturnAction[]>([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Contract>>({});
  
  const [renewalDays, setRenewalDays] = useState(30);
  const [isRenewing, setIsRenewing] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '', startDate: '', endDate: '', items: [] as string[], status: ContractStatus.QUOTE, notes: '', taxRate: 0.08
  });

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.ACTIVE: return 'text-blue-700 bg-blue-50 border-blue-100';
      case ContractStatus.RESERVATION: return 'text-orange-700 bg-orange-50 border-orange-100';
      case ContractStatus.COMPLETED: return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case ContractStatus.OVERDUE: return 'text-rose-700 bg-rose-50 border-rose-100';
      case ContractStatus.PARTIAL_RETURN: return 'text-purple-700 bg-purple-50 border-purple-100';
      case ContractStatus.QUOTE: return 'text-slate-700 bg-slate-100 border-slate-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-100';
    }
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const getTermProgress = (start: string, end: string) => {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const now = Date.now();

    if (now < s) return 0;
    if (now > e) return 100;

    const total = e - s;
    const elapsed = now - s;
    return Math.round((elapsed / total) * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    const selectedItemsList = items.filter(i => formData.items.includes(i.id));
    const subtotalPerDay = selectedItemsList.reduce((acc, i) => acc + i.rate, 0);
    const totalDays = calculateDays(formData.startDate, formData.endDate);
    const total = subtotalPerDay * totalDays * (1 + formData.taxRate);

    addContract({
      customerId: formData.customerId,
      customerName: customer?.name || 'Unknown',
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalAmount: total,
      status: formData.status,
      items: formData.items,
      isSigned: false,
      termsAccepted: true,
      notes: formData.notes,
      taxRate: formData.taxRate
    });
    setFormData({ customerId: '', startDate: '', endDate: '', items: [], status: ContractStatus.QUOTE, notes: '', taxRate: 0.08 });
    setIsModalOpen(false);
  };

  const handleOpenReturnDesk = () => {
    if (!selectedContract) return;
    const initialActions: ReturnAction[] = selectedContract.items.map(id => ({
      itemId: id,
      action: 'Return'
    }));
    setReturnActions(initialActions);
    setIsReturnModalOpen(true);
  };

  const submitReturn = () => {
    if (!selectedContract) return;
    processReturn(selectedContract.id, returnActions);
    setIsReturnModalOpen(false);
    setSelectedContract(null);
  };

  const updateReturnAction = (itemId: string, updates: Partial<ReturnAction>) => {
    setReturnActions(prev => prev.map(a => a.itemId === itemId ? { ...a, ...updates } : a));
  };

  const handleEmailQuote = async () => {
    if (!selectedContract) return;
    setIsEmailing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsEmailing(false);
    alert(`Document #${selectedContract.id} dispatched to ${selectedCustomer?.email}`);
  };

  const handleSendForSignature = async () => {
    if (!selectedContract) return;
    setIsEmailing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsEmailing(false);
    setIsSigningModalOpen(true);
  };

  const handleSimulateSigning = () => {
    if (!selectedContract) return;
    updateContract(selectedContract.id, { 
      isSigned: true, 
      signedAt: new Date().toISOString(),
      status: selectedContract.status === ContractStatus.QUOTE ? ContractStatus.RESERVATION : selectedContract.status 
    });
    setSelectedContract(prev => prev ? { 
      ...prev, 
      isSigned: true, 
      signedAt: new Date().toISOString(),
      status: prev.status === ContractStatus.QUOTE ? ContractStatus.RESERVATION : prev.status 
    } : null);
    setIsSigningModalOpen(false);
    alert("Contract digitally signed and verified.");
  };

  const handleGenerateInvoice = (contract: Contract) => {
    addInvoice({
      contractId: contract.id,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amount: contract.totalAmount,
      status: 'Unpaid'
    });
    alert(`Invoice generated for contract ${contract.id}`);
  };

  const startEditing = () => {
    if (!selectedContract) return;
    setEditFormData({ ...selectedContract });
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!selectedContract || !editFormData) return;
    
    const selectedItemsList = items.filter(i => selectedContract.items.includes(i.id));
    const subtotalPerDay = selectedItemsList.reduce((acc, i) => acc + i.rate, 0);
    const totalDays = calculateDays(editFormData.startDate || selectedContract.startDate, editFormData.endDate || selectedContract.endDate);
    const newTotal = subtotalPerDay * totalDays * (1 + (editFormData.taxRate ?? selectedContract.taxRate));
    
    const finalData = { ...editFormData, totalAmount: newTotal };
    updateContract(selectedContract.id, finalData);
    setSelectedContract({ ...selectedContract, ...finalData } as Contract);
    setIsEditing(false);
    alert("Contract modifications committed and recalculated.");
  };

  const handleRenew = async () => {
    if (!selectedContract) return;
    setIsRenewing(true);
    
    const currentEnd = new Date(selectedContract.endDate);
    currentEnd.setDate(currentEnd.getDate() + renewalDays);
    const newEndStr = currentEnd.toISOString().split('T')[0];
    
    const selectedItemsList = items.filter(i => selectedContract.items.includes(i.id));
    const subtotalPerDay = selectedItemsList.reduce((acc, i) => acc + i.rate, 0);
    const totalDays = calculateDays(selectedContract.startDate, newEndStr);
    const newTotal = subtotalPerDay * totalDays * (1 + selectedContract.taxRate);
    
    updateContract(selectedContract.id, { 
      endDate: newEndStr, 
      totalAmount: newTotal,
      status: ContractStatus.ACTIVE 
    });
    setSelectedContract({ 
      ...selectedContract, 
      endDate: newEndStr, 
      totalAmount: newTotal,
      status: ContractStatus.ACTIVE 
    });

    await new Promise(r => setTimeout(r, 1000));
    setIsRenewing(false);
    alert(`Renewal Successful: Contract ${selectedContract.id} extended by ${renewalDays} days. New Total: $${newTotal.toLocaleString()}. Customer notification dispatched.`);
  };

  const selectedCustomer = selectedContract ? customers.find(c => c.id === selectedContract.customerId) : null;
  const selectedItemsList = selectedContract ? items.filter(i => selectedContract.items.includes(i.id)) : [];

  const subtotalPerDay = selectedItemsList.reduce((acc, i) => acc + i.rate, 0);
  const totalDays = selectedContract ? calculateDays(selectedContract.startDate, selectedContract.endDate) : 0;
  const subtotalTotal = subtotalPerDay * totalDays;
  const taxAmount = subtotalTotal * ((isEditing ? editFormData.taxRate : selectedContract?.taxRate) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Contract Lifecycle</h2>
          <p className="text-slate-500">Manage procurement quotes through to asset return.</p>
        </div>
        <div className="flex gap-3">
           <button 
            onClick={() => { setFormData({...formData, status: ContractStatus.QUOTE}); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all border border-slate-200"
          >
            <PenTool size={18} />
            Draft Quote
          </button>
          <button 
            onClick={() => { setFormData({...formData, status: ContractStatus.ACTIVE}); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus size={18} />
            Activate Contract
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Quotes', status: ContractStatus.QUOTE, color: 'border-slate-300', icon: PenTool },
          { label: 'Reservations', status: ContractStatus.RESERVATION, color: 'border-orange-300', icon: Clock },
          { label: 'Active', status: ContractStatus.ACTIVE, color: 'border-blue-500', icon: Activity },
          { label: 'Partial', status: ContractStatus.PARTIAL_RETURN, color: 'border-purple-500', icon: RotateCcw },
          { label: 'Overdue', status: ContractStatus.OVERDUE, color: 'border-rose-500', icon: AlertCircle },
        ].map((bucket) => (
          <div key={bucket.label} className={`bg-white p-5 rounded-2xl border-l-4 ${bucket.color} shadow-sm border border-slate-200 group hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-2">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bucket.label}</p>
               <bucket.icon size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{contracts.filter(c => c.status === bucket.status).length}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {contracts.length > 0 ? (
            contracts.map((contract) => {
              const progress = getTermProgress(contract.startDate, contract.endDate);
              return (
              <div 
                key={contract.id} 
                onClick={() => { setSelectedContract(contract); setIsEditing(false); }}
                className="p-5 hover:bg-slate-50 flex items-center justify-between group cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getStatusColor(contract.status)} border-2 shadow-sm`}>
                    <FileText size={24} />
                  </div>
                  <div className="flex-1 max-w-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 tracking-tight">CONTRACT #{contract.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(contract.status)} shadow-sm`}>
                        {contract.status}
                      </span>
                      {contract.isSigned && (
                        <span className="flex items-center gap-1 text-[9px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-tighter">
                          <ShieldCheck size={10} /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 font-bold mt-1 uppercase tracking-tight">{contract.customerName}</p>
                    
                    <div className="mt-4 space-y-1.5">
                       <div className="flex justify-between items-center text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">
                          <div className="flex items-center gap-1.5"><Calendar size={10} className="text-blue-500" /> {contract.startDate}</div>
                          <span>Term Progress: {progress}%</span>
                          <div className="flex items-center gap-1.5"><Calendar size={10} className="text-orange-500" /> {contract.endDate}</div>
                       </div>
                       <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full transition-all duration-700 ${contract.status === ContractStatus.COMPLETED ? 'bg-emerald-500' : contract.status === ContractStatus.OVERDUE ? 'bg-rose-500' : 'bg-blue-600'}`} 
                            style={{ width: `${progress}%` }}
                          ></div>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-900 tracking-tight">${contract.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Value</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
              )
            })
          ) : (
            <div className="py-24 text-center">
              <div className="bg-slate-50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <FileText size={40} className="text-slate-200" />
              </div>
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">No Active Contracts</h4>
              <p className="text-slate-500 mt-2 font-medium max-w-xs mx-auto text-sm">Initiate your first utility agreement or procurement quote using the buttons above.</p>
            </div>
          )}
        </div>
      </div>

      {selectedContract && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setSelectedContract(null); setIsEditing(false); }}></div>
          <div className="relative bg-white w-full max-w-5xl max-h-[95vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-6">
                 <div className={`p-4 rounded-[1.5rem] ${getStatusColor(selectedContract.status)} border-2 shadow-md`}>
                   <FileText size={32} />
                 </div>
                 <div>
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Contract #{selectedContract.id}</h3>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColor(selectedContract.status)}`}>
                        {selectedContract.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 font-bold uppercase tracking-widest">Enterprise Fulfillment & Specification Audit</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 {!isEditing ? (
                   <>
                     <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 gap-1 shadow-sm">
                        <select 
                          value={renewalDays} 
                          onChange={(e) => setRenewalDays(Number(e.target.value))}
                          className="bg-transparent text-[10px] font-black uppercase tracking-widest px-3 outline-none"
                        >
                          <option value={7}>7 Days</option>
                          <option value={14}>14 Days</option>
                          <option value={30}>30 Days</option>
                          <option value={90}>90 Days</option>
                        </select>
                        <button 
                          onClick={handleRenew} 
                          disabled={isRenewing}
                          title="Renew Contract Term" 
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                          {isRenewing ? <RefreshCw size={14} className="animate-spin" /> : <RotateCw size={14} />}
                          Renew Agreement
                        </button>
                     </div>
                     <button onClick={startEditing} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm" title="Edit Contract Parameters">
                        <Edit3 size={20} />
                     </button>
                   </>
                 ) : (
                   <div className="flex items-center gap-2">
                     <button onClick={() => setIsEditing(false)} className="p-3 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all shadow-sm">
                        <X size={20} />
                     </button>
                     <button onClick={saveEdits} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-xl active:scale-95" title="Commit Modifications">
                        <Save size={20} />
                     </button>
                   </div>
                 )}
                 <button onClick={handleEmailQuote} disabled={isEmailing} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 shadow-sm">
                    {isEmailing ? <RefreshCw className="animate-spin" size={20} /> : <Mail size={20} />}
                 </button>
                 <button onClick={() => { setSelectedContract(null); setIsEditing(false); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={28}/>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-10">
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl shadow-sm">
                     <div className="flex gap-4">
                        <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div>
                           <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Contract Recalculation Engine</p>
                           <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed font-semibold">
                              Total amounts are dynamically derived based on the <span className="italic">Sum of Asset Rates</span> multiplied by the <span className="italic">Rental Period Duration</span>. Tax provisions are applied at the final stage. Modifications to dates will trigger a master ledger recalculation.
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <User size={16} className="text-blue-500" />
                        Partner Profile
                      </h4>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                        <p className="text-xl font-black text-slate-900 tracking-tight">{selectedCustomer?.name}</p>
                        <p className="text-sm text-slate-600 mt-1.5 font-bold">{selectedCustomer?.email}</p>
                        <p className="text-sm text-slate-500 mt-0.5 font-medium">{selectedCustomer?.phone}</p>
                        <p className="text-[11px] text-slate-400 mt-5 leading-relaxed font-bold uppercase tracking-wider border-t border-slate-50 pt-3">{selectedCustomer?.address}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        Deployment Windows
                      </h4>
                      <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-5 shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center">
                           <div className="flex-1">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Mobilization</p>
                             {isEditing ? (
                               <input 
                                 type="date" 
                                 value={editFormData.startDate} 
                                 onChange={e => setEditFormData({...editFormData, startDate: e.target.value})}
                                 className="w-full text-sm font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1.5 outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                               />
                             ) : (
                               <p className="text-sm font-black text-slate-700 mt-1.5">{selectedContract.startDate}</p>
                             )}
                           </div>
                           <ArrowRight size={20} className="text-slate-200 mx-4 shrink-0 mt-4" />
                           <div className="flex-1 text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Demobilization</p>
                             {isEditing ? (
                               <input 
                                 type="date" 
                                 value={editFormData.endDate} 
                                 onChange={e => setEditFormData({...editFormData, endDate: e.target.value})}
                                 className="w-full text-sm font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mt-1.5 outline-none text-right focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                               />
                             ) : (
                               <p className="text-sm font-black text-slate-700 mt-1.5">{selectedContract.endDate}</p>
                             )}
                           </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                           <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Validation State</p>
                                <div className="flex gap-2">
                                   {selectedContract.isSigned ? (
                                     <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-200 flex items-center gap-1.5"><ShieldCheck size={12}/> Authorized</span>
                                   ) : (
                                     <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-amber-200 flex items-center gap-1.5"><AlertCircle size={12}/> Pending Sig</span>
                                   )}
                                </div>
                              </div>
                              {isEditing && (
                                <div className="text-right">
                                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Tax Provision (%)</label>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    value={editFormData.taxRate} 
                                    onChange={e => setEditFormData({...editFormData, taxRate: Number(e.target.value)})}
                                    className="w-24 text-sm font-black bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-right focus:ring-4 focus:ring-blue-50 shadow-inner"
                                  />
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Package size={16} className="text-blue-500" />
                      Asset Allocation & Spec Inventory
                    </h4>
                    <div className="border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 border-b border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <tr>
                            <th className="px-8 py-6">Unit Specification & Serial Audit</th>
                            <th className="px-8 py-6 text-right">Standard Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedItemsList.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900 text-lg uppercase tracking-tight">{item.name}</span>
                                    {item.modelNumber && <span className="px-2.5 py-1 bg-blue-50 text-[9px] text-blue-600 rounded-lg border border-blue-100 font-black uppercase tracking-widest">MOD: {item.modelNumber}</span>}
                                  </div>
                                  <span className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-[0.15em]">SN: {item.serialNumber} — CAT: {item.category}</span>
                                  
                                  <div className="mt-3 p-4 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight mb-1">Asset Description</p>
                                    <p className="text-xs text-slate-600 leading-relaxed italic">{item.description}</p>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 p-5 bg-slate-50/80 rounded-2xl border border-slate-100 shadow-inner">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Weight size={10}/> Weight</span>
                                       <span className="text-[10px] text-slate-800 font-black">{item.weight || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Activity size={10}/> Capacity</span>
                                       <span className="text-[10px] text-slate-800 font-black">{item.capacity || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Ruler size={10}/> Dims</span>
                                       <span className="text-[10px] text-slate-800 font-black">{item.dimensions || 'N/A'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1"><Hash size={10}/> OEM</span>
                                       <span className="text-[10px] text-slate-800 font-black truncate">{item.manufacturer || 'Tallman'}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right align-top">
                                <span className="font-black text-slate-900 text-xl tracking-tight">${item.rate.toFixed(2)}</span>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Per Diem</p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50/40">
                           <tr className="border-t border-slate-100">
                             <td className="px-8 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Aggregate</td>
                             <td className="px-8 py-4 text-right font-black text-slate-900 tracking-tight">${subtotalPerDay.toFixed(2)}</td>
                           </tr>
                           <tr>
                             <td className="px-8 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Lifecycle Subtotal ({totalDays} Days)</td>
                             <td className="px-8 py-4 text-right font-black text-slate-900 tracking-tight">${subtotalTotal.toFixed(2)}</td>
                           </tr>
                           <tr>
                             <td className="px-8 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Tax Levy ({((isEditing ? editFormData.taxRate : selectedContract?.taxRate) || 0)*100}%)</td>
                             <td className="px-8 py-4 text-right font-black text-slate-900 tracking-tight">${taxAmount.toFixed(2)}</td>
                           </tr>
                           <tr className="border-t-2 border-slate-200 bg-blue-50/30">
                             <td className="px-8 py-6 text-right text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Master Ledger Total</td>
                             <td className="px-8 py-6 text-right text-3xl font-black text-blue-600 tracking-tighter shadow-sm border-l border-blue-100/50">${(isEditing ? (subtotalTotal * (1 + (editFormData.taxRate || 0))) : selectedContract.totalAmount).toFixed(2)}</td>
                           </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileText size={16} className="text-blue-500" />
                      Audited Project Notes
                    </h4>
                    {isEditing ? (
                      <textarea 
                        value={editFormData.notes} 
                        onChange={e => setEditFormData({...editFormData, notes: e.target.value})}
                        className="w-full p-8 bg-white border border-slate-200 rounded-[2.5rem] text-sm outline-none focus:border-blue-500 min-h-[160px] transition-all focus:ring-8 focus:ring-blue-50 shadow-inner font-medium leading-relaxed"
                        placeholder="Append field instructions..."
                      />
                    ) : (
                      <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 italic text-sm text-slate-600 leading-relaxed font-medium">
                        {selectedContract.notes || "No additional audit notes recorded."}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                   <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                      <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
                        <ShieldAlert size={14} className="text-orange-500" />
                        Master Terms Summary
                      </h4>
                      <div className="space-y-6 text-[11px] leading-relaxed text-slate-400 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar font-bold">
                         <p><strong className="text-white uppercase tracking-tight block mb-1">1. Possession Policy:</strong> Customer maintains full structural liability during tenure.</p>
                         <p><strong className="text-white uppercase tracking-tight block mb-1">2. Loss Penalty:</strong> Replacement cost assessment applies at MSRP for missing assets.</p>
                         <p><strong className="text-white uppercase tracking-tight block mb-1">3. Logistic Default:</strong> Overdue check-ins trigger automated 1.5x standard rate surcharges.</p>
                      </div>
                   </div>

                   <div className="p-10 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 space-y-8">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] flex items-center gap-2 border-b border-slate-50 pb-4">
                        <FileSignature size={18} className="text-blue-600" />
                        Operational Sign-off
                      </h4>
                      {selectedContract.isSigned ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center space-y-5">
                           <div className="p-6 bg-emerald-50 text-emerald-600 rounded-[1.5rem] border border-emerald-100 shadow-sm">
                              <ShieldCheck size={56} />
                           </div>
                           <div>
                              <p className="text-xl font-black text-slate-900 tracking-tight uppercase">Verified Seal</p>
                              <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest leading-relaxed">
                                Authorized by Principal on<br/>
                                <span className="text-slate-600">{new Date(selectedContract.signedAt!).toLocaleString()}</span>
                              </p>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <button 
                            onClick={handleSendForSignature}
                            disabled={isEmailing}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-900/20 disabled:opacity-50 active:scale-95 text-[11px] uppercase tracking-[0.2em]"
                          >
                            <FileSignature size={20} />
                            {isEmailing ? 'Dispatching...' : 'Initiate Signature'}
                          </button>
                        </div>
                      )}
                   </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-5">
              <button 
                onClick={handleOpenReturnDesk}
                className="flex-1 flex items-center justify-center gap-4 px-10 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] hover:bg-black transition-all shadow-2xl shadow-slate-900/40 active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                <RotateCcw size={24} />
                ReturnDesk™ Ingestion
              </button>
              <button 
                onClick={() => handleGenerateInvoice(selectedContract)}
                className="flex-1 flex items-center justify-center gap-4 px-10 py-5 bg-white border border-slate-200 text-slate-800 font-black rounded-[1.5rem] hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                <Receipt size={24} />
                Generate Ledger Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-900 text-white">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{formData.status === ContractStatus.QUOTE ? 'Proposal Ingestion' : 'Agreement Activation'}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-[0.2em]">Initiating enterprise tool fulfillment workflow.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl shadow-sm">
                <div className="flex gap-4">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Pricing Strategy & Logistics</p>
                    <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed font-semibold">
                      Contracts marked as <span className="font-bold">Activation</span> will immediately move units to 'Rented' status and trigger a logistics manifest.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Entity</label>
                  <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all font-bold shadow-inner">
                    <option value="">Select Partner Entity...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tax Provision Rate (%)</label>
                  <input type="number" step="0.01" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all font-bold shadow-inner" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployment Start</label>
                  <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all font-bold shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Demobilization End</label>
                  <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-8 focus:ring-blue-50 transition-all font-bold shadow-inner" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Allocation</label>
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-3 custom-scrollbar border border-slate-100 rounded-[2rem] p-4 bg-slate-50 shadow-inner">
                  {items.filter(i => i.status === 'Available' || formData.items.includes(i.id)).map(item => (
                    <label key={item.id} className={`flex items-center gap-5 p-5 border-2 rounded-[1.5rem] transition-all cursor-pointer shadow-sm ${formData.items.includes(item.id) ? 'bg-white border-blue-500 scale-[1.02] shadow-xl' : 'bg-white/60 border-slate-100 hover:border-blue-200'}`}>
                      <input 
                        type="checkbox" 
                        checked={formData.items.includes(item.id)}
                        onChange={(e) => {
                          const newItems = e.target.checked 
                            ? [...formData.items, item.id]
                            : formData.items.filter(id => id !== item.id);
                          setFormData({...formData, items: newItems});
                        }}
                        className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" 
                      />
                      <div className="flex-1">
                        <p className="text-base font-black text-slate-900 tracking-tight uppercase">{item.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">${item.rate.toFixed(2)} / PER DIEM — SN: {item.serialNumber}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Context</label>
                <textarea 
                  value={formData.notes} 
                  onChange={e => setFormData({...formData, notes: e.target.value})} 
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm outline-none focus:ring-8 focus:ring-blue-50 h-32 resize-none font-medium shadow-inner" 
                  placeholder="Append field instructions..."
                />
              </div>

              <div className="pt-6 flex gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-[0.2em] text-[10px] shadow-sm">Abort Ingestion</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-900/30 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px]">
                  {formData.status === ContractStatus.QUOTE ? 'Transmit Proposal' : 'Commit Activation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReturnModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsReturnModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="p-10 border-b border-slate-100 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter">ReturnDesk™ Ingestion</h3>
                  <p className="text-blue-400 text-[10px] mt-1.5 font-black uppercase tracking-[0.3em]">Intelligent Asset verification Protocol</p>
                </div>
                <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={28}/>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-3xl shadow-sm">
                <div className="flex gap-4">
                   <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                   <div>
                      <p className="text-xs font-black text-amber-900 uppercase tracking-widest underline underline-offset-4 decoration-amber-200 mb-2">Technical Inspection Workflow</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-bold">
                        Marking an item as <span className="font-black italic">Damaged</span> will automatically flag it for the <span className="italic">Scan360™ AI Audit</span>.
                      </p>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {selectedItemsList.map((item) => {
                  const currentAct = returnActions.find(a => a.itemId === item.id);
                  return (
                    <div key={item.id} className="p-8 border border-slate-100 rounded-[2rem] bg-white hover:bg-slate-50/50 transition-all group border-2 hover:border-blue-100">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-xl border-4 border-slate-800">
                             <Package size={32} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900 tracking-tight uppercase">{item.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">SERIAL: {item.serialNumber}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2.5">
                          {[
                            { val: 'Return', icon: CheckCircle, color: 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300' },
                            { val: 'Missing', icon: AlertCircle, color: 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300' },
                            { val: 'Damaged', icon: ShieldAlert, color: 'hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300' },
                            { val: 'Extend', icon: Clock, color: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300' }
                          ].map(btn => (
                            <button
                              key={btn.val}
                              onClick={() => updateReturnAction(item.id, { action: btn.val as any })}
                              className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                currentAct?.action === btn.val 
                                  ? 'bg-slate-900 border-slate-900 text-white scale-110 shadow-2xl shadow-slate-900/30' 
                                  : `bg-white border-slate-100 text-slate-400 ${btn.color}`
                              }`}
                            >
                              <btn.icon size={16} />
                              {btn.val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-slate-500">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inventory Parity State</p>
                 <p className="text-2xl font-black text-slate-900 tracking-tighter">{selectedItemsList.length} Units Flagged</p>
              </div>
              <button 
                onClick={submitReturn}
                className="px-12 py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-2xl shadow-slate-900/40 uppercase text-xs tracking-[0.2em] active:scale-95"
              >
                Submit Inspection Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contracts;
