import React, { useState } from "react";
import { QuarterlyVoucher, TaxReturnFiling } from "../../types";
import { 
  Calendar, CheckCircle2, AlertCircle, DollarSign, 
  CreditCard, ShieldCheck, Download, Printer, ArrowRight
} from "lucide-react";

interface TaxQuarterlyEstimatesProps {
  vouchers: QuarterlyVoucher[];
  filing: TaxReturnFiling;
  onUpdateVouchers: (vouchers: QuarterlyVoucher[]) => void;
}

export default function TaxQuarterlyEstimates({
  vouchers,
  filing,
  onUpdateVouchers
}: TaxQuarterlyEstimatesProps) {
  const [selectedVoucher, setSelectedVoucher] = useState<QuarterlyVoucher>(vouchers[2] || vouchers[0]);
  const [isPayingVoucher, setIsPayingVoucher] = useState(false);
  const [eftpsConfirmation, setEftpsConfirmation] = useState<string | null>(null);

  const totalPaidSoFar = vouchers
    .filter(v => v.status === "Paid")
    .reduce((sum, v) => sum + v.estimatedTaxDue, 0);

  const totalProjectedYearly = vouchers.reduce((sum, v) => sum + v.estimatedTaxDue, 0);

  const handlePayVoucher = () => {
    setIsPayingVoucher(true);
    setTimeout(() => {
      const conf = `EFTPS-2026-${Date.now().toString().slice(-8)}`;
      setEftpsConfirmation(conf);

      const updated = vouchers.map(v => {
        if (v.quarter === selectedVoucher.quarter) {
          return {
            ...v,
            status: "Paid" as const,
            paidDate: new Date().toISOString().split("T")[0],
            confirmationNumber: conf
          };
        }
        return v;
      });

      onUpdateVouchers(updated);
      setSelectedVoucher(prev => ({
        ...prev,
        status: "Paid",
        paidDate: new Date().toISOString().split("T")[0],
        confirmationNumber: conf
      }));
      setIsPayingVoucher(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 neo-border neo-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
            IRS Form 1040-ES & Safe-Harbor Penalty Avoidance
          </span>
          <h2 className="text-2xl font-black text-black tracking-tight mt-0.5">
            Quarterly Estimated Tax Center (2026)
          </h2>
          <p className="text-xs text-zinc-600 font-sans max-w-2xl mt-1 leading-relaxed">
            The IRS requires quarterly estimated tax payments for self-employed individuals and pass-through entities if you expect to owe $1,000 or more when filing.
          </p>
        </div>

        <div className="bg-zinc-900 text-white p-3 px-4 neo-border flex items-center gap-3 shrink-0">
          <div>
            <span className="text-[9px] font-mono text-zinc-400 uppercase block">Total Prepaid Year-to-Date</span>
            <span className="text-lg font-black font-mono text-emerald-400">
              ${totalPaidSoFar.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Safe-Harbor Analysis Banner */}
      <div className="bg-emerald-50/70 border-2 border-emerald-600 p-4 text-emerald-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-mono font-black uppercase text-emerald-900 block">
              IRS Safe-Harbor Protection Active (IRC §6654)
            </span>
            <p className="text-[11px] text-emerald-800 font-sans mt-0.5 leading-relaxed">
              Paying 100% of prior year tax liability ($4,630.00) in equal quarterly installments guarantees immunity from underpayment penalties, regardless of current-year revenue spikes.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-1 border border-emerald-300 rounded shrink-0">
          Penalty Shield: 100% ACTIVE
        </span>
      </div>

      {/* 4 Quarters Vouchers Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vouchers.map((voucher) => {
          const isSelected = selectedVoucher.quarter === voucher.quarter;
          const isPaid = voucher.status === "Paid";
          const isUpcoming = voucher.status === "Upcoming";

          return (
            <div
              key={voucher.quarter}
              onClick={() => {
                setSelectedVoucher(voucher);
                setEftpsConfirmation(voucher.confirmationNumber || null);
              }}
              className={`p-5 border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                isSelected 
                  ? "bg-black text-white border-black neo-shadow" 
                  : "bg-white text-black border-zinc-300 hover:border-black"
              }`}
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-black font-mono uppercase px-2 py-0.5 border ${
                    isSelected 
                      ? "bg-zinc-800 text-zinc-100 border-zinc-700" 
                      : "bg-zinc-100 text-zinc-800 border-zinc-300"
                  }`}>
                    {voucher.quarter} Voucher
                  </span>

                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 border ${
                    isPaid 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                      : isUpcoming 
                      ? "bg-blue-50 text-blue-700 border-blue-300" 
                      : "bg-zinc-100 text-zinc-600 border-zinc-300"
                  }`}>
                    {voucher.status}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-2xl font-black font-mono block">
                    ${voucher.estimatedTaxDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <div className="text-[11px] font-sans text-zinc-400 mt-1 flex items-center gap-1">
                    <Calendar size={12} />
                    <span>Due: {voucher.dueDate}</span>
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    Period: {voucher.period}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-zinc-700/50 text-[10px] font-mono">
                {isPaid ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <CheckCircle2 size={12} />
                    Paid {voucher.paidDate}
                  </span>
                ) : (
                  <span className={isSelected ? "text-zinc-300" : "text-zinc-500"}>
                    Click to review payment voucher →
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Voucher Payment & EFTPS Direct Debit Terminal */}
      <div className="bg-white p-6 neo-border neo-shadow-sm border-2 border-black space-y-4">
        <div className="flex justify-between items-center border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5">
                FORM 1040-ES PAYMENT VOUCHER
              </span>
              <span className="text-xs font-mono font-bold text-zinc-500">
                Quarter {selectedVoucher.quarter} (Due {selectedVoucher.dueDate})
              </span>
            </div>
            <h3 className="text-xl font-black font-sans tracking-tight text-black mt-1">
              Electronic Federal Tax Payment System (EFTPS) Dispatch
            </h3>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 border border-black hover:bg-zinc-100 text-black cursor-pointer"
              title="Print 1040-ES Voucher Form"
            >
              <Printer size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Voucher Details */}
          <div className="lg:col-span-7 space-y-3">
            <div className="p-4 bg-zinc-50 border border-zinc-300 text-xs font-sans space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500 uppercase">Taxpayer Name:</span>
                <span className="font-bold text-black">{filing.businessName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500 uppercase">TIN / EIN:</span>
                <span className="font-bold text-black">{filing.einOrSsn}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500 uppercase">Voucher Type:</span>
                <span className="font-bold text-black">Form 1040-ES (Estimated Tax for Individuals)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-zinc-500 uppercase">Quarter & Tax Period:</span>
                <span className="font-bold text-black">{selectedVoucher.quarter} ({selectedVoucher.period})</span>
              </div>
              <div className="flex justify-between font-mono border-t border-zinc-200 pt-2 text-sm">
                <span className="text-zinc-800 font-bold uppercase">Estimated Tax Payment Due:</span>
                <span className="font-black text-black">${selectedVoucher.estimatedTaxDue.toFixed(2)}</span>
              </div>
            </div>

            {selectedVoucher.status === "Paid" && selectedVoucher.confirmationNumber && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-mono">
                <div className="flex items-center gap-2 font-black text-emerald-950">
                  <CheckCircle2 size={16} className="text-emerald-700" />
                  <span>EFTPS TAX PAYMENT SETTLED</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px]">
                  <div>Confirmation #: <strong>{selectedVoucher.confirmationNumber}</strong></div>
                  <div>Settlement Date: <strong>{selectedVoucher.paidDate}</strong></div>
                  <div>Direct Debit Source: <strong>{filing.bankDirectDebit?.bankName || "First National Trust Bank"} (****{filing.bankDirectDebit?.accountNo.slice(-4) || "4821"})</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Right Direct Debit / Action Box */}
          <div className="lg:col-span-5 flex flex-col justify-between p-4 bg-zinc-900 text-white neo-border">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                Direct Debit Authorization
              </span>
              <h4 className="text-sm font-black font-sans mt-1">
                EFTPS Direct Treasury Debit
              </h4>
              <p className="text-[11px] text-zinc-300 font-sans mt-1 leading-relaxed">
                Authorize direct electronic funds withdrawal from registered primary business banking account to the United States Treasury.
              </p>

              <div className="mt-3 p-2.5 bg-zinc-800 border border-zinc-700 text-[11px] font-mono space-y-1">
                <div className="text-zinc-400">Account: <span className="text-white">{filing.bankDirectDebit?.bankName}</span></div>
                <div className="text-zinc-400">Routing #: <span className="text-white">{filing.bankDirectDebit?.routingNo}</span></div>
                <div className="text-zinc-400">Account #: <span className="text-white">••••••••{filing.bankDirectDebit?.accountNo.slice(-4)}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800">
              {selectedVoucher.status === "Paid" ? (
                <div className="text-center font-mono text-xs font-bold text-emerald-400 py-2 bg-emerald-950/60 border border-emerald-500">
                  ✓ Voucher Settled & Confirmed
                </div>
              ) : (
                <button
                  onClick={handlePayVoucher}
                  disabled={isPayingVoucher}
                  className="w-full bg-white hover:bg-zinc-100 text-black font-mono text-xs font-bold py-3 px-4 border-2 border-white uppercase flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <CreditCard size={14} />
                  <span>{isPayingVoucher ? "Transmitting to EFTPS..." : `Pay $${selectedVoucher.estimatedTaxDue.toFixed(2)} via EFTPS`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
