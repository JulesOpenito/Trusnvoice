import React, { useState } from "react";
import { TaxReturnFiling, TaxExpense } from "../../types";
import { 
  Sparkles, Send, Bot, User, RefreshCw, BookOpen, 
  HelpCircle, ShieldCheck, Landmark
} from "lucide-react";

interface TaxCopilotChatProps {
  filing: TaxReturnFiling;
  expenses: TaxExpense[];
}

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
}

const SAMPLE_TAX_QUESTIONS = [
  "What SaaS & AI API tools are 100% tax deductible for developers?",
  "How does the Section 199A 20% QBI deduction work on Schedule C?",
  "When should an LLC elect S-Corp status (Form 2553) to save self-employment tax?",
  "What is the IRS safe-harbor rule for quarterly estimated taxes?"
];

export default function TaxCopilotChat({ filing, expenses }: TaxCopilotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      role: "model",
      text: `Hello! I am your **TrustInvoice AI Tax Counsel & CPA Copilot**. 

I have analyzed your **2026 ${filing.entityType.replace(/_/g, " ")}** profile:
- **Gross Receipts**: $${filing.grossReceipts.toLocaleString("en-US", { minimumFractionDigits: 2 })}
- **Itemized Business Write-Offs**: $${filing.totalDeductions.toLocaleString("en-US", { minimumFractionDigits: 2 })} (${expenses.length} records)
- **Net Business Profit**: $${filing.netBusinessProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}

How can I assist you with deduction optimization, 1099 compliance, or IRS e-filing preparations today?`
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: text.trim()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!textToSend) setInputText("");
    setIsLoading(true);

    try {
      const taxContextSummary = `Entity: ${filing.entityType}, Tax Year: 2026, State: ${filing.state}, Gross Receipts: $${filing.grossReceipts}, Expenses: $${filing.totalDeductions}, Net Profit: $${filing.netBusinessProfit}, Estimated Tax Due: $${filing.totalTaxLiability}.`;

      const response = await fetch("/api/ai/tax-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          taxContext: taxContextSummary
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach Tax Copilot API");
      }

      const data = await response.json();
      setMessages(prev => [
        ...prev,
        {
          id: `msg-model-${Date.now()}`,
          role: "model",
          text: data.text
        }
      ]);
    } catch (err: any) {
      console.warn("Tax Copilot offline fallback:", err);
      // Helpful offline guidance
      let reply = "Here is the IRC guidance on your query:\n\n";
      if (text.toLowerCase().includes("saas") || text.toLowerCase().includes("software") || text.toLowerCase().includes("api")) {
        reply += "• **Software & Cloud SaaS (IRC §162)**: 100% deductible as ordinary and necessary expenses for tech companies. Includes AWS/GCP servers, Gemini/OpenAI API tokens, GitHub, Vercel, Slack, and development IDE licenses.\n• **Classification**: Report on Schedule C, Line 27a (Other Expenses).";
      } else if (text.toLowerCase().includes("qbi") || text.toLowerCase().includes("199a")) {
        reply += "• **Section 199A QBI Deduction**: Allows eligible sole proprietors, LLCs, and S-Corps to deduct up to **20% of qualified business income** directly from their adjusted gross income, subject to taxable income limits.";
      } else if (text.toLowerCase().includes("s-corp") || text.toLowerCase().includes("s corp")) {
        reply += "• **S-Corp Election (Form 2553)**: Beneficial once net profit exceeds ~$60,000–$80,000. It allows paying yourself a reasonable W-2 salary (subject to FICA) and taking remaining profit as dividend distributions (free of 15.3% SE tax).";
      } else {
        reply += "• **Ordinary & Necessary Standard (IRC §162)**: Any expense that is common and accepted in your trade or business, and helpful and appropriate for your operations, qualifies as a deductible write-off.\n• Keep digital receipt records for any single expense exceeding $75.";
      }
      reply += "\n\n*Note: Educational tax guidance based on 2026 IRS regulations.*";

      setMessages(prev => [
        ...prev,
        {
          id: `msg-model-${Date.now()}`,
          role: "model",
          text: reply
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white neo-border neo-shadow-sm border-2 border-black flex flex-col h-[650px]">
      {/* Header */}
      <div className="p-4 bg-zinc-900 text-white border-b-2 border-black flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-white text-black font-black">
            <Bot size={16} />
          </div>
          <div>
            <h3 className="font-mono font-black text-sm uppercase text-white">
              AI CPA & Tax Law Copilot
            </h3>
            <span className="text-[10px] text-zinc-400 font-mono">
              2026 IRS Tax Code • Schedule C / 1120-S / 1040-ES Advisor
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-mono text-zinc-300 uppercase">CPA Engine Ready</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap gap-2">
        {SAMPLE_TAX_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-[11px] font-mono bg-white hover:bg-zinc-100 text-zinc-700 py-1 px-2.5 border border-zinc-300 rounded cursor-pointer transition-all text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-7 h-7 rounded bg-black text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 text-xs font-sans neo-border ${
                  isUser 
                    ? "bg-black text-white" 
                    : "bg-zinc-50 text-black border border-zinc-300"
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>
              </div>

              {isUser && (
                <div className="w-7 h-7 rounded bg-zinc-200 text-black flex items-center justify-center shrink-0 mt-0.5 font-bold font-mono text-[10px]">
                  YOU
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center text-xs font-mono text-zinc-500">
            <div className="w-7 h-7 rounded bg-black text-white flex items-center justify-center shrink-0">
              <RefreshCw size={13} className="animate-spin" />
            </div>
            <span>Consulting 2026 Internal Revenue Code & Treasury Regulations...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-zinc-100 border-t-2 border-black flex gap-2">
        <input
          type="text"
          placeholder="Ask any question about business deductions, S-Corps, 1099s, or filing..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 text-xs neo-input font-sans"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-2 px-5 border-2 border-black uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Send size={13} />
          <span>Ask</span>
        </button>
      </div>
    </div>
  );
}
