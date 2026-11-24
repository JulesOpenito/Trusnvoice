import React, { useState } from "react";
import { 
  TaxReturnFiling, TaxExpense, Contractor1099, QuarterlyVoucher, Invoice 
} from "../types";
import { 
  initialTaxExpenses, initialContractors1099, 
  initialQuarterlyVouchers, initialTaxReturn 
} from "../data/mockTaxData";
import { computeTaxReturn, TaxComputationResult } from "../utils/taxCalculations";
import TaxFilingForm from "./tax/TaxFilingForm";
import TaxExpensesManager from "./tax/TaxExpensesManager";
import TaxDeductionAuditor from "./tax/TaxDeductionAuditor";
import Tax1099Compliance from "./tax/Tax1099Compliance";
import TaxQuarterlyEstimates from "./tax/TaxQuarterlyEstimates";
import TaxCopilotChat from "./tax/TaxCopilotChat";
import { 
  Landmark, ShieldAlert, Receipt, FileSpreadsheet, 
  Calendar, Bot, Sparkles, CheckCircle2, DollarSign, Send, ArrowUpRight
} from "lucide-react";

interface TaxReturnSuiteProps {
  invoices: Invoice[];
  onNavigateToTab?: (tab: string) => void;
}

export default function TaxReturnSuite({ invoices, onNavigateToTab }: TaxReturnSuiteProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>("filing");

  // State
  const [filing, setFiling] = useState<TaxReturnFiling>(initialTaxReturn);
  const [expenses, setExpenses] = useState<TaxExpense[]>(initialTaxExpenses);
  const [contractors, setContractors] = useState<Contractor1099[]>(initialContractors1099);
  const [vouchers, setVouchers] = useState<QuarterlyVoucher[]>(initialQuarterlyVouchers);

  // Compute live values
  const comp: TaxComputationResult = computeTaxReturn(filing, expenses);

  // Handlers
  const handleAddExpense = (newExpense: TaxExpense) => {
    setExpenses([newExpense, ...expenses]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleUpdateExpense = (updated: TaxExpense) => {
    setExpenses(expenses.map(e => e.id === updated.id ? updated : e));
  };

  const handleAddContractor = (c: Contractor1099) => {
    setContractors([c, ...contractors]);
  };

  const handleUpdateContractor = (c: Contractor1099) => {
    setContractors(contractors.map(item => item.id === c.id ? c : item));
  };

  return (
    <div className="space-y-6">
      {/* Top Suite Header Banner */}
      <div className="bg-white border-2 border-black p-6 neo-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 bg-black text-white font-mono font-black text-xs uppercase flex items-center gap-1.5">
              <Landmark size={14} />
              <span>TAX RETURN &amp; COMPLIANCE OS</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 font-bold border border-zinc-300 py-0.5 px-2 uppercase rounded">
              IRS MeF v2026 Production Ready
            </span>
          </div>

          <h2 className="text-3xl font-black text-black tracking-tight mt-2">
            Enterprise Tax Return &amp; E-File Suite
          </h2>
          <p className="text-xs text-zinc-600 font-sans max-w-2xl mt-1 leading-relaxed">
            Automated tax calculation engine linking paid invoices directly to IRS Form 1040 Schedule C, 1120-S, 1099-NEC contractor matrices, quarterly estimated vouchers, and AI-powered audit defense.
          </p>
        </div>

        {/* Quick Balance / Refund Widget */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-zinc-900 text-white p-3 px-4 border-2 border-black text-right">
            <span className="text-[9px] font-mono text-zinc-400 uppercase block tracking-wider">
              {comp.refundOrBalanceDue <= 0 ? "Expected 2026 Refund" : "Est. Tax Balance Due"}
            </span>
            <span className={`text-xl font-black font-mono ${comp.refundOrBalanceDue <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
              ${Math.abs(comp.refundOrBalanceDue).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto border-2 border-black bg-white select-none whitespace-nowrap scrollbar-none">
        {[
          { id: "filing", label: "Schedule C & E-File", icon: Landmark },
          { id: "audit", label: "AI Deduction Auditor", icon: ShieldAlert },
          { id: "expenses", label: "Expense Ledger", icon: Receipt },
          { id: "1099s", label: "1099-NEC Matrix", icon: FileSpreadsheet },
          { id: "estimates", label: "Quarterly Estimates", icon: Calendar },
          { id: "copilot", label: "AI Tax CPA Copilot", icon: Bot }
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase py-3.5 px-4 border-r-2 last:border-r-0 border-black transition-all cursor-pointer ${
                isSelected 
                  ? "bg-black text-white" 
                  : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-black"
              }`}
            >
              <IconComponent size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Sub-Tab */}
      <div>
        {activeSubTab === "filing" && (
          <TaxFilingForm
            filing={filing}
            expenses={expenses}
            invoices={invoices}
            onUpdateFiling={setFiling}
            onNavigateToTab={onNavigateToTab}
          />
        )}

        {activeSubTab === "audit" && (
          <TaxDeductionAuditor
            filing={filing}
            expenses={expenses}
            grossReceipts={comp.grossReceipts}
            onApplyDeduction={handleAddExpense}
          />
        )}

        {activeSubTab === "expenses" && (
          <TaxExpensesManager
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
          />
        )}

        {activeSubTab === "1099s" && (
          <Tax1099Compliance
            contractors={contractors}
            invoices={invoices}
            onAddContractor={handleAddContractor}
            onUpdateContractor={handleUpdateContractor}
          />
        )}

        {activeSubTab === "estimates" && (
          <TaxQuarterlyEstimates
            vouchers={vouchers}
            filing={filing}
            onUpdateVouchers={setVouchers}
          />
        )}

        {activeSubTab === "copilot" && (
          <TaxCopilotChat
            filing={filing}
            expenses={expenses}
          />
        )}
      </div>
    </div>
  );
}
