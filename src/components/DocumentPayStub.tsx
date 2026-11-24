import React, { useState } from "react";
import { Invoice, PayStubConfig } from "../types";
import { 
  Building, User, DollarSign, Calendar, Landmark, 
  ShieldCheck, Printer, CheckCircle2, Edit3, ArrowRight,
  TrendingUp, FileText, Check, HelpCircle, Briefcase
} from "lucide-react";

interface DocumentPayStubProps {
  invoice: Invoice;
  onUpdateInvoice?: (invoice: Invoice) => void;
}

export default function DocumentPayStub({ invoice, onUpdateInvoice }: DocumentPayStubProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Compute default hours and rates from invoice items
  const totalHours = invoice.items.reduce((acc, item) => acc + (item.quantity > 0 ? item.quantity : 40), 0);
  const calculatedGross = invoice.amount;
  const avgHourlyRate = totalHours > 0 ? Math.round((calculatedGross / totalHours) * 100) / 100 : 75;

  const defaultPayStub: PayStubConfig = {
    employeeName: invoice.payStubDetails?.employeeName || invoice.clientName,
    employeeId: invoice.payStubDetails?.employeeId || `EMP-${invoice.id.slice(0, 6).toUpperCase()}`,
    ssnMasked: invoice.payStubDetails?.ssnMasked || "***-**-4892",
    designation: invoice.payStubDetails?.designation || "Senior Technical Contractor / Specialist",
    payType: invoice.payStubDetails?.payType || "1099_Contractor",
    payPeriodStart: invoice.payStubDetails?.payPeriodStart || "2026-08-15",
    payPeriodEnd: invoice.payStubDetails?.payPeriodEnd || invoice.dueDate || "2026-08-31",
    payDate: invoice.payStubDetails?.payDate || invoice.dueDate || "2026-09-01",
    checkNumber: invoice.payStubDetails?.checkNumber || `DIR-DEP-${invoice.invoiceNumber.replace("INV-", "")}`,
    hoursWorked: invoice.payStubDetails?.hoursWorked ?? totalHours,
    hourlyRate: invoice.payStubDetails?.hourlyRate ?? avgHourlyRate,
    grossEarnings: invoice.payStubDetails?.grossEarnings ?? calculatedGross,
    federalTaxWithholding: invoice.payStubDetails?.federalTaxWithholding ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : Math.round(calculatedGross * 0.12 * 100) / 100),
    stateTaxWithholding: invoice.payStubDetails?.stateTaxWithholding ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : Math.round(calculatedGross * 0.05 * 100) / 100),
    socialSecurityTax: invoice.payStubDetails?.socialSecurityTax ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : Math.round(calculatedGross * 0.062 * 100) / 100),
    medicareTax: invoice.payStubDetails?.medicareTax ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : Math.round(calculatedGross * 0.0145 * 100) / 100),
    healthInsurance: invoice.payStubDetails?.healthInsurance ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : 120.00),
    retirement401k: invoice.payStubDetails?.retirement401k ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : 150.00),
    totalDeductions: 0, // calculated below
    netPay: 0, // calculated below
    ytdGross: invoice.payStubDetails?.ytdGross ?? calculatedGross * 6,
    ytdDeductions: invoice.payStubDetails?.ytdDeductions ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? 0 : calculatedGross * 6 * 0.24),
    ytdNet: invoice.payStubDetails?.ytdNet ?? (invoice.payStubDetails?.payType === "1099_Contractor" ? calculatedGross * 6 : calculatedGross * 6 * 0.76),
    depositBank: invoice.payStubDetails?.depositBank || invoice.paymentDetails.bankName,
    depositAccountMasked: invoice.payStubDetails?.depositAccountMasked || `****-****-${invoice.paymentDetails.accountNo.slice(-4) || "8920"}`
  };

  const [config, setConfig] = useState<PayStubConfig>(defaultPayStub);

  // Recalculate deductions and net pay based on current payType
  const is1099 = config.payType === "1099_Contractor";
  const fedTax = is1099 ? 0 : config.federalTaxWithholding;
  const stateTax = is1099 ? 0 : config.stateTaxWithholding;
  const ssTax = is1099 ? 0 : config.socialSecurityTax;
  const medTax = is1099 ? 0 : config.medicareTax;
  const health = is1099 ? 0 : config.healthInsurance;
  const k401 = is1099 ? 0 : config.retirement401k;
  
  const totalDeductions = fedTax + stateTax + ssTax + medTax + health + k401;
  const netTakeHome = Math.max(0, config.grossEarnings - totalDeductions);

  const handlePayTypeChange = (newType: "W2_Hourly" | "W2_Salary" | "1099_Contractor") => {
    if (newType === "1099_Contractor") {
      setConfig({
        ...config,
        payType: newType,
        federalTaxWithholding: 0,
        stateTaxWithholding: 0,
        socialSecurityTax: 0,
        medicareTax: 0,
        healthInsurance: 0,
        retirement401k: 0
      });
    } else {
      const gross = config.grossEarnings;
      setConfig({
        ...config,
        payType: newType,
        federalTaxWithholding: Math.round(gross * 0.12 * 100) / 100,
        stateTaxWithholding: Math.round(gross * 0.05 * 100) / 100,
        socialSecurityTax: Math.round(gross * 0.062 * 100) / 100,
        medicareTax: Math.round(gross * 0.0145 * 100) / 100,
        healthInsurance: 120.00,
        retirement401k: 150.00
      });
    }
  };

  const handleSaveConfig = () => {
    if (onUpdateInvoice) {
      onUpdateInvoice({
        ...invoice,
        payStubDetails: {
          ...config,
          totalDeductions,
          netPay: netTakeHome
        }
      });
    }
    setShowConfig(false);
  };

  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 neo-border neo-shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-400 py-1 px-2.5 rounded flex items-center gap-1.5 uppercase">
            <Briefcase size={13} className="text-amber-700" />
            {is1099 ? "1099 Contractor Remittance Stub" : "W-2 Earnings Statement"}
          </span>
          <span className="text-xs font-mono text-zinc-500">
            Payee: <strong>{config.employeeName}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Mode Quick Toggle */}
          <div className="flex border border-black text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => handlePayTypeChange("1099_Contractor")}
              className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                is1099 ? "bg-black text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              1099 Contractor
            </button>
            <button
              type="button"
              onClick={() => handlePayTypeChange("W2_Hourly")}
              className={`px-2.5 py-1.5 cursor-pointer transition-colors ${
                !is1099 ? "bg-black text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              W-2 Employee
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 text-black border border-black py-2 px-3 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 size={13} />
            <span>{showConfig ? "Close Customizer" : "Customize Pay Stub"}</span>
          </button>
          
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs font-mono font-bold bg-black text-white hover:bg-zinc-800 py-2 px-4 border border-black flex items-center gap-1.5 transition-all cursor-pointer neo-shadow-sm"
          >
            <Printer size={13} />
            <span>Print Pay Stub</span>
          </button>
        </div>
      </div>

      {/* Pay Stub Customizer Drawer */}
      {showConfig && (
        <div className="bg-zinc-50 border-2 border-black p-5 space-y-4 font-mono text-xs neo-shadow-sm">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
            <h4 className="font-extrabold uppercase text-black">Pay Stub Parameters & Withholdings</h4>
            <span className="text-[10px] text-zinc-500">Live preview recalculation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Payee Legal Name</label>
              <input
                type="text"
                value={config.employeeName}
                onChange={(e) => setConfig({ ...config, employeeName: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Employee / Contractor ID</label>
              <input
                type="text"
                value={config.employeeId}
                onChange={(e) => setConfig({ ...config, employeeId: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Masked SSN / TIN</label>
              <input
                type="text"
                value={config.ssnMasked}
                onChange={(e) => setConfig({ ...config, ssnMasked: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Job Designation</label>
              <input
                type="text"
                value={config.designation}
                onChange={(e) => setConfig({ ...config, designation: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Pay Period Start</label>
              <input
                type="date"
                value={config.payPeriodStart}
                onChange={(e) => setConfig({ ...config, payPeriodStart: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Pay Period End</label>
              <input
                type="date"
                value={config.payPeriodEnd}
                onChange={(e) => setConfig({ ...config, payPeriodEnd: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Disbursement / Pay Date</label>
              <input
                type="date"
                value={config.payDate}
                onChange={(e) => setConfig({ ...config, payDate: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase mb-1">Direct Deposit Advice #</label>
              <input
                type="text"
                value={config.checkNumber}
                onChange={(e) => setConfig({ ...config, checkNumber: e.target.value })}
                className="w-full neo-input text-xs py-1.5"
              />
            </div>
          </div>

          {/* Withholding adjustments if W2 */}
          {!is1099 && (
            <div className="pt-2 border-t border-zinc-200">
              <div className="text-[10px] uppercase font-bold text-zinc-600 mb-2">
                Statutory Tax Withholdings ($)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[9px] text-zinc-500 mb-1">Federal (FIT)</label>
                  <input
                    type="number"
                    value={config.federalTaxWithholding}
                    onChange={(e) => setConfig({ ...config, federalTaxWithholding: parseFloat(e.target.value) || 0 })}
                    className="w-full neo-input text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 mb-1">State (SIT)</label>
                  <input
                    type="number"
                    value={config.stateTaxWithholding}
                    onChange={(e) => setConfig({ ...config, stateTaxWithholding: parseFloat(e.target.value) || 0 })}
                    className="w-full neo-input text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 mb-1">Social Security (6.2%)</label>
                  <input
                    type="number"
                    value={config.socialSecurityTax}
                    onChange={(e) => setConfig({ ...config, socialSecurityTax: parseFloat(e.target.value) || 0 })}
                    className="w-full neo-input text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 mb-1">Medicare (1.45%)</label>
                  <input
                    type="number"
                    value={config.medicareTax}
                    onChange={(e) => setConfig({ ...config, medicareTax: parseFloat(e.target.value) || 0 })}
                    className="w-full neo-input text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 mb-1">Pre-Tax Health</label>
                  <input
                    type="number"
                    value={config.healthInsurance}
                    onChange={(e) => setConfig({ ...config, healthInsurance: parseFloat(e.target.value) || 0 })}
                    className="w-full neo-input text-xs py-1"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-500 mb-1">401(k) Pre-Tax</label>
                  <input
                    type="number"
                    value={config.retirement401k}
                    onChange={(e) => setConfig({ ...config, retirement401k: parseFloat(e.target.value) || 0 })}
                    className="w-full neo-input text-xs py-1"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="bg-black text-white px-4 py-2 text-xs font-bold uppercase hover:bg-neutral-800 cursor-pointer"
            >
              Save Pay Stub Settings
            </button>
          </div>
        </div>
      )}

      {/* The Printable Visual Pay Stub Sheet */}
      <div 
        id="printable-paystub"
        className="bg-white p-8 sm:p-12 neo-border neo-shadow-sm min-h-[750px] flex flex-col justify-between"
      >
        <div>
          {/* Header Block */}
          <div className="border-b-2 border-black pb-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-0.5">
                  EMPLOYER / REMITTING ENTITY
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-black tracking-tight">
                  TRUSTINVOICE GLOBAL SERVICES INC.
                </h2>
                <p className="text-xs font-mono text-zinc-600">First Trust Building • Suite 12A • New York, NY 10005</p>
                <p className="text-[11px] font-mono text-zinc-500">Federal EIN: <strong>12-9482019</strong> • State UI: <strong>NY-489201</strong></p>
              </div>

              <div className="text-left sm:text-right">
                <div className="bg-black text-white text-xs font-mono font-bold px-3 py-1 uppercase inline-block mb-1">
                  EARNINGS STATEMENT
                </div>
                <div className="text-xs font-mono text-zinc-600">
                  <span>Advice #: </span>
                  <strong className="text-black">{config.checkNumber}</strong>
                </div>
                <div className="text-xs font-mono text-zinc-600 mt-0.5">
                  <span>Pay Date: </span>
                  <strong className="text-black">{config.payDate}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Payee Details & Pay Period Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-zinc-50 border-2 border-black font-mono text-xs mb-6">
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Payee / Recipient</span>
              <strong className="text-black uppercase block">{config.employeeName}</strong>
              <span className="text-[10px] text-zinc-500">{config.designation}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Tax Identifiers</span>
              <div className="text-zinc-700">SSN: <strong>{config.ssnMasked}</strong></div>
              <div className="text-zinc-700 text-[10px]">ID: <strong>{config.employeeId}</strong></div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Pay Period Span</span>
              <div className="text-zinc-800 font-bold">{config.payPeriodStart}</div>
              <div className="text-zinc-500 text-[10px]">through {config.payPeriodEnd}</div>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-0.5">Classification</span>
              <span className={`inline-block font-bold text-[10px] px-2 py-0.5 uppercase border ${
                is1099 
                  ? "bg-amber-100 text-amber-900 border-amber-300" 
                  : "bg-blue-100 text-blue-900 border-blue-300"
              }`}>
                {is1099 ? "1099 Independent Contractor" : "W-2 Standard Payroll"}
              </span>
            </div>
          </div>

          {/* Itemized Earnings & Breakdown */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center border-b-2 border-black pb-1">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <DollarSign size={14} />
                <span>Earnings Breakdown</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">Currency: USD</span>
            </div>

            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-black text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center">Hours / Units</th>
                  <th className="py-2 text-right">Rate ($)</th>
                  <th className="py-2 text-right">Current Period</th>
                  <th className="py-2 text-right">YTD Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-zinc-100 text-[11px]">
                    <td className="py-2.5 font-semibold text-black">{item.description}</td>
                    <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono">${item.rate.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-black">
                      ${(item.quantity * item.rate).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right font-mono text-zinc-600">
                      ${((item.quantity * item.rate) * 6).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-zinc-50 font-mono font-bold text-xs border-t-2 border-black">
                  <td colSpan={3} className="py-2.5 px-2 uppercase text-black">Total Gross Earnings</td>
                  <td className="py-2.5 text-right font-black text-black">
                    ${config.grossEarnings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 text-right text-zinc-700">
                    ${config.ytdGross.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Withholdings & Deductions Section */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center border-b-2 border-black pb-1">
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Landmark size={14} />
                <span>Statutory Deductions & Taxes</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                {is1099 ? "1099 Direct Remittance (No Tax Withheld)" : "Statutory FICA & Income Taxes"}
              </span>
            </div>

            {is1099 ? (
              <div className="bg-amber-50 border border-amber-300 p-4 font-mono text-xs text-amber-900 space-y-1">
                <div className="font-bold uppercase text-[11px] flex items-center gap-1.5 text-amber-950">
                  <CheckCircle2 size={14} className="text-amber-700" />
                  <span>Form 1099-NEC / Direct Contractor Remittance Statement</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  As an independent contractor, no federal, state, or FICA taxes have been withheld from this payment. You are responsible for reporting this compensation on IRS Form 1040 Schedule C / Schedule SE and paying estimated quarterly taxes.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs font-sans border-collapse">
                <thead>
                  <tr className="border-b border-black text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                    <th className="py-2">Deduction Description</th>
                    <th className="py-2 text-center">Filing Status</th>
                    <th className="py-2 text-right">Applicable Rate</th>
                    <th className="py-2 text-right">Current Deduction</th>
                    <th className="py-2 text-right">YTD Deducted</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100 text-[11px]">
                    <td className="py-2 font-semibold text-black">Federal Income Tax (FIT)</td>
                    <td className="py-2 text-center font-mono">Single / Standard</td>
                    <td className="py-2 text-right font-mono">12.00%</td>
                    <td className="py-2 text-right font-mono text-red-600">-${fedTax.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-zinc-600">-${(fedTax * 6).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-zinc-100 text-[11px]">
                    <td className="py-2 font-semibold text-black">Social Security (OASDI)</td>
                    <td className="py-2 text-center font-mono">Mandatory FICA</td>
                    <td className="py-2 text-right font-mono">6.20%</td>
                    <td className="py-2 text-right font-mono text-red-600">-${ssTax.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-zinc-600">-${(ssTax * 6).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-zinc-100 text-[11px]">
                    <td className="py-2 font-semibold text-black">Medicare (Hospital Insurance)</td>
                    <td className="py-2 text-center font-mono">Mandatory FICA</td>
                    <td className="py-2 text-right font-mono">1.45%</td>
                    <td className="py-2 text-right font-mono text-red-600">-${medTax.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-zinc-600">-${(medTax * 6).toFixed(2)}</td>
                  </tr>
                  <tr className="border-b border-zinc-100 text-[11px]">
                    <td className="py-2 font-semibold text-black">State Income Tax (SIT - NY)</td>
                    <td className="py-2 text-center font-mono">State Res.</td>
                    <td className="py-2 text-right font-mono">5.00%</td>
                    <td className="py-2 text-right font-mono text-red-600">-${stateTax.toFixed(2)}</td>
                    <td className="py-2 text-right font-mono text-zinc-600">-${(stateTax * 6).toFixed(2)}</td>
                  </tr>
                  {health > 0 && (
                    <tr className="border-b border-zinc-100 text-[11px]">
                      <td className="py-2 font-semibold text-black">Pre-Tax Health Insurance (Section 125)</td>
                      <td className="py-2 text-center font-mono">Pre-Tax</td>
                      <td className="py-2 text-right font-mono">Fixed</td>
                      <td className="py-2 text-right font-mono text-red-600">-${health.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono text-zinc-600">-${(health * 6).toFixed(2)}</td>
                    </tr>
                  )}
                  {k401 > 0 && (
                    <tr className="border-b border-zinc-100 text-[11px]">
                      <td className="py-2 font-semibold text-black">401(k) Retirement Pre-Tax</td>
                      <td className="py-2 text-center font-mono">Pre-Tax</td>
                      <td className="py-2 text-right font-mono">Fixed</td>
                      <td className="py-2 text-right font-mono text-red-600">-${k401.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono text-zinc-600">-${(k401 * 6).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-zinc-50 font-mono font-bold text-xs border-t-2 border-black">
                    <td colSpan={3} className="py-2.5 px-2 uppercase text-black">Total Withholdings & Deductions</td>
                    <td className="py-2.5 text-right font-black text-red-600">
                      -${totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 text-right text-zinc-700">
                      -${(totalDeductions * 6).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bottom Summary: Net Pay & Direct Deposit Coordinates */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Direct Deposit Distribution */}
            <div className="p-4 bg-zinc-50 border-2 border-black font-mono text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold uppercase text-black text-[11px]">
                <Landmark size={13} />
                <span>Direct Deposit Distribution</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-600 pt-1">
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Disbursing Bank</span>
                  <strong className="text-black">{config.depositBank}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Account Number</span>
                  <strong className="text-black">{config.depositAccountMasked}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Disbursement Status</span>
                  <span className="text-emerald-700 font-bold uppercase">ACH DIRECT CLEAR</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 block uppercase">Deposited Net</span>
                  <strong className="text-black">${netTakeHome.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            {/* Net Pay Hero Box */}
            <div className="bg-black text-white p-5 border-2 border-black neo-shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-zinc-700 pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  NET DISBURSED PAY
                </span>
                <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 uppercase">
                  {config.payDate}
                </span>
              </div>
              <div className="py-2 flex justify-between items-baseline">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-400">
                  ${netTakeHome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-mono text-zinc-400">USD</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 flex justify-between border-t border-zinc-800 pt-2">
                <span>Gross: ${config.grossEarnings.toFixed(2)}</span>
                <span>Taxes/Deductions: -${totalDeductions.toFixed(2)}</span>
                <span>YTD Net: ${(config.ytdGross - (totalDeductions * 6)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Security Seal Footer */}
          <div className="border-t border-zinc-200 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-mono text-zinc-400 gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-zinc-600" />
              <span>Certified Payroll Stub Seal: <strong>{invoice.trustSealHash.slice(0, 32)}...</strong></span>
            </div>
            <span>TrustInvoice Enterprise Payroll Core v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
