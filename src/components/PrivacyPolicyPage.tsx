import React from "react";
import { ShieldCheck, Lock, Database, Globe, Cookie, Mail, ArrowLeft } from "lucide-react";

interface PrivacyPolicyPageProps {
  onBack: () => void;
  onOpenCookieSettings: () => void;
}

export default function PrivacyPolicyPage({ onBack, onOpenCookieSettings }: PrivacyPolicyPageProps) {
  return (
    <article className="bg-white border-2 border-black neo-shadow p-6 sm:p-10 max-w-4xl mx-auto space-y-8 text-black">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700 block">
            Legal &amp; Compliance Documentation
          </span>
          <h2 className="text-3xl font-black tracking-tight mt-1">Privacy Policy</h2>
          <p className="text-xs font-mono text-zinc-600 mt-1">
            Effective Date: November 15, 2026 · TrustInvoice AI Group Inc.
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
          <ShieldCheck size={18} className="text-emerald-700" aria-hidden="true" />
          <span>1. Information We Collect</span>
        </h3>
        <p>
          TrustInvoice collects only the information necessary to provide cryptographically sealed invoicing, pay stub generation, verified receipts, IRS Schedule C preparation, and Accounts Receivable security monitoring:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-zinc-700">
          <li>
            <strong>Account &amp; Entity Identity:</strong> Name, business email address, company name, optional phone number, and tax identifier (EIN/TIN) provided during registration or Google OAuth sign-in.
          </li>
          <li>
            <strong>Financial &amp; Document Records:</strong> Invoice line items, settlement amounts, bank routing descriptors, pay stubs, receipts, and tax deduction entries stored securely under your Cloud Firestore account.
          </li>
          <li>
            <strong>Security Audit Telemetry:</strong> Timestamped view events and verification flags recorded strictly to detect unauthorized wire-routing tampering.
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <Lock size={18} className="text-black" aria-hidden="true" />
          <span>2. How We Use &amp; Protect Your Data</span>
        </h3>
        <p>
          All traffic is encrypted in transit via HTTPS (TLS) with HTTP Strict Transport Security (HSTS). Server-side AI features (payment reminder drafting, invoice parsing, fraud risk scoring, and tax advisory) process prompts through authenticated backend API proxies—no secret AI API keys are ever exposed in client-side code.
        </p>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <Cookie size={18} className="text-amber-700" aria-hidden="true" />
          <span>3. Cookies &amp; Audience Measurement</span>
        </h3>
        <p>
          We distinguish strictly essential session cookies (required for Firebase authentication and CSRF/anti-spam integrity) from optional audience measurement analytics. Analytics only activates when you explicitly opt in via our Cookie Consent Banner, and honors browser Do-Not-Track (DNT) signals.
        </p>
        <button
          type="button"
          onClick={onOpenCookieSettings}
          className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-black border-2 border-black px-4 py-2 min-h-[40px] font-mono text-xs font-bold uppercase cursor-pointer transition-colors"
        >
          <Cookie size={14} aria-hidden="true" />
          <span>Manage Cookie Preferences</span>
        </button>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <Database size={18} className="text-black" aria-hidden="true" />
          <span>4. Data Retention &amp; Your Rights (GDPR / CCPA)</span>
        </h3>
        <p>
          You retain full ownership of your invoices, pay stubs, receipts, and tax filings. You may inspect, export, update, or request deletion of your profile and stored records at any time through your Account Hub or by contacting our privacy desk. We do not sell personal or financial data to third parties.
        </p>
      </section>

      <section className="space-y-3 text-sm text-zinc-800 leading-relaxed border-t-2 border-black pt-6">
        <h3 className="text-base font-extrabold uppercase font-mono flex items-center gap-2 text-black">
          <Globe size={18} className="text-black" aria-hidden="true" />
          <span>5. Privacy Contact</span>
        </h3>
        <p className="flex flex-wrap items-center gap-2">
          <span>For privacy inquiries or data deletion requests, contact our Data Protection Officer at</span>
          <a
            href="mailto:privacy@trustinvoice.dev"
            className="inline-flex items-center gap-1.5 font-mono font-bold text-black underline hover:text-emerald-700"
          >
            <Mail size={14} aria-hidden="true" />
            <span>privacy@trustinvoice.dev</span>
          </a>
        </p>
      </section>
    </article>
  );
}
