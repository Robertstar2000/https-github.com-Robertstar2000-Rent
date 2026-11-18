import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, RefreshCw, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { ItemStatus } from '../types';

interface AuditRecommendation {
  category: string;
  available: number;
  outOrReserved: number;
  inRepairOrMissing: number;
  riskLevel: 'Low' | 'Watch' | 'Critical';
  action: string;
}

const AIInsights: React.FC = () => {
  const navigate = useNavigate();
  const { inventory, contracts, workOrders, replacementOrders } = useData();
  const [isThinking, setIsThinking] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [reportSource, setReportSource] = useState<'Gemini Live' | 'Local Operational Audit'>(
    'Local Operational Audit'
  );

  const missingCount = inventory.filter(i => i.status === ItemStatus.MISSING).length;
  const repairCount = inventory.filter(
    i => i.status === ItemStatus.MAINTENANCE || i.status === ItemStatus.DAMAGED
  ).length;
  const scrappedCount = inventory.filter(i => i.status === ItemStatus.SCRAPPED).length;
  const availableCount = inventory.filter(i => i.status === ItemStatus.AVAILABLE).length;

  const toolHealthScore = useMemo(() => {
    if (inventory.length === 0) return 100;
    const avgScore =
      inventory.reduce((s, i) => s + (i.conditionScore ?? 92), 0) / inventory.length;
    return Math.round(avgScore);
  }, [inventory]);

  const shrinkagePct = Math.round(((missingCount + scrappedCount) / (inventory.length || 1)) * 100);

  const categoryBreakdown: AuditRecommendation[] = useMemo(() => {
    const cats = Array.from(new Set(inventory.map(i => i.category)));
    return cats.map(cat => {
      const subset = inventory.filter(i => i.category === cat);
      const avail = subset.filter(i => i.status === ItemStatus.AVAILABLE).length;
      const out = subset.filter(
        i => i.status === ItemStatus.RENTED || i.status === ItemStatus.INSPECTION
      ).length;
      const disrupted = subset.filter(
        i =>
          i.status === ItemStatus.MAINTENANCE ||
          i.status === ItemStatus.DAMAGED ||
          i.status === ItemStatus.MISSING ||
          i.status === ItemStatus.SCRAPPED
      ).length;

      const riskLevel: AuditRecommendation['riskLevel'] =
        avail === 0 && disrupted > 0
          ? 'Critical'
          : avail <= 1 && disrupted > 0
          ? 'Watch'
          : 'Low';

      const action =
        riskLevel === 'Critical'
          ? `Expedite OEM Replacement PO / Close open Repair WOs (${disrupted} units unavailable)`
          : riskLevel === 'Watch'
          ? `Monitor dock return turnaround; prioritize incoming inspection`
          : `Adequate buffer (${avail} unit${avail === 1 ? '' : 's'} ready for immediate dispatch)`;

      return {
        category: cat,
        available: avail,
        outOrReserved: out,
        inRepairOrMissing: disrupted,
        riskLevel,
        action
      };
    });
  }, [inventory]);

  const generateDeterministicReport = () => {
    const openWoTotal = workOrders
      .filter(w => w.status !== 'Completed')
      .reduce((s, w) => s + w.totalCost, 0);
    const activeRoTotal = replacementOrders.reduce((s, r) => s + r.totalBilledToCustomer, 0);
    const overdueContracts = contracts.filter(c => c.flowStage === 'Late / Overdue').length;
    const criticalCats = categoryBreakdown
      .filter(c => c.riskLevel !== 'Low')
      .map(c => `• ${c.category}: ${c.action}`)
      .join('\n');

    setApiError(null);
    setReportSource('Local Operational Audit');
    setReport(
      [
        `EXECUTIVE TOOL INVENTORY & BILLING AUDIT — NOVEMBER 2026`,
        `────────────────────────────────────────────────────────────────`,
        `1. Tool Health Score: ${toolHealthScore}/100 across ${inventory.length} serialized utility assets (${availableCount} Ready · ${repairCount} In Repair · ${missingCount} Missing · ${scrappedCount} Scrapped BER).`,
        `2. Return & Exception Exposure: ${overdueContracts} overdue contract(s) accruing 18% APR interest; $${openWoTotal.toFixed(2)} in active shop work orders and $${activeRoTotal.toFixed(2)} in OEM replacement POs.`,
        `3. Category Shortage & Reorder Advisories:`,
        criticalCats || '• All tool categories currently maintain positive ready-to-rent buffer stock.',
        `4. Recommended Actions:`,
        `• Prioritize Return Dock inspection on contracts at Day 0 to release ready-to-rent stringing and dielectric units.`,
        `• Verify OEM replacement lead times for Missing & Scrapped (BER) serials to prevent jobsite staging delays.`
      ].join('\n')
    );
  };

  const runAIAudit = async () => {
    setIsThinking(true);
    setApiError(null);
    try {
      const context = {
        inventory: inventory.map(i => ({
          name: i.name,
          status: i.status,
          category: i.category,
          conditionScore: i.conditionScore
        })),
        contractsCount: contracts.length,
        missingCount,
        repairCount,
        scrappedCount
      };

      const res = await fetch('/api/ai/inventory-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(data.error || `Inventory audit request failed (HTTP ${res.status}).`);
        return;
      }
      setReportSource('Gemini Live');
      setReport(data.report || '');
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Unable to reach AI audit service.'
      );
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Unified Header + 4-KPI Telemetry Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <BrainCircuit size={17} />
            </div>
            <div>
              <h1 className="text-[15px] font-display font-bold text-slate-900">
                Tool Health & Shortage Intelligence
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated inventory health auditing, shortage forecasting, and OEM reorder recommendations.
              </p>
            </div>
          </div>

          <button
            onClick={runAIAudit}
            disabled={isThinking}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isThinking ? (
              <RefreshCw className="animate-spin" size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{isThinking ? 'Running Audit...' : 'Run Intelligence Audit'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 font-mono tabular-nums">
          <div className="p-3.5">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Inventory Health Score
            </span>
            <span className="text-lg font-bold text-emerald-700">{toolHealthScore} / 100</span>
          </div>
          <div className="p-3.5">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Shrinkage / BER Loss
            </span>
            <span className="text-lg font-bold text-rose-700">
              {shrinkagePct}% ({missingCount + scrappedCount} units)
            </span>
          </div>
          <div className="p-3.5">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Repair Shop Load
            </span>
            <span className="text-lg font-bold text-orange-700">
              {repairCount} tools ({workOrders.filter(w => w.status !== 'Completed').length} WOs)
            </span>
          </div>
          <div className="p-3.5">
            <span className="font-sans text-[11px] font-medium text-slate-500 block">
              Pending OEM Reorders
            </span>
            <span className="text-lg font-bold text-purple-700">
              {replacementOrders.length} POs
            </span>
          </div>
        </div>
      </div>

      {/* Category Risk Matrix & Executive Audit Output */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
        <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-slate-900">
              Category Buffer & Shortage Exposure
            </h2>
            <button
              onClick={() => navigate('/returns')}
              className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Manage Repairs</span>
              <ArrowRight size={11} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/60 border-b border-slate-200 text-[11px] font-medium text-slate-500">
                <tr>
                  <th className="py-2 px-3.5">Category</th>
                  <th className="py-2 px-2 text-right">Ready</th>
                  <th className="py-2 px-2 text-right">Out</th>
                  <th className="py-2 px-2 text-right">Shop/Lost</th>
                  <th className="py-2 px-3.5">Risk & Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryBreakdown.map(row => (
                  <tr key={row.category} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">{row.category}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-emerald-700 font-semibold">
                      {row.available}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                      {row.outOrReserved}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-orange-700 font-semibold">
                      {row.inRepairOrMissing}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <span
                        className={`text-[11px] font-semibold block ${
                          row.riskLevel === 'Critical'
                            ? 'text-rose-700'
                            : row.riskLevel === 'Watch'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {row.riskLevel} Risk
                      </span>
                      <span className="text-[11px] text-slate-600">{row.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Audit Report */}
        <div className="xl:col-span-6 bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col min-h-[340px]">
          <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-slate-900">
              Strategic Tool & Shortage Audit Report
            </h2>
            {report && (
              <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                {reportSource}
              </span>
            )}
          </div>

          <div className="flex-1 p-5 bg-white">
            {isThinking ? (
              <div className="h-full py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-9 h-9 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">
                  Evaluating utilization, open repair WOs, and OEM lead times...
                </p>
              </div>
            ) : apiError ? (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-amber-950">
                      Live AI Audit Service Notice
                    </h4>
                    <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">{apiError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateDeterministicReport}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  Generate Local Operational Audit
                </button>
              </div>
            ) : report ? (
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700 leading-relaxed">
                {report}
              </pre>
            ) : (
              <div className="h-full py-14 flex flex-col items-center justify-center text-center space-y-3">
                <BrainCircuit size={32} className="text-slate-300" />
                <div>
                  <h4 className="text-sm font-display font-semibold text-slate-900">
                    Ready to Audit Tool Availability & Reorder Exposure
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Click &ldquo;Run Intelligence Audit&rdquo; to evaluate shortage risks, open repair bottlenecks, and monthly recovery opportunities.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;
