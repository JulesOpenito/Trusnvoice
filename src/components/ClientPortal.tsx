import React, { useState } from "react";
import { Invoice, DocumentFormat } from "../types";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, Copy, Check, Printer, FileText, Landmark, 
  RefreshCw, Send, CheckCircle2, History, Clock, TrendingUp, 
  Receipt, DollarSign, Briefcase, ChevronRight, User, LogIn,
  Building2, Sparkles
} from "lucide-react";
import ClientAuditTrail from "./ClientAuditTrail";
import RiskScoreIndicator from "./RiskScoreIndicator";
import ClientPaymentTrends from "./ClientPaymentTrends";
import DocumentReceipt from "./DocumentReceipt";
import DocumentPayStub from "./DocumentPayStub";

interface ClientPortalProps {
  key?: React.Key;
  invoice: Invoice | null;
  onUpdateInvoice: (invoice: Invoice) => void;
  allInvoices?: Invoice[];
  onSelectInvoice?: (invoice: Invoice) => void;
  initialFormat?: DocumentFormat;
  onOpenAuthModal?: (mode: "signin" | "signup") => void;
}

export default function ClientPortal({ 
  invoice, 
  onUpdateInvoice, 
  allInvoices, 
  onSelectInvoice,
  initialFormat = "invoice",
  onOpenAuthModal
}: ClientPortalProps) {
  const { user, userProfile } = useAuth();
  const [activePortalTab, setActivePortalTab] = useState<"document" | "trends" | "audit">("document");
  const [documentFormat, setDocumentFormat] = useState<DocumentFormat>(initialFormat);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!invoice) {
    return (
      <div className="bg-white p-8 neo-border neo-shadow text-center py-20 font-mono text-zinc-400 text-xs">
        No invoice query targeted. Navigate to the principal invoicing tab and select "Secure Inspection View" on any entry.
      </div>
    );
  }

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleProcessSimulatedWire = () => {
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentSuccess(true);

      const updated: Invoice = {
        ...invoice,
        status: "Paid",
        auditLogs: [
          {
            timestamp: new Date().toISOString(),
            ipAddress: "23.45.120.91",
            location: "San Francisco, CA, United States",
            userAgent: "Chrome 125 on macOS",
            action: "Payment Status Updated: Paid in Full",
            status: "success",
            eventType: "payment_update",
            details: `A direct wire payment transfer of $${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} was initiated and cleared. Interbank Fedwire signature verified.`
          },
          ...invoice.auditLogs
        ]
      };
      onUpdateInvoice(updated);
    }, 2000);
  };

  const formattedAmount = `$${invoice.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const auditLogsCount = (invoice.auditLogs || []).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Cybersecurity Status Guard */}
      <div className="bg-emerald-50 border-2 border-emerald-600 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-emerald-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-emerald-700 shrink-0 mt-0.5" size={24} />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider font-mono">
              VERIFIED SECURE PRESENTATION PORTAL
            </h4>
            <p className="text-[11px] leading-relaxed font-sans mt-0.5">
              Target domain SSL verified. Bank routing parameters match cryptographic entity ledger checksums.
            </p>
          </div>
        </div>
        <div className="font-mono text-[9px] bg-emerald-100 border border-emerald-300 py-1 px-2.5 font-bold uppercase rounded shrink-0">
          Seal ID Verified
        </div>
      </div>

      {/* Client Sign In & Account Banner */}
      {user ? (
        <div className="bg-black text-white p-4 border-2 border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white text-black font-mono font-bold flex items-center justify-center text-sm border border-white shrink-0">
              {userProfile?.displayName?.[0] || user.email?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono">
                  {userProfile?.displayName || user.displayName || user.email}
                </span>
                <span className="text-[9px] font-mono bg-emerald-400 text-black px-1.5 py-0.5 font-black uppercase">
                  {userProfile?.accountRole === "client" ? "Verified Client" : "Merchant Issuer"}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                Organization: {userProfile?.companyName || "Client Enterprise"} • Whitelisted for 1-Click Instant Settlements
              </div>
            </div>
          </div>
          <div className="text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-700 px-2.5 py-1">
            Client Auth: Active
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border-2 border-black p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-black">
          <div className="flex items-start gap-3">
            <User className="text-amber-800 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="text-xs font-black uppercase tracking-wider font-mono">
                Client Account & Billing Profile
              </div>
              <p className="text-[11px] text-zinc-700 leading-snug">
                Sign in or create a Client Account to securely track your payment histories, save billing preferences, and download certified tax receipts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onOpenAuthModal?.("signin")}
              className="bg-black hover:bg-zinc-800 text-white px-3 py-1.5 text-xs font-mono font-bold uppercase border border-black cursor-pointer transition-all"
            >
              Client Sign In
            </button>
            <button
              type="button"
              onClick={() => onOpenAuthModal?.("signup")}
              className="bg-white hover:bg-zinc-100 text-black px-3 py-1.5 text-xs font-mono font-bold uppercase border border-black cursor-pointer transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Calculated Fraud Probability & Multi-Factor Risk Score Indicator */}
      <RiskScoreIndicator invoice={invoice} />

      {/* Client Portal Tab Selector: Invoice Document vs Payment Trends vs Audit Trail */}
      <div className="bg-white p-2 neo-border neo-shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePortalTab("document")}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
              activePortalTab === "document"
                ? "bg-black text-white border-black neo-shadow-sm"
                : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
            }`}
          >
            <FileText size={14} />
            <span>Invoice Document</span>
          </button>

          <button
            onClick={() => setActivePortalTab("trends")}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
              activePortalTab === "trends"
                ? "bg-black text-white border-black neo-shadow-sm"
                : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
            }`}
          >
            <TrendingUp size={14} />
            <span>Payment Trends</span>
          </button>

          <button
            onClick={() => setActivePortalTab("audit")}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
              activePortalTab === "audit"
                ? "bg-black text-white border-black neo-shadow-sm"
                : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
            }`}
          >
            <History size={14} />
            <span>Audit Trail</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              activePortalTab === "audit" ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-800"
            }`}>
              {auditLogsCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {allInvoices && allInvoices.length > 1 && onSelectInvoice && (
            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600">
              <span className="text-[10px] uppercase font-bold text-zinc-400 hidden md:inline">Inspect:</span>
              <select
                value={invoice.id}
                onChange={(e) => {
                  const target = allInvoices.find(inv => inv.id === e.target.value);
                  if (target) onSelectInvoice(target);
                }}
                className="text-xs font-mono font-bold bg-zinc-50 border border-zinc-300 py-1.5 px-2 cursor-pointer focus:outline-none focus:border-black"
              >
                {allInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} ({inv.clientName})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500 pr-2">
            <Clock size={12} />
            <span>Tracking: <strong className="text-black">{invoice.invoiceNumber}</strong></span>
          </div>
        </div>
      </div>

      {/* Tab Content Display */}
      {activePortalTab === "audit" ? (
        <ClientAuditTrail 
          invoice={invoice} 
          onUpdateInvoice={onUpdateInvoice} 
        />
      ) : activePortalTab === "trends" ? (
        <div className="space-y-6">
          <ClientPaymentTrends 
            invoice={invoice} 
            allInvoices={allInvoices} 
          />
        </div>
      ) : paymentSuccess ? (
        <div className="bg-black text-white p-12 text-center neo-border neo-shadow-lg flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 size={48} className="text-emerald-400 animate-pulse" />
          <h3 className="text-2xl font-black uppercase tracking-wide">
            Payment Settled Successfully
          </h3>
          <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto leading-relaxed">
            Your bank transfer has been committed and registered on the TrustInvoice secure audit ledger. The seller has been notified with verification tag:
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-3 max-w-sm truncate text-[10px] text-zinc-300 font-mono tracking-wider">
            {invoice.trustSealHash}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setPaymentSuccess(false);
                setDocumentFormat("receipt");
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-black py-2 px-6 text-xs font-mono uppercase font-bold cursor-pointer transition-all border border-emerald-600 flex items-center gap-1.5"
            >
              <Receipt size={13} />
              <span>View Official Receipt</span>
            </button>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="bg-white text-black hover:bg-neutral-100 py-2 px-6 text-xs font-mono uppercase font-bold cursor-pointer transition-all border border-black"
            >
              Review Invoice Copy
            </button>
            <button
              onClick={() => {
                setPaymentSuccess(false);
                setActivePortalTab("audit");
              }}
              className="bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-6 text-xs font-mono uppercase font-bold cursor-pointer transition-all border border-zinc-700"
            >
              View Audit Log
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Document Format Selector Banner */}
          <div className="bg-white p-2 border-2 border-black flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 pl-2">
                Document Format:
              </span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  id="doc-format-invoice-btn"
                  onClick={() => setDocumentFormat("invoice")}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                    documentFormat === "invoice"
                      ? "bg-black text-white border-black neo-shadow-sm"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                  }`}
                >
                  <FileText size={13} />
                  <span>Certified Invoice</span>
                </button>

                <button
                  type="button"
                  id="doc-format-receipt-btn"
                  onClick={() => setDocumentFormat("receipt")}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                    documentFormat === "receipt"
                      ? "bg-emerald-600 text-white border-emerald-800 neo-shadow-sm"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                  }`}
                >
                  <Receipt size={13} />
                  <span>Official Receipt</span>
                  {invoice.status === "Paid" && (
                    <span className="text-[9px] bg-emerald-200 text-emerald-950 px-1 py-0.2 rounded font-mono">
                      PAID
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  id="doc-format-paystub-btn"
                  onClick={() => setDocumentFormat("paystub")}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
                    documentFormat === "paystub"
                      ? "bg-amber-500 text-black border-amber-700 neo-shadow-sm"
                      : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                  }`}
                >
                  <Briefcase size={13} />
                  <span>Pay Stub / Remittance</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-500 pr-2 hidden md:block">
              Status: <strong className="text-black uppercase">{invoice.status}</strong>
            </div>
          </div>

          {/* Conditional Format Rendering */}
          {documentFormat === "receipt" ? (
            <DocumentReceipt 
              invoice={invoice} 
              onUpdateInvoice={onUpdateInvoice} 
            />
          ) : documentFormat === "paystub" ? (
            <DocumentPayStub 
              invoice={invoice} 
              onUpdateInvoice={onUpdateInvoice} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Printable visual Invoice Document Sheet */}
          <div className="md:col-span-7 lg:col-span-8 bg-white p-8 sm:p-12 neo-border neo-shadow-sm min-h-[700px] flex flex-col justify-between" id="printable-invoice">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-black pb-8 mb-8">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter uppercase text-black">INVOICE</h1>
                  <span className="text-xs font-mono text-zinc-500 font-semibold">{invoice.invoiceNumber}</span>
                </div>
                <div className="text-left sm:text-right font-mono text-[11px] text-zinc-600">
                  <div className="text-xs font-bold text-black uppercase">TRUSTINVOICE RECOVERY ID</div>
                  <div className="mt-0.5 break-all max-w-[200px] text-[10px] text-zinc-400">{invoice.trustSealHash}</div>
                </div>
              </div>

              {/* Billed info */}
              <div className="grid grid-cols-2 gap-8 mb-8 font-mono text-xs">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">Remitter Info</h4>
                  <p className="font-extrabold text-black">TRUSTINVOICE MERCHANT SERVICES</p>
                  <p className="text-zinc-500 mt-1">First Trust Building</p>
                  <p className="text-zinc-500">Suite 12A, NYC</p>
                  <p className="text-zinc-500 underline">settlement@trustinvoice.dev</p>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2">Counterparty Target</h4>
                  <p className="font-extrabold text-black uppercase">{invoice.clientName}</p>
                  <p className="text-zinc-500 mt-1">{invoice.clientEmail}</p>
                  <div className="mt-3 text-[10px] text-zinc-500 flex flex-col gap-0.5">
                    <span>Issued Date: {invoice.issuedDate}</span>
                    <span className="font-black text-black">Due Date: {invoice.dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-12">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="border-b-2 border-black text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-center">Quantity</th>
                      <th className="py-2 text-right">Price Rate</th>
                      <th className="py-2 text-right">Line aggregate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 text-[11px]">
                        <td className="py-3 font-semibold text-black">{item.description}</td>
                        <td className="py-3 text-center font-mono">{item.quantity}</td>
                        <td className="py-3 text-right font-mono">${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 text-right font-mono font-bold text-black">${(item.quantity * item.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations totals bottom block */}
            <div>
              <div className="flex justify-end mb-8">
                <div className="w-64 font-sans text-xs space-y-2 border-t border-dashed border-zinc-200 pt-4">
                  <div className="flex justify-between text-neutral-500">
                    <span>Work Subtotal:</span>
                    <span className="font-mono">${(invoice.amount / 1.08).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Secure processing Surcharge (8%):</span>
                    <span className="font-mono">${(invoice.amount - (invoice.amount / 1.08)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-black border-t-2 border-black pt-2 text-sm">
                    <span>Outstanding Due:</span>
                    <span className="font-mono">{formattedAmount}</span>
                  </div>
                </div>
              </div>

              {/* Secure remittance coordinates detail section */}
              <div className="bg-zinc-50 border border-neutral-300 p-4 font-mono text-[10px]">
                <div className="text-xs font-bold text-black uppercase mb-1.5 flex items-center gap-1">
                  <Landmark size={12} />
                  <span>Sealed Interbank Directives</span>
                </div>
                <p className="text-zinc-500 leading-relaxed mb-3">
                  Verification protocol active. Double check banking parameters of this certified invoice record:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-zinc-600">
                  <div className="flex justify-between hover:bg-neutral-100 p-0.5 truncate">
                    <span>Institution:</span>
                    <span className="font-extrabold text-black">{invoice.paymentDetails.bankName}</span>
                  </div>
                  <div className="flex justify-between hover:bg-neutral-100 p-0.5 truncate">
                    <span>Routing Transit:</span>
                    <span className="font-extrabold text-black">{invoice.paymentDetails.routingNo}</span>
                  </div>
                  <div className="flex justify-between hover:bg-neutral-100 p-0.5 truncate">
                    <span>Account Number:</span>
                    <span className="font-extrabold text-black">{invoice.paymentDetails.accountNo}</span>
                  </div>
                  <div className="flex justify-between hover:bg-neutral-100 p-0.5 truncate">
                    <span>SWIFT Identifier:</span>
                    <span className="font-extrabold text-black">{invoice.paymentDetails.swift}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Desk Controller Sidebar */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            
            {/* Visual Recharts Client Payment Trends Box */}
            <ClientPaymentTrends invoice={invoice} allInvoices={allInvoices} />

            {/* Quick Bank Details Copy Clipboard Panel */}
            <div className="bg-white p-5 neo-border neo-shadow-sm space-y-4">
              <h3 className="text-xs font-mono uppercase text-zinc-500 tracking-wider font-extrabold pb-2 border-b border-zinc-200">
                Remit coordinates
              </h3>
              
              <div className="space-y-3 font-mono text-[11px]">
                {/* Institution copy */}
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Recipient Institution</span>
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-2 mt-1">
                    <span className="font-bold text-black truncate">{invoice.paymentDetails.bankName}</span>
                    <button 
                      onClick={() => handleCopyText(invoice.paymentDetails.bankName, "bankName")}
                      className="p-1 text-black hover:bg-zinc-200 cursor-pointer rounded"
                    >
                      {copiedField === "bankName" ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Routing copy */}
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Transit ABA Code</span>
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-2 mt-1">
                    <span className="font-bold text-black">{invoice.paymentDetails.routingNo}</span>
                    <button 
                      onClick={() => handleCopyText(invoice.paymentDetails.routingNo, "routingNo")}
                      className="p-1 text-black hover:bg-zinc-200 cursor-pointer rounded"
                    >
                      {copiedField === "routingNo" ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* Account copy */}
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Account Number</span>
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-2 mt-1">
                    <span className="font-bold text-black">{invoice.paymentDetails.accountNo}</span>
                    <button 
                      onClick={() => handleCopyText(invoice.paymentDetails.accountNo, "accountNo")}
                      className="p-1 text-black hover:bg-zinc-200 cursor-pointer rounded"
                    >
                      {copiedField === "accountNo" ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                {/* IBAN copy */}
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Full Wire IBAN code</span>
                  <div className="flex justify-between items-center bg-zinc-50 border border-zinc-200 p-2 mt-1">
                    <span className="font-bold text-black truncate select-all">{invoice.paymentDetails.iban}</span>
                    <button 
                      onClick={() => handleCopyText(invoice.paymentDetails.iban, "iban")}
                      className="p-1 text-black hover:bg-zinc-200 cursor-pointer rounded animate-pulse"
                    >
                      {copiedField === "iban" ? <Check size={12} className="text-emerald-700" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Payment Action widget */}
            {invoice.status !== "Paid" && (
              <div className="bg-black text-white p-5 neo-border neo-shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono uppercase text-zinc-400 tracking-wider font-extrabold pb-2 border-b border-zinc-800">
                    Settle Account
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mt-2.5">
                    Clicking below simulates processing an instant secure interbank wire settlement from your business bank directly using these coordinates.
                  </p>
                </div>

                <div className="mt-6">
                  <div className="text-center font-mono text-[10px] text-zinc-500 mb-2">
                    Settling sum: {formattedAmount}
                  </div>
                  <button
                    onClick={handleProcessSimulatedWire}
                    disabled={paymentLoading}
                    className="w-full bg-white hover:bg-neutral-100 text-black py-3 border-2 border-white text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm"
                  >
                    {paymentLoading ? (
                      <>
                        <RefreshCw className="animate-spin text-black" size={14} />
                        <span>Transmitting Wire...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Execute Wire Settlement</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Local Printing Button Widget */}
            <button
              onClick={() => window.print()}
              className="w-full bg-white hover:bg-zinc-100 text-black border-2 border-black py-3 text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm font-mono"
            >
              <Printer size={14} />
              <span>Print Secure Document</span>
            </button>
          </div>
        </div>
          )}
        </div>
      )}
    </div>
  );
}
