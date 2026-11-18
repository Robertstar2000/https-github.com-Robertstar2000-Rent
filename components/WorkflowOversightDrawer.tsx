import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { WorkflowIssue } from '../types';

interface WorkflowOversightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: Array<'ALL' | WorkflowIssue['category']> = [
  'ALL',
  'Late Payment & Re-Vetting',
  'Overdue Return',
  'High Damage / Scrap Rate',
  'Human Input Required',
  'Data Inconsistency'
];

const WorkflowOversightDrawer: React.FC<WorkflowOversightDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    workflowIssues,
    customers,
    contracts,
    inventory,
    invoices,
    workOrders,
    replacementOrders,
    openReVettingModal
  } = useData();

  const [categoryFilter, setCategoryFilter] = useState<'ALL' | WorkflowIssue['category']>('ALL');
  const [aiAuditText, setAiAuditText] = useState<string | null>(null);
  const [aiAuditSource, setAiAuditSource] = useState<string | null>(null);
  const [aiAuditError, setAiAuditError] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const counts = useMemo(() => {
    return {
      critical: workflowIssues.filter(i => i.severity === 'critical').length,
      warning: workflowIssues.filter(i => i.severity === 'warning').length,
      info: workflowIssues.filter(i => i.severity === 'info').length
    };
  }, [workflowIssues]);

  const filteredIssues = useMemo(() => {
    if (categoryFilter === 'ALL') return workflowIssues;
    return workflowIssues.filter(i => i.category === categoryFilter);
  }, [workflowIssues, categoryFilter]);

  if (!isOpen) return null;

  const handleAction = (issue: WorkflowIssue) => {
    if (issue.requiresReVetting && issue.customerId) {
      const cust = customers.find(c => c.id === issue.customerId);
      if (cust) {
        onClose();
        openReVettingModal(cust);
        return;
      }
    }
    onClose();
    navigate(issue.targetRoute, {
      state: {
        contractId: issue.contractId,
        customerId: issue.customerId
      }
    });
  };

  const runDeepAiAudit = async () => {
    setIsAuditing(true);
    setAiAuditError(null);

    try {
      const summary = {
        totalIssuesDetected: workflowIssues.length,
        issues: workflowIssues.map(i => ({
          id: i.id,
          severity: i.severity,
          category: i.category,
          title: i.title,
          errorMessage: i.errorMessage
        })),
        paymentRiskCustomers: customers
          .filter(c => (c.latePaymentsCount || 0) >= 2 || (c.maxDaysOverdue || 0) > 61)
          .map(c => ({
            id: c.id,
            name: c.name,
            latePaymentsCount: c.latePaymentsCount || 0,
            maxDaysOverdue: c.maxDaysOverdue || 0,
            balance: c.balance
          })),
        overdueInvoicesCount: invoices.filter(i => i.status === 'Overdue').length,
        overdueContracts: contracts
          .filter(c => c.flowStage === 'Late / Overdue')
          .map(c => ({ id: c.id, customerName: c.customerName, daysDelta: c.daysDelta })),
        openWorkOrders: workOrders.filter(w => w.status !== 'Completed' && w.status !== 'Scrapped - BER').length,
        openReplacementOrders: replacementOrders.filter(
          r => r.status !== 'Received & Inventory Indexed'
        ).length,
        totalTools: inventory.length
      };

      const res = await fetch('/api/ai/workflow-oversight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `AI oversight request failed (HTTP ${res.status}).`);
      }
      setAiAuditText(data.analysis || 'No additional hidden anomalies detected.');
      setAiAuditSource(data.source || 'Gemini Workflow Oversight');
    } catch (err) {
      setAiAuditError(err instanceof Error ? err.message : 'Unable to reach AI oversight service.');
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-2xl bg-[#F8FAFC] h-full border-l border-slate-200 shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-slate-900">
                AI Workflow Oversight & Exception Monitor
              </h2>
              <p className="text-[11px] text-slate-500">
                Continuous detection of overdue returns, &gt;61d / repeat late-payment re-vetting, damage ratios &amp; human input gaps.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary Strip & Deep AI Trigger */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="font-semibold text-rose-700">{counts.critical} Critical</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-amber-700">{counts.warning} Warning</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-blue-700">{counts.info} Info</span>
          </div>

          <button
            type="button"
            disabled={isAuditing}
            onClick={runDeepAiAudit}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-60"
          >
            {isAuditing ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Running Gemini Audit...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Run AI Deep Workflow Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 shrink-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? `All (${workflowIssues.length})` : cat}
            </button>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* AI Deep Analysis Result or Transparent Configuration Message */}
          {aiAuditError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
              <strong className="block font-semibold">Live AI Workflow Audit Notice</strong>
              <p className="text-[11px] mt-0.5 leading-relaxed">{aiAuditError}</p>
            </div>
          )}

          {aiAuditText && (
            <div className="p-3.5 bg-white border border-blue-200 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  Executive AI Workflow Diagnosis
                </span>
                <span className="font-mono text-[10px] text-blue-700">{aiAuditSource}</span>
              </div>
              <div className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                {aiAuditText}
              </div>
            </div>
          )}

          {filteredIssues.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-2">
              <CheckCircle2 size={28} className="text-emerald-600 mx-auto" />
              <p className="text-sm font-display font-semibold text-slate-900">
                Zero Errors Detected in This Category
              </p>
              <p className="text-xs text-slate-500">
                All tool contracts, customer vetting checks, and P21 monthly balances are aligned.
              </p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div
                key={issue.id}
                className={`bg-white rounded-xl border p-3.5 space-y-2 shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
                  issue.severity === 'critical'
                    ? 'border-rose-200'
                    : issue.severity === 'warning'
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    {issue.severity === 'critical' ? (
                      <ShieldAlert size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    ) : issue.severity === 'warning' ? (
                      <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info size={15} className="text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-semibold text-slate-500 block">
                        {issue.category} · {issue.entityId}
                      </span>
                      <h3 className="text-xs font-display font-bold text-slate-900">
                        {issue.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAction(issue)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap ${
                      issue.requiresReVetting
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {issue.requiresReVetting ? <UserCheck size={12} /> : <ArrowRight size={12} />}
                    <span>{issue.actionLabel}</span>
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70 space-y-1.5 text-[11px]">
                  <p className="text-slate-800">
                    <strong className="text-rose-800">Error / Risk: </strong>
                    {issue.errorMessage}
                  </p>
                  <p className="text-slate-700">
                    <strong className="text-slate-900">How to Correct: </strong>
                    {issue.instructions}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default WorkflowOversightDrawer;
