import React from "react";
import { AlertOctagon, ArrowLeft, Compass, FileText } from "lucide-react";

interface NotFoundPageProps {
  requestedPath: string;
  onGoHome: () => void;
  onGoInvoices: () => void;
}

export default function NotFoundPage({ requestedPath, onGoHome, onGoInvoices }: NotFoundPageProps) {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="bg-white border-2 border-black neo-shadow p-8 sm:p-14 max-w-2xl mx-auto text-center space-y-6 my-8"
    >
      <div className="w-16 h-16 bg-black text-amber-400 border-2 border-black flex items-center justify-center mx-auto">
        <AlertOctagon size={32} aria-hidden="true" />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-rose-700">
          HTTP 404 · Route Not Found
        </p>
        <h2 id="not-found-heading" className="text-3xl sm:text-4xl font-black tracking-tight text-black">
          Page Not Found
        </h2>
        <p className="text-sm text-zinc-700 max-w-md mx-auto leading-relaxed">
          The requested path{" "}
          <code className="bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 font-mono text-xs text-black">
            {requestedPath}
          </code>{" "}
          does not exist or has been relocated within TrustInvoice.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onGoHome}
          className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase px-6 py-3 min-h-[44px] border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all neo-shadow-sm"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Return to Overview</span>
        </button>

        <button
          type="button"
          onClick={onGoInvoices}
          className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-black font-mono text-xs font-bold uppercase px-5 py-3 min-h-[44px] border-2 border-black flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <FileText size={14} aria-hidden="true" />
          <span>Browse Invoices</span>
        </button>
      </div>

      <div className="pt-4 border-t border-zinc-200 text-xs font-mono text-zinc-600 flex items-center justify-center gap-2">
        <Compass size={14} aria-hidden="true" />
        <span>All cryptographic sessions and records remain intact.</span>
      </div>
    </section>
  );
}
