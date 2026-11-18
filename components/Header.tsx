import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  ArrowRight,
  Users,
  Box,
  ClipboardCheck,
  ShieldAlert
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import WorkflowOversightDrawer from './WorkflowOversightDrawer';

const Header: React.FC = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isOversightOpen, setIsOversightOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { toasts, dismissToast, contracts, customers, inventory, workflowIssues } = useData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandOpen(false);
        setIsHelpOpen(false);
        setIsOversightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageBreadcrumb = () => {
    switch (location.pathname) {
      case '/':
        return 'Rental View / Command Center';
      case '/new-order':
        return 'Operations / New Order & Contract Builder';
      case '/flowchart':
        return 'Rental View / Customer Time & Return Status Flow Chart';
      case '/returns':
        return 'Operations / Returns, Repair & Replacements';
      case '/inventory':
        return 'Operations / Tool & Equipment Inventory';
      case '/contracts':
        return 'Operations / Contracts, Multiple Return Dates & Shipments';
      case '/customers':
        return 'Operations / Customers & Monthly Consolidated Billing';
      case '/onboard-customer':
        return 'Operations / Onboard New Rental Customer & D&B Vetting';
      case '/reports':
        return 'Rental View / Analytics & Reports';
      case '/scan360':
        return 'Inspection / Scan360 Optical Tool Audit';
      case '/ai-insights':
        return 'Intelligence / Tool Health & Shortage Audit';
      case '/admin':
        return 'ERP / Epicor P21 Bridge & Admin Console';
      default:
        return 'TallmanRent Operations Suite';
    }
  };

  const quickResults = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    const matchedContracts = contracts
      .filter(
        c =>
          !q ||
          c.id.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          (c.jobSite || '').toLowerCase().includes(q)
      )
      .slice(0, 4);
    const matchedCustomers = customers
      .filter(
        c =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          (c.p21Id || '').toLowerCase().includes(q)
      )
      .slice(0, 3);
    const matchedTools = inventory
      .filter(
        i =>
          !q ||
          i.id.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.serialNumber.toLowerCase().includes(q)
      )
      .slice(0, 4);
    return { matchedContracts, matchedCustomers, matchedTools };
  }, [commandQuery, contracts, customers, inventory]);

  return (
    <>
      <header className="h-12 border-b border-slate-200 bg-white sticky top-0 z-10 px-4 flex items-center justify-between gap-4 shrink-0">
        {/* Zone 1: Contextual Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[13px] font-display font-semibold text-slate-900 truncate whitespace-nowrap">
            {getPageBreadcrumb()}
          </span>
        </div>

        {/* Zone 2: Global Command Search Bar */}
        <button
          type="button"
          onClick={() => setIsCommandOpen(true)}
          className="hidden md:flex items-center justify-between gap-6 w-80 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 transition-colors"
        >
          <span className="flex items-center gap-2 truncate">
            <Search size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">Jump to contract, customer, or serial...</span>
          </span>
          <kbd className="font-mono text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
            ⌘K
          </kbd>
        </button>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCommandOpen(true)}
            className="md:hidden p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            title="Quick Search"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => setIsOversightOpen(true)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              workflowIssues.some(i => i.severity === 'critical')
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                : workflowIssues.length > 0
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <ShieldAlert
              size={13}
              className={
                workflowIssues.some(i => i.severity === 'critical')
                  ? 'text-rose-600'
                  : 'text-amber-600'
              }
            />
            <span className="font-mono tabular-nums">Oversight ({workflowIssues.length})</span>
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <HelpCircle size={13} className="text-blue-600" />
            <span>Guide</span>
          </button>
          <button
            onClick={() => navigate('/returns')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
          >
            <ClipboardCheck size={13} />
            <span>Inspect Return</span>
          </button>
        </div>
      </header>

      <WorkflowOversightDrawer
        isOpen={isOversightOpen}
        onClose={() => setIsOversightOpen(false)}
      />

      {/* Non-Blocking Toast Notifications Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map(t => (
            <div
              key={t.id}
              className="pointer-events-auto bg-white text-slate-900 p-3 rounded-xl border border-slate-200 shadow-lg flex items-start justify-between gap-2.5"
            >
              <div className="flex items-start gap-2.5">
                {t.type === 'warning' || t.type === 'error' ? (
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                ) : t.type === 'info' ? (
                  <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-semibold text-slate-900">{t.title}</p>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{t.message}</p>
                </div>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Global Command Quick Jump Modal */}
      {isCommandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setIsCommandOpen(false)}
          />
          <div className="relative bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center gap-2.5">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                placeholder="Search contract ID, quote, customer, tool, or serial number..."
                className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="text-xs font-mono text-slate-400 hover:text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 p-2 space-y-2 text-xs">
              {quickResults.matchedContracts.length > 0 && (
                <div className="pt-1">
                  <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                    Contracts & Quotes
                  </p>
                  {quickResults.matchedContracts.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setIsCommandOpen(false);
                        navigate('/contracts', { state: { contractId: c.id } });
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} className="text-blue-600 shrink-0" />
                        <span className="font-mono font-semibold text-blue-600">{c.id}</span>
                        <span className="font-medium text-slate-900 truncate">{c.customerName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[11px] text-slate-500 truncate">{c.flowStage}</span>
                      </div>
                      <ArrowRight size={13} className="text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {quickResults.matchedCustomers.length > 0 && (
                <div className="pt-2">
                  <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                    Customers & Monthly Statements
                  </p>
                  {quickResults.matchedCustomers.map(cust => (
                    <button
                      key={cust.id}
                      onClick={() => {
                        setIsCommandOpen(false);
                        navigate('/customers', { state: { customerId: cust.id } });
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Users size={14} className="text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-900 truncate">{cust.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {cust.p21Id} · ${(cust.monthlyBillingTotal ?? cust.balance).toLocaleString()}
                        </span>
                      </div>
                      <ArrowRight size={13} className="text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {quickResults.matchedTools.length > 0 && (
                <div className="pt-2">
                  <p className="px-2 py-1 text-[11px] font-semibold text-slate-400">
                    Serialized Tools & Equipment
                  </p>
                  {quickResults.matchedTools.map(tool => (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setIsCommandOpen(false);
                        navigate('/inventory', { state: { itemId: tool.id } });
                      }}
                      className="w-full px-2.5 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Box size={14} className="text-slate-600 shrink-0" />
                        <span className="font-mono font-semibold text-slate-700">{tool.id}</span>
                        <span className="font-medium text-slate-900 truncate">{tool.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-[11px] text-slate-500">{tool.status}</span>
                      </div>
                      <ArrowRight size={13} className="text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Operations Quick Reference Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setIsHelpOpen(false)}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <h3 className="text-sm font-display font-semibold text-slate-900">
                  TallmanRent Operations & Monthly Billing Quick Reference
                </h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <p className="font-semibold text-slate-900">1. New Orders, Quotes & Staged Shipments</p>
                <p className="mt-0.5">
                  Select an Epicor P21 customer (or onboard & vet a new customer) to auto-fill billing/jobsite addresses, split tools across multiple fulfillment shipments, and either email a bright yellow Quote or place an Active Rental Order.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <p className="font-semibold text-slate-900">2. Customer Flow Chart & Return Timing</p>
                <p className="mt-0.5">
                  Every rental customer is plotted horizontally by time (Days Early, Dock Day 0, Days Late/Off-Schedule) and vertically by lifecycle stage. Handles Early Return credits, Late 1.5x surcharges + 18% APR interest, Multiple Return Dates, and Partial Return Replacement POs.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <p className="font-semibold text-slate-900">3. 5-Point Inspection, Repair WOs, Scrap & Monthly Statements</p>
                <p className="mt-0.5">
                  Damaged returns create Repair Work Orders (Labor, Materials, OEM Part Reorders) or Scrap (BER total loss minus salvage) and automatically consolidate all charges and credits into each customer&apos;s November 2026 Monthly Statement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;