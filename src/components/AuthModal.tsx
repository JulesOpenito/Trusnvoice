import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AccountRole } from "../types";
import { 
  ShieldCheck, X, Mail, Lock, User, Building2, Phone, 
  KeyRound, ArrowRight, CheckCircle2, AlertTriangle, 
  Sparkles, RefreshCw, Eye, EyeOff, Shield, Briefcase
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  initialRole?: AccountRole;
  targetInvoiceNumber?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "signin",
  initialRole = "client",
  targetInvoiceNumber
}: AuthModalProps) {
  const { 
    user, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    sendPasswordReset, 
    authError, 
    setAuthError 
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [accountRole, setAccountRole] = useState<AccountRole>(initialRole);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxId, setTaxId] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const openedAtRef = React.useRef<number>(Date.now());

  if (!isOpen) return null;

  const resetFormState = () => {
    setAuthError(null);
    setSuccessMessage(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSwitchMode = (newMode: "signin" | "signup" | "forgot") => {
    resetFormState();
    setMode(newMode);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim() !== "") {
      setAuthError("Automated submission rejected.");
      return;
    }
    if (!isValidEmail(email)) {
      setAuthError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithEmail(email.trim(), password);
      onClose();
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim() !== "") {
      setAuthError("Automated registration rejected.");
      return;
    }
    if (Date.now() - openedAtRef.current < 1000) {
      setAuthError("Please verify your registration details before submitting.");
      return;
    }
    if (!displayName.trim() || displayName.trim().length < 2) {
      setAuthError("Full name must be at least 2 characters.");
      return;
    }
    if (!isValidEmail(email)) {
      setAuthError("Please enter a valid corporate or personal email address.");
      return;
    }
    if (password.length < 8) {
      setAuthError("Password must be at least 8 characters for account security.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match. Please verify.");
      return;
    }
    if (!agreedTerms) {
      setAuthError("Please accept the cryptographic verification terms to continue.");
      return;
    }

    setLoading(true);
    setAuthError(null);
    try {
      await signUpWithEmail({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        companyName: companyName.trim() || (accountRole === "client" ? "Client Enterprise" : "Issuer Organization"),
        accountRole,
        phone: phone.trim(),
        taxId: taxId.trim(),
      });
      setSuccessMessage("Account created successfully! Welcome to TrustInvoice.");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim() !== "") {
      setAuthError("Automated submission rejected.");
      return;
    }
    if (!isValidEmail(email)) {
      setAuthError("Please enter a valid registered email address.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    try {
      await sendPasswordReset(email.trim());
      setSuccessMessage("Password reset email sent! Check your inbox for instructions.");
    } catch (err) {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helpers
  const handleFillDemoClient = () => {
    setEmail("client.acme@globalcorp.io");
    setPassword("DemoClient123!");
    setConfirmPassword("DemoClient123!");
    setDisplayName("Sarah Jenkins");
    setCompanyName("Acme Global Holdings Ltd.");
    setAccountRole("client");
    setPhone("+1 (555) 234-8899");
    setTaxId("US-94-3829104");
  };

  const handleFillDemoMerchant = () => {
    setEmail("billing@trustinvoice.internal");
    setPassword("DemoIssuer123!");
    setConfirmPassword("DemoIssuer123!");
    setDisplayName("Alexander Wright");
    setCompanyName("TrustInvoice Capital Group");
    setAccountRole("merchant");
    setPhone("+1 (800) 555-0199");
    setTaxId("US-12-9847120");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white neo-border neo-shadow w-full max-w-lg max-h-[92vh] overflow-y-auto relative text-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="bg-black text-white p-4 flex justify-between items-center border-b-2 border-black sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white text-black font-mono font-black text-xs uppercase flex items-center gap-1">
              <Shield size={14} className="text-black" />
              <span>TRUST // AUTH</span>
            </div>
            {targetInvoiceNumber && (
              <span className="text-[10px] font-mono text-zinc-300 border-l border-zinc-700 pl-2">
                REF: {targetInvoiceNumber}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-white hover:text-rose-400 p-1 cursor-pointer transition-colors"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="grid grid-cols-2 border-b-2 border-black bg-zinc-100 font-mono text-xs font-bold uppercase">
          <button
            type="button"
            onClick={() => handleSwitchMode("signin")}
            className={`py-3 text-center border-r-2 border-black cursor-pointer transition-colors ${
              mode === "signin" 
                ? "bg-white text-black border-b-2 border-b-white -mb-[2px]" 
                : "text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Client Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("signup")}
            className={`py-3 text-center cursor-pointer transition-colors ${
              mode === "signup" 
                ? "bg-white text-black border-b-2 border-b-white -mb-[2px]" 
                : "text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Create Client Account
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Notifications / Alerts */}
          {authError && (
            <div className="bg-rose-50 border-2 border-rose-600 p-3 text-rose-900 flex items-start gap-2 text-xs font-mono">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">AUTHENTICATION ERROR:</span>
                <span>{authError}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border-2 border-emerald-600 p-3 text-emerald-900 flex items-start gap-2 text-xs font-mono">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">SUCCESSFUL VERIFICATION:</span>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {/* MODE: SIGN IN */}
          {mode === "signin" && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
                  Client & Merchant Authentication
                </div>
                <h3 className="text-xl font-black text-black">Sign in to your account</h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Access verified invoices, process cryptographic settlements, and download official receipts.
                </p>
              </div>

              {/* Honeypot anti-spam field */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="auth-honeypot">Website URL</label>
                <input
                  id="auth-honeypot"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Fast Google Auth */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white hover:bg-zinc-50 text-black border-2 border-black py-3 px-4 min-h-[44px] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-zinc-300 flex-1" />
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Or with email</span>
                <div className="h-px bg-zinc-300 flex-1" />
              </div>

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                  <Mail size={12} /> Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@company.com"
                  required
                  className="w-full bg-zinc-50 p-2.5 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <Lock size={12} /> Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("forgot")}
                    className="text-[10px] font-mono underline text-zinc-600 hover:text-black cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-zinc-50 p-2.5 pr-10 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-zinc-800 text-white py-3 border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In & Authorize Session</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              {/* Demo Helper Switcher */}
              <div className="p-3 bg-zinc-50 border border-dashed border-zinc-300 rounded-none mt-3">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">
                  🧪 One-Click Demo Credentials:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleFillDemoClient}
                    className="text-[10px] font-mono bg-white hover:bg-zinc-100 p-1.5 border border-zinc-400 text-left cursor-pointer"
                  >
                    <span className="font-bold block text-black">👤 Demo Client</span>
                    <span className="text-zinc-500 text-[9px] truncate block">client.acme@globalcorp.io</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleFillDemoMerchant}
                    className="text-[10px] font-mono bg-white hover:bg-zinc-100 p-1.5 border border-zinc-400 text-left cursor-pointer"
                  >
                    <span className="font-bold block text-black">🏢 Demo Merchant</span>
                    <span className="text-zinc-500 text-[9px] truncate block">billing@trustinvoice.internal</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* MODE: SIGN UP / CREATE ACCOUNT */}
          {mode === "signup" && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
                  New Identity Registration
                </div>
                <h3 className="text-xl font-black text-black">Create Client or Merchant Account</h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Generate your secure cryptographic profile with zero setup fees.
                </p>
              </div>

              {/* Role Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold uppercase text-zinc-700 block">
                  Select Account Role *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountRole("client")}
                    className={`p-3 border-2 text-left cursor-pointer transition-all flex flex-col gap-1 ${
                      accountRole === "client"
                        ? "border-black bg-black text-white"
                        : "border-zinc-300 bg-zinc-50 hover:bg-white text-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <User size={14} />
                      <span>Client / Customer</span>
                    </div>
                    <span className={`text-[10px] font-mono leading-tight ${
                      accountRole === "client" ? "text-zinc-300" : "text-zinc-500"
                    }`}>
                      Pay invoices, track settlements, download receipts & pay stubs.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountRole("merchant")}
                    className={`p-3 border-2 text-left cursor-pointer transition-all flex flex-col gap-1 ${
                      accountRole === "merchant"
                        ? "border-black bg-black text-white"
                        : "border-zinc-300 bg-zinc-50 hover:bg-white text-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <Building2 size={14} />
                      <span>Merchant / Issuer</span>
                    </div>
                    <span className={`text-[10px] font-mono leading-tight ${
                      accountRole === "merchant" ? "text-zinc-300" : "text-zinc-500"
                    }`}>
                      Issue invoices, dispatch AI reminders & e-file IRS tax schedules.
                    </span>
                  </button>
                </div>
              </div>

              {/* Name & Company */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <User size={12} /> Full Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    required
                    className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <Building2 size={12} /> Company / Org Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={accountRole === "client" ? "e.g. Acme Holdings LLC" : "e.g. TrustInvoice Studio"}
                    className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                  <Mail size={12} /> Corporate / Client Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@company.com"
                  required
                  className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Optional Phone & Tax ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <Phone size={12} /> Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <KeyRound size={12} /> Tax ID / EIN (Optional)
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="XX-XXXXXXX"
                    className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <Lock size={12} /> Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    required
                    className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                    <Lock size={12} /> Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full bg-zinc-50 p-2 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-xs font-mono text-zinc-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 accent-black"
                />
                <span className="text-[11px] leading-snug">
                  I agree to cryptographic session sealing, anti-fraud audit logging, and terms of service.
                </span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-zinc-800 text-white py-3 border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Provisioning Account...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Create & Register {accountRole === "client" ? "Client" : "Merchant"} Account</span>
                  </>
                )}
              </button>

              {/* Quick Google Alternative */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="text-xs font-mono underline text-zinc-600 hover:text-black cursor-pointer"
                >
                  Or sign up with 1-click Google Authorization
                </button>
              </div>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-1">
                  Credential Recovery
                </div>
                <h3 className="text-xl font-black text-black">Reset Account Password</h3>
                <p className="text-xs text-zinc-600 mt-1">
                  Enter your registered account email and we'll send you a secure cryptographic reset link.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold uppercase text-zinc-700 flex items-center gap-1">
                  <Mail size={12} /> Registered Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-zinc-50 p-2.5 text-xs font-mono border-2 border-black focus:bg-white focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-zinc-800 text-white py-3 border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Dispatching Reset Link...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signin")}
                  className="text-xs font-mono underline text-zinc-600 hover:text-black cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
