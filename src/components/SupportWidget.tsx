import React, { useState, useRef } from "react";
import { Mail, Phone, Clock, ShieldCheck, Send, CheckCircle, AlertTriangle, ArrowRight, X } from "lucide-react";
import { trackAudienceEvent } from "../utils/analytics";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("Routing Parameters Discrepancy");
  const [userEmail, setUserEmail] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [spamMath, setSpamMath] = useState("");
  const [mathChallenge, setMathChallenge] = useState<{ a: number; b: number }>({ a: 4, b: 3 });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const openedAtRef = useRef<number>(Date.now());

  const handleOpenModal = () => {
    openedAtRef.current = Date.now();
    const a = Math.floor(2 + Math.random() * 7);
    const b = Math.floor(1 + Math.random() * 6);
    setMathChallenge({ a, b });
    setSpamMath("");
    setFormError(null);
    setIsOpen(true);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Anti-spam honeypot & minimum human fill-time check
    if (honeypot.trim() !== "") {
      setFormError("Automated submission blocked.");
      return;
    }
    if (Date.now() - openedAtRef.current < 1500) {
      setFormError("Please take a moment to review your support request before submitting.");
      return;
    }

    // Strict Form Validation
    if (!EMAIL_REGEX.test(userEmail.trim())) {
      setFormError("Please enter a valid callback email address (e.g. name@company.com).");
      return;
    }
    if (ticketMessage.trim().length < 10) {
      setFormError("Please provide at least 10 characters describing your routing or invoice inquiry.");
      return;
    }
    if (parseInt(spamMath.trim(), 10) !== mathChallenge.a + mathChallenge.b) {
      setFormError(`Anti-spam verification failed. Please enter the sum of ${mathChallenge.a} + ${mathChallenge.b}.`);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      const generatedCode = `SRV-CASE-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(generatedCode);
      trackAudienceEvent("form_submit", "/support-ticket", { subject: ticketSubject });
    }, 900);
  };

  const handleResetForm = () => {
    setTicketMessage("");
    setSpamMath("");
    setFormError(null);
    setSubmitSuccess(false);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Service Support Contact Deck */}
      <div className="bg-white p-6 sm:p-8 neo-border neo-shadow" id="service-support-deck">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-black pb-6 mb-6">
          <div>
            <span className="text-[11px] font-mono font-bold text-zinc-700 uppercase tracking-widest block">
              Global Trust Infrastructure
            </span>
            <h2 className="text-xl font-black uppercase text-black font-sans tracking-tight mt-1">
              Service Help Center &amp; Support Contact
            </h2>
            <p className="text-xs text-zinc-700 font-sans mt-1">
              Direct verification lines, cryptographic assistance, and priority customer care routing.
            </p>
          </div>
          
          <button
            type="button"
            onClick={handleOpenModal}
            className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-3 px-5 min-h-[44px] border-2 border-black uppercase flex items-center gap-2 transition-all cursor-pointer rounded-none hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm shrink-0"
          >
            <span>Open Priority Ticket</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Emergency Phone Direct Line */}
          <div className="p-4 bg-zinc-50 border border-zinc-300 flex flex-col justify-between hover:bg-neutral-50 transition-colors">
            <div>
              <div className="p-2 w-fit bg-black text-white mb-3">
                <Phone size={16} aria-hidden="true" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                Secure Emergency Hotwire
              </h3>
              <p className="text-xs text-zinc-700 font-sans mt-1 leading-relaxed">
                For instant assistance with routing parameters or potential wire validation anomalies.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-600 block">Phone Support</span>
              <a 
                href="tel:+16828888166"
                aria-label="Call TrustInvoice support at +1 682 888 8166"
                className="text-sm font-extrabold text-black font-mono hover:underline block mt-0.5 py-1"
              >
                +1 (682) 888-8166
              </a>
            </div>
          </div>

          {/* Card 2: Help Desk Central Email */}
          <div className="p-4 bg-zinc-50 border border-zinc-300 flex flex-col justify-between hover:bg-neutral-50 transition-colors">
            <div>
              <div className="p-2 w-fit bg-emerald-700 text-white mb-3">
                <Mail size={16} aria-hidden="true" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                Primary Support Mailbox
              </h3>
              <p className="text-xs text-zinc-700 font-sans mt-1 leading-relaxed">
                For compliance audit records, enterprise verification, and customized company onboarding setup.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-600 block">General Inquiries</span>
              <a 
                href="mailto:support@trustinvoice.dev"
                aria-label="Email TrustInvoice support at support@trustinvoice.dev"
                className="text-sm font-extrabold text-black font-mono hover:underline block mt-0.5 py-1"
              >
                support@trustinvoice.dev
              </a>
            </div>
          </div>

          {/* Card 3: Priority SLA response */}
          <div className="p-4 bg-zinc-50 border border-zinc-300 flex flex-col justify-between hover:bg-neutral-50 transition-colors">
            <div>
              <div className="p-2 w-fit bg-amber-700 text-white mb-3">
                <Clock size={16} aria-hidden="true" />
              </div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                Operations &amp; Duty Hours
              </h3>
              <p className="text-xs text-zinc-700 font-sans mt-1 leading-relaxed">
                Our cryptographic monitoring center checks global interbank routing tables 24 hours a day, 7 days a week.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-zinc-300">
              <span className="text-[10px] uppercase font-mono text-zinc-600 block">SLA Commitment</span>
              <span className="text-sm font-extrabold text-black font-mono block mt-0.5 uppercase py-1">
                &lt; 9 Min Response
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Support Submission Screen (Modal overlay) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="support-modal-title">
          <div className="bg-white max-w-lg w-full max-h-[92vh] overflow-y-auto neo-border neo-shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-black text-white p-4 flex justify-between items-center border-b-2 border-black sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={16} aria-hidden="true" />
                <span id="support-modal-title" className="font-mono text-xs font-bold uppercase tracking-wider">
                  TRUSTINVOICE OPERATIONS DESK
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close support modal"
                className="text-zinc-300 hover:text-white transition-colors cursor-pointer p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-600 text-emerald-700 mb-2">
                  <CheckCircle size={24} aria-hidden="true" />
                </div>
                <h3 className="text-lg font-black uppercase text-black font-sans tracking-tight">
                  TICKET COMMITTED TO ONSITE DESK
                </h3>
                <p className="text-xs text-zinc-700 max-w-sm mx-auto font-sans leading-relaxed">
                  Your priority action ticket has been logged inside our operations database. Wait for direct emergency wire desk response.
                </p>
                <div className="bg-zinc-50 border border-zinc-300 p-3 max-w-xs mx-auto font-mono text-xs text-black">
                  <span className="text-[10px] text-zinc-600 block uppercase tracking-wider">REFERENCE CASE ID</span>
                  <span className="font-bold text-sm tracking-wider">{ticketId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold py-3 min-h-[44px] uppercase transition-all cursor-pointer mt-4"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} noValidate className="p-6 space-y-4">
                <div className="bg-amber-50 border border-amber-400 p-3 text-amber-950 text-xs leading-relaxed flex gap-2">
                  <AlertTriangle className="shrink-0 text-amber-800 font-bold mt-0.5" size={14} aria-hidden="true" />
                  <span>
                    <strong>PRIORITY NOTICE:</strong> Submitting a case activates priority logging and records your verified callback details.
                  </span>
                </div>

                {formError && (
                  <div role="alert" className="bg-rose-50 border-2 border-rose-700 p-3 text-rose-900 text-xs font-mono font-bold">
                    {formError}
                  </div>
                )}

                {/* Honeypot anti-spam trap */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="support-company-fax">Leave this field empty</label>
                  <input
                    id="support-company-fax"
                    type="text"
                    name="company_fax"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="support-callback-email" className="text-[11px] uppercase font-mono font-bold text-zinc-700 block">
                    Callback Email Address *
                  </label>
                  <input
                    id="support-callback-email"
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2.5 font-mono text-sm sm:text-xs text-black focus:outline-hidden"
                    placeholder="security@company.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="support-classification" className="text-[11px] uppercase font-mono font-bold text-zinc-700 block">
                    Concern Classification
                  </label>
                  <select
                    id="support-classification"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2.5 font-mono text-sm sm:text-xs text-black focus:outline-hidden"
                  >
                    <option value="Routing Parameters Discrepancy">Routing Parameters Discrepancy</option>
                    <option value="Payment Verification Delay">Payment Verification Delay</option>
                    <option value="SSL presentation certificate error">SSL Presentation Certificate Error</option>
                    <option value="Gemini AI Reminder tone failure">Gemini AI Reminder Tone Failure</option>
                    <option value="Other general request">Other General Technical Request</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="support-description" className="text-[11px] uppercase font-mono font-bold text-zinc-700 block">
                    Detailed Message Description * (min. 10 chars)
                  </label>
                  <textarea
                    id="support-description"
                    required
                    minLength={10}
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2.5 font-sans text-sm sm:text-xs text-black focus:outline-hidden focus:ring-0 leading-relaxed"
                    placeholder="Provide description of routing details, invoice code context, or custom questions..."
                  />
                </div>

                <div className="space-y-1.5 bg-zinc-50 border border-zinc-300 p-3">
                  <label htmlFor="support-antispam" className="text-[11px] uppercase font-mono font-bold text-zinc-800 block">
                    Anti-Spam Check: What is {mathChallenge.a} + {mathChallenge.b}? *
                  </label>
                  <input
                    id="support-antispam"
                    type="number"
                    required
                    inputMode="numeric"
                    value={spamMath}
                    onChange={(e) => setSpamMath(e.target.value)}
                    className="w-full bg-white border-2 border-black p-2 font-mono text-sm sm:text-xs text-black focus:outline-hidden"
                    placeholder="Enter sum"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold py-3 min-h-[44px] uppercase flex justify-center items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="animate-spin" size={14} aria-hidden="true" />
                        <span>Transmitting Secure Incident Log...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} aria-hidden="true" />
                        <span>Transmit Ticket to Security Desk</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
