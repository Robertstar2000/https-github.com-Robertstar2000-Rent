import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  Upload,
  ShieldCheck,
  History,
  Settings2,
  X,
  ArrowRightLeft,
  Mail,
  Bell,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Send
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

const AdminConsole: React.FC = () => {
  const {
    syncLogs,
    runP21Sync,
    runOrderSync,
    exportBackup,
    importBackup,
    emailSettings,
    notificationSettings,
    updateEmailSettings,
    updateNotificationSettings,
    sendOverdueAlerts,
    notify
  } = useData();

  const [isSyncingInventory, setIsSyncingInventory] = useState(false);
  const [isSyncingOrders, setIsSyncingOrders] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'Order' | 'Customer' | 'Inventory'>('ALL');

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
    syncInterval: '30m'
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
    setSyncProgress(10);
    setSyncStatus('Validating OAuth 2.0 session...');

    await new Promise(r => setTimeout(r, 450));
    setSyncProgress(45);
    setSyncStatus('Pushing rental contracts & quotes to P21...');

    await new Promise(r => setTimeout(r, 550));
    setSyncProgress(80);
    setSyncStatus('Confirming P21 order ledger parity...');

    await runOrderSync();
    setSyncProgress(100);
    setSyncStatus('Sync Complete');

    await new Promise(r => setTimeout(r, 450));
    setIsSyncingOrders(false);
    setSyncProgress(0);
    setSyncStatus('');
  };

  const handleAlertSweep = async () => {
    setIsSendingAlerts(true);
    await sendOverdueAlerts();
    setIsSendingAlerts(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
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
    notify('Configuration Saved', 'ERP bridge, email, and trigger settings updated.');
  };

  const getRelativeTime = (timestamp: string) => {
    const past = new Date(timestamp);
    const diffMins = Math.floor((currentTime.getTime() - past.getTime()) / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return past.toLocaleDateString();
  };

  const lastInvSync = syncLogs.find(l => l.entity === 'Inventory');
  const lastOrderSync = syncLogs.find(l => l.entity === 'Order');
  const filteredLogs =
    logFilter === 'ALL' ? syncLogs : syncLogs.filter(l => l.entity === logFilter);

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Database size={17} />
          </div>
          <div>
            <h1 className="text-[15px] font-display font-bold text-slate-900">
              Epicor P21 ERP Bridge & System Administration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bidirectional Epicor P21 customer/order sync, automated monthly statement alert sweeps, and backup archives.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-mono font-semibold text-emerald-700">
            P21 Gateway v1 · Connected
          </span>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <Settings2 size={14} />
            <span>Configure Bridge & Alerts</span>
          </button>
        </div>
      </div>

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left 8 Cols: Sync Controls & Audit Table */}
        <div className="lg:col-span-8 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Inventory Sync */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-slate-900">
                    P21 Inventory Parity
                  </span>
                  <RefreshCw size={14} className="text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Sync serialized tool availability, MSRP, and warehouse bin locations with P21 Item Master.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={handleP21InventorySync}
                  disabled={isSyncingInventory}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSyncingInventory ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <CheckCircle2 size={13} />
                  )}
                  <span>{isSyncingInventory ? 'Syncing...' : 'Sync Inventory'}</span>
                </button>
                {lastInvSync && (
                  <p className="text-[11px] font-mono text-slate-500 text-center">
                    Last sync: {getRelativeTime(lastInvSync.timestamp)}
                  </p>
                )}
              </div>
            </div>

            {/* Order & Contract Sync */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-slate-900">
                    P21 Order & Contract Sync
                  </span>
                  <ArrowRightLeft size={14} className="text-indigo-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Push new contracts, quotes, repair work orders, and monthly billing deltas to P21 Sales Orders.
                </p>
              </div>
              <div className="space-y-1.5">
                {isSyncingOrders && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span className="truncate">{syncStatus}</span>
                      <span>{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <button
                  onClick={handleP21OrderSync}
                  disabled={isSyncingOrders}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSyncingOrders ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <ArrowRightLeft size={13} />
                  )}
                  <span>{isSyncingOrders ? 'Syncing Orders...' : 'Sync Orders'}</span>
                </button>
                {lastOrderSync && !isSyncingOrders && (
                  <p className="text-[11px] font-mono text-slate-500 text-center">
                    Last sync: {getRelativeTime(lastOrderSync.timestamp)}
                  </p>
                )}
              </div>
            </div>

            {/* Overdue Alert Sweep */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-slate-900">
                    Monthly Alert Sweep
                  </span>
                  <Bell size={14} className="text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Dispatch overdue tool return reminders & open November statement notices via {emailSettings.provider}.
                </p>
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={handleAlertSweep}
                  disabled={isSendingAlerts}
                  className="w-full py-2 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSendingAlerts ? (
                    <RefreshCw className="animate-spin" size={13} />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{isSendingAlerts ? 'Dispatching...' : 'Send Overdue Notices'}</span>
                </button>
                <p className="text-[11px] font-mono text-slate-500 text-center">
                  Sender: {emailSettings.fromAddress}
                </p>
              </div>
            </div>
          </div>

          {/* Sync Audit Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <History size={14} className="text-blue-600" />
                <h2 className="text-xs font-display font-bold text-slate-900">
                  Epicor P21 Synchronization Audit Log ({filteredLogs.length})
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {(['ALL', 'Order', 'Customer', 'Inventory'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      logFilter === f
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-medium text-slate-500 sticky top-0">
                  <tr>
                    <th className="py-2 px-3.5">Time</th>
                    <th className="py-2 px-2.5">Entity</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-3.5">Synchronization Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2 px-2.5 font-mono font-semibold text-slate-700">
                        {log.entity}
                      </td>
                      <td className="py-2 px-2.5">
                        <span
                          className={`text-[11px] font-semibold ${
                            log.status === 'Success' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3.5 text-slate-700">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Data Management & Security Compliance */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-3">
            <h3 className="text-xs font-display font-bold text-slate-900">
              Snapshot Export & Disaster Recovery
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Download a full JSON snapshot of serialized tools, active rental contracts, quotes, work orders, and consolidated monthly statements.
            </p>
            <div className="space-y-2">
              <button
                onClick={exportBackup}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Download size={14} />
                <span>Export System Backup (.json)</span>
              </button>
              <label className="w-full py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload size={14} />
                <span>Restore Backup Snapshot</span>
                <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <h4 className="text-xs font-display font-bold text-slate-900">
                P21 Audit & Ledger Integrity
              </h4>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every customer vetting approval, rental contract placement, quote conversion, and monthly statement update records deterministic P21 parity events.
            </p>
            <div className="pt-1 text-[11px] font-mono text-slate-500 border-t border-slate-100">
              Endpoint: {localP21.apiUrl}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-48 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 p-3 flex sm:flex-col gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('erp')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'erp'
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Database size={14} />
                <span>ERP Bridge</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('email')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'email'
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Mail size={14} />
                <span>Email Relay</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-white text-blue-600 border border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Bell size={14} />
                <span>Alert Triggers</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-display font-bold text-slate-900">
                  {activeTab === 'erp'
                    ? 'Epicor P21 Interface'
                    : activeTab === 'email'
                    ? 'Email Relay Configuration'
                    : 'Automated Notification Triggers'}
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-4 space-y-4 text-xs flex-1">
                {activeTab === 'erp' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-700 block mb-1">
                        P21 Endpoint URL
                      </label>
                      <input
                        type="url"
                        value={localP21.apiUrl}
                        onChange={e => setLocalP21({ ...localP21, apiUrl: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 block mb-1">
                          Polling Interval
                        </label>
                        <select
                          value={localP21.syncInterval}
                          onChange={e =>
                            setLocalP21({ ...localP21, syncInterval: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        >
                          <option value="15m">Every 15 Minutes</option>
                          <option value="30m">Every 30 Minutes</option>
                          <option value="1h">Hourly</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 block mb-1">
                          Gateway Token
                        </label>
                        <input
                          type="password"
                          value="****************"
                          readOnly
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-slate-700 block mb-1">
                        Relay Provider
                      </label>
                      <select
                        value={localEmail.provider}
                        onChange={e =>
                          setLocalEmail({ ...localEmail, provider: e.target.value as any })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      >
                        <option value="SendGrid">SendGrid</option>
                        <option value="SMTP">Enterprise SMTP</option>
                        <option value="Mailchimp">Mailchimp Transactional</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 block mb-1">
                          From Address
                        </label>
                        <input
                          type="email"
                          value={localEmail.fromAddress}
                          onChange={e =>
                            setLocalEmail({ ...localEmail, fromAddress: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-slate-700 block mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={localEmail.senderName}
                          onChange={e =>
                            setLocalEmail({ ...localEmail, senderName: e.target.value })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-2">
                    {[
                      {
                        id: 'overdueInvoices',
                        label: 'Overdue Monthly Statement Alerts',
                        desc: 'Notify billing contacts 72h past due date.'
                      },
                      {
                        id: 'lateReturns',
                        label: 'Late & Multiple Return Date Alerts',
                        desc: 'Flag off-schedule tools accruing 18% APR interest.'
                      },
                      {
                        id: 'lowStockAlerts',
                        label: 'Category Buffer Thresholds',
                        desc: 'Warn dispatchers when ready-to-rent buffer reaches 1 unit.'
                      },
                      {
                        id: 'dailyDigest',
                        label: 'Morning Operations Digest',
                        desc: 'Send 06:00 EST return dock & repair summary.'
                      }
                    ].map(notif => {
                      const enabled =
                        localNotifications[notif.id as keyof typeof localNotifications];
                      return (
                        <div
                          key={notif.id}
                          className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{notif.label}</p>
                            <p className="text-[11px] text-slate-500">{notif.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLocalNotifications({
                                ...localNotifications,
                                [notif.id]: !enabled
                              })
                            }
                            className={enabled ? 'text-blue-600' : 'text-slate-300'}
                          >
                            {enabled ? <ToggleRight size={30} /> : <ToggleLeft size={30} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3.5 py-1.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsole;
