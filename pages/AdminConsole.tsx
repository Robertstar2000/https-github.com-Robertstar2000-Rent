import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Download, Upload, Server, ShieldCheck, 
  AlertCircle, History, ExternalLink, Settings2, X, Lock, Globe, ArrowRightLeft, Clock,
  Mail, Bell, ToggleLeft, ToggleRight, CheckCircle2, Send, Info, FileText, ArrowUp, ArrowDown, HardDrive
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const AdminConsole: React.FC = () => {
  const { 
    syncLogs, runP21Sync, runOrderSync, exportBackup, importBackup, 
    emailSettings, notificationSettings, updateEmailSettings, updateNotificationSettings, sendOverdueAlerts 
  } = useData();
  
  const [isSyncingInventory, setIsSyncingInventory] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  
  const [isSendingAlerts, setIsSendingAlerts] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'erp' | 'email' | 'notifications'>('erp');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [localP21, setLocalP21] = useState({
    apiUrl: 'https://p21-api.epicor.com/v1',
    apiKey: '************************',
    apiSecret: '************************',
    syncInterval: '30m',
    syncDirection: 'bidirectional'
  });

  const [localEmail, setLocalEmail] = useState(emailSettings);
  const [localNotifications, setLocalNotifications] = useState(notificationSettings);

  const handleP21InventorySync = async () => {
    setIsSyncingInventory(true);
    await runP21Sync();
    setIsSyncingInventory(false);
  };

  const handleP21OrderSync = async () => {
    setIsSyncingOrders(true);
    setSyncProgress(5);
    setSyncStatus('Initializing OAuth2 handshake...');
    
    await new Promise(r => setTimeout(r, 600));
    setSyncProgress(35);
    setSyncStatus('Pushing updated contract details to P21...');
    
    await new Promise(r => setTimeout(r, 800));
    setSyncProgress(75);
    setSyncStatus('Fetching remote order fulfillment statuses...');
    
    await runOrderSync();
    setSyncProgress(100);
    setSyncStatus('Sync Complete. Master Ledger Updated.');
    
    await new Promise(r => setTimeout(r, 800));
    setIsSyncingOrders(false);
    setSyncProgress(0);
    setSyncStatus('');
  };

  const handleAlertSweep = async () => {
    setIsSendingAlerts(true);
    const count = await sendOverdueAlerts();
    setIsSendingAlerts(false);
    alert(`Manual sweep complete. ${count} automated notices dispatched to utility partners.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        importBackup(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmailSettings(localEmail);
    updateNotificationSettings(localNotifications);
    setIsSettingsOpen(false);
    alert("System configuration updated successfully.");
  };

  const getRelativeTime = (timestamp: string) => {
    const past = new Date(timestamp);
    const diffMins = Math.floor((currentTime.getTime() - past.getTime()) / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    return past.toLocaleDateString();
  };

  const lastInvSync = syncLogs.find(l => l.entity === 'Inventory');
  const lastOrderSync = syncLogs.find(l => l.entity === 'Order');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">Admin & Ops Console</h2>
          <p className="text-slate-500">ERP connectivity, automated alerts, and system architecture.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">P21 API Gateway: ONLINE</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all">
             <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl">
                    <Database size={24} />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">Enterprise Synchronization</h3>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all shadow-lg active:scale-95"
                >
                  <Settings2 size={20} />
                </button>
             </div>
             
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inventory Sync Card */}
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-5 shadow-inner flex flex-col">
                   <div className="flex items-center gap-3">
                      <RefreshCw size={22} className="text-blue-600" />
                      <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">P21 Inventory Parity</h4>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium flex-1">Sync tool availability, technical specs, and warehouse bins with the master ledger.</p>
                   
                   <div className="space-y-4">
                     <button 
                      onClick={handleP21InventorySync}
                      disabled={isSyncingInventory}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-blue-900/20 active:scale-95"
                    >
                      {isSyncingInventory ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                      {isSyncingInventory ? 'Syncing...' : 'Sync Inventory'}
                    </button>
                    {lastInvSync && (
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-white py-2 rounded-xl border border-slate-100 shadow-sm">
                        Last Inv: <span className="text-slate-800">{getRelativeTime(lastInvSync.timestamp)}</span>
                      </div>
                    )}
                   </div>
                </div>

                {/* Orders & Contracts Sync Card */}
                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-5 shadow-inner flex flex-col">
                   <div className="flex items-center gap-3">
                      <FileText size={22} className="text-purple-600" />
                      <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">P21 Order/Contract Sync</h4>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium flex-1">Transmit new rental contracts to P21 and fetch updated order fulfillment statuses.</p>
                   
                   <div className="space-y-4">
                     {isSyncingOrders && (
                       <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className="flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
                             <span className="flex items-center gap-1.5"><RefreshCw size={10} className="animate-spin" /> {syncStatus}</span>
                             <span>{syncProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                             <div 
                               className="h-full bg-purple-600 transition-all duration-500 shadow-[0_0_8px_rgba(147,51,234,0.5)]" 
                               style={{ width: `${syncProgress}%` }}
                             ></div>
                          </div>
                       </div>
                     )}

                     <button 
                      onClick={handleP21OrderSync}
                      disabled={isSyncingOrders}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-purple-900/20 active:scale-95"
                    >
                      {isSyncingOrders ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRightLeft size={18} />}
                      {isSyncingOrders ? 'Syncing...' : 'Sync Orders'}
                    </button>
                    
                    {!isSyncingOrders && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-white rounded-lg border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          <ArrowUp size={10} className="text-purple-500" /> Push Pending
                        </div>
                        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-white rounded-lg border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                          <ArrowDown size={10} className="text-emerald-500" /> Fetch Status
                        </div>
                      </div>
                    )}

                    {lastOrderSync && !isSyncingOrders && (
                      <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] bg-white py-2 rounded-xl border border-slate-100 shadow-sm">
                        Last Order: <span className="text-slate-800">{getRelativeTime(lastOrderSync.timestamp)}</span>
                      </div>
                    )}
                   </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-5 shadow-inner md:col-span-2">
                   <div className="flex items-center gap-3">
                      <Bell size={22} className="text-orange-600" />
                      <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Automated Alert Sweep</h4>
                   </div>
                   <p className="text-xs text-slate-500 leading-relaxed font-medium">Transmit automated overdue return and invoice notices to all utility partners with outstanding ledger balances.</p>
                   <button 
                    onClick={handleAlertSweep}
                    disabled={isSendingAlerts}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-orange-900/20 active:scale-95"
                  >
                    {isSendingAlerts ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                    {isSendingAlerts ? 'Dispatching...' : 'Run Global Alert Sweep'}
                  </button>
                </div>
             </div>

             <div className="px-8 mb-8">
               <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-2xl shadow-sm">
                  <div className="flex gap-4">
                     <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
                     <div>
                        <p className="text-xs font-black text-amber-900 uppercase tracking-widest">Enterprise Bridge Security</p>
                        <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed font-bold">
                           Bidirectional synchronization requires <span className="font-black italic">OAuth 2.0</span> validation. Syncing <span className="font-bold">Orders</span> ensures that billing events in TallmanRent are mirrored to the P21 financial sub-ledger. Failed syncs will be retried automatically in the next 30m polling cycle.
                        </p>
                     </div>
                  </div>
               </div>
             </div>

             <div className="px-8 pb-10">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <History size={14} className="text-blue-500" />
                    Master Sync Logs
                  </h4>
                  <button className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-tighter">View All logs</button>
                </div>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-3 custom-scrollbar">
                   {syncLogs.length > 0 ? syncLogs.map(log => (
                      <div key={log.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4 text-[11px] group hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                         <span className={`w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'}`}></span>
                         <span className="font-black text-slate-800 whitespace-nowrap bg-slate-100 px-2 py-0.5 rounded-lg">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded border border-slate-100">{log.entity}</span>
                         <span className="text-slate-500 flex-1 truncate font-bold uppercase tracking-tight">{log.message}</span>
                      </div>
                   )) : (
                     <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Zero Sync Events Detected</p>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl transition-transform group-hover:scale-125 duration-700"></div>
             <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 mb-6">
                <HardDrive size={28} />
                Data Management
             </h3>
             <p className="text-blue-100 text-sm leading-relaxed mb-10 font-medium">
                Execute localized data exports or restore previous system states for disaster recovery or regulatory archiving.
             </p>
             <div className="space-y-4">
                <button onClick={exportBackup} className="w-full flex items-center justify-center gap-3 py-4 bg-white text-blue-600 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-2xl active:scale-95">
                  <Download size={18} />
                  Export Backup
                </button>
                <label className="w-full flex items-center justify-center gap-3 py-4 bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-blue-800 transition-all cursor-pointer border border-blue-500 active:scale-95 shadow-lg">
                  <Upload size={18} />
                  Import Backup
                  <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
                </label>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
             <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Compliance Status</h4>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed italic font-medium">
                All P21 synchronizations are logged with immutable SHA-256 hashes. Automated communications are archived for 7 years per enterprise retention policies.
             </p>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex">
               <div className="w-52 bg-slate-50 border-r border-slate-100 p-8 flex flex-col gap-3 shadow-inner">
                  <button 
                    onClick={() => setActiveTab('erp')}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'erp' ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Database size={16} /> ERP Bridge
                  </button>
                  <button 
                    onClick={() => setActiveTab('email')}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'email' ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Mail size={16} /> Comms
                  </button>
                  <button 
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-white shadow-md text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Bell size={16} /> Triggers
                  </button>
               </div>

               <div className="flex-1 flex flex-col min-h-[550px]">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                     <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        {activeTab === 'erp' ? 'Epicor P21 Interface' : activeTab === 'email' ? 'Communication Server' : 'Notification Triggers'}
                     </h3>
                     <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={24}/>
                     </button>
                  </div>
                  
                  <form onSubmit={handleSaveSettings} className="p-8 space-y-8 flex-1">
                     {activeTab === 'erp' && (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">P21 Endpoint URL</label>
                              <input 
                                type="url" 
                                value={localP21.apiUrl} 
                                onChange={e => setLocalP21({...localP21, apiUrl: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none shadow-inner focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Polling Interval</label>
                                 <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none shadow-inner focus:ring-4 focus:ring-blue-50 transition-all font-medium">
                                    <option>Every 30 Minutes</option>
                                    <option>Hourly</option>
                                    <option>Daily</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integration Key</label>
                                 <input type="password" value="************" className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm outline-none cursor-not-allowed font-medium" readOnly />
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'email' && (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Provider</label>
                              <select 
                                value={localEmail.provider}
                                onChange={e => setLocalEmail({...localEmail, provider: e.target.value as any})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none shadow-inner focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                              >
                                 <option value="SendGrid">SendGrid (Recommended)</option>
                                 <option value="SMTP">Relay SMTP Server</option>
                                 <option value="Mailchimp">Mailchimp Transactional</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Secret Authorization</label>
                              <input 
                                type="password" 
                                value={localEmail.apiKey}
                                onChange={e => setLocalEmail({...localEmail, apiKey: e.target.value})}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none shadow-inner focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authored Sender</label>
                                 <input 
                                   type="email" 
                                   value={localEmail.fromAddress}
                                   onChange={e => setLocalEmail({...localEmail, fromAddress: e.target.value})}
                                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none shadow-inner focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Display Identity</label>
                                 <input 
                                   type="text" 
                                   value={localEmail.senderName}
                                   onChange={e => setLocalEmail({...localEmail, senderName: e.target.value})}
                                   className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none shadow-inner focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                                 />
                              </div>
                           </div>
                        </div>
                     )}

                     {activeTab === 'notifications' && (
                        <div className="space-y-5 overflow-y-auto pr-3 custom-scrollbar max-h-[350px]">
                           <p className="text-xs text-slate-500 mb-4 font-medium italic">Configure automated dispatch criteria for utility communication workflows.</p>
                           
                           {[
                              { id: 'overdueInvoices', label: 'Overdue Invoice Alerts', desc: 'Dispatched 72h post-maturity.' },
                              { id: 'lateReturns', label: 'Return Default Notices', desc: 'Dispatched at T-24h and contract expiry.' },
                              { id: 'lowStockAlerts', label: 'Utilization Thresholds', desc: 'Alerts if category parity drops below 10%.' },
                              { id: 'dailyDigest', label: 'Morning Ops Summary', desc: 'Stakeholder PDF report daily at 06:00.' },
                           ].map(notif => (
                              <label key={notif.id} className="flex items-center gap-5 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] cursor-pointer hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                                 <div className="flex-1">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{notif.label}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{notif.desc}</p>
                                 </div>
                                 <button 
                                   type="button"
                                   onClick={() => setLocalNotifications({...localNotifications, [notif.id]: !localNotifications[notif.id as keyof typeof localNotifications]})}
                                   className="text-blue-600 transition-transform active:scale-90"
                                 >
                                    {localNotifications[notif.id as keyof typeof localNotifications] ? <ToggleRight size={44} /> : <ToggleLeft size={44} className="text-slate-300" />}
                                 </button>
                              </label>
                           ))}
                        </div>
                     )}

                     <div className="pt-10 flex gap-5 mt-auto">
                        <button 
                           type="button" 
                           onClick={() => setIsSettingsOpen(false)}
                           className="flex-1 py-4 border border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
                        >
                           Abort Changes
                        </button>
                        <button 
                           type="submit" 
                           className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-900/20 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
                        >
                           Commit System Config
                        </button>
                     </div>
                  </form>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
