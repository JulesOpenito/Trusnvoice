import React from "react";
import { FileText, ShieldAlert, Scale, CheckCircle2, ArrowLeft, Mail } from "lucide-react";

interface TermsPageProps {
  onBack: () => void;
  onNavigatePrivacy: () => void;
}

export default function TermsPage({ onBack, onNavigatePrivacy }: TermsPageProps) {
  return (
    <article className="bg-white border-2 border-black neo-shadow p-6 sm:p-10 max-w-4xl mx-auto space-y-8 text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600 block">
            Service Agreement &amp; Disclosures
          </span>
          <h2 className="text-3xl font-black tracking-tight mt-1">Terms &amp; Conditions</h2>
          <p className="text-xs font-mono text-zinc-600 mt-1">
            Last Updated: November 15, 2026 · TrustInvoice AI Group Inc.
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase px-4 py-2.5 min-h-[44px] flex items-center gap-2 cursor-pointer transition-colors self-start"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Back to Overview</span>
        </button>
      </div>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <FileText size={18} aria-hidden="true" />
          <span>1. Acceptance of Terms</span>
        </h3>
        <p>
          By accessing or using TrustInvoice (&ldquo;the Service&rdquo;), including invoice creation, pay stub generation, receipt downloads, client portal verification, and tax schedule preparation, you agree to be bound by these Terms &amp; Conditions and our{" "}
          <a
            href="/privacy"
            onClick={(e) => {
              e.preventDefault();
              onNavigatePrivacy();
            }}
            className="font-bold underline text-black hover:text-emerald-700"
          >
            Privacy Policy
          </a>.
        </p>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <CheckCircle2 size={18} className="text-emerald-700" aria-hidden="true" />
          <span>2. Cryptographic Seals &amp; Payment Verification</span>
        </h3>
        <p>
          TrustInvoice provides cryptographic hash sealing and anti-fraud risk indicators to help detect invoice tampering and wire-routing discrepancies. Merchants and clients remain solely responsible for independently confirming bank routing numbers prior to initiating high-value ACH or Fedwire transfers.
        </p>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <ShieldAlert size={18} className="text-amber-700" aria-hidden="true" />
          <span>3. Tax Preparation &amp; AI Advisory Disclaimer</span>
        </h3>
        <p>
          IRS Form 1040 Schedule C / 1120-S worksheets, deduction analyses, and Accounts Receivable advisor drafts are provided as automated operational tools and educational guidance. They do not constitute licensed CPA, tax attorney, or formal legal advice. Always review tax filings with a certified professional prior to statutory submission.
        </p>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <Scale size={18} aria-hidden="true" />
          <span>4. Acceptable Use, Anti-Spam &amp; Limitation of Liability</span>
        </h3>
        <p>
          You agree not to submit fraudulent invoices, automated spam requests, or attempt to bypass rate limits or security controls. To the maximum extent permitted by applicable law, TrustInvoice AI Group Inc. shall not be liable for indirect, incidental, or consequential damages resulting from unauthorized third-party wire interception or inaccurate user-supplied financial data.
        </p>
      </section>

      <section className="space-y-2 text-sm text-zinc-800 border-t-2 border-black pt-6">
        <p className="flex flex-wrap items-center gap-2">
          <span>Questions regarding these terms may be sent to</span>
          <a
            href="mailto:legal@trustinvoice.dev"
            className="inline-flex items-center gap-1.5 font-mono font-bold text-black underline hover:text-emerald-700"
          >
            <Mail size={14} aria-hidden="true" />
            <span>legal@trustinvoice.dev</span>
          </a>
        </p>
      </section>
    </article>
  );
}
