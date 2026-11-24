import React, { useState, useMemo } from "react";
import { Invoice, SecurityAuditEntry, AuditEventType } from "../types";
import { 
  Mail, MailOpen, MousePointerClick, CreditCard, ShieldCheck, 
  Clock, ArrowDownUp, Search, Filter, Download, Printer, 
  CheckCircle2, AlertTriangle, Info, AlertCircle, Sparkles, 
  Send, ExternalLink, Globe, Laptop, Smartphone, Copy, Check, Plus
} from "lucide-react";

interface ClientAuditTrailProps {
  invoice: Invoice;
  onUpdateInvoice: (updated: Invoice) => void;
}

export default function ClientAuditTrail({ invoice, onUpdateInvoice }: ClientAuditTrailProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc"); // desc = newest first
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Helper to resolve event category if not explicitly set
  const resolveEventType = (entry: SecurityAuditEntry): AuditEventType => {
    if (entry.eventType) return entry.eventType;
    const actionLower = entry.action.toLowerCase();
    const detailsLower = entry.details.toLowerCase();

    if (actionLower.includes("email") && (actionLower.includes("open") || detailsLower.includes("opened"))) {
      return "email_open";
    }
    if (actionLower.includes("click") || actionLower.includes("viewed") || detailsLower.includes("clicked") || detailsLower.includes("portal viewed")) {
      return "link_click";
    }
    if (actionLower.includes("payment") || actionLower.includes("wire") || actionLower.includes("settled") || actionLower.includes("overdue") || actionLower.includes("paid")) {
      return "payment_update";
    }
    if (actionLower.includes("reminder") || actionLower.includes("dispatched") || actionLower.includes("sent")) {
      return "reminder_sent";
    }
    if (actionLower.includes("registered") || actionLower.includes("created")) {
      return "invoice_created";
    }
    return "system";
  };

  // Process & sort all audit entries
  const allProcessedEntries = useMemo(() => {
    const list = (invoice.auditLogs || []).map((entry) => ({
      ...entry,
      resolvedType: resolveEventType(entry)
    }));

    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [invoice.auditLogs, sortOrder]);

  // Filter & Search
  const filteredEntries = useMemo(() => {
    return allProcessedEntries.filter((entry) => {
      // Filter by type
      if (filterType !== "all") {
        if (filterType === "email_open" && entry.resolvedType !== "email_open") return false;
        if (filterType === "link_click" && entry.resolvedType !== "link_click") return false;
        if (filterType === "payment_update" && entry.resolvedType !== "payment_update") return false;
        if (filterType === "reminder_security" && !["reminder_sent", "invoice_created", "security_seal", "system"].includes(entry.resolvedType)) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesAction = entry.action.toLowerCase().includes(q);
        const matchesDetails = entry.details.toLowerCase().includes(q);
        const matchesIp = entry.ipAddress.toLowerCase().includes(q);
        const matchesLocation = (entry.location || "").toLowerCase().includes(q);
        const matchesUserAgent = (entry.userAgent || "").toLowerCase().includes(q);
        return matchesAction || matchesDetails || matchesIp || matchesLocation || matchesUserAgent;
      }

      return true;
    });
  }, [allProcessedEntries, filterType, searchQuery]);

  // Metric counts
  const totalEvents = allProcessedEntries.length;
  const emailOpenCount = allProcessedEntries.filter(e => e.resolvedType === "email_open").length;
  const linkClickCount = allProcessedEntries.filter(e => e.resolvedType === "link_click").length;
  const paymentUpdateCount = allProcessedEntries.filter(e => e.resolvedType === "payment_update").length;

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  // Real-time Event Simulation: Email Open
  const handleSimulateEmailOpen = () => {
    const timestamp = new Date().toISOString();
    const newEntry: SecurityAuditEntry = {
      timestamp,
      action: "Email Invoice Opened by Recipient",
      ipAddress: "74.125.210.34",
      location: "San Jose, CA, United States",
      userAgent: "Gmail Web App / Chrome 126 (macOS)",
      status: "success",
      eventType: "email_open",
      details: `Live tracking beacon triggered: ${invoice.clientEmail} reopened the invoice message via secure TLS connection.`
    };

    const updatedInvoice: Invoice = {
      ...invoice,
      auditLogs: [newEntry, ...invoice.auditLogs]
    };

    onUpdateInvoice(updatedInvoice);
    setSimulationNotice("Simulated Email Open event logged in real-time.");
    setTimeout(() => setSimulationNotice(null), 3000);
  };

  // Real-time Event Simulation: Link Click
  const handleSimulateLinkClick = () => {
    const timestamp = new Date().toISOString();
    const newEntry: SecurityAuditEntry = {
      timestamp,
      action: "Secure Remittance Portal Link Clicked",
      ipAddress: "74.125.210.34",
      location: "San Jose, CA, United States",
      userAgent: "Safari 17.5 / iOS 17.5 (iPhone)",
      status: "success",
      eventType: "link_click",
      details: `Client clicked the direct inspection link from email notification (session token #tk_live_${Date.now().toString().slice(-6)}).`
    };

    const updatedInvoice: Invoice = {
      ...invoice,
      auditLogs: [newEntry, ...invoice.auditLogs]
    };

    onUpdateInvoice(updatedInvoice);
    setSimulationNotice("Simulated Portal Link Click event logged in real-time.");
    setTimeout(() => setSimulationNotice(null), 3000);
  };

  // Export audit log as JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      amount: invoice.amount,
      status: invoice.status,
      trustSealHash: invoice.trustSealHash,
      exportedAt: new Date().toISOString(),
      auditLogs: allProcessedEntries
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-trail-${invoice.invoiceNumber}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Format date helper
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  const getEventBadge = (type: AuditEventType) => {
    switch (type) {
      case "email_open":
        return {
          icon: MailOpen,
          label: "Email Open",
          colorClass: "bg-blue-50 text-blue-800 border-blue-300",
          iconColor: "text-blue-700"
        };
      case "link_click":
        return {
          icon: MousePointerClick,
          label: "Link Click",
          colorClass: "bg-purple-50 text-purple-800 border-purple-300",
          iconColor: "text-purple-700"
        };
      case "payment_update":
        return {
          icon: CreditCard,
          label: "Payment Update",
          colorClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
          iconColor: "text-emerald-700"
        };
      case "reminder_sent":
        return {
          icon: Send,
          label: "Notification Sent",
          colorClass: "bg-amber-50 text-amber-800 border-amber-300",
          iconColor: "text-amber-700"
        };
      case "invoice_created":
        return {
          icon: ShieldCheck,
          label: "Invoice Created",
          colorClass: "bg-zinc-100 text-zinc-900 border-zinc-400",
          iconColor: "text-zinc-800"
        };
      default:
        return {
          icon: Info,
          label: "System Event",
          colorClass: "bg-zinc-100 text-zinc-700 border-zinc-300",
          iconColor: "text-zinc-600"
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Telemetry & Tracking Beacon */}
      <div className="bg-white p-6 neo-border neo-shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase bg-black text-white px-2 py-0.5">
              TELEMETRY AUDIT TRAIL
            </span>
            <span className="text-xs font-mono font-bold text-zinc-500">
              {invoice.invoiceNumber} • {invoice.clientName}
            </span>
            <div className="flex items-center gap-1.5 ml-2 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>LIVE BEACON ACTIVE</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-black tracking-tight mt-1">
            Chronological Engagement &amp; Payment Ledger
          </h2>
          <p className="text-xs text-zinc-600 font-sans max-w-2xl mt-0.5 leading-relaxed">
            Immutable timeline recording cryptographic invoice issuance, email deliveries, recipient pixel opens, portal inspection link clicks, and settlement status updates.
          </p>
        </div>

        {/* Action Buttons: Simulate, Export & Print */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSimulateEmailOpen}
            className="bg-white hover:bg-zinc-100 text-blue-900 border border-blue-400 font-mono text-xs font-bold py-2 px-3 flex items-center gap-1.5 cursor-pointer transition-all uppercase"
            title="Simulate recipient opening invoice email"
          >
            <MailOpen size={13} className="text-blue-700" />
            <span>Simulate Open</span>
          </button>

          <button
            onClick={handleSimulateLinkClick}
            className="bg-white hover:bg-zinc-100 text-purple-900 border border-purple-400 font-mono text-xs font-bold py-2 px-3 flex items-center gap-1.5 cursor-pointer transition-all uppercase"
            title="Simulate recipient clicking portal payment link"
          >
            <MousePointerClick size={13} className="text-purple-700" />
            <span>Simulate Click</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-white hover:bg-zinc-100 text-black border border-black font-mono text-xs font-bold py-2 px-3 flex items-center gap-1.5 cursor-pointer transition-all uppercase"
            title="Export full audit trail as JSON"
          >
            <Download size={13} />
            <span>Export Log</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-2 px-3 border-2 border-black flex items-center gap-1.5 cursor-pointer transition-all uppercase"
            title="Print Official Audit Certificate"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Simulation Feedback Alert */}
      {simulationNotice && (
        <div className="bg-emerald-50 border-2 border-emerald-600 p-3.5 text-emerald-950 text-xs font-mono flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-700" />
            <span>{simulationNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-800 uppercase font-bold">Ledger Updated</span>
        </div>
      )}

      {/* Metric KPI Summary Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
              Total Recorded Events
            </span>
            <span className="text-2xl font-black font-mono mt-1 block text-black">
              {totalEvents}
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-sans mt-2 block border-t border-zinc-100 pt-1.5">
            Since invoice creation on {invoice.issuedDate}
          </span>
        </div>

        {/* Email Opens */}
        <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                Email Opens
              </span>
              <span className="text-2xl font-black font-mono mt-1 block text-blue-700">
                {emailOpenCount}
              </span>
            </div>
            <div className="p-1.5 bg-blue-50 border border-blue-300 text-blue-700">
              <MailOpen size={16} />
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-sans mt-2 block border-t border-zinc-100 pt-1.5">
            Recipient: {invoice.clientEmail}
          </span>
        </div>

        {/* Link Clicks */}
        <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                Portal Link Clicks
              </span>
              <span className="text-2xl font-black font-mono mt-1 block text-purple-700">
                {linkClickCount}
              </span>
            </div>
            <div className="p-1.5 bg-purple-50 border border-purple-300 text-purple-700">
              <MousePointerClick size={16} />
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-sans mt-2 block border-t border-zinc-100 pt-1.5">
            Inspections &amp; payment page visits
          </span>
        </div>

        {/* Settlement Status */}
        <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                Current Payment Status
              </span>
              <span className={`text-2xl font-black font-mono mt-1 block ${
                invoice.status === "Paid" 
                  ? "text-emerald-700" 
                  : invoice.status === "Overdue" 
                  ? "text-red-600" 
                  : "text-zinc-800"
              }`}>
                {invoice.status}
              </span>
            </div>
            <div className={`p-1.5 border ${
              invoice.status === "Paid" 
                ? "bg-emerald-50 border-emerald-300 text-emerald-700" 
                : invoice.status === "Overdue" 
                ? "bg-red-50 border-red-300 text-red-600" 
                : "bg-zinc-50 border-zinc-300 text-zinc-700"
            }`}>
              <CreditCard size={16} />
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-sans mt-2 block border-t border-zinc-100 pt-1.5">
            {paymentUpdateCount} status transitions logged
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Events", count: totalEvents, icon: Clock },
            { id: "email_open", label: "Email Opens", count: emailOpenCount, icon: MailOpen },
            { id: "link_click", label: "Link Clicks", count: linkClickCount, icon: MousePointerClick },
            { id: "payment_update", label: "Payment Updates", count: paymentUpdateCount, icon: CreditCard },
            { id: "reminder_security", label: "System & Security", count: totalEvents - emailOpenCount - linkClickCount - paymentUpdateCount, icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`text-xs font-mono font-bold py-1.5 px-3 border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? "bg-black text-white border-black" 
                    : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSelected ? "bg-zinc-800 text-zinc-200" : "bg-zinc-200 text-zinc-700"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search action, IP, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 neo-input font-sans"
            />
          </div>

          <button
            onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
            className="p-1.5 bg-white border border-black hover:bg-zinc-100 text-black font-mono text-xs flex items-center gap-1 cursor-pointer"
            title={`Sorting: ${sortOrder === "desc" ? "Newest First" : "Oldest First"}`}
          >
            <ArrowDownUp size={13} />
            <span className="hidden sm:inline text-[11px] font-bold">
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </span>
          </button>
        </div>
      </div>

      {/* Chronological Vertical Timeline View */}
      <div className="bg-white p-6 neo-border neo-shadow-sm border-2 border-black">
        <div className="border-b-2 border-black pb-3 mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-mono font-black text-sm uppercase text-black">
              Chronological Audit Trail ({filteredEntries.length} Records)
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">
              Cryptographically verified against invoice hash: {invoice.trustSealHash}
            </span>
          </div>

          <span className="text-[10px] font-mono text-zinc-400 uppercase">
            Order: {sortOrder === "desc" ? "Latest ↓ Earliest" : "Earliest ↑ Latest"}
          </span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 font-mono text-xs">
            No audit records match the selected filter or search query.
          </div>
        ) : (
          <div className="relative border-l-2 border-black ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6">
            {filteredEntries.map((entry, index) => {
              const badge = getEventBadge(entry.resolvedType);
              const BadgeIcon = badge.icon;
              const isPayment = entry.resolvedType === "payment_update";
              const isEmail = entry.resolvedType === "email_open";
              const isClick = entry.resolvedType === "link_click";

              return (
                <div key={index} className="relative group">
                  {/* Timeline Dot Marker */}
                  <div className={`absolute -left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 rounded-full border-2 border-black flex items-center justify-center bg-white ${badge.colorClass}`}>
                    <BadgeIcon size={14} className={badge.iconColor} />
                  </div>

                  {/* Event Detail Box */}
                  <div className="bg-zinc-50 border border-zinc-300 p-4 neo-shadow-sm group-hover:border-black transition-all">
                    {/* Event Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-zinc-200 pb-2.5 mb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${badge.colorClass}`}>
                          {badge.label}
                        </span>
                        <h4 className="text-xs font-black font-mono text-black">
                          {entry.action}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                        <Clock size={11} />
                        <span>{formatDateTime(entry.timestamp)}</span>
                      </div>
                    </div>

                    {/* Event Body Description */}
                    <p className="text-xs text-zinc-700 font-sans leading-relaxed">
                      {entry.details}
                    </p>

                    {/* Event Metadata Badges Bar */}
                    <div className="mt-3 pt-2 border-t border-dashed border-zinc-200 flex flex-wrap items-center gap-2 text-[10px] font-mono">
                      {/* IP Address badge */}
                      <div className="bg-white border border-zinc-300 px-2 py-0.5 flex items-center gap-1.5 text-zinc-700">
                        <Globe size={11} className="text-zinc-500" />
                        <span>IP: <strong>{entry.ipAddress}</strong></span>
                        <button
                          onClick={() => handleCopyIp(entry.ipAddress)}
                          className="text-zinc-400 hover:text-black cursor-pointer ml-0.5"
                          title="Copy IP address"
                        >
                          {copiedIp === entry.ipAddress ? (
                            <Check size={10} className="text-emerald-600" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      </div>

                      {/* Location Badge if present */}
                      {entry.location && (
                        <div className="bg-white border border-zinc-300 px-2 py-0.5 flex items-center gap-1 text-zinc-700">
                          <span>📍 {entry.location}</span>
                        </div>
                      )}

                      {/* User Agent / Device Badge if present */}
                      {entry.userAgent && (
                        <div className="bg-white border border-zinc-300 px-2 py-0.5 flex items-center gap-1 text-zinc-600">
                          <Laptop size={11} className="text-zinc-500" />
                          <span>{entry.userAgent}</span>
                        </div>
                      )}

                      {/* Cryptographic Seal badge */}
                      <div className="ml-auto bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-emerald-800 flex items-center gap-1 font-bold">
                        <ShieldCheck size={11} className="text-emerald-700" />
                        <span>SHA-256 SEALED</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
