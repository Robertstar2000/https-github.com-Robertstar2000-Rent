import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Globe,
  ExternalLink,
  AlertTriangle,
  Database,
  RefreshCw,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Customer, CustomerVettingData } from '../types';
import { getCustomerPaymentRisk } from '../services/workflowOversight';

type LookupResult = CustomerVettingData & {
  p21MatchFound: boolean;
  matchedP21Id?: string;
  suggestedTerms: string;
  existingBalanceInP21: number;
};

interface CustomerOnboardingWorkbenchProps {
  compact?: boolean;
  prefillCustomer?: Customer | null;
  onCancel?: () => void;
  onApproved?: (customer: Customer) => void;
  onDisapproved?: (customer: Customer) => void;
}

const initialFormState = {
  name: '',
  dbaName: '',
  website: '',
  taxId: '',
  industrySector: 'Transmission & Grid Utility',
  contactPerson: '',
  billingContactName: '',
  email: '',
  operationsEmail: '',
  phone: '',
  secondaryPhone: '',
  billingAddress: '',
  shippingJobsiteAddress: '',
  sameAsBilling: false,
  paymentTerms: 'Net 30',
  requestedCreditLimit: 35000,
  taxExemptCert: ''
};

const CustomerOnboardingWorkbench: React.FC<CustomerOnboardingWorkbenchProps> = ({
  compact = false,
  prefillCustomer = null,
  onCancel,
  onApproved,
  onDisapproved
}) => {
  const {
    customers,
    disapprovedApplications,
    invoices,
    researchCustomerForVetting,
    addCustomer,
    updateCustomerAfterReVetting,
    disapproveExistingCustomer,
    rejectCustomerApplication
  } = useData();

  const [form, setForm] = useState(initialFormState);
  const [isResearching, setIsResearching] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [vettingResult, setVettingResult] = useState<LookupResult | null>(null);
  const [approvedLimitOverride, setApprovedLimitOverride] = useState<number>(35000);
  const [finalTerms, setFinalTerms] = useState<string>('Net 30');
  const [vettingNotes, setVettingNotes] = useState<string>('');
  const [showDisapproveInput, setShowDisapproveInput] = useState(false);
  const [disapprovalReason, setDisapprovalReason] = useState('');
  const [lastDecision, setLastDecision] = useState<{
    type: 'Approved' | 'Disapproved';
    customer: Customer;
  } | null>(null);
  const [autoFilledFromP21, setAutoFilledFromP21] = useState<boolean>(false);

  const hydrateFromCustomer = (cust: Customer) => {
    const bill = cust.billingAddress || cust.address || '';
    const ship = cust.shippingJobsiteAddress || cust.address || '';
    setForm({
      name: cust.name || '',
      dbaName: cust.dbaName || '',
      website: cust.website || '',
      taxId: cust.vetting?.taxId || '',
      industrySector: cust.industrySector || 'Transmission & Grid Utility',
      contactPerson: cust.contactPerson || '',
      billingContactName: cust.billingContactName || '',
      email: cust.email || '',
      operationsEmail: cust.operationsEmail || '',
      phone: cust.phone || '',
      secondaryPhone: cust.secondaryPhone || '',
      billingAddress: bill,
      shippingJobsiteAddress: ship,
      sameAsBilling: Boolean(bill && bill === ship),
      paymentTerms: cust.paymentTerms || 'Net 30',
      requestedCreditLimit: cust.creditLimit || cust.vetting?.approvedCreditLimit || 35000,
      taxExemptCert: cust.taxExemptCert || ''
    });
    setApprovedLimitOverride(cust.creditLimit || cust.vetting?.approvedCreditLimit || 35000);
    setFinalTerms(cust.paymentTerms || 'Net 30');
    setAutoFilledFromP21(true);
    setResearchError(null);
    setVettingResult(null);
    setShowDisapproveInput(false);
    setDisapprovalReason('');
    setLastDecision(null);
  };

  useEffect(() => {
    if (prefillCustomer) {
      hydrateFromCustomer(prefillCustomer);
    } else {
      setAutoFilledFromP21(false);
    }
  }, [prefillCustomer]);

  const prefillRisk = useMemo(
    () => (prefillCustomer ? getCustomerPaymentRisk(prefillCustomer, invoices) : null),
    [prefillCustomer, invoices]
  );

  // Live P21 / Local DB Lookup when typing a new customer's name or EIN so user never re-enters existing data
  const matchedExistingRecord = useMemo(() => {
    if (prefillCustomer) return null;
    const nameQ = form.name.trim().toLowerCase();
    const taxQ = form.taxId.trim().toLowerCase();
    if (nameQ.length < 4 && taxQ.length < 5) return null;
    const allPool = [...customers, ...disapprovedApplications];
    return (
      allPool.find(
        c =>
          (nameQ.length >= 4 && c.name.toLowerCase().includes(nameQ)) ||
          (taxQ.length >= 5 && (c.vetting?.taxId || '').toLowerCase() === taxQ)
      ) || null
    );
  }, [prefillCustomer, form.name, form.taxId, customers, disapprovedApplications]);

  const applySampleProfile = (profile: 'prime' | 'watchlist' | 'public_corp') => {
    setResearchError(null);
    setVettingResult(null);
    setShowDisapproveInput(false);
    setDisapprovalReason('');
    setLastDecision(null);

    if (profile === 'public_corp') {
      setForm({
        name: 'Quanta Services, Inc.',
        dbaName: 'Quanta Electric Power Infrastructure',
        website: 'https://www.quantaservices.com',
        taxId: '74-2851603',
        industrySector: 'Transmission & Grid Utility',
        contactPerson: 'Marcus Vance (VP Grid Fleet Operations)',
        billingContactName: 'Elena Ortiz (Corporate A/P)',
        email: 'ap-rentals@quantaservices-example.com',
        operationsEmail: 'dispatch@quantaservices-example.com',
        phone: '(713) 629-7600',
        secondaryPhone: '(713) 555-0194',
        billingAddress: '2727 North Loop West, Houston, TX 77008',
        shippingJobsiteAddress: 'Permian Basin 345kV Transmission Yard, Midland, TX 79701',
        sameAsBilling: false,
        paymentTerms: 'Net 45',
        requestedCreditLimit: 75000,
        taxExemptCert: 'TX-UTL-88412'
      });
    } else if (profile === 'prime') {
      setForm({
        name: 'Tri-State Transmission & Grid Co.',
        dbaName: 'Tri-State Line Services',
        website: 'https://www.tristategrid.com',
        taxId: '31-4490218',
        industrySector: 'Substation EPC Contractor',
        contactPerson: 'Rachel Foster (Grid Ops Director)',
        billingContactName: 'Kevin Brooks (A/P Manager)',
        email: 'ap@tristategrid.com',
        operationsEmail: 'tools@tristategrid.com',
        phone: '(614) 555-0182',
        secondaryPhone: '(614) 555-0199',
        billingAddress: '450 Civic Center Dr, Suite 900, Columbus, OH 43215',
        shippingJobsiteAddress: 'Licking Valley 345kV Substation Yard, Newark, OH 43055',
        sameAsBilling: false,
        paymentTerms: 'Net 30',
        requestedCreditLimit: 40000,
        taxExemptCert: 'OH-EX-44219'
      });
    } else {
      setForm({
        name: 'Delta Subsurface Contracting LLC',
        dbaName: 'Delta Trench & Conduit',
        website: 'https://www.deltasubsurface.com',
        taxId: '72-8831044',
        industrySector: 'Underground Distribution',
        contactPerson: 'Grant Miller (Field Supt)',
        billingContactName: 'Tina Landry (Controller)',
        email: 'billing@deltasubsurface.com',
        operationsEmail: 'yard@deltasubsurface.com',
        phone: '(504) 555-0149',
        secondaryPhone: '(225) 555-0177',
        billingAddress: '1820 Veterans Memorial Blvd, Metairie, LA 70005',
        shippingJobsiteAddress: 'Baton Rouge Underground Duct Bank Site B, LA 70802',
        sameAsBilling: false,
        paymentTerms: 'Net 15',
        requestedCreditLimit: 15000,
        taxExemptCert: ''
      });
    }
  };

  const resetAll = () => {
    setForm(initialFormState);
    setVettingResult(null);
    setResearchError(null);
    setShowDisapproveInput(false);
    setDisapprovalReason('');
    setLastDecision(null);
    setAutoFilledFromP21(false);
  };

  const runResearch = async (mode: 'live' | 'simulation') => {
    if (!form.name.trim()) return;
    setIsResearching(true);
    setResearchError(null);
    setShowDisapproveInput(false);
    setLastDecision(null);

    try {
      const effectiveShipTo = form.sameAsBilling
        ? form.billingAddress
        : form.shippingJobsiteAddress || form.billingAddress;

      const result = await researchCustomerForVetting(
        {
          name: form.name.trim(),
          dbaName: form.dbaName.trim(),
          website: form.website.trim(),
          taxId: form.taxId.trim(),
          industrySector: form.industrySector,
          contactPerson: form.contactPerson.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          billingAddress: form.billingAddress.trim(),
          shippingJobsiteAddress: effectiveShipTo.trim(),
          requestedCreditLimit: form.requestedCreditLimit,
          paymentTerms: form.paymentTerms,
          forceFreshResearch: Boolean(prefillCustomer)
        },
        mode
      );

      setVettingResult(result);
      setApprovedLimitOverride(result.approvedCreditLimit);
      setFinalTerms(result.suggestedTerms || form.paymentTerms);
      setVettingNotes(result.vettingNotes || '');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to complete live D&B and web research.';
      setResearchError(message);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    runResearch('live');
  };

  const buildCustomerPayload = (status: 'Approved' | 'Rejected', reason?: string): Omit<Customer, 'id'> => {
    const shipAddress = form.sameAsBilling
      ? form.billingAddress.trim()
      : form.shippingJobsiteAddress.trim() || form.billingAddress.trim();

    const finalVetting: CustomerVettingData | undefined = vettingResult
      ? {
          ...vettingResult,
          approvedCreditLimit: status === 'Approved' ? approvedLimitOverride : 0,
          vettingStatus: status,
          vettedBy: 'Operations Credit Approver',
          vettedAt: '2026-11-17',
          vettingNotes,
          disapprovalReason: reason
        }
      : undefined;

    return {
      name: form.name.trim(),
      dbaName: form.dbaName.trim() || undefined,
      website: form.website.trim() || undefined,
      industrySector: form.industrySector,
      contactPerson: form.contactPerson.trim() || 'Operations Contact',
      billingContactName: form.billingContactName.trim() || undefined,
      email: form.email.trim() || 'billing@customer.com',
      operationsEmail: form.operationsEmail.trim() || undefined,
      phone: form.phone.trim() || '(800) 555-0100',
      secondaryPhone: form.secondaryPhone.trim() || undefined,
      address: form.billingAddress.trim() || shipAddress,
      billingAddress: form.billingAddress.trim(),
      shippingJobsiteAddress: shipAddress,
      paymentTerms: finalTerms || form.paymentTerms,
      taxExemptCert: form.taxExemptCert.trim() || undefined,
      balance: 0,
      monthlyBillingTotal: 0,
      billingCycleMonth: 'November 2026',
      creditLimit: status === 'Approved' ? approvedLimitOverride : 0,
      p21Id: vettingResult?.matchedP21Id,
      p21Synced: status === 'Approved',
      latestCustomerUpdate:
        status === 'Approved'
          ? `Customer vetted (${vettingResult?.riskTier || 'Approved'}, Credit Score ${vettingResult?.creditScore || 'N/A'}, D&B PAYDEX ${vettingResult?.dnbPaydexScore || 'N/A'}) & onboarded into Epicor P21 (${vettingResult?.matchedP21Id}).`
          : `Application disapproved: ${reason || 'Failed credit vetting criteria.'}`,
      tags:
        status === 'Approved'
          ? ['P21 Verified', vettingResult?.riskTier || 'Approved']
          : ['Disapproved', vettingResult?.riskTier || 'Declined'],
      vetting: finalVetting
    };
  };

  const handleApprove = () => {
    if (!vettingResult) return;
    const payload = buildCustomerPayload('Approved');
    if (prefillCustomer) {
      const updated = updateCustomerAfterReVetting(prefillCustomer.id, payload);
      if (updated) {
        setLastDecision({ type: 'Approved', customer: updated });
        if (onApproved) onApproved(updated);
      }
      return;
    }
    const created = addCustomer(payload);
    setLastDecision({ type: 'Approved', customer: created });
    if (onApproved) onApproved(created);
  };

  const handleDisapprove = () => {
    if (!vettingResult) return;
    if (!showDisapproveInput) {
      setShowDisapproveInput(true);
      if (!disapprovalReason) {
        setDisapprovalReason(
          prefillRisk?.requiresReVetting
            ? `Failed re-vetting check: ${prefillRisk.triggerReason}.`
            : vettingResult.riskTier === 'High Risk'
            ? 'High delinquency risk / adverse commercial credit standing.'
            : 'Insufficient commercial credit history or missing active insurance COI.'
        );
      }
      return;
    }
    const reasonText =
      disapprovalReason.trim() || 'Declined by Operations Credit Approver after D&B & web review.';
    const payload = buildCustomerPayload('Rejected', reasonText);

    if (prefillCustomer) {
      disapproveExistingCustomer(prefillCustomer.id, reasonText, payload.vetting);
      const updatedLocal = { ...prefillCustomer, ...payload, id: prefillCustomer.id, accountStatus: 'Credit Hold' as const };
      setShowDisapproveInput(false);
      setLastDecision({ type: 'Disapproved', customer: updatedLocal });
      if (onDisapproved) onDisapproved(updatedLocal);
      return;
    }

    const declined = rejectCustomerApplication(payload, reasonText);
    setShowDisapproveInput(false);
    setLastDecision({ type: 'Disapproved', customer: declined });
    if (onDisapproved) onDisapproved(declined);
  };

  const fieldHighlightClass = (val: string, required = false) => {
    if (required && !val.trim()) {
      return 'border-amber-400 bg-amber-50/40 focus:border-amber-600';
    }
    if (autoFilledFromP21 && val.trim()) {
      return 'border-blue-200 bg-blue-50/20 focus:border-blue-500';
    }
    return 'border-slate-200 bg-white focus:border-blue-500';
  };

  return (
    <div className={`grid grid-cols-1 ${compact ? 'lg:grid-cols-12' : 'xl:grid-cols-12'} gap-3 items-start`}>
      {/* Left: Complete Customer Data Intake Form */}
      <form
        onSubmit={handleSubmitForm}
        className={`${compact ? 'lg:col-span-6' : 'xl:col-span-7'} bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden`}
      >
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-display font-bold text-slate-900">
                1. {prefillCustomer ? 'Re-Vetting Customer Profile (Auto-Filled from P21)' : 'Customer Profile, Contacts & Addresses'}
              </h2>
              {autoFilledFromP21 && (
                <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  Auto-Filled · P21 / Local DB
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {prefillCustomer
                ? 'All stored corporate details were loaded automatically from Epicor P21 — zero duplicate typing required.'
                : 'Fields highlighted in amber require human input; existing P21 / DB records auto-populate automatically.'}
            </p>
          </div>
          {!prefillCustomer && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applySampleProfile('public_corp')}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-blue-50 text-[11px] font-medium text-blue-700 rounded-md whitespace-nowrap"
              >
                Sample Public Corp
              </button>
              <button
                type="button"
                onClick={() => applySampleProfile('prime')}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-[11px] font-medium text-slate-700 rounded-md whitespace-nowrap"
              >
                Low-Risk Test
              </button>
              <button
                type="button"
                onClick={() => applySampleProfile('watchlist')}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-amber-50 text-[11px] font-medium text-amber-800 rounded-md whitespace-nowrap"
              >
                Watchlist Test
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Re-Vetting Payment Risk Warning Banner */}
        {prefillCustomer && prefillRisk?.requiresReVetting && (
          <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs">
            <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-950 block">
                Payment-Risk Re-Vetting Triggered ({prefillCustomer.p21Id || prefillCustomer.id})
              </strong>
              <p className="text-[11px] text-rose-800 mt-0.5">
                {prefillRisk.triggerReason}. Profile fields below are pre-loaded from P21 — run fresh D&amp;B &amp; Web research on the right to Approve updated terms or Lock Credit Hold.
              </p>
            </div>
          </div>
        )}

        {/* Live P21 / Local DB Match Auto-Fill Bar */}
        {matchedExistingRecord && matchedExistingRecord.name.toLowerCase() !== form.name.trim().toLowerCase() && (
          <div className="mx-4 mt-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles size={14} className="text-blue-600 shrink-0" />
              <span className="text-blue-950 truncate">
                Match in Epicor P21 / Local DB: <strong>{matchedExistingRecord.name}</strong> ({matchedExistingRecord.p21Id || matchedExistingRecord.id})
              </span>
            </div>
            <button
              type="button"
              onClick={() => hydrateFromCustomer(matchedExistingRecord)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-md shrink-0"
            >
              Auto-Fill All P21 Fields
            </button>
          </div>
        )}

        <div className="divide-y divide-slate-100 text-xs">
          {/* Section A: Company Identity */}
          <div className="p-4 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-800 block">
              Company Identity & Online Registration
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-7">
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Legal Company Name *</span>
                  {!form.name.trim() && (
                    <span className="text-[10px] font-semibold text-amber-700">Needs Human Input</span>
                  )}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Tri-State Transmission & Grid Co."
                  className={`w-full px-3 py-1.5 border rounded-lg font-medium outline-none ${fieldHighlightClass(form.name, true)}`}
                />
              </div>
              <div className="sm:col-span-5">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  DBA / Trade Name
                </label>
                <input
                  value={form.dbaName}
                  onChange={e => setForm({ ...form, dbaName: e.target.value })}
                  placeholder="Operating Division / DBA"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-4">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Federal Tax ID / DUNS #
                </label>
                <input
                  value={form.taxId}
                  onChange={e => setForm({ ...form, taxId: e.target.value })}
                  placeholder="XX-XXXXXXX"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:border-blue-500 outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Company Website
                </label>
                <input
                  value={form.website}
                  onChange={e => setForm({ ...form, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Utility / Industry Sector
                </label>
                <select
                  value={form.industrySector}
                  onChange={e => setForm({ ...form, industrySector: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium focus:border-blue-500 outline-none"
                >
                  <option value="Transmission & Grid Utility">Transmission & Grid Utility</option>
                  <option value="Substation EPC Contractor">Substation EPC Contractor</option>
                  <option value="Underground Distribution">Underground Distribution</option>
                  <option value="Municipal / Co-op Power">Municipal / Co-op Power</option>
                  <option value="Industrial Electrical">Industrial Electrical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section B: Contacts, Emails & Phone(s) */}
          <div className="p-4 space-y-2.5">
            <span className="text-[11px] font-semibold text-slate-800 block">
              Contacts, Emails & Phone Numbers
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Primary Authorized Contact *</span>
                  {!form.contactPerson.trim() && (
                    <span className="text-[10px] font-semibold text-amber-700">Needs Input</span>
                  )}
                </label>
                <input
                  required
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  placeholder="Full Name & Role"
                  className={`w-full px-3 py-1.5 border rounded-lg outline-none ${fieldHighlightClass(form.contactPerson, true)}`}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Billing / Accounts Payable Contact
                </label>
                <input
                  value={form.billingContactName}
                  onChange={e => setForm({ ...form, billingContactName: e.target.value })}
                  placeholder="A/P Manager Name"
                  className={`w-full px-3 py-1.5 border rounded-lg outline-none ${fieldHighlightClass(form.billingContactName)}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Billing / AP Email *</span>
                  {!form.email.trim() && (
                    <span className="text-[10px] font-semibold text-amber-700">Needs Input</span>
                  )}
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="ap@customer.com"
                  className={`w-full px-3 py-1.5 border rounded-lg outline-none ${fieldHighlightClass(form.email, true)}`}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Operations / Dispatch Email
                </label>
                <input
                  type="email"
                  value={form.operationsEmail}
                  onChange={e => setForm({ ...form, operationsEmail: e.target.value })}
                  placeholder="dispatch@customer.com"
                  className={`w-full px-3 py-1.5 border rounded-lg outline-none ${fieldHighlightClass(form.operationsEmail)}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 flex items-center justify-between mb-1">
                  <span>Primary Office Phone *</span>
                  {!form.phone.trim() && (
                    <span className="text-[10px] font-semibold text-amber-700">Needs Input</span>
                  )}
                </label>
                <input
                  required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="(800) 555-0199"
                  className={`w-full px-3 py-1.5 border rounded-lg font-mono outline-none ${fieldHighlightClass(form.phone, true)}`}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Secondary / Field Dispatch Phone
                </label>
                <input
                  value={form.secondaryPhone}
                  onChange={e => setForm({ ...form, secondaryPhone: e.target.value })}
                  placeholder="(800) 555-0144"
                  className={`w-full px-3 py-1.5 border rounded-lg font-mono outline-none ${fieldHighlightClass(form.secondaryPhone)}`}
                />
              </div>
            </div>
          </div>

          {/* Section C: Addresses & Requested Credit Terms */}
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-800">
                Corporate Billing & Jobsite Addresses
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.sameAsBilling}
                  onChange={e =>
                    setForm({
                      ...form,
                      sameAsBilling: e.target.checked,
                      shippingJobsiteAddress: e.target.checked
                        ? form.billingAddress
                        : form.shippingJobsiteAddress
                    })
                  }
                  className="rounded text-blue-600"
                />
                <span>Jobsite same as Corporate Billing</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Corporate Billing Address *
                </label>
                <input
                  required
                  value={form.billingAddress}
                  onChange={e =>
                    setForm({
                      ...form,
                      billingAddress: e.target.value,
                      ...(form.sameAsBilling ? { shippingJobsiteAddress: e.target.value } : {})
                    })
                  }
                  placeholder="Street, Suite, City, State ZIP"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Default Jobsite / Ship-To Address *
                </label>
                <input
                  required={!form.sameAsBilling}
                  disabled={form.sameAsBilling}
                  value={form.sameAsBilling ? form.billingAddress : form.shippingJobsiteAddress}
                  onChange={e => setForm({ ...form, shippingJobsiteAddress: e.target.value })}
                  placeholder="Substation / Project Laydown Yard"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Requested Payment Terms
                </label>
                <select
                  value={form.paymentTerms}
                  onChange={e => setForm({ ...form, paymentTerms: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium focus:border-blue-500 outline-none"
                >
                  <option value="Net 30">Net 30 (Monthly Consolidated)</option>
                  <option value="Net 45">Net 45 (Enterprise Utility)</option>
                  <option value="Net 15">Net 15 (Accelerated)</option>
                  <option value="COD / Card">COD / Credit Card</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Requested Credit Limit ($)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.requestedCreditLimit}
                  onChange={e =>
                    setForm({ ...form, requestedCreditLimit: Number(e.target.value) })
                  }
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-semibold focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">
                  Tax-Exempt Certificate #
                </label>
                <input
                  value={form.taxExemptCert}
                  onChange={e => setForm({ ...form, taxExemptCert: e.target.value })}
                  placeholder="Optional Exemption ID"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="px-4 py-3 bg-slate-50/60 flex flex-wrap items-center justify-between gap-2">
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">
                Submits company name, EIN/DUNS & HQ to D&B + live web search before credit decision.
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isResearching || !form.name.trim()}
                onClick={() => runResearch('simulation')}
                className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                Quick Bureau Sim
              </button>
              <button
                type="submit"
                disabled={isResearching}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 disabled:opacity-60 whitespace-nowrap shadow-sm"
              >
                {isResearching ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Researching D&B & Web...</span>
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    <span>Research D&B & Web to Vet Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Right 5 Cols: Step 2 — Collected D&B + Web Vetting Dossier & Approval / Disapproval */}
      <div
        className={`${compact ? 'lg:col-span-6' : 'xl:col-span-5'} bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden`}
      >
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-display font-bold text-slate-900">
              2. D&B Credit Report, Web Intelligence & Decision
            </h2>
            <p className="text-[11px] text-slate-500">
              Automatically collected risk dossier ready for Approve / Disapprove review.
            </p>
          </div>
          {vettingResult && (
            <span
              className={`text-[11px] font-semibold whitespace-nowrap ${
                vettingResult.riskTier === 'Low Risk'
                  ? 'text-emerald-700'
                  : vettingResult.riskTier === 'Moderate Risk'
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {vettingResult.riskTier}
            </span>
          )}
        </div>

        <div className="p-4 text-xs">
          {/* Decision Confirmation Banner */}
          {lastDecision && (
            <div
              className={`mb-3 p-3 rounded-lg border flex items-start justify-between gap-2 ${
                lastDecision.type === 'Approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-start gap-2">
                {lastDecision.type === 'Approved' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block">
                    {lastDecision.type === 'Approved'
                      ? `Approved & Synced to Epicor P21 (${lastDecision.customer.p21Id})`
                      : `Application Disapproved & Logged (${lastDecision.customer.id})`}
                  </strong>
                  <span className="text-[11px] opacity-80 block mt-0.5">
                    {lastDecision.customer.latestCustomerUpdate}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={resetAll}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 hover:bg-slate-50 shrink-0"
              >
                New Customer
              </button>
            </div>
          )}

          {/* Error Banner when Live Research fails or Gemini API key is missing */}
          {researchError && !isResearching && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2.5 mb-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-950 block">
                    Live D&B & Web Search Unavailable
                  </span>
                  <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                    {researchError}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => runResearch('simulation')}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-md"
                >
                  Load Offline Test Bureau Simulation
                </button>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {isResearching && (
            <div className="space-y-3 py-4 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-lg" />
              <div className="grid grid-cols-2 gap-2.5">
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-24 bg-slate-100 rounded-lg" />
              <p className="text-center text-[11px] text-slate-500 font-medium">
                Collecting Dun & Bradstreet trade tape, corporate registration, liens & web reputation...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isResearching && !vettingResult && !researchError && (
            <div className="py-12 px-4 text-center space-y-2.5">
              <Globe size={30} className="text-slate-300 mx-auto" />
              <h3 className="text-sm font-display font-semibold text-slate-900">
                Ready for Automated D&B & Web Due Diligence
              </h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Complete the customer profile on the left (or pick a sample profile above), then click{' '}
                <strong className="text-slate-700">Research D&B & Web to Vet Customer</strong> to pull D&B PAYDEX, commercial credit score, UCC liens, revenue scale, and web sources for your Approve / Disapprove decision.
              </p>
            </div>
          )}

          {/* Populated D&B + Web Vetting Dossier */}
          {!isResearching && vettingResult && (
            <div className="space-y-3">
              {/* Company Identity & Source Strip */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-600 shrink-0" />
                      <span className="font-display font-bold text-sm text-slate-900 truncate">
                        {form.name}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      DUNS {vettingResult.dunsNumber} · Tax ID {vettingResult.taxId} · P21 {vettingResult.matchedP21Id}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-blue-700 shrink-0">
                    {vettingResult.researchSource || 'Bureau Vetted'}
                  </span>
                </div>
              </div>

              {/* 4 Key Credit & D&B KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-100 font-mono tabular-nums">
                <div className="p-2.5">
                  <span className="font-sans text-[10px] text-slate-500 block">Credit Score</span>
                  <strong
                    className={`text-sm font-bold ${
                      vettingResult.creditScore >= 730
                        ? 'text-emerald-700'
                        : vettingResult.creditScore >= 670
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {vettingResult.creditScore} / 850
                  </strong>
                  <div className="w-full bg-slate-100 h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full ${
                        vettingResult.creditScore >= 730
                          ? 'bg-emerald-500'
                          : vettingResult.creditScore >= 670
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.round((vettingResult.creditScore / 850) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-2.5">
                  <span className="font-sans text-[10px] text-slate-500 block">D&B PAYDEX</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {vettingResult.dnbPaydexScore ?? 78} / 100
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Rating: {vettingResult.dnbRating || '3A2'}
                  </span>
                </div>
                <div className="p-2.5">
                  <span className="font-sans text-[10px] text-slate-500 block">On-Time / DSO</span>
                  <strong className="text-sm font-bold text-slate-900">
                    {vettingResult.onTimePaymentRate}%
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {vettingResult.dsoDays}d Avg DSO
                  </span>
                </div>
                <div className="p-2.5">
                  <span className="font-sans text-[10px] text-slate-500 block">Claims / COI</span>
                  <strong
                    className={`text-sm font-bold ${
                      vettingResult.damageClaimHistoryCount === 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {vettingResult.damageClaimHistoryCount} Claims
                  </strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {vettingResult.insuranceCOIStatus}
                  </span>
                </div>
              </div>

              {/* Collected Corporate & Risk Table */}
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 text-[11px]">
                <div className="px-3 py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Legal Entity & Founded</span>
                  <strong className="text-slate-900 text-right">
                    {vettingResult.legalEntityStatus || 'Active'} · Est.{' '}
                    {vettingResult.yearFounded || 'Verified'}
                  </strong>
                </div>
                <div className="px-3 py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Revenue & Scale</span>
                  <strong className="text-slate-900 text-right">
                    {vettingResult.annualRevenueBand}
                    {vettingResult.employeeCountEstimate
                      ? ` · ${vettingResult.employeeCountEstimate}`
                      : ''}
                  </strong>
                </div>
                <div className="px-3 py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Verified HQ</span>
                  <strong className="text-slate-900 text-right truncate max-w-[65%]">
                    {vettingResult.headquartersVerified || form.billingAddress}
                  </strong>
                </div>
                <div className="px-3 py-2 flex justify-between gap-2">
                  <span className="text-slate-500">D&B Delinquency Risk</span>
                  <strong className="text-slate-900 text-right">
                    {vettingResult.dnbDelinquencyRisk || vettingResult.riskTier}
                  </strong>
                </div>
                <div className="px-3 py-2 flex justify-between gap-2">
                  <span className="text-slate-500">P21 Registry Check</span>
                  <strong className="text-slate-900 text-right font-mono">
                    {vettingResult.p21MatchFound
                      ? `Existing (${vettingResult.matchedP21Id})`
                      : `New Master Record (${vettingResult.matchedP21Id})`}
                  </strong>
                </div>
                <div className="px-3 py-2">
                  <span className="text-slate-500 block mb-0.5">Liens, Judgments & Safety Findings</span>
                  <span className="text-slate-800 font-medium leading-relaxed block">
                    {vettingResult.liensOrJudgmentsSummary ||
                      'No active federal tax liens or bankruptcy filings detected.'}
                  </span>
                </div>
              </div>

              {/* Collected Web Intelligence & Cited Sources */}
              {vettingResult.webReputationSummary && (
                <div className="p-3 bg-blue-50/40 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-950 flex items-center gap-1.5">
                      <Database size={13} className="text-blue-600" />
                      Collected Web & D&B Research Summary
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {vettingResult.webReputationSummary}
                  </p>
                  {vettingResult.webSources && vettingResult.webSources.length > 0 && (
                    <div className="pt-1.5 border-t border-blue-200/70 space-y-1">
                      <span className="text-[10px] font-semibold text-blue-900 block">
                        Verified Web & D&B Sources ({vettingResult.webSources.length})
                      </span>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {vettingResult.webSources.slice(0, 5).map((src, idx) => (
                          <a
                            key={idx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 hover:underline max-w-[210px] truncate"
                          >
                            <ExternalLink size={10} className="shrink-0" />
                            <span className="truncate">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Approver Overrides & Notes */}
              <div className="p-3 bg-amber-50/40 border border-amber-300 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <FileCheck2 size={13} className="text-amber-700" />
                    <span>Credit Approval Terms & Human Decision</span>
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800">
                    Needs Human Input
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                      Approved Credit Limit ($)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={approvedLimitOverride}
                      onChange={e => setApprovedLimitOverride(Number(e.target.value))}
                      className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded-md font-mono font-semibold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                      Final Payment Terms
                    </label>
                    <select
                      value={finalTerms}
                      onChange={e => setFinalTerms(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-amber-300 rounded-md font-medium text-slate-900"
                    >
                      <option value="Net 30">Net 30</option>
                      <option value="Net 45">Net 45</option>
                      <option value="Net 15">Net 15</option>
                      <option value="COD / Card">COD / Card</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                    Underwriting / Approver Notes
                  </label>
                  <textarea
                    value={vettingNotes}
                    onChange={e => setVettingNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] h-14 resize-none"
                  />
                </div>

                {showDisapproveInput && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md space-y-1.5">
                    <label className="text-[10px] font-semibold text-rose-900 block">
                      Disapproval Reason (Required to Reject / Hold Account)
                    </label>
                    <input
                      value={disapprovalReason}
                      onChange={e => setDisapprovalReason(e.target.value)}
                      placeholder="Specify credit, D&B PAYDEX, or delinquency reason..."
                      className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded text-xs"
                    />
                  </div>
                )}

                <div className="pt-1 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleDisapprove}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <XCircle size={14} />
                    <span>
                      {showDisapproveInput
                        ? 'Confirm Disapproval'
                        : prefillCustomer
                        ? 'Disapprove & Lock Hold'
                        : 'Disapprove'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                  >
                    <CheckCircle2 size={14} />
                    <span>
                      {prefillCustomer
                        ? 'Approve Re-Vetting & Update P21'
                        : 'Approve & Sync to P21'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerOnboardingWorkbench;
