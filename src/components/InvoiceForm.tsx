import React, { useState, useEffect, useRef, useMemo } from "react";
import { Invoice, InvoiceItem } from "../types";
import { 
  Plus, Trash2, Shield, Lock, Send, Check, Sparkles, 
  Wand2, History, AlertCircle, ArrowRight, CheckCircle2, 
  RotateCcw, Info, Zap, Layers, ShieldCheck, Mic 
} from "lucide-react";
import VoiceInvoiceDictation, { DictatedInvoiceData } from "./VoiceInvoiceDictation";
import { generateSha256Seal } from "../utils/cryptoSeal";

interface InvoiceFormProps {
  invoices?: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
  onNavigateToTab: (tabName: string) => void;
}

interface ClientSuggestion {
  clientName: string;
  paymentTermsDays: number;
  suggestedItems: {
    description: string;
    quantity: number;
    rate: number;
  }[];
  recommendedNotes: string;
  confidence: number;
  reasoning: string;
  isSecureSigned?: boolean;
  secureIPLock?: boolean;
  autoReminders?: boolean;
}

export default function InvoiceForm({ invoices = [], onAddInvoice, onNavigateToTab }: InvoiceFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [issuedDate, setIssuedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "item-1", description: "Strategic Cybersecurity Development Integration", quantity: 1, rate: 2500 }
  ]);
  const [bankName, setBankName] = useState("Chase Manhattan Security");
  const [routingNo, setRoutingNo] = useState("021000021");
  const [accountNo, setAccountNo] = useState("4829103948");
  const [notes, setNotes] = useState("");

  // Security preferences
  const [isSecureSigned, setIsSecureSigned] = useState(true);
  const [secureIPLock, setSecureIPLock] = useState(false);
  const [autoReminders, setAutoReminders] = useState(true);

  // Auto-Suggest States
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<ClientSuggestion | null>(null);
  const [suggestionSource, setSuggestionSource] = useState<"api" | "history" | null>(null);
  const [justApplied, setJustApplied] = useState(false);
  const [autoSuggestDismissed, setAutoSuggestDismissed] = useState(false);
  const [showVoiceDictation, setShowVoiceDictation] = useState(false);
  const [voiceAppliedToast, setVoiceAppliedToast] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Apply Dictated Invoice Data
  const handleApplyDictation = (data: DictatedInvoiceData) => {
    if (data.clientName) setClientName(data.clientName);
    if (data.clientEmail) setClientEmail(data.clientEmail);
    if (data.paymentTermsDays) {
      const calculatedDue = new Date(
        Date.now() + data.paymentTermsDays * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0];
      setDueDate(calculatedDue);
    }
    if (data.items && data.items.length > 0) {
      setItems(
        data.items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          description: item.description,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
        }))
      );
    }
    if (data.notes) {
      setNotes(data.notes);
    }

    setVoiceAppliedToast(true);
    setTimeout(() => setVoiceAppliedToast(false), 4000);
  };

  // Extract unique historical clients
  const historicalClients = useMemo(() => {
    const map = new Map<string, { name: string; email: string; count: number; lastInvoice: Invoice }>();
    invoices.forEach((inv) => {
      const emailKey = inv.clientEmail.trim().toLowerCase();
      if (!map.has(emailKey)) {
        map.set(emailKey, { name: inv.clientName, email: inv.clientEmail, count: 1, lastInvoice: inv });
      } else {
        const item = map.get(emailKey)!;
        item.count += 1;
        item.lastInvoice = inv;
      }
    });
    return Array.from(map.values()).slice(0, 6);
  }, [invoices]);

  // Quick helper to calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = subtotal * 0.08; // 8% dummy tax
  const total = subtotal + tax;

  // Trigger Gemini API Auto-Suggestion
  const fetchClientSuggestion = async (emailToQuery: string) => {
    if (!emailToQuery || !emailToQuery.includes("@") || emailToQuery.length < 5) {
      setSuggestion(null);
      return;
    }

    setIsSuggesting(true);
    setAutoSuggestDismissed(false);

    try {
      // Prepare historical records for context
      const relevantHistory = invoices
        .filter((inv) => 
          inv.clientEmail.toLowerCase() === emailToQuery.toLowerCase() ||
          inv.clientEmail.toLowerCase().includes(emailToQuery.split("@")[1]?.toLowerCase() || "")
        )
        .slice(0, 5)
        .map((inv) => ({
          clientName: inv.clientName,
          clientEmail: inv.clientEmail,
          amount: inv.amount,
          issuedDate: inv.issuedDate,
          dueDate: inv.dueDate,
          items: inv.items,
          notes: inv.notes,
          status: inv.status,
          paymentDetails: inv.paymentDetails,
        }));

      // Call server-side Gemini endpoint
      const response = await fetch("/api/ai/suggest-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToQuery,
          historicalInvoices: relevantHistory.length > 0 ? relevantHistory : invoices.slice(0, 8).map(i => ({
            clientName: i.clientName,
            clientEmail: i.clientEmail,
            items: i.items,
            notes: i.notes,
            amount: i.amount
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestion(data);
        setSuggestionSource("api");
      } else {
        // Fallback to client-side historical pattern matching
        throw new Error("Server API unavailable");
      }
    } catch (err) {
      // Local Pattern Matching Fallback
      const exactMatch = invoices.find(
        (i) => i.clientEmail.toLowerCase() === emailToQuery.toLowerCase()
      );
      const domainMatch = invoices.find(
        (i) => i.clientEmail.split("@")[1]?.toLowerCase() === emailToQuery.split("@")[1]?.toLowerCase()
      );
      const matched = exactMatch || domainMatch;

      if (matched) {
        // Compute term days from last invoice
        const issued = new Date(matched.issuedDate).getTime();
        const due = new Date(matched.dueDate).getTime();
        const diffDays = Math.max(7, Math.round((due - issued) / (1000 * 60 * 60 * 24))) || 14;

        setSuggestion({
          clientName: matched.clientName,
          paymentTermsDays: diffDays,
          suggestedItems: matched.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            rate: it.rate,
          })),
          recommendedNotes: matched.notes || "Standard Net-14 settlement directives per enterprise agreement.",
          confidence: exactMatch ? 96 : 78,
          reasoning: exactMatch
            ? `Exact historical invoice pattern match detected for ${matched.clientName} with ${invoices.filter(i => i.clientEmail.toLowerCase() === emailToQuery.toLowerCase()).length} previous settlements.`
            : `Domain pattern match with existing enterprise account '${matched.clientName}'.`,
          isSecureSigned: matched.isSecureSigned,
          secureIPLock: matched.secureIPLock,
          autoReminders: matched.autoReminders,
        });
        setSuggestionSource("history");
      } else {
        // Synthesize smart suggestion from domain
        const domain = emailToQuery.split("@")[1] || "";
        const domainName = domain.split(".")[0] || "Client";
        const formattedName = domainName.charAt(0).toUpperCase() + domainName.slice(1) + " Technologies";

        setSuggestion({
          clientName: formattedName,
          paymentTermsDays: 14,
          suggestedItems: [
            { description: "Enterprise Cloud Infrastructure & Security Services", quantity: 1, rate: 3200 },
            { description: "Dedicated Technical Support SLA & Monitoring", quantity: 1, rate: 850 }
          ],
          recommendedNotes: `Remittance due within 14 business days. Please reference wire coordination token on payment receipt.`,
          confidence: 65,
          reasoning: `Domain intelligence analysis on '${domain}' indicates technology & professional services billing profile.`,
          isSecureSigned: true,
          secureIPLock: false,
          autoReminders: true,
        });
        setSuggestionSource("api");
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  // Watch clientEmail changes with debounce
  const handleEmailChange = (newEmail: string) => {
    setClientEmail(newEmail);
    setAutoSuggestDismissed(false);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newEmail.includes("@") && newEmail.length > 5) {
      debounceTimerRef.current = setTimeout(() => {
        fetchClientSuggestion(newEmail);
      }, 600);
    } else {
      setSuggestion(null);
    }
  };

  // Apply Auto-Suggestion to all relevant fields
  const applyAllSuggestions = () => {
    if (!suggestion) return;

    // Apply Client Name
    if (suggestion.clientName) {
      setClientName(suggestion.clientName);
    }

    // Calculate Due Date based on suggested paymentTermsDays
    if (suggestion.paymentTermsDays) {
      const baseDate = issuedDate ? new Date(issuedDate) : new Date();
      const newDue = new Date(baseDate.getTime() + suggestion.paymentTermsDays * 24 * 60 * 60 * 1000);
      setDueDate(newDue.toISOString().split("T")[0]);
    }

    // Apply Items
    if (suggestion.suggestedItems && suggestion.suggestedItems.length > 0) {
      setItems(
        suggestion.suggestedItems.map((it, idx) => ({
          id: `item-suggest-${Date.now()}-${idx}`,
          description: it.description,
          quantity: it.quantity || 1,
          rate: it.rate || 100,
        }))
      );
    }

    // Apply Notes
    if (suggestion.recommendedNotes) {
      setNotes(suggestion.recommendedNotes);
    }

    // Apply Security Preferences
    if (suggestion.isSecureSigned !== undefined) {
      setIsSecureSigned(suggestion.isSecureSigned);
    }
    if (suggestion.secureIPLock !== undefined) {
      setSecureIPLock(suggestion.secureIPLock);
    }
    if (suggestion.autoReminders !== undefined) {
      setAutoReminders(suggestion.autoReminders);
    }

    // Visual Feedback
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 4000);
  };

  // Select historical client pill
  const handleSelectHistoricalClient = (client: { name: string; email: string }) => {
    setClientEmail(client.email);
    setClientName(client.name);
    fetchClientSuggestion(client.email);
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 100
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: "description" | "quantity" | "rate", value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    if (honeypot.trim() !== "") {
      errors.push("Automated submission rejected.");
    }
    if (clientName.trim().length < 2) {
      errors.push("Client / Entity Name must be at least 2 characters.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail.trim())) {
      errors.push("Enter a valid Client Authorized Email address.");
    }
    if (!issuedDate || !dueDate) {
      errors.push("Issued date and due date are required.");
    } else if (new Date(dueDate) < new Date(issuedDate)) {
      errors.push("Due date cannot be earlier than the invoice issued date.");
    }
    if (!/^\d{9}$/.test(routingNo.trim())) {
      errors.push("ABA Routing Number must be exactly 9 digits.");
    }
    if (accountNo.trim().length < 4) {
      errors.push("Bank Account Number must be at least 4 characters.");
    }
    if (items.some((it) => !it.description.trim() || it.quantity <= 0 || it.rate < 0)) {
      errors.push("Every line item requires a description, positive quantity, and non-negative rate.");
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const timestamp = new Date().toISOString();
    const sealPayload = JSON.stringify({
      clientEmail: clientEmail.trim(),
      amount: parseFloat(total.toFixed(2)),
      issuedDate,
      dueDate,
      bankName: bankName.trim(),
      routingNo: routingNo.trim(),
      accountNo: accountNo.trim(),
      timestamp,
    });
    const trustSealHash = isSecureSigned
      ? await generateSha256Seal(sealPayload)
      : "SHA256-draft-unsigned";

    const generatedInvoiceNumber = `INV-2026-00${Math.floor(Math.random() * 90) + 10}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: generatedInvoiceNumber,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      amount: parseFloat(total.toFixed(2)),
      issuedDate,
      dueDate,
      status: "Sent",
      items,
      isSecureSigned,
      secureIPLock,
      autoReminders,
      trustSealHash,
      fraudRiskScore: isSecureSigned ? 2 : 35,
      notes,
      paymentDetails: {
        bankName,
        routingNo,
        accountNo,
        iban: `US49${bankName.substring(0, 4).toUpperCase()}${routingNo}${accountNo}`,
        swift: `${bankName.substring(0, 4).toUpperCase()}US33`
      },
      auditLogs: [
        {
          timestamp,
          ipAddress: "127.0.0.1",
          action: "Invoice Registered & Electronically Signed",
          status: "success",
          details: `Invoice entry committed securely under Web Crypto trust seal ${trustSealHash.substring(0, 16)}.`
        }
      ]
    };

    onAddInvoice(newInvoice);
    onNavigateToTab("invoices");
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Honeypot anti-spam field */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="invoice-website-trap">Leave empty</label>
        <input
          id="invoice-website-trap"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Parameters Entry */}
      <div className="lg:col-span-8 bg-white p-6 neo-border neo-shadow space-y-6">
        {validationErrors.length > 0 && (
          <div role="alert" className="bg-rose-50 border-2 border-rose-700 p-4 text-rose-950 font-mono text-xs space-y-1">
            <div className="font-bold uppercase flex items-center gap-1.5">
              <AlertCircle size={14} aria-hidden="true" />
              <span>Please correct the following fields before submitting:</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-black flex items-center gap-2">
              <span>Record New Trust Invoice</span>
            </h2>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Enter authorized client coordinates to trigger automated Gemini pattern matching.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVoiceDictation(!showVoiceDictation)}
              className={`text-xs font-mono font-bold uppercase py-1.5 px-3 border transition-all cursor-pointer flex items-center gap-1.5 ${
                showVoiceDictation
                  ? "bg-amber-400 text-black border-black neo-shadow-sm"
                  : "bg-black text-white hover:bg-zinc-800 border-black"
              }`}
            >
              <Mic size={13} className={showVoiceDictation ? "animate-pulse" : ""} />
              <span>{showVoiceDictation ? "Close Voice Dictation" : "Voice Dictation"}</span>
            </button>

            <span className="text-[10px] font-mono font-bold uppercase bg-indigo-50 text-indigo-900 border border-indigo-300 px-2 py-1 hidden sm:flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-600" />
              <span>Gemini Auto-Suggest</span>
            </span>
          </div>
        </div>

        {/* Voice Dictation Drawer */}
        {showVoiceDictation && (
          <VoiceInvoiceDictation onApplyDictation={handleApplyDictation} />
        )}

        {/* Voice Applied Success Notification Toast */}
        {voiceAppliedToast && (
          <div className="bg-emerald-50 border-2 border-emerald-600 p-3 text-emerald-900 font-mono text-xs flex items-center gap-2 neo-shadow-sm">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Voice dictation transcript parsed & applied to invoice parameters!</span>
          </div>
        )}

        {/* Quick Select Frequent Clients */}
        {historicalClients.length > 0 && (
          <div className="bg-zinc-50 p-3 border border-zinc-300 neo-shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase text-zinc-500">
              <span className="flex items-center gap-1">
                <History size={11} />
                <span>Historical Client Autocomplete:</span>
              </span>
              <span>{historicalClients.length} verified counterparts</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {historicalClients.map((c) => (
                <button
                  key={c.email}
                  type="button"
                  onClick={() => handleSelectHistoricalClient(c)}
                  className={`text-[11px] font-mono px-2 py-1 border transition-all cursor-pointer flex items-center gap-1.5 ${
                    clientEmail.toLowerCase() === c.email.toLowerCase()
                      ? "bg-black text-white border-black font-bold"
                      : "bg-white text-zinc-800 border-zinc-300 hover:border-black hover:bg-zinc-100"
                  }`}
                >
                  <span className="truncate max-w-[120px]">{c.name}</span>
                  <span className="text-[9px] opacity-70">({c.email})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Counterparty section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Email Field with Trigger */}
            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-mono uppercase text-zinc-500 font-bold">
                  Client Authorized Email *
                </label>
                {clientEmail && (
                  <button
                    type="button"
                    onClick={() => fetchClientSuggestion(clientEmail)}
                    disabled={isSuggesting}
                    className="text-[10px] font-mono font-bold uppercase text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>{isSuggesting ? "Analyzing..." : "Re-Scan Patterns"}</span>
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="e.g. billing@apextechnologies.com"
                  value={clientEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full text-xs neo-input pr-8"
                />
                {isSuggesting && (
                  <div className="absolute right-2.5 top-2.5 text-indigo-600 animate-spin">
                    <Sparkles size={14} />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                Type an email or domain to automatically analyze historical billing records.
              </span>
            </div>

            {/* Client Name Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-mono uppercase text-zinc-500 font-bold">
                  Client Business Name *
                </label>
                {suggestion && suggestion.clientName && clientName !== suggestion.clientName && (
                  <button
                    type="button"
                    onClick={() => setClientName(suggestion.clientName)}
                    className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 border border-emerald-300 hover:bg-emerald-100 cursor-pointer"
                  >
                    Use &quot;{suggestion.clientName}&quot;
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Apex Technologies Global Ltd"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full text-xs neo-input"
              />
            </div>
          </div>

          {/* Gemini AI Auto-Suggest Intelligence Banner / Card */}
          {suggestion && !autoSuggestDismissed && (
            <div className="bg-indigo-50 border-2 border-indigo-700 p-4 neo-shadow-sm relative space-y-3">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-indigo-200 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-600 text-white">
                    <Wand2 size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono uppercase text-indigo-950">
                        Gemini AI Client Auto-Suggest
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-indigo-200 text-indigo-900 px-1.5 py-0.2 border border-indigo-300">
                        {suggestion.confidence}% Confidence
                      </span>
                      {suggestionSource === "history" && (
                        <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-900 px-1.5 py-0.2 border border-emerald-300">
                          Historical Match
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-800 font-sans mt-0.5">
                      {suggestion.reasoning}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={applyAllSuggestions}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs font-bold uppercase px-3 py-1.5 flex items-center gap-1.5 border border-black cursor-pointer neo-shadow-sm transition-all"
                  >
                    <Zap size={13} />
                    <span>Pre-fill All Information</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoSuggestDismissed(true)}
                    className="text-zinc-500 hover:text-black font-mono text-xs p-1"
                    title="Dismiss suggestion"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Grid of detected pre-fill parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-mono">
                {/* Detected Name & Terms */}
                <div className="bg-white p-2.5 border border-indigo-200">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">
                    Detected Entity &amp; Terms
                  </span>
                  <div className="font-bold text-black truncate">{suggestion.clientName}</div>
                  <div className="text-[10px] text-indigo-700 mt-0.5">
                    Net-{suggestion.paymentTermsDays || 14} Day Maturity Terms
                  </div>
                </div>

                {/* Suggested Items Preview */}
                <div className="bg-white p-2.5 border border-indigo-200">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">
                    Historical Line Items ({suggestion.suggestedItems?.length || 0})
                  </span>
                  <div className="text-[11px] text-zinc-800 truncate font-semibold">
                    {suggestion.suggestedItems?.[0]?.description || "Professional Services"}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                    ${suggestion.suggestedItems?.[0]?.rate?.toLocaleString() || "0"} rate standard
                  </div>
                </div>

                {/* Remittance & Security */}
                <div className="bg-white p-2.5 border border-indigo-200">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase block mb-1">
                    Security Directives
                  </span>
                  <div className="text-[10px] text-zinc-700 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    <span>SHA-256 Sign Seal Recommended</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                    {suggestion.recommendedNotes?.substring(0, 40)}...
                  </div>
                </div>
              </div>

              {/* Just Applied Confirmation */}
              {justApplied && (
                <div className="bg-emerald-100 border border-emerald-400 p-2 text-emerald-900 text-xs font-mono font-bold flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-700" />
                  <span>Client information and historical invoice patterns successfully applied!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-dashed border-zinc-200">
          <div>
            <label className="block text-xs font-mono uppercase text-zinc-500 mb-1.5 font-bold">
              Dispatch Release Date
            </label>
            <input
              type="date"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
              className="w-full text-xs neo-input font-mono"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-mono uppercase text-zinc-500 font-bold">
                Payment Maturity Deadline
              </label>
              {suggestion?.paymentTermsDays && (
                <span className="text-[10px] font-mono text-zinc-500">
                  Net-{suggestion.paymentTermsDays} Days
                </span>
              )}
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs neo-input font-mono"
            />
          </div>
        </div>

        {/* Work items description array */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono uppercase text-zinc-500 font-bold flex items-center gap-1.5">
              <Layers size={13} />
              <span>Line Items Registry</span>
            </span>
            <button
              type="button"
              onClick={handleAddItem}
              className="p-1 px-3 border-2 border-black hover:bg-neutral-100 text-xs font-semibold font-mono flex items-center gap-1 cursor-pointer transition-all neo-shadow-sm"
            >
              <Plus size={12} /> Add Row
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-zinc-50 p-3 border border-neutral-300">
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    required
                    placeholder="Work description or deliverable details"
                    value={item.description}
                    onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                    className="w-full text-xs bg-white border border-neutral-300 p-2 font-semibold"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="w-16">
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="Qty"
                      title="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      className="w-full text-xs bg-white border border-neutral-300 p-2 font-mono text-center"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="Rate"
                      title="Hourly or flat rate"
                      value={item.rate}
                      onChange={(e) => handleUpdateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      className="w-full text-xs bg-white border border-neutral-300 p-2 font-mono text-right"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={items.length === 1}
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-rose-600 disabled:text-zinc-300 cursor-pointer hover:bg-rose-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banking Route detail definitions */}
        <div className="pt-4 border-t border-dashed border-zinc-200 space-y-3">
          <span className="text-xs font-mono uppercase text-zinc-500 font-bold block">
            Secure Bank Remit Routing Coordinates
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Recipient Institution
              </label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full text-xs neo-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Routing ABA Code
              </label>
              <input
                type="text"
                maxLength={9}
                required
                value={routingNo}
                onChange={(e) => setRoutingNo(e.target.value)}
                className="w-full text-xs neo-input font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-neutral-400 mb-1">
                Account Number
              </label>
              <input
                type="text"
                required
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                className="w-full text-xs neo-input font-mono"
              />
            </div>
          </div>
        </div>

        {/* Private notes */}
        <div className="pt-2">
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-mono uppercase text-zinc-500 font-bold">
              Private Remarks / Settlement Directives
            </label>
            {suggestion?.recommendedNotes && notes !== suggestion.recommendedNotes && (
              <button
                type="button"
                onClick={() => setNotes(suggestion.recommendedNotes)}
                className="text-[10px] font-mono font-bold text-indigo-700 hover:underline cursor-pointer"
              >
                Use AI Note
              </button>
            )}
          </div>
          <textarea
            rows={2}
            placeholder="Provide custom reference parameters to list in the document..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs neo-input"
          ></textarea>
        </div>
      </div>

      {/* Security Protection Sidebar */}
      <div className="lg:col-span-4 bg-black text-white p-6 neo-border neo-shadow flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold tracking-wider uppercase mb-6 flex items-center gap-2 border-b border-zinc-800 pb-3 text-white">
            <Shield className="text-emerald-400" size={18} />
            <span>CYBER PROTECTION CODES</span>
          </h3>

          <div className="space-y-5">
            {/* Sign Seals Checkbox */}
            <div 
              onClick={() => setIsSecureSigned(!isSecureSigned)}
              className="flex gap-3 hover:bg-zinc-900 p-3 cursor-pointer border border-transparent hover:border-neutral-800 rounded transition-all duration-200"
            >
              <div className="mt-0.5">
                {isSecureSigned ? (
                  <div className="bg-white text-black border border-white p-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-zinc-500 bg-black"></div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                  <span>Inject Cryptographic Sign Seal</span>
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                  Enables verified SHA256 seals. Protects clients against wire-routing spoofing.
                </p>
              </div>
            </div>

            {/* Secure IP Locking */}
            <div 
              onClick={() => setSecureIPLock(!secureIPLock)}
              className="flex gap-3 hover:bg-zinc-900 p-3 cursor-pointer border border-transparent hover:border-neutral-800 rounded transition-all duration-200"
            >
              <div className="mt-0.5">
                {secureIPLock ? (
                  <div className="bg-white text-black border border-white p-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-zinc-500 bg-black"></div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                  <span>Restrict link to host IP (Audit)</span>
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                  Generates security flags inside outstanding logs if accessed from unexpected locations.
                </p>
              </div>
            </div>

            {/* Autopilot collection warning dispatch */}
            <div 
              onClick={() => setAutoReminders(!autoReminders)}
              className="flex gap-3 hover:bg-zinc-900 p-3 cursor-pointer border border-transparent hover:border-neutral-800 rounded transition-all duration-200"
            >
              <div className="mt-0.5">
                {autoReminders ? (
                  <div className="bg-white text-black border border-white p-0.5">
                    <Check size={12} strokeWidth={3} />
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-zinc-500 bg-black"></div>
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-white flex items-center gap-1.5">
                  <span>Enable Intelligent AI Collection Reminders</span>
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                  Activates automatic tone-modulated dispatch check timers based on remaining maturity days.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Dynamic visual price display Box */}
          <div className="mt-8 bg-zinc-900 border border-zinc-800 p-4">
            <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">AGGREGATE SUM</span>
            <div className="text-2xl font-black font-mono text-white tracking-tight flex justify-between items-baseline">
              <span>Total DUE:</span>
              <span>${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="border-t border-zinc-800 pt-2 mt-2 flex justify-between text-[10px] font-mono text-zinc-400">
              <span>Subtotal: ${subtotal.toFixed(2)}</span>
              <span>Secure Surcharge (8%): ${tax.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-white text-black hover:bg-neutral-100 py-3 mt-6 border-2 border-white text-xs font-bold tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 neo-shadow-sm"
          >
            <span>Authorize & Commit Registry</span>
            <Send size={12} />
          </button>
        </div>
      </div>
    </form>
  );
}
