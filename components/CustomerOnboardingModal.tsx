import React from 'react';
import { UserPlus, X } from 'lucide-react';
import { Customer } from '../types';
import CustomerOnboardingWorkbench from './CustomerOnboardingWorkbench';

interface CustomerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillCustomer?: Customer | null;
  onCustomerOnboarded?: (customer: Customer) => void;
}

const CustomerOnboardingModal: React.FC<CustomerOnboardingModalProps> = ({
  isOpen,
  onClose,
  prefillCustomer = null,
  onCustomerOnboarded
}) => {
  if (!isOpen) return null;

  const isReVetting = Boolean(prefillCustomer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative bg-[#F8FAFC] w-full max-w-5xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 ${
                isReVetting ? 'bg-amber-600' : 'bg-blue-600'
              }`}
            >
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900">
                {isReVetting
                  ? `Re-Run Customer Credit Vetting · ${prefillCustomer?.name}`
                  : 'Customer Onboarding, D&B / Web Research & Credit Vetting'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isReVetting
                  ? `Existing P21 account (${prefillCustomer?.p21Id || prefillCustomer?.id}) pre-filled automatically. Pull updated D&B & web intelligence to Approve or Lock Hold.`
                  : 'Collect customer data, query D&B and web intelligence, and approve or disapprove prior to Epicor P21 sync.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <CustomerOnboardingWorkbench
            compact
            prefillCustomer={prefillCustomer}
            onCancel={onClose}
            onApproved={customer => {
              if (onCustomerOnboarded) onCustomerOnboarded(customer);
              onClose();
            }}
            onDisapproved={() => {
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerOnboardingModal;
