"use client";

import Link from "next/link";
import { Download, FileText, CheckCircle } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  totalAmount: number;
  currency: string;
  paymentMethod?: {
    type: string;
    details: string;
  };
  paymentDate?: string;
  periodStart: string;
  periodEnd: string;
  items: InvoiceItem[];
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  code?: string;
}

interface InvoiceDisplayProps {
  invoice: InvoiceData;
  workspaceDomain: string;
}

export function InvoiceDisplay({ invoice, workspaceDomain }: InvoiceDisplayProps) {
  const formatDate = (dateString: string) => formatMediumDate(dateString);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: invoice.currency,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'overdue':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8 pt-6">

      {/* Invoice Header (title/date live in the page Banner) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <p className="text-sm text-muted-foreground">
              Issued on {formatDate(invoice.issuedDate)} • Due on {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(invoice.status)}`}>            {getStatusLabel(invoice.status)}
          </span>
          <span className="text-2xl font-bold font-display text-primary">
            {formatAmount(invoice.totalAmount)}
          </span>
        </div>
      </div>

      {/* Invoice Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Billing Period */}
        <div className="col-span-4 glass-surface rounded-2xl p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Billing Period
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{formatDate(invoice.periodStart)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{formatDate(invoice.periodEnd)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        {(invoice.status === 'paid' || invoice.status === 'pending') && (
          <div className="col-span-2 glass-surface rounded-2xl p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Payment Information
            </h3>
            <div className="space-y-3">
              {invoice.status === 'paid' ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">Paid on {formatDate(invoice.paymentDate || invoice.issuedDate)}</span>
                  </div>
                  {invoice.paymentMethod && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Method: </span>
                      <span className="font-medium">{invoice.paymentMethod.type}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-amber-400" />
                    <span className="text-sm font-medium text-amber-700">Payment pending</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Please complete payment by due date
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Line Items */}
      <div className="glass-surface rounded-2xl p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Invoice Breakdown
        </h3>
        
        <div className="space-y-3">
          {invoice.items.map((item, index) => (
            <div key={index} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.description}</span>
                  {item.code && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {item.quantity} × {formatAmount(item.unitPrice)}
                </div>
              </div>
              <div className="text-sm font-semibold ml-4">
                {formatAmount(item.total)}
              </div>
            </div>
          ))}
        </div>

        {/* Subtotal and Total */}
        <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatAmount(invoice.totalAmount)}</span>
          </div>

          <div className="flex justify-between text-base font-bold pt-2 border-t border-border/60">
            <span>Total Due</span>
            <span className="text-primary">{formatAmount(invoice.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
        <Link
          href={`/${workspaceDomain}/dashboard/billing`}
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border bg-card/40 text-foreground font-medium text-sm hover:bg-muted/50 transition-all"
        >
          Back to Billing
        </Link>
        <button className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:opacity-95 active:scale-[0.99] transition-all">
          <Download className="h-4 w-4 mr-2" />
          Download Invoice
        </button>
      </div>
    </div>
  );
}