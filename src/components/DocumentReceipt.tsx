import React, { useState } from "react";
import { Invoice, ReceiptConfig } from "../types";
import { 
  CheckCircle2, ShieldCheck, Printer, Copy, Check, 
  Landmark, CreditCard, Calendar, Hash, Building2, 
  Sparkles, FileText, ArrowDownRight, Award, Edit3
} from "lucide-react";

interface DocumentReceiptProps {
  invoice: Invoice;
  onUpdateInvoice?: (invoice: Invoice) => void;
}

export default function DocumentReceipt({ invoice, onUpdateInvoice }: DocumentReceiptProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Initialize receipt config from invoice or defaults
  const receiptConfig: ReceiptConfig = {
    receiptNumber: invoice.receiptDetails?.receiptNumber || `REC-${invoice.invoiceNumber.replace("INV-", "")}`,
    paymentMethod: invoice.receiptDetails?.paymentMethod || "Fedwire Wire Transfer",
    transactionId: invoice.receiptDetails?.transactionId || `TXN-FED-${invoice.id.toUpperCase().slice(0, 8)}-${Math.floor(100000 + Math.random() * 900000)}`,
    paidDate: invoice.receiptDetails?.paidDate || invoice.dueDate || "2026-09-01",
    paidTime: invoice.receiptDetails?.paidTime || "14:32:08 UTC",
    totalPaid: invoice.receiptDetails?.totalPaid ?? invoice.amount,
    balanceRemaining: invoice.receiptDetails?.balanceRemaining ?? 0.00,
    paymentStatus: invoice.receiptDetails?.paymentStatus || (invoice.status === "Paid" ? "Settled & Cleared" : "Authorized"),
    payerName: invoice.receiptDetails?.payerName || invoice.clientName,
    payerEmail: invoice.receiptDetails?.payerEmail || invoice.clientEmail,
    payeeName: invoice.receiptDetails?.payeeName || "TRUSTINVOICE MERCHANT SERVICES LLC",
    payeeTaxId: invoice.receiptDetails?.payeeTaxId || "EIN 84-2940192",
    authCode: invoice.receiptDetails?.authCode || `AUTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    notes: invoice.receiptDetails?.notes || "Payment received in full. Thank you for your business."
  };

  const [localConfig, setLocalConfig] = useState<ReceiptConfig>(receiptConfig);

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSaveConfig = () => {
    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        receiptDetails: localConfig
      });
    }
    setShowConfig(false);
  };

  const workSubtotal = invoice.amount / 1.08;
  const surchargeFee = invoice.amount - workSubtotal;

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 neo-border neo-shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 py-1 px-2.5 rounded flex items-center gap-1.5 uppercase">
            <CheckCircle2 size={13} className="text-emerald-700" />
            Official Settlement Receipt
          </span>
          <span className="text-xs font-mono text-zinc-500">
            Ref: <strong>{localConfig.receiptNumber}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 text-black border border-black py-2 px-3 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 size={13} />
            <span>{showConfig ? "Close Settings" : "Customize Receipt"}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-mono font-bold bg-black text-white hover:bg-zinc-800 py-2 px-4 border border-black flex items-center gap-1.5 transition-all cursor-pointer neo-shadow-sm"
          >
            <Printer size={13} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>

      {/* Config Drawer */}
      {showConfig && (
        <div className="bg-zinc-50 border-2 border-black p-5 space-y-4 font-mono text-xs neo-shadow-sm">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
            <h4 className="font-extrabold uppercase text-black">Receipt Configuration & Metadata</h4>
            <span className="text-[10px] text-zinc-500">Updates reflected instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Receipt Number</label>
              <input
                type="text"
                value={localConfig.receiptNumber}
                onChange={(e) => setLocalConfig({ ...localConfig, receiptNumber: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Payment Method</label>
              <select
                value={localConfig.paymentMethod}
                onChange={(e) => setLocalConfig({ ...localConfig, paymentMethod: e.target.value as any })}
                className="w-full neo-input text-xs py-1.5 bg-white"
              >
                <option value="Fedwire Wire Transfer">Fedwire Wire Transfer</option>
                <option value="ACH Direct Debit">ACH Direct Debit</option>
                <option value="Credit Card (Corporate Visa)">Credit Card (Corporate Visa)</option>
                <option value="Corporate Check">Corporate Check</option>
                <option value="Zelle / Instant Rail">Zelle / Instant Rail</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Transaction Ref ID</label>
              <input
                type="text"
                value={localConfig.transactionId}
                onChange={(e) => setLocalConfig({ ...localConfig, transactionId: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Settlement Date</label>
              <input
                type="date"
                value={localConfig.paidDate}
                onChange={(e) => setLocalConfig({ ...localConfig, paidDate: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Auth / Trace Code</label>
              <input
                type="text"
                value={localConfig.authCode}
                onChange={(e) => setLocalConfig({ ...localConfig, authCode: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Payment Status</label>
              <select
                value={localConfig.paymentStatus}
                onChange={(e) => setLocalConfig({ ...localConfig, paymentStatus: e.target.value as any })}
                className="w-full neo-input text-xs py-1.5 bg-white"
              >
                <option value="Settled & Cleared">Settled & Cleared</option>
                <option value="Authorized">Authorized</option>
                <option value="Processing">Processing</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-neutral-800 cursor-pointer"
            >
              Save Receipt Customization
            </button>
          </div>
        </div>
      )}

      {/* The Printable Visual Receipt */}
      <div 
        id="printable-receipt"
        className="bg-white p-8 sm:p-12 neo-border neo-shadow-sm min-h-[750px] flex flex-col justify-between relative overflow-hidden"
      >
        {/* Paid Stamp Watermark Effect */}
        <div className="absolute right-8 top-16 rotate-[-12deg] pointer-events-none select-none opacity-85">
          <div className="border-4 border-emerald-600 border-dashed rounded-lg px-6 py-2 text-center text-emerald-700">
            <div className="text-2xl sm:text-3xl font-black tracking-widest uppercase font-mono">PAID IN FULL</div>
            <div className="text-[10px] font-mono font-bold tracking-wider">{localConfig.paidDate} • {localConfig.paymentMethod}</div>
          </div>
        </div>

        <div>
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-black pb-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-800">
                  Payment Remittance Certificate
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase text-black">
                PAYMENT RECEIPT
              </h1>
              <div className="flex items-center gap-2 mt-1 font-mono text-xs text-zinc-600">
                <span className="font-bold text-black">{localConfig.receiptNumber}</span>
                <span>•</span>
                <span>Linked Invoice: <strong>{invoice.invoiceNumber}</strong></span>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] text-zinc-600">
              <div className="text-xs font-bold text-black uppercase">CLEARING HOUSE TRACE</div>
              <div className="mt-0.5 font-bold text-emerald-700">{localConfig.transactionId}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{localConfig.paidDate} @ {localConfig.paidTime}</div>
            </div>
          </div>

          {/* Key Transaction Metadata Matrix */}
          <div className="bg-zinc-50 border-2 border-black p-4 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Settlement Method</span>
              <span className="font-bold text-black flex items-center gap-1">
                <Landmark size={12} className="text-zinc-600 shrink-0" />
                {localConfig.paymentMethod}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Authorization Code</span>
              <span className="font-bold text-black tracking-wider">{localConfig.authCode}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Remittance Status</span>
              <span className="font-bold text-emerald-700 uppercase flex items-center gap-1">
                <CheckCircle2 size={12} />
                {localConfig.paymentStatus}
              </span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Remaining Balance</span>
              <span className="font-extrabold text-black font-mono">
                ${localConfig.balanceRemaining.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* Party Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 font-mono text-xs">
            <div>
              <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 flex items-center gap-1.5">
                <Building2 size={12} />
                <span>Creditor / Received By</span>
              </h4>
              <p className="font-extrabold text-black uppercase">{localConfig.payeeName}</p>
              <p className="text-zinc-500 mt-1">{localConfig.payeeTaxId}</p>
              <p className="text-zinc-500">First Trust Building, Suite 12A, New York, NY</p>
              <p className="text-zinc-500 underline">settlement@trustinvoice.dev</p>
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-2 flex items-center gap-1.5">
                <FileText size={12} />
                <span>Remitter / Paid By</span>
              </h4>
              <p className="font-extrabold text-black uppercase">{localConfig.payerName}</p>
              <p className="text-zinc-500 mt-1">{localConfig.payerEmail}</p>
              <div className="mt-2 text-[10px] text-zinc-500">
                <span>Account Reference: <strong>{invoice.clientName.replace(/\s+/g, "").toUpperCase().slice(0, 8)}-{invoice.id.slice(0, 4)}</strong></span>
              </div>
            </div>
          </div>

          {/* Itemized Service & Goods Table */}
          <div className="mb-8">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold mb-2">
              Settled Line Items
            </div>
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b-2 border-black text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-extrabold">
                  <th className="py-2.5">Line Description</th>
                  <th className="py-2.5 text-center">Quantity</th>
                  <th className="py-2.5 text-right">Unit Price</th>
                  <th className="py-2.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-zinc-100 text-[11px]">
                    <td className="py-3 font-semibold text-black">{item.description}</td>
                    <td className="py-3 text-center font-mono">{item.quantity}</td>
                    <td className="py-3 text-right font-mono">${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right font-mono font-bold text-black">
                      ${(item.quantity * item.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculations & Certified Seal Bottom */}
        <div className="space-y-6">
          <div className="flex justify-end">
            <div className="w-72 font-sans text-xs space-y-2 border-t border-dashed border-zinc-300 pt-4">
              <div className="flex justify-between text-neutral-600">
                <span>Services Subtotal:</span>
                <span className="font-mono">${workSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Processing Surcharge (8%):</span>
                <span className="font-mono">${surchargeFee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-extrabold text-black border-t-2 border-black pt-2 text-base">
                <span>Total Settled:</span>
                <span className="font-mono text-emerald-700">${localConfig.totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-zinc-500 pt-1">
                <span>Remaining Balance Due:</span>
                <span className="font-bold text-black">$0.00</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Receipt Seal & Disclaimer */}
          <div className="bg-emerald-50 border-2 border-emerald-600 p-4 font-mono text-[10px] space-y-2 text-emerald-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold uppercase">
                <ShieldCheck size={14} className="text-emerald-700" />
                <span>Cryptographically Sealed Remittance Proof</span>
              </div>
              <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 font-bold text-[9px] uppercase">
                Verified Ledger Entry
              </span>
            </div>
            <p className="text-emerald-800 leading-relaxed">
              This official receipt confirms full and final settlement of invoice {invoice.invoiceNumber}. The electronic signature and transaction trace have been permanently written to the TrustInvoice secure immutable audit registry.
            </p>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 border-t border-emerald-200">
              <span className="text-emerald-700 text-[9px] break-all">
                DIGITAL SHA-256 SEAL: <strong>{invoice.trustSealHash}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleCopyText(invoice.trustSealHash, "hash")}
                className="bg-emerald-600 text-white px-2 py-1 text-[9px] font-bold uppercase hover:bg-emerald-700 cursor-pointer shrink-0"
              >
                {copiedField === "hash" ? "Copied Seal" : "Copy Seal"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
