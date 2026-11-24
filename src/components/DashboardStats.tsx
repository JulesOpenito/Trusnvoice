import React from "react";
import { Invoice } from "../types";
import { Shield, TrendingUp, AlertTriangle, CheckCircle2, Landmark } from "lucide-react";

interface StatsProps {
  invoices: Invoice[];
  onTabChange: (tab: string) => void;
}

export default function DashboardStats({ invoices, onTabChange }: StatsProps) {
  const totalOutstanding = invoices
    .filter((inv) => inv.status === "Overdue" || inv.status === "Sent")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaid = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

  const overdueCount = invoices.filter((inv) => inv.status === "Overdue").length;
  const secureSignedCount = invoices.filter((inv) => inv.isSecureSigned).length;
  const securePercentage = invoices.length > 0 ? (secureSignedCount / invoices.length) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Total Outstanding */}
      <div className="bg-white p-5 neo-border neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">A/R Outstanding</p>
            <h3 className="text-2xl font-extrabold tracking-tight mt-1">
              ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-1.5 border-2 border-black bg-black text-white">
            <TrendingUp size={16} />
          </div>
        </div>
        <div className="text-[11px] font-mono text-neutral-600 flex items-center justify-between border-t border-neutral-200 pt-2.5">
          <span>Active Collection</span>
          <span className="font-bold text-black border-b border-black">
            {invoices.filter((i) => i.status !== "Paid").length} Invoices
          </span>
        </div>
      </div>

      {/* Collection Rate */}
      <div className="bg-white p-5 neo-border neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Collection Rate</p>
            <h3 className="text-2xl font-extrabold tracking-tight mt-1">
              {collectionRate.toFixed(0)}%
            </h3>
          </div>
          <div className="p-1.5 border-2 border-black bg-white text-black">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="text-[11px] font-mono text-neutral-600 border-t border-neutral-200 pt-2.5">
          <div className="w-full bg-neutral-200 h-1.5 border border-black mb-1">
            <div 
              className="bg-black h-full transition-all duration-500" 
              style={{ width: `${collectionRate}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[9px]">
            <span>Paid: ${totalPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            <span>All: ${totalInvoiced.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>

      {/* Overdue Accounts */}
      <div 
        onClick={() => onTabChange("invoices")}
        className="bg-zinc-50 p-5 neo-border neo-shadow flex flex-col justify-between hover:-translate-y-1 cursor-pointer transition-all duration-300"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Overdue Alerts</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-red-600 mt-1">
              {overdueCount}
            </h3>
          </div>
          <div className="p-1.5 border-2 border-red-600 bg-red-50 text-red-600">
            <AlertTriangle size={16} />
          </div>
        </div>
        <div className="text-[11px] font-mono text-neutral-600 flex items-center justify-between border-t border-neutral-200 pt-2.5">
          <span>Escalated</span>
          <span className="font-bold underline text-black">Review</span>
        </div>
      </div>

      {/* Trust Seal Coverage */}
      <div className="bg-black text-white p-5 neo-border neo-shadow flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">Seal Coverage</p>
            <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-emerald-400">
              {securePercentage.toFixed(0)}%
            </h3>
          </div>
          <div className="p-1.5 border-2 border-emerald-400 bg-emerald-950 text-emerald-400">
            <Shield size={16} aria-hidden="true" />
          </div>
        </div>
        <div className="text-[11px] font-mono text-zinc-300 flex items-center justify-between border-t border-neutral-700 pt-2.5">
          <span>Crypto Seals</span>
          <span className="text-emerald-400 font-bold">
            {secureSignedCount} Signed
          </span>
        </div>
      </div>

      {/* 2026 Tax Return & E-File Status Card */}
      <div 
        onClick={() => onTabChange("tax")}
        className="bg-emerald-50/70 p-5 border-2 border-emerald-600 neo-shadow flex flex-col justify-between hover:-translate-y-1 cursor-pointer transition-all duration-300 text-emerald-950"
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-[10px] font-mono text-emerald-700 uppercase tracking-widest font-bold">2026 Tax Return</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-emerald-900 mt-1 font-mono">
              Sched C
            </h3>
          </div>
          <div className="p-1.5 border-2 border-emerald-700 bg-emerald-100 text-emerald-900">
            <Landmark size={16} />
          </div>
        </div>
        <div className="text-[11px] font-mono text-emerald-800 flex items-center justify-between border-t border-emerald-300 pt-2.5">
          <span>IRS E-File Ready</span>
          <span className="font-bold underline text-emerald-950">Open Return →</span>
        </div>
      </div>
    </div>
  );
}

