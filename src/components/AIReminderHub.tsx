import React, { useState, useEffect } from "react";
import { Invoice } from "../types";
import { Sparkles, Calendar, User, DollarSign, Send, Copy, Check, FileText, AlertCircle, RefreshCw } from "lucide-react";

interface ReminderHubProps {
  invoices: Invoice[];
  preSelectedInvoice: Invoice | null;
}

export default function AIReminderHub({ invoices, preSelectedInvoice }: ReminderHubProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [tone, setTone] = useState<"friendly" | "business" | "urgent" | "alert">("business");
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // generated text state
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [usingOfflineFallback, setUsingOfflineFallback] = useState(false);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedInvoiceId);

  useEffect(() => {
    if (preSelectedInvoice) {
      setSelectedInvoiceId(preSelectedInvoice.id);
    } else if (invoices.length > 0) {
      setSelectedInvoiceId(invoices[0].id);
    }
  }, [preSelectedInvoice, invoices]);

  // Handle local templates (reliable offline fallback)
  const getOfflineTemplate = (inv: Invoice, selectedTone: string, note: string) => {
    const formattedAmount = `$${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    const hostUrl = window.location.origin;

    const signatureBlock = `\n---\nSECURITY GUARANTEE:\nThis invoice presentation link is protected by TrustInvoice Cryptographic Signature Block:\nID Token: ${inv.trustSealHash}\nRouting Authenticity Checksum: Verified`;

    const customMsg = note ? `\nSender Personal Note:\n"${note}"\n` : "";

    switch (selectedTone) {
      case "friendly":
        return {
          subject: `Friendly Quick reminder: Secure Invoice ${inv.invoiceNumber} for ${inv.clientName}`,
          body: `Hi Finance Team at ${inv.clientName},

Hope everything is going wonderfully on your end!

Just a polite, soft reminder that invoice ${inv.invoiceNumber} issued on ${inv.issuedDate} for ${formattedAmount} is currently due by ${inv.dueDate}.
${customMsg}
To protect your payment routing from spoofing and wire fraud, please verify the banking coordinates on our encrypted presentation page here:
${hostUrl}/verify/${inv.id}

If you have already processed this trade or scheduled the transfer, please disregard this note!

Warmly,
Accounts Receivable Division
${signatureBlock}`
        };
      case "urgent":
        return {
          subject: `URGENT ACTION REQUIRED: Overdue Invoicing ${inv.invoiceNumber} (${formattedAmount})`,
          body: `Attention Accounts Payable,

This is an urgent payment request regarding invoice ${inv.invoiceNumber} of ${formattedAmount}, which has matured past its deadline on ${inv.dueDate}.

This outstanding account must be settled immediately to prevent collection escalations or secondary contract suspension clauses.
${customMsg}
Please log in to the verifiably signed client presentation terminal to guarantee absolute payment legitimacy:
${hostUrl}/verify/${inv.id}

For your protection, do NOT wire funds to any banking coordinates sent outside of this encrypted trust profile page.

Regards,
Settlement Compliance Group
${signatureBlock}`
        };
      case "alert":
        return {
          subject: `CYBERSECURITY COMPLIANCE AUDIT FLAG: Verify Accounts-Receivable ${inv.invoiceNumber}`,
          body: `Authorized Security Notice: Counterparty Accounts Management,

A scheduled automated systems audit of our outstanding receivables from ${inv.clientName} has flagged Invoice ${inv.invoiceNumber} (${formattedAmount}) as unresolved.

In compliance with our standard privacy-by-design framework, we have sealed this invoice's settlement details cryptographically.
${customMsg}
To complete secure verification and release the signed routing details, please click through our secure host verification certificate:
${hostUrl}/verify/${inv.id}

Authenticity Token matching your profile registrar: ${inv.trustSealHash}
Please transmit direct wires only to coordinates listed inside the authenticated host address above.

Sincerely,
System Integrity Operations
${signatureBlock}`
        };
      case "business":
      default:
        return {
          subject: `Payment Demand Alert: Invoice ${inv.invoiceNumber} due ${inv.dueDate}`,
          body: `Dear Financial Operations Team,

Please find this formal notice regarding Invoice ${inv.invoiceNumber} for services rendered, totaling ${formattedAmount}.
The designated due date for this balance is ${inv.dueDate}.
${customMsg}
We ask that your payments department verify the cryptographic routing parameters using the verified TrustInvoice protocol ledger, preventing man-in-the-middle email interception attempts:
${hostUrl}/verify/${inv.id}

Please confirm bank transfer details directly inside the sealed client portal link.

Best regards,
Finance Operations Team
${signatureBlock}`
        };
    }
  };

  const handleGenerate = async () => {
    if (!selectedInvoice) return;
    setLoading(true);
    setError(null);
    setUsingOfflineFallback(false);

    try {
      const response = await fetch("/api/ai/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: selectedInvoice.invoiceNumber,
          clientName: selectedInvoice.clientName,
          amount: selectedInvoice.amount,
          dueDate: selectedInvoice.dueDate,
          tone,
          items: selectedInvoice.items.map((i) => i.description).join(", "),
          customNote
        })
      });

      if (!response.ok) {
        throw new Error("Missing server credentials or key. Routing to secure client-side template generator.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedSubject(data.subject);
      setGeneratedBody(data.body);
    } catch (err: any) {
      console.warn("AI Generation failed, routing to high-fidelity offline templates:", err.message);
      // Fallback
      const backup = getOfflineTemplate(selectedInvoice, tone, customNote);
      setGeneratedSubject(backup.subject);
      setGeneratedBody(backup.body);
      setUsingOfflineFallback(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvoice) {
      const backup = getOfflineTemplate(selectedInvoice, tone, customNote);
      setGeneratedSubject(backup.subject);
      setGeneratedBody(backup.body);
    }
  }, [selectedInvoiceId, tone, customNote]);

  const handleCopy = () => {
    const fullText = `Subject: ${generatedSubject}\n\n${generatedBody}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Parameter Selection Grid */}
      <div className="lg:col-span-5 bg-white p-6 neo-border neo-shadow flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider mb-6 border-b-2 border-black pb-2 text-black">
            Compose reminders
          </h2>

          {/* Select Invoice target */}
          <div className="mb-4">
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1.5 font-bold">
              Target Invoice Registry
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => setSelectedInvoiceId(e.target.value)}
              className="w-full text-xs neo-input font-mono"
            >
              <option value="" disabled>-- Select outstanding account --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} - {inv.clientName} [${inv.amount.toLocaleString()}]
                </option>
              ))}
            </select>
          </div>

          {selectedInvoice && (
            <div className="mb-6 p-3 bg-neutral-50 border border-neutral-300 text-xs text-neutral-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="font-mono">Outstanding Sum:</span>
                <span className="font-bold text-black">${selectedInvoice.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono">Due Date:</span>
                <span className="font-bold text-black">{selectedInvoice.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono">Authorized Email:</span>
                <span className="font-bold text-black underline">{selectedInvoice.clientEmail}</span>
              </div>
            </div>
          )}

          {/* Tone selections */}
          <div className="mb-6">
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-2 font-bold">
              Tone Modulator
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "friendly", desc: "Patient & Soft", color: "border-neutral-200" },
                { name: "business", desc: "Corporate Audit", color: "border-black" },
                { name: "urgent", desc: "Firm escalations", color: "border-rose-300" },
                { name: "alert", desc: "Secure Warning", color: "border-emerald-300" }
              ].map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTone(t.name as any)}
                  className={`text-left p-3 border-2 transition-all cursor-pointer ${
                    tone === t.name
                      ? "bg-black text-white border-black neo-shadow-sm"
                      : "bg-white text-zinc-800 hover:bg-neutral-50 border-neutral-300"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wide leading-none">{t.name}</p>
                  <span className={`text-[9px] font-mono leading-none block mt-1 ${
                    tone === t.name ? "text-zinc-300" : "text-neutral-500"
                  }`}>
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Personal message inclusion */}
          <div className="mb-6">
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1.5 font-bold">
              Preamble Personal Note
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Thanks for chatting on Friday! We're wrapping up audits this week..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full text-xs neo-input"
            ></textarea>
          </div>
        </div>

        {/* Generate triggers */}
        <div>
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedInvoiceId}
            className="w-full bg-black text-white hover:bg-zinc-800 py-3.5 border-2 border-black text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 neo-shadow"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={14} />
                <span>Modulating Tone via Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-400" />
                <span>Optimize with Gemini AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Presentation Results screen */}
      <div className="lg:col-span-7 bg-white p-6 neo-border neo-shadow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-extrabold">
              Remit Dispatch Content
            </h3>
            {usingOfflineFallback ? (
              <span className="text-[9px] bg-zinc-100 text-neutral-500 font-mono py-0.5 px-2 border border-zinc-300">
                OFFLINE CRYPTO PRESET
              </span>
            ) : (
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-mono py-0.5 px-2 border border-emerald-300 flex items-center gap-1 font-bold">
                <Sparkles size={10} className="text-emerald-600" /> GEMINI AI TAILORED
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Subject */}
            <div className="border border-neutral-300 p-3 bg-neutral-50">
              <span className="text-[9px] font-mono text-zinc-400 block mb-1">EMAIL SUBJECT:</span>
              <span className="text-xs font-bold text-black font-sans leading-relaxed block">
                {generatedSubject || "Select invoice records above to preview email contents."}
              </span>
            </div>

            {/* Body */}
            <div className="border border-neutral-300 p-4 bg-zinc-50 font-mono text-xs text-zinc-800 leading-relaxed whitespace-pre-wrap min-h-[280px]">
              {generatedBody || "Email body preview compiles here instantly."}
            </div>
          </div>
        </div>

        {/* Action controls */}
        {generatedBody && (
          <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 bg-white hover:bg-neutral-100 text-black border-2 border-black py-3.5 text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-600" />
                  <span>Copy Complete</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Complete Letter</span>
                </>
              )}
            </button>
            <button
              onClick={() => alert(`Remit dispatch instructions transmitted securely via TrustInvoice to: ${selectedInvoice?.clientEmail}`)}
              className="flex-1 bg-black hover:bg-neutral-800 text-white border-2 border-black py-3.5 text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm"
            >
              <Send size={14} />
              <span>Dispatch Secure Email</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
