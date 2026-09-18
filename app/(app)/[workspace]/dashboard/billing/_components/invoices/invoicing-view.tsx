import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Layers, 
  Database, 
  ShieldCheck, 
  CreditCard, 
  Sparkles,
  Info
} from '@/lib/icons';
import {
  CapabilityGrid,
  type CapabilityItem,
} from './capability-grid';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  totalAmount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  items: Array<{
    /** For the plan row this is the plan label; for feature rows, `PlanFeature.label`. */
    description: string;
    /** `PlanFeature.description` — the capability body copy (feature rows only). */
    detail?: string;
    /** `PlanFeature.feature` — the backend registry key that drives icon + tone. */
    featureKey?: string;
    quantity: number;
    unitPrice: number;
    total: number;
    code?: string;
  }>;
}

interface InvoiceViewProps {
  invoice: InvoiceData;
  workspaceDomain: string;
}

export default function InvoiceView({ invoice, workspaceDomain }: InvoiceViewProps) {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const basePriceMonthly = invoice.totalAmount;
  const discountAnnual = 0.84; // 16% off
  
  const currentPrice = billingCycle === 'annual' 
    ? Math.round(basePriceMonthly * 12 * discountAnnual) 
    : basePriceMonthly;

  const monthlyEquivalent = billingCycle === 'annual'
    ? Math.round(basePriceMonthly * discountAnnual)
    : basePriceMonthly;

  const vat = Math.round(monthlyEquivalent * 0.16);
  const totalDue = monthlyEquivalent + vat;

  const handleProceedPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccessModal(true);
    }, 1200);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const planName = invoice.items[0]?.description || 'Plan';
  // The plan itself is `items[0]`; every capability row after it carries a
  // `FEAT-…` code (and, once the caller threads it through, a registry key).
  const planFeatures: CapabilityItem[] = invoice.items.filter(
    (item) => Boolean(item.featureKey) || Boolean(item.code?.startsWith('FEAT-')),
  );

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-800 font-sans relative overflow-hidden p-4 md:p-8 flex items-center justify-center">
      
      {/* Background Soft Ambient Glows matching reference */}
      <div className="absolute top-12 left-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-8 right-12 w-96 h-96 bg-primary-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        
        {/* Header & Toggle Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Subscription & Invoicing
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your active plan, resource quotas, and billing details.
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center self-start md:self-auto">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                billingCycle === 'monthly'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual billing</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                billingCycle === 'annual' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                Save 16%
              </span>
            </button>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (Plan details & Capabilities) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Current Plan Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/60 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full pointer-events-none -z-10"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
<div className="flex items-center gap-3">
                     <h2 className="text-2xl font-bold text-slate-900">{planName}</h2>
                     <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full flex items-center gap-1">
                       <Sparkles className="w-3.5 h-3.5" />
                       Current Plan
                     </span>
                   </div>
                   <p className="text-xs md:text-sm text-slate-500 mt-1">
                     Billing cycle: <span className="capitalize font-medium text-slate-700">{billingCycle}</span>, active since {formatDate(invoice.issuedDate)}
                   </p>
                </div>

<div className="text-left sm:text-right">
                   <div className="text-2xl md:text-3xl font-extrabold text-slate-900">
                     {formatAmount(monthlyEquivalent)}
                   </div>
                   <div className="text-xs text-slate-400 font-medium">/month</div>
                 </div>
              </div>

              {/* Resource Usage Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                
                {/* Workspaces Meter */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Layers className="w-4 h-4 text-primary-500" />
                      Workspaces
                    </span>
                    <span className="text-slate-900">2 of 5 active</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                  </div>
                </div>

                {/* Storage Library Meter */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Database className="w-4 h-4 text-secondary-500" />
                      Storage Library
                    </span>
                    <span className="text-slate-900">14 GB of 50 GB</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div className="bg-gradient-to-r from-secondary-500 to-primary-500 h-full rounded-full transition-all duration-500" style={{ width: '28%' }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Included Package Capabilities */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-lg">Included Package Capabilities</h3>
                <p className="text-xs text-slate-500 mt-0.5">Core features unlocked with your Business subscription</p>
              </div>

              <CapabilityGrid items={planFeatures} />
            </div>

          </div>

          {/* Right Column (Payment Summary & Action) */}
          <div className="lg:col-span-5">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/80 shadow-2xl shadow-primary-500/10 sticky top-8">
              
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Payment Summary</h3>
                <span className="p-2 rounded-xl bg-primary-50 text-primary-600">
                  <CreditCard className="w-5 h-5" />
                </span>
              </div>

              {/* Next billing date banner */}
              <div className="bg-amber-50/80 border border-amber-200/60 rounded-2xl p-3.5 mb-6 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Next billing date:</span>
                <span className="font-bold bg-amber-200/70 text-slate-800 px-2.5 py-1 rounded-lg">
                  Oct 8, 2026
                </span>
              </div>

              {/* Cost breakdown list */}
              <div className="space-y-3.5 text-xs md:text-sm mb-6">
                <div className="flex justify-between items-center text-slate-600">
                  <span className="truncate pr-2">Business Package ({billingCycle === 'annual' ? '12 months' : '1 month'})</span>
                  <span className="font-semibold text-slate-900 shrink-0">Ksh {currentPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="truncate pr-2">Additional Workspaces (0)</span>
                  <span className="font-semibold text-slate-900 shrink-0">Ksh 0</span>
                </div>

                <div className="flex justify-between items-center text-slate-600 pb-3 border-b border-slate-100">
                  <span className="truncate pr-2">Extra Storage (0 GB)</span>
                  <span className="font-semibold text-slate-900 shrink-0">Ksh 0</span>
                </div>

                <div className="flex justify-between items-center text-slate-700 pt-1">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold text-slate-900">Ksh {currentPrice.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-slate-500">
                  <span className="flex items-center gap-1">
                    VAT (16% applicable)
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <span className="font-medium text-slate-700">Ksh {vat.toLocaleString()}</span>
                </div>
              </div>

              {/* Total Due Box */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 flex items-center justify-between border border-slate-100">
                <span className="text-base font-bold text-slate-800">Total Due:</span>
                <span className="text-xl md:text-2xl font-black text-rose-600">
                  Ksh {(currentPrice + vat).toLocaleString()}
                </span>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleProceedPayment}
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-sm shadow-lg shadow-primary-600/30 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Secure Payment...
                  </span>
                ) : (
                  <>
                    <span>Proceed to Payment (Ksh {(currentPrice + vat).toLocaleString()})</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Secure 256-bit encrypted M-Pesa & Card checkout
              </p>

            </div>
          </div>

        </div>

      </div>

      {/* Success Modal Notification */}
      {successModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Payment Successful!</h3>
            <p className="text-sm text-slate-600">
              Your Business subscription has been successfully renewed. A receipt has been sent to your registered email.
            </p>
            <div className="pt-4">
              <button
                onClick={() => setSuccessModal(false)}
                className="w-full py-3 px-6 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}