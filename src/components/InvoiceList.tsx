import React, { useState } from "react";
import { Invoice, SecurityAuditEntry, DocumentFormat } from "../types";
import { 
  Search, Filter, ShieldCheck, Mail, ExternalLink, RefreshCw, 
  CheckCircle, AlertTriangle, Clock, ArrowRight, Eye, ShieldAlert, 
  CheckSquare, Square, X, RotateCcw, Receipt, Briefcase, FileText 
} from "lucide-react";

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onNavigateToTab: (tabName: string, selectedInvoice?: Invoice, format?: DocumentFormat) => void;
}

export default function InvoiceList({ invoices, onSelectInvoice, onUpdateInvoice, onNavigateToTab }: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(invoices[0]?.id || null);

  const selectedInvoice = invoices.find((inv) => inv.id === selectedId);

  // Filters by client name, invoice number, or status (text search or category filter)
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      normalizedSearch === "" ||
      inv.clientName.toLowerCase().includes(normalizedSearch) ||
      inv.invoiceNumber.toLowerCase().includes(normalizedSearch) ||
      inv.clientEmail.toLowerCase().includes(normalizedSearch) ||
      inv.status.toLowerCase().includes(normalizedSearch);

    if (activeFilter === "all") return matchesSearch;
    return matchesSearch && inv.status.toLowerCase() === activeFilter;
  });

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleResetAllFilters = () => {
    setSearchTerm("");
    setActiveFilter("all");
  };

  // Toggle paid status
  const handleToggleStatus = (status: "Paid" | "Sent" | "Overdue" | "Review") => {
    if (!selectedInvoice) return;
    const updated: Invoice = {
      ...selectedInvoice,
      status,
      auditLogs: [
        {
          timestamp: new Date().toISOString(),
          action: `Manual Status Override to [${status}]`,
          ipAddress: "127.0.0.1 (Owner Console)",
          status: status === "Paid" ? "success" : status === "Overdue" ? "warn" : "info",
          details: `Invoice status manually set to ${status}.`
        },
        ...selectedInvoice.auditLogs
      ]
    };
    onUpdateInvoice(updated);
  };

  // Simulate client view click to generate real-time secure logging audit trail
  const handleSimulateClientView = () => {
    if (!selectedInvoice) return;
    const randomIP = `${Math.floor(Math.random() * 210) + 10}.${Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const newLogEntry: SecurityAuditEntry = {
      timestamp: new Date().toISOString(),
      action: "Secure Link Accessed",
      ipAddress: randomIP,
      status: selectedInvoice.secureIPLock ? "warn" : "success",
      details: selectedInvoice.secureIPLock
        ? `IP locked audit: View attempted from coordinate ${randomIP}. Signature requested.`
        : `Verified client portal entrance. Electronic signature confirmed.`
    };

    const updated: Invoice = {
      ...selectedInvoice,
      auditLogs: [newLogEntry, ...selectedInvoice.auditLogs]
    };
    onUpdateInvoice(updated);
  };

  const statusBadges = {
    Paid: "bg-black text-white hover:bg-neutral-800",
    Sent: "bg-white text-black border-2 border-black",
    Overdue: "bg-red-50 text-red-600 border-2 border-red-600",
    Review: "bg-yellow-50 text-amber-700 border-2 border-amber-500"
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* List Panel */}
      <div className="lg:col-span-7 bg-white p-6 neo-border neo-shadow">
        {/* Header & Search Bar */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
              <span>Invoice Registries</span>
              <span className="text-xs bg-zinc-100 py-1 px-2 border border-black font-mono font-normal">
                {filteredInvoices.length} of {invoices.length} entries
              </span>
            </h2>

            {/* Total search matches indicator */}
            {searchTerm.trim() && (
              <span className="text-[10px] font-mono bg-amber-100 border border-amber-400 text-amber-900 px-2 py-1 font-bold">
                Filtered by: &ldquo;{searchTerm}&rdquo;
              </span>
            )}
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full">
            <input
              id="invoice-registry-search-input"
              type="text"
              placeholder="Search by client name, invoice number, or status (e.g., Paid, Overdue, Review, Sent)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs neo-input pl-9 pr-10 py-2.5 font-mono border-2 border-black placeholder:text-neutral-400 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
            <Search className="absolute left-3 top-3 text-neutral-500" size={15} />
            {searchTerm && (
              <button
                type="button"
                id="invoice-registry-clear-search-btn"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 p-1 text-neutral-400 hover:text-black rounded transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Quick-Buttons & Status Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b-2 border-neutral-100 pb-4">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {["all", "paid", "sent", "overdue", "review"].map((filter) => (
              <button
                key={filter}
                id={`invoice-filter-${filter}`}
                onClick={() => setActiveFilter(filter)}
                className={`text-xs font-mono py-1.5 px-3 border-2 transition-all cursor-pointer ${
                  activeFilter === filter
                    ? "bg-black text-white border-black font-bold neo-shadow-sm"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-black"
                }`}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </div>

          {(searchTerm.trim() || activeFilter !== "all") && (
            <button
              type="button"
              id="invoice-registry-reset-filters-btn"
              onClick={handleResetAllFilters}
              className="text-[10px] font-mono text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer underline underline-offset-2"
            >
              <RotateCcw size={11} />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                <th className="py-3 px-2">Invoice Code</th>
                <th className="py-3 px-2">Counterparty</th>
                <th className="py-3 px-2 text-right">Sum</th>
                <th className="py-3 px-2 text-center">Security Seals</th>
                <th className="py-3 px-2 text-right">State</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs font-mono text-neutral-500 space-y-3">
                    <div className="text-sm font-bold text-black uppercase mb-1">
                      No matching invoices found
                    </div>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      {searchTerm.trim()
                        ? `No records match your query "${searchTerm}" under filter [${activeFilter.toUpperCase()}].`
                        : `No records found in category [${activeFilter.toUpperCase()}].`}
                    </p>
                    {(searchTerm.trim() || activeFilter !== "all") && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleResetAllFilters}
                          className="bg-black text-white hover:bg-neutral-800 text-xs font-mono py-2 px-4 border border-black uppercase font-bold cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <RotateCcw size={12} />
                          <span>Clear Search & Show All</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedId(inv.id)}
                    className={`border-b border-zinc-100 hover:bg-neutral-50 cursor-pointer transition-colors text-xs ${
                      selectedId === inv.id ? "bg-neutral-50 font-semibold" : ""
                    }`}
                  >
                    <td className="py-4 px-2 font-mono">{inv.invoiceNumber}</td>
                    <td className="py-4 px-2 max-w-[150px] truncate">
                      <div className="font-bold text-black">{inv.clientName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{inv.clientEmail}</div>
                    </td>
                    <td className="py-4 px-2 text-right font-bold text-black">
                      ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-2 text-center">
                      <div className="flex justify-center items-center">
                        {inv.isSecureSigned ? (
                          <span 
                            title="Cryptographically Locked and Protected" 
                            className="bg-emerald-50 text-emerald-600 px-2 py-0.5 border border-emerald-400 text-[9px] font-mono rounded flex items-center gap-1"
                          >
                            <ShieldCheck size={10} /> SIGNED
                          </span>
                        ) : (
                          <span 
                            title="Unsigned / Insecure Default Invoice" 
                            className="bg-amber-50 text-amber-600 px-2 py-0.5 border border-amber-300 text-[9px] font-mono rounded flex items-center gap-1"
                          >
                            <ShieldAlert size={10} /> BASE-ONLY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-block text-[9px] font-mono py-0.5 px-2 uppercase ${statusBadges[inv.status]}`}>
                          {inv.status}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <button
                            type="button"
                            title="Open Invoice Format"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(inv.id);
                              onNavigateToTab("portal", inv, "invoice");
                            }}
                            className="text-[9px] font-mono bg-zinc-100 hover:bg-black hover:text-white px-1.5 py-0.5 border border-zinc-300 transition-colors"
                          >
                            INV
                          </button>
                          <button
                            type="button"
                            title="Open Official Receipt Format"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(inv.id);
                              onNavigateToTab("portal", inv, "receipt");
                            }}
                            className="text-[9px] font-mono bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 px-1.5 py-0.5 border border-emerald-300 transition-colors"
                          >
                            REC
                          </button>
                          <button
                            type="button"
                            title="Open Pay Stub Format"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(inv.id);
                              onNavigateToTab("portal", inv, "paystub");
                            }}
                            className="text-[9px] font-mono bg-amber-50 hover:bg-amber-500 hover:text-black text-amber-900 px-1.5 py-0.5 border border-amber-300 transition-colors"
                          >
                            STUB
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Security Console Sidebar */}
      <div className="lg:col-span-5">
        {selectedInvoice ? (
          <div className="bg-white p-6 neo-border neo-shadow flex flex-col justify-between h-full">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start border-b border-neutral-200 pb-4 mb-4">
                <div>
                  <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Selected Registry</div>
                  <h3 className="text-2xl font-black tracking-tight mt-0.5 text-black">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                  <div className="text-xs font-mono text-zinc-400 mt-1">
                    Risk Assessment Score:{" "}
                    <span className={`font-bold ${
                      selectedInvoice.fraudRiskScore > 30 ? "text-amber-600" : "text-emerald-600"
                    }`}>
                      {selectedInvoice.fraudRiskScore}/100
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab("portal", selectedInvoice)}
                  className="bg-black text-white hover:bg-zinc-800 p-2 border-2 border-black hover:translate-x-0.5 hover:-translate-y-0.5 transition-all neo-shadow-sm cursor-pointer"
                  title="Open Secure Client Portal Presentation"
                >
                  <Eye size={16} />
                </button>
              </div>

              {/* Status Modifiers */}
              <div className="mb-4 bg-zinc-50 p-3 border border-neutral-300">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">State Controller</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["Paid", "Sent", "Overdue", "Review"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleToggleStatus(st)}
                      className={`text-[10px] font-mono py-1 cursor-pointer text-center border capitalize ${
                        selectedInvoice.status === st
                          ? "bg-black text-white border-black font-bold"
                          : "bg-white text-zinc-600 hover:bg-neutral-100 border-neutral-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Formats Launchpad */}
              <div className="mb-6 bg-white p-3 border-2 border-black">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                  Document View & Export Modes
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab("portal", selectedInvoice, "invoice")}
                    className="bg-black hover:bg-neutral-800 text-white p-2.5 text-[10px] font-mono font-bold uppercase flex flex-col items-center justify-center gap-1 border border-black cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5"
                    title="Open Standard Certified Invoice"
                  >
                    <FileText size={14} />
                    <span>Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab("portal", selectedInvoice, "receipt")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 text-[10px] font-mono font-bold uppercase flex flex-col items-center justify-center gap-1 border border-emerald-800 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5"
                    title="Open Official Payment Settlement Receipt"
                  >
                    <Receipt size={14} />
                    <span>Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToTab("portal", selectedInvoice, "paystub")}
                    className="bg-amber-400 hover:bg-amber-500 text-black p-2.5 text-[10px] font-mono font-bold uppercase flex flex-col items-center justify-center gap-1 border border-black cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5"
                    title="Open Payroll / Contractor Pay Stub"
                  >
                    <Briefcase size={14} />
                    <span>Pay Stub</span>
                  </button>
                </div>
              </div>

              {/* Secure Coordinates Details */}
              <div className="mb-6">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2 border-b border-dashed border-zinc-200 pb-1">
                  Secure Remitting Target
                </span>
                <div className="font-mono text-[11px] grid grid-cols-3 gap-y-1.5 gap-x-2 text-zinc-600">
                  <div className="text-zinc-400">Interbank Swift:</div>
                  <div className="col-span-2 text-black font-semibold uppercase">{selectedInvoice.paymentDetails.swift}</div>

                  <div className="text-zinc-400">Recipient Bank:</div>
                  <div className="col-span-2 text-black truncate">{selectedInvoice.paymentDetails.bankName}</div>

                  <div className="text-zinc-400">Account Int'l:</div>
                  <div className="col-span-2 text-black font-semibold truncate hover:text-rose-600" title={selectedInvoice.paymentDetails.iban}>
                    {selectedInvoice.paymentDetails.iban}
                  </div>
                </div>
              </div>

              {/* Digital Trust Seals */}
              <div className="mb-6 p-4 border-2 border-black bg-zinc-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 py-1 px-2 border-b border-l border-black font-mono text-[8px] bg-black text-white">
                  CRYPTOGRAPHIC LOG
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={20} className={selectedInvoice.isSecureSigned ? "text-emerald-600" : "text-amber-500"} />
                  <div>
                    <h4 className="text-xs font-bold uppercase text-black">
                      {selectedInvoice.isSecureSigned ? "Signed Trust Registry" : "Base Invoice Draft"}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Signature matches verified business entity records.
                    </p>
                  </div>
                </div>
                {selectedInvoice.isSecureSigned && (
                  <div className="mt-3 bg-white p-2 border border-neutral-200">
                    <span className="text-[9px] font-mono text-zinc-400 block">SHA-256 SECURE LOCK TARGET</span>
                    <span className="text-[10px] font-mono text-zinc-700 tracking-tight font-semibold block break-all">
                      {selectedInvoice.trustSealHash}
                    </span>
                  </div>
                )}
              </div>

              {/* Security Audit Log Entries */}
              <div>
                <div className="flex justify-between items-center mb-2 border-b border-neutral-200 pb-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Link Access Audit-Trails
                  </span>
                  <button
                    onClick={handleSimulateClientView}
                    className="text-[9px] font-mono underline text-black hover:text-neutral-600 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} /> Simulate Client Visit
                  </button>
                </div>
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                  {selectedInvoice.auditLogs.map((log, index) => (
                    <div key={index} className="border-l-2 border-black pl-3 py-1 bg-neutral-50">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <span className="bg-zinc-200 text-black px-1 text-[9px] font-semibold">{log.ipAddress}</span>
                      </div>
                      <div className="text-[11px] font-bold text-black mt-0.5">{log.action}</div>
                      <p className="text-[10px] text-neutral-600 leading-relaxed font-sans">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI reminder Dispatch quick action button */}
            <div className="mt-6 pt-4 border-t border-zinc-200 flex flex-col gap-2">
              <button
                onClick={() => onNavigateToTab("ai", selectedInvoice)}
                className="w-full bg-black text-white py-3 border-2 border-black font-semibold text-xs transition-all tracking-wider uppercase flex items-center justify-center gap-2 hover:translate-x-1 hover:-translate-y-1 neo-shadow cursor-pointer"
              >
                <span>Compose AI Payment Reminder</span>
                <Mail size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 neo-border neo-shadow text-center py-20 font-mono text-zinc-400 text-xs">
            No invoice selected. Select a record to view cybersecurity controls.
          </div>
        )}
      </div>
    </div>
  );
}
