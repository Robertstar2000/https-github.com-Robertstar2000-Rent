import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, Tag, MapPin, Wrench,
  CheckCircle2, XCircle, AlertCircle, AlertTriangle, X, History, Info, Anchor, Weight, Activity, Ruler, Hash, Box, Edit3, Save, Clock
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ItemStatus, InventoryItem } from '../types';

const Inventory: React.FC = () => {
  const { inventory, addInventoryItem, updateInventoryItem, maintenance } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', serialNumber: '', rate: 0, location: '', status: ItemStatus.AVAILABLE, replacementCost: 0,
    manufacturer: '', weight: '', capacity: '', modelNumber: '', dimensions: ''
  });

  // Ensure form is initialized with existing data when editing, or reset when adding new
  useEffect(() => {
    if (selectedItem && isEditing) {
      setFormData({
        name: selectedItem.name,
        description: selectedItem.description,
        category: selectedItem.category,
        serialNumber: selectedItem.serialNumber,
        rate: selectedItem.rate,
        location: selectedItem.location,
        status: selectedItem.status,
        replacementCost: selectedItem.replacementCost,
        manufacturer: selectedItem.manufacturer || '',
        weight: selectedItem.weight || '',
        capacity: selectedItem.capacity || '',
        modelNumber: selectedItem.modelNumber || '',
        dimensions: selectedItem.dimensions || ''
      });
    } else if (!isModalOpen) {
      resetForm();
    }
  }, [selectedItem, isEditing, isModalOpen]);

  const resetForm = () => {
    setFormData({ name: '', description: '', category: '', serialNumber: '', rate: 0, location: '', status: ItemStatus.AVAILABLE, replacementCost: 0, manufacturer: '', weight: '', capacity: '', modelNumber: '', dimensions: '' });
  };

  const getStatusBadge = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.AVAILABLE:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700"><CheckCircle2 size={14} /> Available</span>;
      case ItemStatus.RENTED:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><Tag size={14} /> Rented</span>;
      case ItemStatus.MAINTENANCE:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Wrench size={14} /> Maintenance</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700"><XCircle size={14} /> {status}</span>;
    }
  };

  const filteredItems = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem && isEditing) {
      updateInventoryItem(selectedItem.id, formData);
      alert("Asset metadata synchronized with master ledger.");
    } else {
      addInventoryItem(formData);
      alert("New asset provisioned and indexed.");
    }
    setIsEditing(false);
    setIsModalOpen(false);
    resetForm();
  };

  const itemMaintenance = maintenance.filter(m => m.itemId === selectedItem?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Enterprise Inventory</h2>
          <p className="text-slate-500">Tracking and technical specification management.</p>
        </div>
        <button 
          onClick={() => { setSelectedItem(null); setIsEditing(false); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Register Asset
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, serial, or model ID..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:ring-4 focus:ring-blue-50 outline-none rounded-2xl text-sm font-medium transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredItems.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Asset Identification</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">Specs (Cap/Weight)</th>
                  <th className="px-8 py-5">Standard Rate</th>
                  <th className="px-8 py-5">Location</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => { setSelectedItem(item); setIsEditing(false); }}
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">SN: {item.serialNumber}</span>
                          {item.modelNumber && <span className="text-[10px] text-blue-600 font-black bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">{item.modelNumber}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">{getStatusBadge(item.status)}</td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                         <span className="text-xs text-slate-700 font-bold">{item.capacity || 'N/A'}</span>
                         <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Gross: {item.weight || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-900">${item.rate}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <MapPin size={12} className="text-blue-500" />
                        {item.location}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setIsEditing(true); setIsModalOpen(true); }}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600"
                       >
                         <Edit3 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-32 text-center bg-slate-50/30">
              <div className="bg-white w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
                <Box size={40} className="text-slate-200" />
              </div>
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Zero Matches Found</h4>
            </div>
          )}
        </div>
      </div>

      {/* Asset Detail Drawer */}
      {selectedItem && !isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedItem(null)}></div>
          <div className="relative bg-white h-full w-full max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-8 flex items-center justify-between z-10 text-white shadow-xl">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Technical Data Sheet</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Audit Log: {selectedItem.serialNumber}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => { setIsEditing(true); setIsModalOpen(true); }} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-lg active:scale-95 text-white border border-white/10">
                    <Edit3 size={20} />
                 </button>
                 <button onClick={() => setSelectedItem(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-95 border border-white/10 shadow-lg"><X size={24}/></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{selectedItem.name}</h4>
                  {getStatusBadge(selectedItem.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Serial ID</p>
                    <p className="text-sm font-black text-slate-800 font-mono bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-fit">{selectedItem.serialNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Model</p>
                    <p className="text-sm font-black text-slate-800">{selectedItem.modelNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Category</p>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Manufacturer</p>
                    <p className="text-sm font-black text-slate-800">{selectedItem.manufacturer || 'Tallman Specialty'}</p>
                  </div>
                  <div className="col-span-2 border-t border-slate-100 pt-6 mt-2 grid grid-cols-3 gap-4">
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Weight size={12} className="text-blue-500" /> Weight</p>
                       <p className="text-xs font-black text-slate-800">{selectedItem.weight || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity size={12} className="text-blue-500" /> Capacity</p>
                       <p className="text-xs font-black text-slate-800">{selectedItem.capacity || 'N/A'}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Ruler size={12} className="text-blue-500" /> Footprint</p>
                       <p className="text-xs font-black text-slate-800">{selectedItem.dimensions || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                     <History size={18} className="text-blue-600" />
                     Service Logs
                   </h4>
                   <span className="text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-3 py-1 rounded-full">{itemMaintenance.length} Records</span>
                </div>
                <div className="space-y-4">
                  {itemMaintenance.length > 0 ? (
                    itemMaintenance.map(record => (
                      <div key={record.id} className="p-6 border border-slate-100 rounded-[1.5rem] bg-white/60 group">
                        <div className="flex justify-between items-start mb-3">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{record.description}</p>
                          <p className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm">${record.cost}</p>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-black uppercase tracking-widest">
                          <p className="flex items-center gap-2"><Anchor size={10} /> Certified: {record.technician || 'System'}</p>
                          <p className="flex items-center gap-2"><Clock size={10} /> {record.date}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                      <p className="text-xs text-slate-400 font-black uppercase tracking-widest leading-relaxed">No structural service history recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Ingestion Modal (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => { setIsModalOpen(false); setIsEditing(false); }}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-10 border-b border-slate-100 bg-slate-900 text-white">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{isEditing ? 'Modify Asset' : 'Register New Asset'}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">{isEditing ? 'Synchronizing Metadata' : 'Enterprise Ingestion Protocol'}</p>
              </div>
              <button onClick={() => { setIsModalOpen(false); setIsEditing(false); }} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={28}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-3xl shadow-sm">
                <div className="flex gap-4">
                  <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-xs font-black text-amber-900 uppercase tracking-widest mb-1.5 underline underline-offset-4 decoration-amber-200">Asset Data Synchronization</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed font-bold">
                      Ensure <span className="font-black italic">Serial IDs</span> match physical engravings exactly. For <span className="font-bold">Model Numbers</span>, use OEM designations. Updates to <span className="font-black">Rates</span> or <span className="font-black">Replacement Values</span> trigger a ledger recalculation for all un-invoiced contracts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Designation</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all">
                    <option value="">Select Category...</option>
                    <option value="Distribution">Distribution</option>
                    <option value="Transmission">Transmission</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial ID (Sync Key)</label>
                  <input required value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-mono font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Net Weight</label>
                   <input value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="e.g. 15 lbs" />
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Footprint Dimensions</label>
                   <input value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" placeholder="L x W x H" />
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rated Capacity</label>
                 <input value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Daily Rate ($)</label>
                  <input required type="number" value={formData.rate} onChange={e => setFormData({...formData, rate: Number(e.target.value)})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Replacement Value ($)</label>
                  <input required type="number" value={formData.replacementCost} onChange={e => setFormData({...formData, replacementCost: Number(e.target.value)})} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-blue-50 transition-all" />
                </div>
              </div>

              <div className="pt-10 flex gap-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditing(false); }} className="flex-1 py-5 border border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-slate-50 transition-all shadow-sm">Cancel</button>
                <button type="submit" className="flex-1 py-5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-900/30 transition-all active:scale-95">
                  {isEditing ? 'Commit Changes' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;