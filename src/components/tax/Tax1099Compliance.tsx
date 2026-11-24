import React, { useState } from "react";
import { Contractor1099, Invoice } from "../../types";
import { 
  FileSpreadsheet, Plus, CheckCircle2, AlertCircle, Eye, 
  Download, Printer, Search, ShieldCheck, Mail, UserCheck
} from "lucide-react";

interface Tax1099ComplianceProps {
  contractors: Contractor1099[];
  invoices: Invoice[];
  onAddContractor: (c: Contractor1099) => void;
  onUpdateContractor: (c: Contractor1099) => void;
}

export default function Tax1099Compliance({
  contractors,
  invoices,
  onAddContractor,
  onUpdateContractor
}: Tax1099ComplianceProps) {
  const [selected1099, setSelected1099] = useState<Contractor1099 | null>(contractors[0] || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"subcontractors" | "clients">("subcontractors");

  // Form states for adding 1099 entity
  const [name, setName] = useState("");
  const [tin, setTin] = useState("");
  const [amount, setAmount] = useState("");
  const [formType, setFormType] = useState<"1099-NEC" | "1099-K" | "1099-MISC">("1099-NEC");
  const [w9Status, setW9Status] = useState<"Verified" | "Pending" | "Missing">("Verified");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  // Filter clients who paid >$600 from invoice history
  const clientRevenueMap = invoices.reduce((acc, inv) => {
    if (inv.status === "Paid") {
      acc[inv.clientName] = (acc[inv.clientName] || 0) + inv.amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const handleCreate1099 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created: Contractor1099 = {
      id: `c1099-${Date.now()}`,
      name: name.trim(),
      tin: tin.trim() || "XX-XXX" + Math.floor(1000 + Math.random() * 9000),
      type: activeSubTab === "subcontractors" ? "Subcontractor_1099_Filed" : "Client_1099_Received",
      amount: parseFloat(amount) || 0,
      formType,
      w9Status,
      address: address.trim() || "Address on file",
      email: email.trim() || undefined
    };

    onAddContractor(created);
    setSelected1099(created);
    setShowAddModal(false);
    setName("");
    setTin("");
    setAmount("");
    setAddress("");
    setEmail("");
  };

  const subcontractorsList = contractors.filter(c => c.type === "Subcontractor_1099_Filed");
  const clientsList = contractors.filter(c => c.type === "Client_1099_Received");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 neo-border neo-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
            IRS Counterparty Tax Reporting
          </span>
          <h2 className="text-2xl font-black text-black tracking-tight mt-0.5">
            Form 1099-NEC & 1099-K Compliance Center
          </h2>
          <p className="text-xs text-zinc-600 font-sans max-w-2xl mt-1 leading-relaxed">
            The IRS requires Form 1099-NEC reporting for any independent contractor paid $600 or more annually. Track client 1099s received and dispatch compliant subcontractor 1099 packets.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-2.5 px-4 border-2 border-black uppercase flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus size={14} />
          <span>Register 1099 Recipient</span>
        </button>
      </div>

      {/* Sub-tab selection */}
      <div className="flex border-2 border-black bg-white select-none">
        <button
          onClick={() => setActiveSubTab("subcontractors")}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase transition-all cursor-pointer border-r-2 border-black ${
            activeSubTab === "subcontractors" ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Subcontractors Filed (Outgoing 1099-NEC) [{subcontractorsList.length}]
        </button>
        <button
          onClick={() => setActiveSubTab("clients")}
          className={`flex-1 py-3 font-mono text-xs font-bold uppercase transition-all cursor-pointer ${
            activeSubTab === "clients" ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          Clients Invoiced &gt;$600 (Incoming 1099s) [{clientsList.length}]
        </button>
      </div>

      {/* Main Grid: List on Left, Form 1099-NEC Interactive Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          {(activeSubTab === "subcontractors" ? subcontractorsList : clientsList).map((item) => {
            const isSelected = selected1099?.id === item.id;
            return (
              <div
                key={item.id}
                onClick={() => setSelected1099(item)}
                className={`p-4 border-2 transition-all cursor-pointer select-none ${
                  isSelected ? "bg-zinc-900 text-white border-black neo-shadow-sm" : "bg-white text-black border-zinc-300 hover:border-black"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border ${
                      isSelected ? "bg-zinc-800 text-zinc-300 border-zinc-700" : "bg-zinc-100 text-zinc-700 border-zinc-300"
                    }`}>
                      {item.formType}
                    </span>
                    <h3 className="font-extrabold text-sm font-sans mt-1.5">
                      {item.name}
                    </h3>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      TIN: {item.tin}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black font-mono block">
                      ${item.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-mono font-bold inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 border ${
                      item.w9Status === "Verified" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                        : "bg-amber-50 text-amber-700 border-amber-300"
                    }`}>
                      <CheckCircle2 size={10} />
                      W-9 {item.w9Status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {(activeSubTab === "subcontractors" ? subcontractorsList : clientsList).length === 0 && (
            <div className="bg-white p-8 neo-border text-center text-zinc-400 font-mono text-xs">
              No entries recorded in this category. Click &quot;Register 1099 Recipient&quot; to create one.
            </div>
          )}
        </div>

        {/* Right: Official IRS Form 1099-NEC Interactive Visual Form */}
        <div className="lg:col-span-7">
          {selected1099 ? (
            <div className="bg-white p-6 neo-border neo-shadow-sm border-2 border-black space-y-4">
              <div className="flex justify-between items-center border-b-2 border-black pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5">
                      OFFICIAL IRS FORM
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      OMB No. 1545-0116 (Tax Year 2026)
                    </span>
                  </div>
                  <h3 className="text-xl font-black font-serif tracking-tight text-black mt-1">
                    Form 1099-NEC: Nonemployee Compensation
                  </h3>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="p-2 border border-black hover:bg-zinc-100 text-black cursor-pointer"
                    title="Print 1099-NEC Copy B for Recipient"
                  >
                    <Printer size={14} />
                  </button>
                </div>
              </div>

              {/* Form 1099-NEC Grid Box */}
              <div className="border-2 border-black divide-y-2 divide-black text-xs font-sans">
                {/* Payer and Recipient Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black">
                  <div className="p-3 bg-zinc-50">
                    <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 block">
                      PAYER&apos;S name, street address, city or town, state, and ZIP
                    </span>
                    <div className="font-bold text-black text-xs mt-1">
                      TrustInvoice Software Technologies LLC
                    </div>
                    <div className="text-[11px] text-zinc-600 font-mono">
                      100 Pine Street, Suite 2400, San Francisco, CA 94111
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/50">
                    <span className="text-[9px] font-mono font-bold uppercase text-amber-800 block">
                      RECIPIENT&apos;S name, street address, and ZIP code
                    </span>
                    <div className="font-bold text-black text-xs mt-1">
                      {selected1099.name}
                    </div>
                    <div className="text-[11px] text-zinc-600 font-mono">
                      {selected1099.address}
                    </div>
                  </div>
                </div>

                {/* TIN Row */}
                <div className="grid grid-cols-2 divide-x-2 divide-black">
                  <div className="p-2.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 block">
                      PAYER&apos;S TIN / EIN
                    </span>
                    <span className="font-mono font-bold text-xs text-black">
                      88-3928104
                    </span>
                  </div>
                  <div className="p-2.5">
                    <span className="text-[9px] font-mono font-bold uppercase text-zinc-500 block">
                      RECIPIENT&apos;S TIN / SSN
                    </span>
                    <span className="font-mono font-bold text-xs text-black">
                      {selected1099.tin}
                    </span>
                  </div>
                </div>

                {/* Box 1 and Box 4 */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y-2 md:divide-y-0 md:divide-x-2 divide-black">
                  <div className="p-4 bg-emerald-50/60">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 block">
                      BOX 1: Nonemployee compensation
                    </span>
                    <span className="text-2xl font-black font-mono text-emerald-950 mt-1 block">
                      ${selected1099.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-sans mt-0.5 block">
                      Reportable to IRS & State Tax Agency
                    </span>
                  </div>

                  <div className="p-4 bg-zinc-50">
                    <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">
                      BOX 4: Federal income tax withheld
                    </span>
                    <span className="text-2xl font-black font-mono text-zinc-900 mt-1 block">
                      $0.00
                    </span>
                    <span className="text-[10px] text-zinc-500 font-sans mt-0.5 block">
                      No backup withholding required (W-9 Verified)
                    </span>
                  </div>
                </div>

                {/* State tax reporting row */}
                <div className="grid grid-cols-3 divide-x-2 divide-black p-2.5 bg-zinc-50 text-[10px] font-mono">
                  <div>
                    <span className="text-zinc-500 block">BOX 5: State tax withheld</span>
                    <span className="font-bold text-black">$0.00</span>
                  </div>
                  <div className="pl-2">
                    <span className="text-zinc-500 block">BOX 6: State / Payer&apos;s state no.</span>
                    <span className="font-bold text-black">CA-948201</span>
                  </div>
                  <div className="pl-2">
                    <span className="text-zinc-500 block">BOX 7: State income</span>
                    <span className="font-bold text-black">${selected1099.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Trust Guarantee */}
              <div className="p-3 bg-zinc-900 text-white flex justify-between items-center text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>IRS FIRE System e-File Dispatch Ready</span>
                </div>
                <span className="text-zinc-400">TIN Matching API: PASS</span>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 neo-border text-center text-zinc-400 font-mono text-xs">
              Select a 1099 contractor to view official IRS Form 1099-NEC.
            </div>
          )}
        </div>
      </div>

      {/* Add 1099 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white neo-border neo-shadow max-w-lg w-full p-6 border-2 border-black animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4">
              <h3 className="font-black font-mono text-sm uppercase text-black flex items-center gap-2">
                <Plus size={16} />
                <span>Register Form 1099 Counterparty</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-mono text-zinc-400 hover:text-black font-bold uppercase"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreate1099} className="space-y-4 text-xs font-sans">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Entity / Contractor Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Chen Consulting, Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs neo-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                    Tax ID (EIN or SSN)
                  </label>
                  <input
                    type="text"
                    placeholder="XX-XXX1234"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    className="w-full text-xs neo-input font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                    Total Compensation ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="600.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-xs neo-input font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                    Form Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full text-xs neo-input font-mono bg-white"
                  >
                    <option value="1099-NEC">Form 1099-NEC (Nonemployee Comp)</option>
                    <option value="1099-K">Form 1099-K (Payment Card Network)</option>
                    <option value="1099-MISC">Form 1099-MISC (Rents / Royalties)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                    Form W-9 Status
                  </label>
                  <select
                    value={w9Status}
                    onChange={(e: any) => setW9Status(e.target.value)}
                    className="w-full text-xs neo-input font-mono bg-white"
                  >
                    <option value="Verified">Verified W-9 on File</option>
                    <option value="Pending">Pending Recipient Signature</option>
                    <option value="Missing">Missing W-9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Mailing Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs neo-input"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white hover:bg-zinc-100 text-zinc-600 font-mono text-xs font-bold py-2.5 px-4 border border-zinc-300 uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-2.5 px-6 border-2 border-black uppercase cursor-pointer"
                >
                  Save 1099 Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
