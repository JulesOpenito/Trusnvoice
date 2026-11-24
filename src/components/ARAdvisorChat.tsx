import React, { useState, useRef, useEffect } from "react";
import { Invoice } from "../types";
import { 
  Bot, Send, User, Sparkles, RefreshCw, Copy, Check, 
  Trash2, ShieldCheck, AlertCircle, TrendingUp, DollarSign, 
  Scale, FileText, ArrowRight, CornerDownLeft 
} from "lucide-react";

interface ARAdvisorChatProps {
  invoices: Invoice[];
  userDisplayName?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    role: "model",
    content: `### 👋 Welcome to TrustInvoice AI Accounts Receivable Advisor

I am your Senior Accounts Receivable Strategist, Commercial Credit Analyst, and Dispute Arbitrator. I can assist you with:

- **Escalation Workflows**: Structuring progressive Level 1 through Level 4 collection demand notices.
- **Dispute Mediation**: Resolving counterparty billing friction without burning business relationships.
- **Prompt Payment Terms**: Formulating dynamic discounts (e.g., 2/10 Net-30) and statutory late penalty schedules.
- **Cryptographic Trust Enforcement**: Verifying SHA-256 seal integrity and legal enforceability.

*Select a tactical prompt below or type your specific AR dilemma.*`,
    timestamp: new Date().toISOString(),
  },
];

const SUGGESTED_PROMPTS = [
  "Draft a formal Level-2 30-day overdue collection demand letter.",
  "How should I negotiate a disputed deliverable without losing the client?",
  "Calculate statutory late payment penalty rates on an overdue commercial balance.",
  "Structure an early payment discount (2/10 Net-30) to accelerate cash flow.",
  "Review my currently overdue portfolio and prioritize collection targets.",
];

export default function ARAdvisorChat({ invoices, userDisplayName }: ARAdvisorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Compute portfolio summary context for the AI
  const portfolioContext = React.useMemo(() => {
    const totalCount = invoices.length;
    const overdueInvoices = invoices.filter((i) => i.status === "Overdue");
    const totalOverdueSum = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalOutstandingSum = invoices
      .filter((i) => i.status !== "Paid")
      .reduce((sum, i) => sum + i.amount, 0);
    const totalPaidSum = invoices
      .filter((i) => i.status === "Paid")
      .reduce((sum, i) => sum + i.amount, 0);

    return {
      totalInvoices: totalCount,
      totalOutstandingUSD: totalOutstandingSum,
      totalOverdueUSD: totalOverdueSum,
      overdueCount: overdueInvoices.length,
      totalPaidUSD: totalPaidSum,
      overdueClients: overdueInvoices.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        clientName: i.clientName,
        amount: i.amount,
        dueDate: i.dueDate,
      })),
    };
  }, [invoices]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setLoading(true);

    try {
      // Send conversation history to server
      const payloadMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/advisor-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: payloadMessages,
          portfolioContext,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: "mod-" + Date.now(),
        role: "model",
        content: data.reply || "No response received.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("AR Chat Error:", err);
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        role: "model",
        content: `⚠️ **Advisory Engine Error**: ${err.message || "Failed to reach AR Advisor service."}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-black text-white p-6 neo-border neo-shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-black text-[10px] font-black uppercase font-mono px-2 py-0.5">
              Gemini 3.5 AI Advisor
            </span>
            <span className="text-zinc-400 text-xs font-mono">
              Role: Senior AR Director & Mediator
            </span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Accounts Receivable & Dispute Advisory
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Tactical collection strategies, compliance regulations, and dispute mediation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetChat}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 py-2 px-3 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Trash2 size={13} />
            <span>Reset Thread</span>
          </button>
        </div>
      </div>

      {/* Portfolio Quick Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="bg-white p-3.5 neo-border neo-shadow-sm">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Total Receivables</span>
          <span className="text-base font-black text-black">
            ${portfolioContext.totalOutstandingUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-red-50 p-3.5 border-2 border-red-600 text-red-900 neo-shadow-sm">
          <span className="text-[10px] uppercase font-bold text-red-700 block mb-0.5">Overdue Exposure</span>
          <span className="text-base font-black text-red-900">
            ${portfolioContext.totalOverdueUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[9px] block text-red-700 mt-0.5 font-bold">
            {portfolioContext.overdueCount} accounts past maturity
          </span>
        </div>

        <div className="bg-emerald-50 p-3.5 border-2 border-emerald-600 text-emerald-900 neo-shadow-sm">
          <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-0.5">Collected Volume</span>
          <span className="text-base font-black text-emerald-950">
            ${portfolioContext.totalPaidUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="bg-zinc-50 p-3.5 neo-border neo-shadow-sm flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-0.5">Seal Enforceability</span>
          <div className="flex items-center gap-1.5 text-xs font-bold text-black">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>100% Cryptographic</span>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="bg-white p-4 neo-border neo-shadow-sm space-y-2">
        <div className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider">
          Suggested AR Action Prompts
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="bg-zinc-50 hover:bg-black hover:text-white border border-zinc-300 py-1.5 px-3 text-xs font-mono text-zinc-700 cursor-pointer transition-all text-left truncate max-w-full"
            >
              &ldquo;{prompt}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log Area */}
      <div className="bg-white neo-border neo-shadow-sm flex flex-col min-h-[480px]">
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-h-[600px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "model" && (
                <div className="w-8 h-8 rounded bg-black text-amber-400 flex items-center justify-center shrink-0 border border-black neo-shadow-sm">
                  <Bot size={18} />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-none p-4 space-y-2 border-2 ${
                  msg.role === "user"
                    ? "bg-black text-white border-black neo-shadow-sm"
                    : "bg-zinc-50 text-black border-black neo-shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between gap-4 border-b border-zinc-300/40 pb-1.5 text-[10px] font-mono">
                  <span className={`font-bold uppercase ${msg.role === "user" ? "text-zinc-300" : "text-zinc-600"}`}>
                    {msg.role === "user" ? (userDisplayName || "You (Creditor)") : "AR Advisory Engine"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={msg.role === "user" ? "text-zinc-400" : "text-zinc-400"}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.role === "model" && (
                      <button
                        onClick={() => handleCopyContent(msg.content, msg.id)}
                        className="text-zinc-500 hover:text-black cursor-pointer p-0.5"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className={`text-xs leading-relaxed font-sans whitespace-pre-wrap ${msg.role === "user" ? "text-zinc-100" : "text-zinc-900"}`}>
                  {msg.content}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded bg-zinc-200 text-black flex items-center justify-center shrink-0 border border-zinc-400">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center">
              <div className="w-8 h-8 rounded bg-black text-amber-400 flex items-center justify-center shrink-0 border border-black">
                <Bot size={18} />
              </div>
              <div className="bg-zinc-100 border-2 border-black p-4 neo-shadow-sm font-mono text-xs flex items-center gap-3">
                <RefreshCw size={14} className="animate-spin text-black" />
                <span>Formulating Accounts Receivable strategy & compliance check...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t-2 border-black bg-zinc-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about escalation letters, payment plan formulas, dispute mediation, or late fees..."
              disabled={loading}
              className="flex-1 bg-white border-2 border-black p-3 text-xs font-mono text-black focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white px-6 py-3 text-xs font-mono font-bold uppercase flex items-center gap-2 cursor-pointer transition-all border-2 border-black neo-shadow-sm"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400 mt-2">
            <span>Powered by Gemini 3.5 Flash AR Strategy Engine</span>
            <span>Real-time Portfolio Context Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
