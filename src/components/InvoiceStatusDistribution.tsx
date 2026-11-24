import React, { useState, useMemo } from "react";
import { Invoice } from "../types";
import { 
  PieChart as PieIcon, CheckCircle2, Clock, AlertTriangle, 
  ArrowUpRight, DollarSign, Layers, Filter, ShieldCheck, Sparkles 
} from "lucide-react";

interface InvoiceStatusDistributionProps {
  invoices: Invoice[];
  onNavigateToTab?: (tab: string, specInvoice?: Invoice) => void;
}

export default function InvoiceStatusDistribution({ 
  invoices, 
  onNavigateToTab 
}: InvoiceStatusDistributionProps) {
  const [metricMode, setMetricMode] = useState<"count" | "amount">("amount");
  const [activeSlice, setActiveSlice] = useState<string | null>(null);

  // Calculate detailed status metrics
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    const paidInvoices = invoices.filter((i) => i.status === "Paid");
    const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
    const pendingInvoices = invoices.filter((i) => i.status === "Sent" || i.status === "Review");

    const paidCount = paidInvoices.length;
    const paidAmount = paidInvoices.reduce((sum, i) => sum + i.amount, 0);

    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);

    const pendingCount = pendingInvoices.length;
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.amount, 0);

    // Percentages by amount
    const paidAmountPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
    const pendingAmountPct = totalAmount > 0 ? (pendingAmount / totalAmount) * 100 : 0;
    const overdueAmountPct = totalAmount > 0 ? (overdueAmount / totalAmount) * 100 : 0;

    // Percentages by count
    const paidCountPct = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    const pendingCountPct = totalCount > 0 ? (pendingCount / totalCount) * 100 : 0;
    const overdueCountPct = totalCount > 0 ? (overdueCount / totalCount) * 100 : 0;

    return {
      totalCount,
      totalAmount,
      paid: {
        count: paidCount,
        amount: paidAmount,
        amountPct: paidAmountPct,
        countPct: paidCountPct,
        color: "#10B981", // Emerald-500
        bgClass: "bg-emerald-500",
        borderClass: "border-emerald-600",
        badgeBg: "bg-emerald-50 text-emerald-800 border-emerald-300",
        label: "Paid",
        sublabel: "Cleared Interbank",
      },
      pending: {
        count: pendingCount,
        amount: pendingAmount,
        amountPct: pendingAmountPct,
        countPct: pendingCountPct,
        color: "#F59E0B", // Amber-500
        bgClass: "bg-amber-400",
        borderClass: "border-amber-500",
        badgeBg: "bg-amber-50 text-amber-800 border-amber-300",
        label: "Pending",
        sublabel: "Sent / In Review",
      },
      overdue: {
        count: overdueCount,
        amount: overdueAmount,
        amountPct: overdueAmountPct,
        countPct: overdueCountPct,
        color: "#EF4444", // Red-500
        bgClass: "bg-red-500",
        borderClass: "border-red-600",
        badgeBg: "bg-red-50 text-red-800 border-red-300",
        label: "Overdue",
        sublabel: "Escalated Action",
      },
    };
  }, [invoices]);

  // Generate SVG Donut Chart Paths
  const pieSegments = useMemo(() => {
    const data = [
      {
        id: "paid",
        label: "Paid",
        value: metricMode === "amount" ? stats.paid.amount : stats.paid.count,
        percentage: metricMode === "amount" ? stats.paid.amountPct : stats.paid.countPct,
        color: stats.paid.color,
        amount: stats.paid.amount,
        count: stats.paid.count,
      },
      {
        id: "pending",
        label: "Pending",
        value: metricMode === "amount" ? stats.pending.amount : stats.pending.count,
        percentage: metricMode === "amount" ? stats.pending.amountPct : stats.pending.countPct,
        color: stats.pending.color,
        amount: stats.pending.amount,
        count: stats.pending.count,
      },
      {
        id: "overdue",
        label: "Overdue",
        value: metricMode === "amount" ? stats.overdue.amount : stats.overdue.count,
        percentage: metricMode === "amount" ? stats.overdue.amountPct : stats.overdue.countPct,
        color: stats.overdue.color,
        amount: stats.overdue.amount,
        count: stats.overdue.count,
      },
    ].filter(s => s.percentage > 0);

    const totalVal = data.reduce((sum, d) => sum + d.value, 0);
    if (totalVal === 0) return [];

    let currentAngle = -90; // Start at top
    const radius = 65;
    const innerRadius = 38;
    const center = 85;

    return data.map((seg) => {
      const angle = (seg.value / totalVal) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      const rad = (deg: number) => (deg * Math.PI) / 180;

      // Outer arc points
      const x1 = center + radius * Math.cos(rad(startAngle));
      const y1 = center + radius * Math.sin(rad(startAngle));
      const x2 = center + radius * Math.cos(rad(endAngle));
      const y2 = center + radius * Math.sin(rad(endAngle));

      // Inner arc points
      const x3 = center + innerRadius * Math.cos(rad(endAngle));
      const y3 = center + innerRadius * Math.sin(rad(endAngle));
      const x4 = center + innerRadius * Math.cos(rad(startAngle));
      const y4 = center + innerRadius * Math.sin(rad(startAngle));

      const largeArc = angle > 180 ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
        "Z",
      ].join(" ");

      return {
        ...seg,
        pathData,
        startAngle,
        endAngle,
      };
    });
  }, [stats, metricMode]);

  return (
    <div className="bg-white p-6 neo-border neo-shadow mb-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black font-mono uppercase tracking-wider text-black flex items-center gap-2">
              <PieIcon size={16} className="text-black" />
              <span>Invoice Status Distribution &amp; Progress</span>
            </h3>
            <span className="text-[10px] font-mono font-bold uppercase bg-black text-white px-2 py-0.5">
              Live Ledger
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-sans mt-0.5">
            Real-time portfolio composition showing pending receivables, overdue alerts, and cleared settlements.
          </p>
        </div>

        {/* Amount vs Count Toggle */}
        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 border border-zinc-300 font-mono text-xs shrink-0">
          <span className="text-[9px] uppercase font-bold text-zinc-500 px-1.5 hidden sm:inline">Metric:</span>
          <button
            onClick={() => setMetricMode("amount")}
            className={`px-2.5 py-1 text-xs font-bold uppercase transition-all cursor-pointer ${
              metricMode === "amount"
                ? "bg-black text-white neo-shadow-sm"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Dollar Value ($)
          </button>
          <button
            onClick={() => setMetricMode("count")}
            className={`px-2.5 py-1 text-xs font-bold uppercase transition-all cursor-pointer ${
              metricMode === "count"
                ? "bg-black text-white neo-shadow-sm"
                : "text-zinc-600 hover:text-black"
            }`}
          >
            Invoice Count (#)
          </button>
        </div>
      </div>

      {/* Primary Section: Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="font-bold text-black uppercase flex items-center gap-1.5">
            <Layers size={13} />
            <span>Cumulative Settlement Progress Bar</span>
          </span>
          <span className="text-[11px] text-zinc-500">
            Total Ledger: <strong className="text-black font-mono">${stats.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ({stats.totalCount} invoices)
          </span>
        </div>

        {/* Segmented Multi-Color Progress Bar */}
        <div className="w-full h-7 bg-zinc-200 border-2 border-black flex overflow-hidden neo-shadow-sm relative">
          {/* Paid Segment */}
          {stats.paid.amountPct > 0 && (
            <div
              className="h-full bg-emerald-500 hover:bg-emerald-400 transition-all duration-500 flex items-center justify-center font-mono text-[10px] font-black text-black border-r border-black cursor-pointer truncate px-1"
              style={{ width: `${metricMode === "amount" ? stats.paid.amountPct : stats.paid.countPct}%` }}
              onMouseEnter={() => setActiveSlice("paid")}
              onMouseLeave={() => setActiveSlice(null)}
              title={`Paid: $${stats.paid.amount.toLocaleString()} (${stats.paid.count} invoices)`}
            >
              {(metricMode === "amount" ? stats.paid.amountPct : stats.paid.countPct) > 12 && (
                <span>PAID {(metricMode === "amount" ? stats.paid.amountPct : stats.paid.countPct).toFixed(0)}%</span>
              )}
            </div>
          )}

          {/* Pending Segment */}
          {stats.pending.amountPct > 0 && (
            <div
              className="h-full bg-amber-400 hover:bg-amber-300 transition-all duration-500 flex items-center justify-center font-mono text-[10px] font-black text-black border-r border-black cursor-pointer truncate px-1"
              style={{ width: `${metricMode === "amount" ? stats.pending.amountPct : stats.pending.countPct}%` }}
              onMouseEnter={() => setActiveSlice("pending")}
              onMouseLeave={() => setActiveSlice(null)}
              title={`Pending: $${stats.pending.amount.toLocaleString()} (${stats.pending.count} invoices)`}
            >
              {(metricMode === "amount" ? stats.pending.amountPct : stats.pending.countPct) > 12 && (
                <span>PENDING {(metricMode === "amount" ? stats.pending.amountPct : stats.pending.countPct).toFixed(0)}%</span>
              )}
            </div>
          )}

          {/* Overdue Segment */}
          {stats.overdue.amountPct > 0 && (
            <div
              className="h-full bg-red-500 hover:bg-red-400 transition-all duration-500 flex items-center justify-center font-mono text-[10px] font-black text-white cursor-pointer truncate px-1"
              style={{ width: `${metricMode === "amount" ? stats.overdue.amountPct : stats.overdue.countPct}%` }}
              onMouseEnter={() => setActiveSlice("overdue")}
              onMouseLeave={() => setActiveSlice(null)}
              title={`Overdue: $${stats.overdue.amount.toLocaleString()} (${stats.overdue.count} invoices)`}
            >
              {(metricMode === "amount" ? stats.overdue.amountPct : stats.overdue.countPct) > 12 && (
                <span>OVERDUE {(metricMode === "amount" ? stats.overdue.amountPct : stats.overdue.countPct).toFixed(0)}%</span>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar Legend Markers */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-600 pt-1">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveSlice(activeSlice === "paid" ? null : "paid")}>
              <span className="w-3 h-3 bg-emerald-500 border border-black inline-block"></span>
              <strong className="text-black">Paid:</strong> ${stats.paid.amount.toLocaleString()} ({stats.paid.amountPct.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveSlice(activeSlice === "pending" ? null : "pending")}>
              <span className="w-3 h-3 bg-amber-400 border border-black inline-block"></span>
              <strong className="text-black">Pending:</strong> ${stats.pending.amount.toLocaleString()} ({stats.pending.amountPct.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1.5 cursor-pointer" onClick={() => setActiveSlice(activeSlice === "overdue" ? null : "overdue")}>
              <span className="w-3 h-3 bg-red-500 border border-black inline-block"></span>
              <strong className="text-black">Overdue:</strong> ${stats.overdue.amount.toLocaleString()} ({stats.overdue.amountPct.toFixed(1)}%)
            </span>
          </div>

          <div className="text-[10px] bg-zinc-100 px-2 py-0.5 border border-zinc-300 font-bold">
            Target Collection SLA: 85.0%
          </div>
        </div>
      </div>

      {/* Secondary Section: Pie Chart & Detailed Metric Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
        
        {/* Left: SVG Status Distribution Pie / Donut Chart */}
        <div className="lg:col-span-5 bg-zinc-50 border-2 border-black p-4 neo-shadow-sm flex flex-col items-center justify-center relative min-h-[240px]">
          <div className="text-center mb-2">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-700">
              Distribution Donut Analysis
            </span>
          </div>

          <div className="relative w-[170px] h-[170px] flex items-center justify-center">
            <svg
              viewBox="0 0 170 170"
              role="img"
              aria-label="Invoice status distribution donut chart showing paid, pending, and overdue shares"
              className="w-full h-full transform -rotate-90"
            >
              <title>Invoice status distribution donut chart</title>
              {pieSegments.map((seg) => {
                const isSelected = activeSlice === seg.id;
                return (
                  <path
                    key={seg.id}
                    d={seg.pathData}
                    fill={seg.color}
                    stroke="#000"
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    className="cursor-pointer transition-all duration-300 hover:opacity-90"
                    onMouseEnter={() => setActiveSlice(seg.id)}
                    onMouseLeave={() => setActiveSlice(null)}
                    style={{
                      transformOrigin: "center",
                      transform: isSelected ? "scale(1.04)" : "scale(1)",
                    }}
                  />
                );
              })}
            </svg>

            {/* Donut Center Core Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                {activeSlice 
                  ? activeSlice.toUpperCase()
                  : metricMode === "amount" 
                  ? "TOTAL VOLUME" 
                  : "TOTAL INVOICES"}
              </span>
              <span className="text-sm font-black font-mono text-black">
                {activeSlice === "paid" 
                  ? `${stats.paid.amountPct.toFixed(0)}%`
                  : activeSlice === "pending"
                  ? `${stats.pending.amountPct.toFixed(0)}%`
                  : activeSlice === "overdue"
                  ? `${stats.overdue.amountPct.toFixed(0)}%`
                  : metricMode === "amount"
                  ? `$${(stats.totalAmount / 1000).toFixed(1)}k`
                  : stats.totalCount}
              </span>
              <span className="text-[8px] font-mono text-zinc-400">
                {activeSlice ? `${metricMode === "amount" ? `$${stats[activeSlice as keyof typeof stats === "paid" ? "paid" : activeSlice === "pending" ? "pending" : "overdue"].amount.toLocaleString()}` : `${stats[activeSlice as keyof typeof stats === "paid" ? "paid" : activeSlice === "pending" ? "pending" : "overdue"].count} items`}` : "Status Share"}
              </span>
            </div>
          </div>

          <div className="mt-3 text-[10px] font-mono text-zinc-500 text-center">
            Hover over segments to inspect discrete tranche allocation
          </div>
        </div>

        {/* Right: 3 Interactive Tranche Cards */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Paid Tranche Card */}
          <div 
            onMouseEnter={() => setActiveSlice("paid")}
            onMouseLeave={() => setActiveSlice(null)}
            className={`p-4 border-2 transition-all duration-200 cursor-pointer ${
              activeSlice === "paid" 
                ? "bg-emerald-50 border-emerald-600 neo-shadow-sm translate-x-1" 
                : "bg-white border-zinc-300 hover:border-black"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 border border-emerald-400 text-emerald-800">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-black">
                      Paid In Full
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 border bg-emerald-100 text-emerald-900 border-emerald-300">
                      {stats.paid.count} Invoices
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Settled receivables with verified Fedwire cryptographic hashes.
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-sm font-black text-black">
                  ${stats.paid.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold text-emerald-700">
                  {stats.paid.amountPct.toFixed(1)}% of portfolio
                </div>
              </div>
            </div>
          </div>

          {/* Pending Tranche Card */}
          <div 
            onMouseEnter={() => setActiveSlice("pending")}
            onMouseLeave={() => setActiveSlice(null)}
            className={`p-4 border-2 transition-all duration-200 cursor-pointer ${
              activeSlice === "pending" 
                ? "bg-amber-50 border-amber-500 neo-shadow-sm translate-x-1" 
                : "bg-white border-zinc-300 hover:border-black"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 border border-amber-400 text-amber-800">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-black">
                      Pending Remittance
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 border bg-amber-100 text-amber-900 border-amber-300">
                      {stats.pending.count} Invoices
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Invoices dispatched to counterparties under standard payment grace terms.
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-sm font-black text-black">
                  ${stats.pending.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold text-amber-700">
                  {stats.pending.amountPct.toFixed(1)}% of portfolio
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Tranche Card */}
          <div 
            onMouseEnter={() => setActiveSlice("overdue")}
            onMouseLeave={() => setActiveSlice(null)}
            className={`p-4 border-2 transition-all duration-200 cursor-pointer ${
              activeSlice === "overdue" 
                ? "bg-red-50 border-red-600 neo-shadow-sm translate-x-1" 
                : "bg-white border-zinc-300 hover:border-black"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-100 border border-red-400 text-red-800">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-mono font-bold uppercase text-black">
                      Overdue Accounts
                    </h4>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 border bg-red-100 text-red-900 border-red-300">
                      {stats.overdue.count} Invoices
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-sans">
                    Delinquent balances requiring automated AI tone escalation or manual review.
                  </p>
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-sm font-black text-red-600">
                  ${stats.overdue.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-bold text-red-700">
                  {stats.overdue.amountPct.toFixed(1)}% of portfolio
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200 font-mono text-xs">
        <div className="flex items-center gap-2 text-zinc-600">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Automated reconciliation active on all <strong>{stats.totalCount}</strong> ledger entries</span>
        </div>

        {onNavigateToTab && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab("invoices")}
              className="bg-black hover:bg-zinc-800 text-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer neo-shadow-sm transition-all"
            >
              <span>View Full Ledger</span>
              <ArrowUpRight size={13} />
            </button>
            <button
              onClick={() => onNavigateToTab("ai")}
              className="bg-zinc-100 hover:bg-zinc-200 text-black border border-black px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles size={13} className="text-indigo-600" />
              <span>AI Tone Follow-ups</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
