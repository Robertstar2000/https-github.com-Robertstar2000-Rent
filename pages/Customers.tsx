import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Mail, Phone, MoreVertical, 
  UserCircle, CreditCard, History, X, Info, Globe, ShieldCheck, Edit3, Trash2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Customer } from '../types';

const Customers: React.FC = () => {
  const { customers, addCustomer, updateCustomer } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', balance: 0, tags: ''
  });

  // Initialize form when editing
  useEffect(() => {
    if (selectedCustomer && isEditing) {
      setFormData({
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
        balance: selectedCustomer.balance,
        tags: selectedCustomer.tags?.join(', ') || ''
      });
    } else if (!isModalOpen) {
      setFormData({ name: '', email: '', phone: '', address: '', balance: 0, tags: '' });
    }
  }, [selectedCustomer, isEditing, isModalOpen]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };

    if (isEditing && selectedCustomer) {
      updateCustomer(selectedCustomer.id, cleanData);
      alert("Partner record synchronized.");
    } else {
      addCustomer(cleanData);
      alert("New strategic partner provisioned.");
    }
    
    setIsModalOpen(false);
    setIsEditing(false);
    setFormData({ name: '', email: '', phone: '', address: '', balance: 0, tags: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Partner Accounts</h2>
          <p className="text-slate-500">Relationship management and financial parity for utility contracts.</p>
        </div>
        <button 
          onClick={() => { setSelectedCustomer(null); setIsEditing(false); setIsModalOpen(true); }}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-slate-900/30 hover:bg-black transition-all active:scale-95"
        >
          <Plus size={20} />
          Onboard Partner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125 duration-700"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Accounts Receivable</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
            ${customers.reduce((acc, c) => acc + c.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <div className="mt-6 flex items-center text-[10px] text-rose-700 font-black uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 w-fit shadow-sm">
            <CreditCard size={14} className="mr-2" />
            {customers.filter(c => c.balance > 1000).length} Over-Threshold Entities
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Enterprise Entities</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{customers.length}</h3>
          <div className="mt-6 flex items-center gap-2 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
            <ShieldCheck size={16} /> Ledger Sync Enabled
          </div>
        </div>

        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-3">Market Retention</p>
          <h3 className="text-3xl font-black tracking-tighter">98.4%</h3>
          <div className="w-full bg-blue-800 h-2 rounded-full mt-6 shadow-inner overflow-hidden">
            <div className="bg-white h-full rounded-full w-[98%] shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search size={20} />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, or domain..."
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 focus:ring-8 focus:ring-blue-50 outline-none rounded-2xl text-sm font-bold transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Partner Entity</th>
                <th className="px-10 py-6">Contact Metadata</th>
                <th className="px-10 py-6">Audit Status</th>
                <th className="px-10 py-6">Ledger Balance</th>
                <th className="px-10 py-6 text-right">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-blue-50/30 transition-colors group cursor-pointer">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border-2 border-white shadow-xl group-hover:scale-110 transition-all">
                        <UserCircle size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{customer.name}</p>
                        <div className="flex gap-2 mt-1.5">
                          {customer.tags?.map(tag => (
                            <span key={tag} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase font-black tracking-tighter border border-slate-200">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                        <Mail size={14} className="text-slate-300" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-500">
                        <Phone size={14} className="text-slate-300" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                      customer.balance > 1000 ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {customer.balance > 1000 ? 'Credit Hold' : 'Authorized'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <p className={`text-lg font-black tracking-tighter ${customer.balance > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      ${customer.balance.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                      onClick={() => { setSelectedCustomer(customer); setIsEditing(true); setIsModalOpen(true); }}
                      className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-900 hover:text-white transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Ingestion Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setIsModalOpen(false); setIsEditing(false); }}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-10 border-b border-slate-100 bg-slate-900 text-white shadow-xl">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{isEditing ? 'Modify Partner Profile' : 'Onboard Enterprise Partner'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">{isEditing ? 'Database Synchronization' : 'New Account Provisioning'}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setIsEditing(false); }} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-3xl shadow-sm">
                <div className="flex gap-4">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-amber-200">ERP Ledger Logic</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-bold">
                      All <span className="font-black italic">Balances</span> and <span className="font-black italic">Tags</span> are synchronized with Epicor P21. Accounts with balances exceeding <span className="font-bold">$1,000.00</span> are automatically flagged for <span className="italic text-rose-700">Credit Hold</span>, preventing tool dispatch.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Entity Designation</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Legal Entity Name" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Email</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="ops@entity.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Phone</label>
                  <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Balance ($)</label>
                  <input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HQ Address</label>
                <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 h-24 resize-none transition-all" placeholder="Full mailing address..." />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Audit Tags (Comma separated)</label>
                <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="Utility, High Priority, West..." />
              </div>

              <div className="pt-10 flex gap-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditing(false); }} className="flex-1 py-5 border border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-900/30 transition-all active:scale-95">
                  {isEditing ? 'Commit Changes' : 'Verify & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;