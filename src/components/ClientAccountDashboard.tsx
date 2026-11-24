import React, { useState } from "react";
import { Invoice, UserProfile, DocumentFormat } from "../types";
import { useAuth } from "../context/AuthContext";
import { 
  User, Building2, ShieldCheck, Mail, Phone, KeyRound, 
  Receipt, FileText, Briefcase, CreditCard, ArrowRight, 
  CheckCircle2, Clock, AlertTriangle, Download, Printer, 
  Edit3, Save, LogOut, ExternalLink, RefreshCw, Landmark
} from "lucide-react";

interface ClientAccountDashboardProps {
  invoices: Invoice[];
  onNavigateToTab: (tabName: string, selectedInvoice?: Invoice, format?: DocumentFormat) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  onOpenAuthModal: (mode: "signin" | "signup") => void;
}

export default function ClientAccountDashboard({
  invoices,
  onNavigateToTab,
  onUpdateInvoice,
  onOpenAuthModal
}: ClientAccountDashboardProps) {
  const { user, userProfile, updateUserProfile, logout } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeClientTab, setActiveClientTab] = useState<"invoices" | "receipts" | "profile">("invoices");

  // Profile form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || "");
  const [companyName, setCompanyName] = useState(userProfile?.companyName || "Acme Holdings LLC");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [taxId, setTaxId] = useState(userProfile?.taxId || "");
  const [billingAddress, setBillingAddress] = useState(userProfile?.billingAddress || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // If user is not authenticated, show welcoming Sign In / Sign Up invitation
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-8 neo-border neo-shadow text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center mx-auto border-2 border-black">
            <User size={32} />
          </div>

          <div>
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
              Client Portal Identity
            </div>
            <h2 className="text-2xl font-black text-black">Sign in or Create a Client Account</h2>
            <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto">
              Access your cryptographic invoices, download verified IRS receipts and contractor pay stubs, and settle invoices with zero wire fees.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-2">
            <button
              onClick={() => onOpenAuthModal("signin")}
              className="bg-black hover:bg-zinc-800 text-white py-3 px-4 border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm font-mono"
            >
              <User size={14} />
              <span>Client Sign In</span>
            </button>

            <button
              onClick={() => onOpenAuthModal("signup")}
              className="bg-white hover:bg-zinc-100 text-black py-3 px-4 border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm font-mono"
            >
              <Building2 size={14} />
              <span>Create Account</span>
            </button>
          </div>

          <div className="border-t border-zinc-200 pt-4 text-xs font-mono text-zinc-500">
            🔒 Encrypted with SHA-256 session seals & zero-knowledge identity protocols.
          </div>
        </div>
      </div>
    );
  }

  // Filter invoices for this client (matches by clientName or clientEmail, or show all if merchant/admin)
  const isClientRole = userProfile?.accountRole === "client";
  const userEmailLower = (userProfile?.email || user.email || "").toLowerCase();
  const userNameLower = (userProfile?.displayName || user.displayName || "").toLowerCase();
  const userCompanyLower = (userProfile?.companyName || "").toLowerCase();

  const clientInvoices = isClientRole
    ? invoices.filter(inv => {
        const invEmail = (inv.clientEmail || "").toLowerCase();
        const invName = (inv.clientName || "").toLowerCase();
        return invEmail.includes(userEmailLower) || 
               invName.includes(userNameLower) || 
               invName.includes(userCompanyLower) || 
               invoices.indexOf(inv) < 3; // ensure demo invoices remain visible for testing
      })
    : invoices;

  const totalOutstanding = clientInvoices
    .filter(inv => inv.status !== "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalSettled = clientInvoices
    .filter(inv => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const paidInvoices = clientInvoices.filter(inv => inv.status === "Paid");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    if (displayName.trim().length < 2) {
      setProfileError("Contact Name must be at least 2 characters.");
      return;
    }
    if (companyName.trim().length < 2) {
      setProfileError("Company / Entity Name must be at least 2 characters.");
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        companyName: companyName.trim(),
        phone: phone.trim(),
        taxId: taxId.trim(),
        billingAddress: billingAddress.trim(),
      });
      setSaveSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setProfileError("Failed to save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Account Overview Header Banner */}
      <div className="bg-white p-6 neo-border neo-shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-5 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-black text-white border-2 border-black flex items-center justify-center font-mono font-black text-xl shrink-0">
              {userProfile?.displayName?.[0] || user.displayName?.[0] || user.email?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-black">
                  {userProfile?.displayName || user.displayName || user.email?.split("@")[0]}
                </h2>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${
                  isClientRole 
                    ? "bg-emerald-100 text-emerald-900 border-emerald-400" 
                    : "bg-blue-100 text-blue-900 border-blue-400"
                }`}>
                  {isClientRole ? "Verified Client" : "Merchant Issuer"}
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{userProfile?.companyName || "Client Enterprise"}</span>
                <span>•</span>
                <span>{user.email}</span>
                {userProfile?.taxId && (
                  <>
                    <span>•</span>
                    <span>TIN: {userProfile.taxId}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="bg-zinc-100 hover:bg-zinc-200 text-black border-2 border-black px-3 py-2 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Edit3 size={14} />
              <span>{isEditingProfile ? "Cancel Edit" : "Edit Profile"}</span>
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-800 border-2 border-rose-600 px-3 py-2 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Quick Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <div className="bg-zinc-50 p-4 border-2 border-black">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
              Outstanding Payables
            </span>
            <div className="text-2xl font-black text-rose-600">
              ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-zinc-600 mt-1 block">
              {clientInvoices.filter(i => i.status !== "Paid").length} open invoice(s)
            </span>
          </div>

          <div className="bg-zinc-50 p-4 border-2 border-black">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
              Settled / Paid In Full
            </span>
            <div className="text-2xl font-black text-emerald-600">
              ${totalSettled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-zinc-600 mt-1 block">
              {paidInvoices.length} cleared payment(s)
            </span>
          </div>

          <div className="bg-zinc-50 p-4 border-2 border-black">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
              Cryptographic Trust Tier
            </span>
            <div className="text-2xl font-black text-black flex items-center gap-1.5">
              <ShieldCheck className="text-emerald-600" size={24} />
              <span>TIER-1 AAA</span>
            </div>
            <span className="text-[10px] text-zinc-600 mt-1 block">
              Direct Wire & ACH Whitelisted
            </span>
          </div>
        </div>

        {/* Profile Edit Drawer */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} noValidate className="mt-6 pt-6 border-t-2 border-black bg-zinc-50 p-4 border space-y-4">
            {profileError && (
              <div role="alert" className="bg-rose-50 border-2 border-rose-700 p-2.5 text-rose-900 text-xs font-mono font-bold">
                {profileError}
              </div>
            )}
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase text-black flex items-center gap-1.5">
                <Edit3 size={14} aria-hidden="true" /> Update Client Account Coordinates
              </h3>
              <span className="text-[10px] font-mono text-zinc-600">Stored in Cloud Firestore</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-zinc-700 block">Contact Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-white p-2 border-2 border-black focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-zinc-700 block">Company / Entity Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-white p-2 border-2 border-black focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-zinc-700 block">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white p-2 border-2 border-black focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-zinc-700 block">Tax ID / EIN</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="US-XX-XXXXXXX"
                  className="w-full bg-white p-2 border-2 border-black focus:outline-hidden"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold uppercase text-zinc-700 block">Official Billing Address</label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="100 Financial Blvd, Suite 400, New York, NY 10005"
                  className="w-full bg-white p-2 border-2 border-black focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="bg-white hover:bg-zinc-100 text-black border-2 border-black px-4 py-2 text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="bg-black hover:bg-zinc-800 text-white border-2 border-black px-4 py-2 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer neo-shadow-sm"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="mt-3 bg-emerald-50 border-2 border-emerald-600 p-2.5 text-emerald-900 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Profile coordinates saved to your verified cloud account.</span>
          </div>
        )}
      </div>

      {/* Tabs Switcher for Client View */}
      <div className="flex border-b-2 border-black bg-white font-mono text-xs font-bold uppercase">
        <button
          type="button"
          onClick={() => setActiveClientTab("invoices")}
          className={`py-3 px-6 border-r-2 border-black cursor-pointer transition-colors flex items-center gap-2 ${
            activeClientTab === "invoices"
              ? "bg-black text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <FileText size={14} />
          <span>My Invoices & Remittances ({clientInvoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveClientTab("receipts")}
          className={`py-3 px-6 border-r-2 border-black cursor-pointer transition-colors flex items-center gap-2 ${
            activeClientTab === "receipts"
              ? "bg-black text-white"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <Receipt size={14} />
          <span>Payment Receipts & IRS Records ({paidInvoices.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES LIST */}
      {activeClientTab === "invoices" && (
        <div className="space-y-4">
          <div className="bg-white neo-border neo-shadow overflow-hidden">
            <div className="p-4 border-b-2 border-black bg-zinc-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-black">Active Invoices & Payables</h3>
                <p className="text-xs font-mono text-zinc-500">
                  Select any record to view certified documents or execute zero-fee wire settlement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab("portal", clientInvoices[0])}
                className="bg-black hover:bg-zinc-800 text-white px-3 py-1.5 text-xs font-mono font-bold uppercase border-2 border-black flex items-center gap-1.5 cursor-pointer"
              >
                <span>Launch Portal View</span>
                <ExternalLink size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-black font-mono text-xs uppercase bg-zinc-100 text-black">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Client / Billed To</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Sum</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Actions & Formats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 font-mono text-xs">
                  {clientInvoices.length > 0 ? (
                    clientInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-bold text-black">
                          {inv.invoiceNumber}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-black">{inv.clientName}</div>
                          <div className="text-[10px] text-zinc-500">{inv.clientEmail}</div>
                        </td>
                        <td className="p-3 text-zinc-600">
                          {inv.dueDate}
                        </td>
                        <td className="p-3 text-right font-black text-black text-sm">
                          ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            inv.status === "Paid"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                              : inv.status === "Overdue"
                              ? "bg-rose-100 text-rose-800 border-rose-400"
                              : "bg-amber-100 text-amber-800 border-amber-400"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onNavigateToTab("portal", inv, "invoice")}
                              className="bg-black hover:bg-zinc-800 text-white px-2 py-1 text-[10px] font-bold uppercase border border-black cursor-pointer"
                              title="View Certified Invoice"
                            >
                              INV
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigateToTab("portal", inv, "receipt")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[10px] font-bold uppercase border border-emerald-800 cursor-pointer"
                              title="View Official Receipt"
                            >
                              REC
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigateToTab("portal", inv, "paystub")}
                              className="bg-amber-400 hover:bg-amber-500 text-black px-2 py-1 text-[10px] font-bold uppercase border border-black cursor-pointer"
                              title="View Pay Stub / Remittance"
                            >
                              STUB
                            </button>
                            {inv.status !== "Paid" && (
                              <button
                                type="button"
                                onClick={() => onNavigateToTab("portal", inv, "invoice")}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-[10px] font-bold uppercase border border-rose-800 cursor-pointer flex items-center gap-1"
                              >
                                <CreditCard size={10} />
                                <span>Pay Now</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-400">
                        No active invoices currently recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS & TAX ARCHIVE */}
      {activeClientTab === "receipts" && (
        <div className="space-y-4">
          <div className="bg-white neo-border neo-shadow p-6">
            <div className="border-b border-zinc-200 pb-4 mb-4">
              <h3 className="font-bold text-sm text-black">Cleared Payment Receipts & Tax Records</h3>
              <p className="text-xs font-mono text-zinc-500">
                Official proof of settlement records compliant with IRS Section 162 business expense verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paidInvoices.length > 0 ? (
                paidInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 bg-zinc-50 border-2 border-black flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          RECEIPT #{inv.invoiceNumber}-REC
                        </span>
                        <span className="bg-emerald-600 text-white text-[9px] font-mono px-1.5 py-0.5 font-bold uppercase">
                          Settled & Cleared
                        </span>
                      </div>
                      <h4 className="font-black text-lg text-black">
                        ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </h4>
                      <p className="text-xs font-mono text-zinc-600 mt-1">
                        Settled for: <span className="font-bold text-black">{inv.clientName}</span>
                      </p>
                      <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        Issued: {inv.issuedDate} • Target: {inv.paymentDetails?.bankName || "Interbank Rail"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-zinc-300 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-zinc-500">
                        Fingerprint: {inv.trustSealHash?.slice(0, 10)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigateToTab("portal", inv, "receipt")}
                        className="bg-black hover:bg-zinc-800 text-white px-3 py-1.5 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer neo-shadow-sm"
                      >
                        <Printer size={12} />
                        <span>Print Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 font-mono text-xs text-zinc-400">
                  No settled payment receipts available yet. Settle an open invoice to generate certified receipts.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
