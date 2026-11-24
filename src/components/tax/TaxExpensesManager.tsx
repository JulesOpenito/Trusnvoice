import React, { useState } from "react";
import { TaxExpense, TaxExpenseCategory } from "../../types";
import { CATEGORY_LABELS } from "../../utils/taxCalculations";
import { 
  Receipt, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Search, Filter, Download, FileText, Sparkles, Tag, DollarSign, Calendar
} from "lucide-react";

interface TaxExpensesManagerProps {
  expenses: TaxExpense[];
  onAddExpense: (expense: TaxExpense) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateExpense: (expense: TaxExpense) => void;
}

export default function TaxExpensesManager({
  expenses,
  onAddExpense,
  onDeleteExpense,
  onUpdateExpense
}: TaxExpensesManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // New Expense form state
  const [newVendor, setNewVendor] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<TaxExpenseCategory>("software_cloud_saas");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDeductible, setNewDeductible] = useState("100");
  const [newHasReceipt, setNewHasReceipt] = useState(true);
  const [newNotes, setNewNotes] = useState("");

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      exp.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "ALL" || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalRawAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalDeductibleAmount = expenses.reduce((sum, e) => sum + (e.amount * (e.deductiblePercent || 100)) / 100, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0 || !newVendor.trim()) return;

    const created: TaxExpense = {
      id: `exp-${Date.now()}`,
      date: newDate || new Date().toISOString().split("T")[0],
      vendor: newVendor.trim(),
      description: newDesc.trim() || newVendor.trim(),
      category: newCategory,
      amount: amountVal,
      deductiblePercent: parseFloat(newDeductible) || 100,
      hasReceipt: newHasReceipt,
      notes: newNotes.trim() || undefined
    };

    onAddExpense(created);
    setIsAddingExpense(false);
    setNewVendor("");
    setNewDesc("");
    setNewAmount("");
    setNewNotes("");
  };

  const exportExpensesCSV = () => {
    const headers = ["ID", "Date", "Vendor", "Description", "IRS Category", "Amount", "Deductible %", "Deductible Total", "Receipt Attached", "Notes"];
    const rows = expenses.map(e => [
      e.id,
      e.date,
      `"${e.vendor.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${CATEGORY_LABELS[e.category]?.label || e.category}"`,
      e.amount.toFixed(2),
      `${e.deductiblePercent}%`,
      ((e.amount * e.deductiblePercent) / 100).toFixed(2),
      e.hasReceipt ? "Yes" : "No",
      `"${(e.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TrustInvoice-Tax-Expenses-2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Ledger Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 neo-border neo-shadow-sm">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block tracking-wider">
            Total Logged Expenses
          </span>
          <span className="text-2xl font-black font-mono mt-1 block text-black">
            ${totalRawAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-zinc-500 font-sans mt-0.5 block">
            Across {expenses.length} itemized transaction records
          </span>
        </div>

        <div className="bg-emerald-50/60 border-2 border-emerald-600 p-4 text-emerald-950">
          <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 block tracking-wider">
            Schedule C Tax Deductions
          </span>
          <span className="text-2xl font-black font-mono mt-1 block text-emerald-900">
            ${totalDeductibleAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-700 font-sans mt-0.5 block">
            100% compliant ordinary & necessary business deductions (§162)
          </span>
        </div>

        <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
              IRS Receipt Audit Verification
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={12} />
              {Math.round((expenses.filter(e => e.hasReceipt).length / (expenses.length || 1)) * 100)}% Verified
            </span>
          </div>
          <div className="w-full bg-zinc-100 h-2 mt-2 border border-zinc-300">
            <div 
              className="bg-black h-full transition-all"
              style={{ width: `${(expenses.filter(e => e.hasReceipt).length / (expenses.length || 1)) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1.5">
            {expenses.filter(e => !e.hasReceipt).length} items missing receipt attachments
          </span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-4 neo-border neo-shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search vendor, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs neo-input font-sans"
            />
          </div>

          {/* Category filter dropdown */}
          <div className="relative w-full sm:w-64">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs neo-input font-mono uppercase bg-white cursor-pointer"
            >
              <option value="ALL">All Categories ({expenses.length})</option>
              {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => {
                const count = expenses.filter(e => e.category === catKey).length;
                return (
                  <option key={catKey} value={catKey}>
                    {catVal.label} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportExpensesCSV}
            className="bg-white hover:bg-zinc-100 text-black font-mono text-xs font-bold py-2 px-3 border border-black uppercase flex items-center gap-1.5 cursor-pointer transition-all"
            title="Export Expense Ledger as CSV"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddingExpense(true)}
            className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-2 px-4 border border-black uppercase flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Plus size={13} />
            <span>Add Tax Expense</span>
          </button>
        </div>
      </div>

      {/* Add Expense Modal / Drawer */}
      {isAddingExpense && (
        <div className="bg-white p-6 neo-border neo-shadow border-2 border-black animate-in fade-in duration-150">
          <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4">
            <h3 className="text-sm font-mono font-black uppercase text-black flex items-center gap-2">
              <Plus size={16} />
              <span>Record New Tax Deductible Business Expense</span>
            </h3>
            <button
              onClick={() => setIsAddingExpense(false)}
              className="text-xs font-mono text-zinc-400 hover:text-black uppercase font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Vendor / Payee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Cloud, Adobe Systems, Alex Chen"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="w-full text-xs neo-input font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  IRS Schedule C Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => {
                    const cat = e.target.value as TaxExpenseCategory;
                    setNewCategory(cat);
                    if (cat === "meals_50") setNewDeductible("50");
                    else setNewDeductible("100");
                  }}
                  className="w-full text-xs neo-input font-mono bg-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([catKey, catVal]) => (
                    <option key={catKey} value={catKey}>
                      {catVal.label} [{catVal.line}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Expense Amount ($ USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="0.00"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full text-xs neo-input font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs neo-input font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Deductibility Rate (%)
                </label>
                <select
                  value={newDeductible}
                  onChange={(e) => setNewDeductible(e.target.value)}
                  className="w-full text-xs neo-input font-mono bg-white"
                >
                  <option value="100">100% Fully Deductible (Standard)</option>
                  <option value="50">50% Deductible (Business Meals §274)</option>
                  <option value="80">80% Pro-Rated Business Use</option>
                  <option value="50">50% Mixed Personal/Business</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Receipt Status
                </label>
                <label className="flex items-center gap-2 p-2 border border-zinc-200 bg-zinc-50 cursor-pointer text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={newHasReceipt}
                    onChange={(e) => setNewHasReceipt(e.target.checked)}
                    className="accent-black"
                  />
                  <span>Digital Receipt / Invoice Verified on File</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Expense Description / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly server capacity for client production API"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs neo-input font-sans"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                  Internal Tax Notes / IRC Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Section 179 direct write-off, paid via Chase business debit"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs neo-input font-sans"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddingExpense(false)}
                className="bg-white hover:bg-zinc-100 text-zinc-600 font-mono text-xs font-bold py-2.5 px-4 border border-zinc-300 uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-2.5 px-6 border-2 border-black uppercase cursor-pointer"
              >
                Save Deductible Expense
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white neo-border neo-shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-zinc-100 border-b-2 border-black font-mono text-[10px] text-zinc-600 uppercase">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vendor & Description</th>
                <th className="py-3 px-4">Schedule C Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Deductible</th>
                <th className="py-3 px-4 text-center">Receipt</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredExpenses.map((expense) => {
                const catInfo = CATEGORY_LABELS[expense.category] || { label: expense.category, line: "Line 27a" };
                const deductibleAmount = (expense.amount * (expense.deductiblePercent || 100)) / 100;

                return (
                  <tr key={expense.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-600 whitespace-nowrap">
                      {expense.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-extrabold text-black font-sans text-xs">
                        {expense.vendor}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-normal mt-0.5">
                        {expense.description}
                      </div>
                      {expense.notes && (
                        <div className="text-[10px] font-mono text-zinc-400 mt-0.5 italic">
                          ↳ {expense.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] bg-zinc-100 border border-zinc-300 text-zinc-700 py-0.5 px-2 rounded block w-fit font-bold">
                        {catInfo.line}
                      </span>
                      <span className="text-[11px] text-zinc-600 block mt-0.5">
                        {catInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-black whitespace-nowrap">
                      ${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[11px]">
                      <span className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                        expense.deductiblePercent === 100 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-amber-50 text-amber-700 border-amber-300"
                      }`}>
                        ${deductibleAmount.toFixed(2)} ({expense.deductiblePercent}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {expense.hasReceipt ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          <CheckCircle2 size={11} />
                          <span>Attached</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded" title="Missing receipt over $75 may trigger IRS DIF question">
                          <AlertTriangle size={11} />
                          <span>Missing</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteExpense(expense.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400 font-mono text-xs">
                    No business expenses found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
