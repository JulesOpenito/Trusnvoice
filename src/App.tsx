import React, { useState, useEffect, Suspense, lazy } from "react";
import { initialInvoices } from "./data/mockInvoices";
import { Invoice, DocumentFormat, AccountRole } from "./types";
import DashboardStats from "./components/DashboardStats";
import InvoiceStatusDistribution from "./components/InvoiceStatusDistribution";
import SupportWidget from "./components/SupportWidget";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { useAuth } from "./context/AuthContext";
import {
  saveInvoiceToFirestore,
  seedInitialInvoicesIfEmpty,
  subscribeToUserInvoices,
} from "./services/firestoreService";
import {
  getStoredCookieConsent,
  initOptionalGA4,
  trackAudienceEvent,
} from "./utils/analytics";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Compass, HardDrive, Landmark, Smartphone, Terminal, Eye,
  AlertOctagon, Shield, FilePlus, Sparkles, LogIn, LogOut, Bot, User, UserPlus
} from "lucide-react";

// Lazy-loaded secondary views for fast initial bundle load
const InvoiceList = lazy(() => import("./components/InvoiceList"));
const InvoiceForm = lazy(() => import("./components/InvoiceForm"));
const AIPerformanceSuite = lazy(() => import("./components/AIPerformanceSuite"));
const SecurityScanner = lazy(() => import("./components/SecurityScanner"));
const ClientPortal = lazy(() => import("./components/ClientPortal"));
const TaxReturnSuite = lazy(() => import("./components/TaxReturnSuite"));
const ARAdvisorChat = lazy(() => import("./components/ARAdvisorChat"));
const ClientAccountDashboard = lazy(() => import("./components/ClientAccountDashboard"));
const AuthModal = lazy(() => import("./components/AuthModal"));
const PrivacyPolicyPage = lazy(() => import("./components/PrivacyPolicyPage"));
const TermsPage = lazy(() => import("./components/TermsPage"));
const NotFoundPage = lazy(() => import("./components/NotFoundPage"));

const TAB_TO_PATH: Record<string, string> = {
  dashboard: "/",
  invoices: "/invoices",
  advisor: "/advisor",
  tax: "/tax",
  create: "/create",
  ai: "/ai",
  scanner: "/scanner",
  portal: "/portal",
  client_account: "/account",
  privacy: "/privacy",
  terms: "/terms",
};

const PATH_TO_TAB: Record<string, string> = {
  "/": "dashboard",
  "/dashboard": "dashboard",
  "/invoices": "invoices",
  "/advisor": "advisor",
  "/tax": "tax",
  "/create": "create",
  "/ai": "ai",
  "/scanner": "scanner",
  "/portal": "portal",
  "/account": "client_account",
  "/privacy": "privacy",
  "/terms": "terms",
};

const TAB_META: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: "TrustInvoice – Cryptographic Invoicing & Tax Suite",
    description:
      "Create cryptographically sealed invoices, verify wire routing, issue pay stubs and receipts, and e-file IRS Schedule C returns securely.",
  },
  invoices: {
    title: "Invoice Registries – TrustInvoice",
    description:
      "Manage sent, paid, and overdue invoices with cryptographic hash seals and instant receipt or pay stub exports.",
  },
  advisor: {
    title: "AI AR Advisor – TrustInvoice",
    description:
      "Resolve Accounts Receivable disputes, structure prompt-payment terms, and draft professional collection notices.",
  },
  tax: {
    title: "Tax Return & E-File – TrustInvoice",
    description:
      "Prepare IRS Form 1040 Schedule C and Form 1120-S worksheets, audit deductions, and validate 1099-NEC filings.",
  },
  create: {
    title: "Register New Invoice – TrustInvoice",
    description:
      "Issue a cryptographically sealed invoice with voice dictation, automated line-item parsing, and wire routing locks.",
  },
  ai: {
    title: "AI Performance Suite – TrustInvoice",
    description:
      "Automate payment reminders, parse unstructured billing notes, and audit receivable risk across your portfolio.",
  },
  scanner: {
    title: "Anti-Fraud Scanner – TrustInvoice",
    description:
      "Scan incoming invoice text and bank routing parameters to detect wire spoofing and phishing risk.",
  },
  portal: {
    title: "Client Payment Portal – TrustInvoice",
    description:
      "Inspect verified invoices, download cryptographic receipts and contractor pay stubs, and settle balances.",
  },
  client_account: {
    title: "Client & Account Hub – TrustInvoice",
    description:
      "Sign in to manage company billing details, review payment histories, and download verified tax receipts.",
  },
  privacy: {
    title: "Privacy Policy – TrustInvoice",
    description:
      "Learn how TrustInvoice protects your invoicing records, Firestore credentials, cookie choices, and privacy rights.",
  },
  terms: {
    title: "Terms & Conditions – TrustInvoice",
    description:
      "Review TrustInvoice service terms, cryptographic verification disclosures, tax guidance disclaimers, and acceptable use rules.",
  },
  not_found: {
    title: "404 Page Not Found – TrustInvoice",
    description:
      "The requested TrustInvoice page could not be found. Return to the main invoicing and tax overview.",
  },
};

function resolveTabFromPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return PATH_TO_TAB[normalized] || "not_found";
}

function LazyPanelFallback() {
  return (
    <div className="bg-white border-2 border-black neo-shadow p-12 text-center font-mono text-xs text-zinc-700">
      Loading module...
    </div>
  );
}

export default function App() {
  const { user, userProfile, logout, authError } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [activeTab, setActiveTab] = useState<string>(() =>
    typeof window !== "undefined" ? resolveTabFromPath(window.location.pathname) : "dashboard"
  );
  const [requestedPath, setRequestedPath] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(initialInvoices[0] || null);
  const [selectedDocFormat, setSelectedDocFormat] = useState<DocumentFormat>("invoice");
  const [isSyncing, setIsSyncing] = useState(false);

  // Auth modal controls
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [authModalRole, setAuthModalRole] = useState<AccountRole>("client");

  // Cookie consent banner state
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return getStoredCookieConsent() === null;
  });
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return Boolean(getStoredCookieConsent()?.analytics);
  });

  // Enforce HTTPS on live non-localhost origins if loaded over HTTP
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "http:" &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      window.location.replace(window.location.href.replace(/^http:/, "https:"));
    }
  }, []);

  // Initialize audience measurement if consent was already granted
  useEffect(() => {
    if (analyticsConsent) {
      initOptionalGA4();
    }
  }, [analyticsConsent]);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setRequestedPath(path);
      setActiveTab(resolveTabFromPath(path));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Update SEO document title, meta description, and track consent-gated pageview
  useEffect(() => {
    const meta = TAB_META[activeTab] || TAB_META.dashboard;
    document.title = meta.title;
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute("content", meta.description);
    }

    const currentPath = TAB_TO_PATH[activeTab] || requestedPath || "/";
    trackAudienceEvent("page_view", currentPath, { tab: activeTab });
  }, [activeTab, requestedPath]);

  const handleOpenAuthModal = (mode: "signin" | "signup" = "signin", role: AccountRole = "client") => {
    setAuthModalMode(mode);
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (user) {
      setIsSyncing(true);
      seedInitialInvoicesIfEmpty(user.uid, initialInvoices).then((loaded) => {
        if (loaded && loaded.length > 0) {
          setInvoices(loaded);
          if (!selectedInvoice) setSelectedInvoice(loaded[0]);
        }
        setIsSyncing(false);
      });

      const unsubscribe = subscribeToUserInvoices(user.uid, (updatedInvoices) => {
        setInvoices(updatedInvoices);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Callback to add new invoice
  const handleAddInvoice = async (newInvoice: Invoice) => {
    setInvoices([newInvoice, ...invoices]);
    if (user) {
      try {
        await saveInvoiceToFirestore(user.uid, newInvoice);
      } catch (err) {
        console.warn("Firestore save error:", err);
      }
    }
  };

  // Callback to update an existing invoice
  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    setInvoices(invoices.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));
    if (selectedInvoice && selectedInvoice.id === updatedInvoice.id) {
      setSelectedInvoice(updatedInvoice);
    }
    if (user) {
      try {
        await saveInvoiceToFirestore(user.uid, updatedInvoice);
      } catch (err) {
        console.warn("Firestore update error:", err);
      }
    }
  };

  // Intertab navigation with URL synchronization
  const handleNavigateToTab = (tabName: string, specInvoice?: Invoice, format?: DocumentFormat) => {
    if (specInvoice) {
      setSelectedInvoice(specInvoice);
    }
    if (format) {
      setSelectedDocFormat(format);
    }
    const targetPath = TAB_TO_PATH[tabName] || "/";
    if (typeof window !== "undefined" && window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
    setRequestedPath(targetPath);
    setActiveTab(tabName);
  };

  const navTabs = [
    { id: "dashboard", label: "Overview Panel", icon: Compass },
    { id: "invoices", label: "Invoice Registries", icon: HardDrive },
    { id: "advisor", label: "AI AR Advisor", icon: Bot },
    { id: "tax", label: "Tax Return & E-File", icon: Landmark },
    { id: "ai", label: "AI Performance Suite", icon: Sparkles },
    { id: "scanner", label: "Anti-Fraud Scanner", icon: AlertOctagon },
    { id: "portal", label: "Client Payment Portal", icon: Eye },
    {
      id: "client_account",
      label: userProfile?.accountRole === "client" ? "My Client Account" : "Client & Account Hub",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F5F5] text-black font-sans antialiased selection:bg-black selection:text-white">
      {/* Top Banner / Navigation */}
      <header className="bg-black text-white p-4 sticky top-0 z-50 border-b-2 border-black flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNavigateToTab("dashboard");
            }}
            className="p-1.5 px-2.5 bg-white text-black font-black uppercase text-sm font-mono border-2 border-white flex items-center gap-1.5 hover:scale-105 transition-all"
          >
            <Shield className="text-black shrink-0" size={16} aria-hidden="true" />
            <span>TRUSTINVOICE // AI</span>
          </a>
          <span className="text-[11px] bg-zinc-900 border border-zinc-700 text-amber-300 font-mono py-0.5 px-2 font-bold tracking-widest uppercase rounded">
            v2.0 Cloud Core
          </span>
        </div>

        {/* User context & Firebase Auth Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 font-mono text-xs">
          {user ? (
            <div className="flex flex-wrap items-center gap-2 bg-zinc-900 px-3 py-1.5 border border-zinc-700 rounded">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={`${userProfile?.displayName || user.displayName || "Authenticated user"} profile avatar`}
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                  className="w-6 h-6 rounded-full border border-emerald-400"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold text-xs">
                  {userProfile?.displayName?.[0] || user.displayName?.[0] || user.email?.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold truncate max-w-[130px] text-[11px]">
                    {userProfile?.displayName || user.displayName || user.email}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded ${
                      userProfile?.accountRole === "client"
                        ? "bg-emerald-400 text-black"
                        : "bg-blue-300 text-black"
                    }`}
                  >
                    {userProfile?.accountRole === "client" ? "Client" : "Merchant"}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-300 truncate max-w-[140px]">
                  {userProfile?.companyName || "TrustInvoice Account"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleNavigateToTab("client_account")}
                title="Open Client Account Dashboard"
                className="ml-1 text-black bg-white hover:bg-zinc-200 px-2.5 py-1.5 min-h-[36px] rounded font-bold transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <User size={12} aria-hidden="true" />
                <span>My Account</span>
              </button>
              <button
                type="button"
                onClick={logout}
                title="Sign out of Firebase"
                className="text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 min-h-[36px] rounded transition-all cursor-pointer flex items-center gap-1 text-[11px]"
              >
                <LogOut size={12} aria-hidden="true" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAuthModal("signin", "client")}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold px-3.5 py-2 min-h-[40px] rounded flex items-center gap-1.5 transition-all cursor-pointer border border-zinc-600 text-[11px]"
              >
                <LogIn size={13} className="text-amber-300" aria-hidden="true" />
                <span>Client Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAuthModal("signup", "client")}
                className="bg-white hover:bg-zinc-200 text-black font-bold px-3.5 py-2 min-h-[40px] rounded flex items-center gap-1.5 transition-all cursor-pointer border border-white neo-shadow-sm text-[11px]"
              >
                <UserPlus size={13} aria-hidden="true" />
                <span>Create Account</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Auth Notice if Error */}
      {authError && (
        <div role="alert" className="bg-red-700 text-white text-xs font-mono py-2 px-4 text-center">
          Authentication Notice: {authError}
        </div>
      )}

      {/* Hero Header Context line with a single, clear Call to Action */}
      <div className="bg-white border-b-2 border-black p-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-xs font-mono font-bold tracking-wider text-neutral-700 uppercase">
              Secure AI Invoice Collection, Dispute Mediation &amp; Cloud Persistence
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter mt-1 text-black">
              TrustInvoice AI
            </h1>
            <p className="text-sm text-neutral-700 font-sans max-w-2xl mt-1.5 leading-relaxed">
              Cryptographically sealed invoicing, pay stubs, verified receipts, IRS Schedule C e-filing, and Accounts Receivable dispute mediation.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                trackAudienceEvent("cta_click", "/create", { cta: "register_invoice_hero" });
                handleNavigateToTab("create");
              }}
              className="w-full md:w-auto bg-black hover:bg-neutral-800 text-white font-mono text-xs font-bold py-3.5 px-6 min-h-[44px] border-2 border-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer hover:translate-x-0.5 hover:-translate-y-0.5 neo-shadow-sm"
            >
              <FilePlus size={15} aria-hidden="true" />
              <span>Register New Invoice</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Navigation Tab selection menus */}
        <nav aria-label="Primary application sections" className="flex overflow-x-auto border-2 border-black bg-white select-none whitespace-nowrap scrollbar-none">
          {navTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleNavigateToTab(tab.id)}
                aria-current={isSelected ? "page" : undefined}
                className={`flex-1 flex items-center justify-center gap-2 font-mono text-xs font-bold uppercase py-3.5 px-4 min-h-[44px] border-r-2 last:border-r-0 border-black transition-all cursor-pointer ${
                  isSelected ? "bg-black text-white" : "bg-white text-zinc-700 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <IconComponent size={14} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dynamic Tab Switchboard container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Statistics Cards widgets */}
                <DashboardStats invoices={invoices} onTabChange={handleNavigateToTab} />

                {/* Visual Progress Bar & Status Distribution Pie Chart */}
                <InvoiceStatusDistribution
                  invoices={invoices}
                  onNavigateToTab={handleNavigateToTab}
                />

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: SaaS capabilities overview & Visual Analytics */}
                  <div className="lg:col-span-8 bg-white p-6 neo-border neo-shadow space-y-8">
                    {/* Visual Analytics Custom SVG Chart */}
                    <div>
                      <h2 className="text-xs font-mono font-bold text-neutral-700 uppercase tracking-widest mb-4">
                        Remittance Volume &amp; Cleared Accounts (6-Month Flow)
                      </h2>
                      <div className="border border-neutral-300 p-4 bg-neutral-50 h-[240px] flex flex-col justify-between">
                        <svg
                          className="w-full h-full"
                          viewBox="0 0 700 160"
                          role="img"
                          aria-label="6-month remittance volume bar chart: January $4K, February $6.5K, March $8.2K, April $4.8K, May $12.5K, June projected $14.8K"
                        >
                          <title>Remittance Volume and Cleared Accounts 6-Month Bar Chart</title>
                          {/* Grid Lines */}
                          <line x1="40" y1="20" x2="680" y2="20" stroke="#D4D4D4" strokeDasharray="3,3" />
                          <line x1="40" y1="60" x2="680" y2="60" stroke="#D4D4D4" strokeDasharray="3,3" />
                          <line x1="40" y1="100" x2="680" y2="100" stroke="#D4D4D4" strokeDasharray="3,3" />
                          <line x1="40" y1="140" x2="680" y2="140" stroke="#111111" strokeWidth="1.5" />

                          {/* Data Bars */}
                          <rect x="80" y="100" width="35" height="40" fill="#E5E5E5" stroke="#111111" strokeWidth="2" />
                          <rect x="180" y="75" width="35" height="65" fill="#E5E5E5" stroke="#111111" strokeWidth="2" />
                          <rect x="280" y="58" width="35" height="82" fill="#E5E5E5" stroke="#111111" strokeWidth="2" />
                          <rect x="380" y="92" width="35" height="48" fill="#E5E5E5" stroke="#111111" strokeWidth="2" />
                          <rect x="480" y="15" width="35" height="125" fill="#111111" stroke="#111111" strokeWidth="2" />
                          <rect x="580" y="5" width="35" height="135" fill="#34D399" stroke="#111111" strokeWidth="2" />

                          {/* Labels */}
                          <text x="97" y="155" fill="#3F3F46" fontSize="9" fontFamily="monospace" textAnchor="middle">JAN</text>
                          <text x="197" y="155" fill="#3F3F46" fontSize="9" fontFamily="monospace" textAnchor="middle">FEB</text>
                          <text x="297" y="155" fill="#3F3F46" fontSize="9" fontFamily="monospace" textAnchor="middle">MAR</text>
                          <text x="397" y="155" fill="#3F3F46" fontSize="9" fontFamily="monospace" textAnchor="middle">APR</text>
                          <text x="497" y="155" fill="#111111" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MAY</text>
                          <text x="597" y="155" fill="#047857" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">JUN *</text>

                          {/* Values markers */}
                          <text x="97" y="90" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#3F3F46">$4K</text>
                          <text x="197" y="65" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#3F3F46">$6.5K</text>
                          <text x="297" y="48" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#3F3F46">$8.2K</text>
                          <text x="397" y="82" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#3F3F46">$4.8K</text>
                          <text x="497" y="10" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#111111" fontWeight="bold">$12.5K</text>
                          <text x="597" y="14" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#047857" fontWeight="bold">$14.8K</text>
                        </svg>
                      </div>
                    </div>

                    <div className="border-t border-neutral-200 pt-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-3 text-black">
                        TrustInvoice System Features
                      </h3>
                      <p className="text-xs text-zinc-700 leading-relaxed font-sans font-medium mb-4">
                        TrustInvoice AI combines automation, artificial intelligence, cybersecurity, and privacy-by-design to provide secure payment reminders, intelligent collection workflows, audit trails, client verification, and fraud detection.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border-2 border-neutral-200 bg-neutral-50 rounded">
                          <h4 className="text-xs font-extrabold uppercase font-mono text-black flex items-center gap-1.5">
                            <Landmark size={14} className="text-black" aria-hidden="true" />
                            <span>1. Interbank Routing Seals</span>
                          </h4>
                          <p className="text-xs text-zinc-700 mt-1 font-sans">
                            Every outstanding balance has banking coordinates locked inside cryptographic signatures, preventing email modification fraud.
                          </p>
                        </div>
                        <div className="p-4 border-2 border-neutral-200 bg-neutral-50 rounded">
                          <h4 className="text-xs font-extrabold uppercase font-mono text-black flex items-center gap-1.5">
                            <Smartphone size={14} className="text-black" aria-hidden="true" />
                            <span>2. Client Portal Verification</span>
                          </h4>
                          <p className="text-xs text-zinc-700 mt-1 font-sans">
                            Counterparties read invoices from designated host certificates that cannot be spoofed by external mail transport groups.
                          </p>
                        </div>
                        <div className="p-4 border-2 border-neutral-200 bg-neutral-50 rounded">
                          <h4 className="text-xs font-extrabold uppercase font-mono text-black flex items-center gap-1.5">
                            <Mail size={14} className="text-black" aria-hidden="true" />
                            <span>3. Automated AI Reminders</span>
                          </h4>
                          <p className="text-xs text-zinc-700 mt-1 font-sans">
                            Integrate customizable tone presets (Friendly, Business, Urgent, Compliance) to formulate polite yet highly converting requests.
                          </p>
                        </div>
                        <div className="p-4 border-2 border-neutral-200 bg-neutral-50 rounded">
                          <h4 className="text-xs font-extrabold uppercase font-mono text-black flex items-center gap-1.5">
                            <Terminal size={14} className="text-black" aria-hidden="true" />
                            <span>4. Real-Time Security Audit Logs</span>
                          </h4>
                          <p className="text-xs text-zinc-700 mt-1 font-sans">
                            Register audit entries for every link view, verifying IP coordinates to warn of unauthorized man-in-the-middle attacks.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Integrity Compliance Panel & Quick Scans */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-black text-white p-6 neo-border neo-shadow">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-200 mb-4 flex items-center gap-1.5">
                        <Terminal size={14} className="text-white" aria-hidden="true" />
                        <span>INTEGRITY CHECKLIST</span>
                      </h3>

                      <div className="space-y-4 font-mono text-[11px]">
                        <div className="flex gap-2 items-start py-1 border-b border-zinc-800">
                          <span className="text-emerald-400 font-bold shrink-0" aria-hidden="true">✔</span>
                          <div>
                            <div className="text-white font-extrabold">CRYPTOGRAPHIC SEALS</div>
                            <span className="text-[10px] text-zinc-300">Web Crypto SHA-256 signature sealing</span>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start py-1 border-b border-zinc-800">
                          <span className="text-emerald-400 font-bold shrink-0" aria-hidden="true">✔</span>
                          <div>
                            <div className="text-white font-extrabold">AI INTELLIGENCE ENGINE</div>
                            <span className="text-[10px] text-zinc-300">Resilient server-side tone, tax &amp; risk analysis</span>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start py-1 border-b border-zinc-800">
                          <span className="text-emerald-400 font-bold shrink-0" aria-hidden="true">✔</span>
                          <div>
                            <div className="text-white font-extrabold">HTTPS &amp; HSTS ENFORCED</div>
                            <span className="text-[10px] text-zinc-300">Encrypted transport &amp; rate-limited APIs</span>
                          </div>
                        </div>

                        <div className="flex gap-2 items-start py-1 border-b border-zinc-800">
                          <span className="text-emerald-400 font-bold shrink-0" aria-hidden="true">✔</span>
                          <div>
                            <div className="text-white font-extrabold">SWISS GRID TYPOGRAPHY</div>
                            <span className="text-[10px] text-zinc-300">Plus Jakarta Sans &amp; JetBrains Mono</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 neo-border neo-shadow flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-mono font-bold text-neutral-700 uppercase tracking-widest block mb-2">
                          Audit Actions
                        </h3>
                        <p className="text-xs text-neutral-700 font-sans leading-relaxed mb-4">
                          Enter the security testing cockpit to inspect external files or client scenarios for potential wire-routing safety concerns.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigateToTab("scanner")}
                        className="w-full bg-black text-white hover:bg-neutral-800 py-3 min-h-[44px] border-2 border-black text-xs font-bold font-mono uppercase tracking-wider block text-center cursor-pointer transition-colors"
                      >
                        Enter Scanner Desktop
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Suspense fallback={<LazyPanelFallback />}>
              {activeTab === "invoices" && (
                <InvoiceList
                  invoices={invoices}
                  onSelectInvoice={setSelectedInvoice}
                  onUpdateInvoice={handleUpdateInvoice}
                  onNavigateToTab={handleNavigateToTab}
                />
              )}

              {activeTab === "advisor" && (
                <ARAdvisorChat
                  invoices={invoices}
                  userDisplayName={user?.displayName || "Enterprise User"}
                />
              )}

              {activeTab === "tax" && (
                <TaxReturnSuite
                  invoices={invoices}
                  onNavigateToTab={handleNavigateToTab}
                />
              )}

              {activeTab === "create" && (
                <InvoiceForm
                  invoices={invoices}
                  onAddInvoice={handleAddInvoice}
                  onNavigateToTab={handleNavigateToTab}
                />
              )}

              {activeTab === "ai" && (
                <AIPerformanceSuite
                  invoices={invoices}
                  preSelectedInvoice={selectedInvoice}
                  onAddInvoice={handleAddInvoice}
                  onNavigateToTab={handleNavigateToTab}
                />
              )}

              {activeTab === "scanner" && <SecurityScanner />}

              {activeTab === "portal" && (
                <ClientPortal
                  key={`${selectedInvoice?.id || "empty"}-${selectedDocFormat}`}
                  invoice={selectedInvoice}
                  onUpdateInvoice={handleUpdateInvoice}
                  allInvoices={invoices}
                  onSelectInvoice={setSelectedInvoice}
                  initialFormat={selectedDocFormat}
                  onOpenAuthModal={handleOpenAuthModal}
                />
              )}

              {activeTab === "client_account" && (
                <ClientAccountDashboard
                  invoices={invoices}
                  onNavigateToTab={handleNavigateToTab}
                  onUpdateInvoice={handleUpdateInvoice}
                  onOpenAuthModal={handleOpenAuthModal}
                />
              )}

              {activeTab === "privacy" && (
                <PrivacyPolicyPage
                  onBack={() => handleNavigateToTab("dashboard")}
                  onOpenCookieSettings={() => setShowCookieBanner(true)}
                />
              )}

              {activeTab === "terms" && (
                <TermsPage
                  onBack={() => handleNavigateToTab("dashboard")}
                  onNavigatePrivacy={() => handleNavigateToTab("privacy")}
                />
              )}

              {activeTab === "not_found" && (
                <NotFoundPage
                  requestedPath={requestedPath}
                  onGoHome={() => handleNavigateToTab("dashboard")}
                  onGoInvoices={() => handleNavigateToTab("invoices")}
                />
              )}
            </Suspense>
          </motion.div>
        </AnimatePresence>

        {/* Global Support and Help Desk Section */}
        <div className="border-t-2 border-black pt-8 mt-12">
          <SupportWidget />
        </div>

        {/* Corporate Footer with Legal, Cookie & Sitemap Links */}
        <footer className="text-center text-xs font-mono text-zinc-700 py-8 border-t-2 border-zinc-300 mt-12 space-y-4">
          <div className="flex justify-center">
            <img
              src="/trust-seal.png"
              alt="TrustInvoice Crypto-Sealed SHA-256 and TLS Verified Security Badge"
              width={220}
              height={64}
              loading="lazy"
              decoding="async"
              className="border border-black"
            />
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase">
            <a
              href="/privacy"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateToTab("privacy");
              }}
              className="text-black hover:text-emerald-700 underline py-2 px-1"
            >
              Privacy Policy
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="/terms"
              onClick={(e) => {
                e.preventDefault();
                handleNavigateToTab("terms");
              }}
              className="text-black hover:text-emerald-700 underline py-2 px-1"
            >
              Terms &amp; Conditions
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setShowCookieBanner(true)}
              className="text-black hover:text-emerald-700 underline py-2 px-1 cursor-pointer uppercase font-bold"
            >
              Cookie Preferences
            </button>
            <span aria-hidden="true">·</span>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:text-emerald-700 underline py-2 px-1"
            >
              Sitemap
            </a>
          </nav>

          <div>
            <p>© 2026 TrustInvoice AI · Founded by L Openito. All assets cryptographically sealed.</p>
            <p className="mt-1 text-zinc-700">
              Encrypted interbank session: <span className="text-black font-bold">SHA256-V1-ACTIVE</span>
              {isSyncing && <span className="ml-2 text-emerald-700">· Cloud Sync Active</span>}
            </p>
          </div>
        </footer>
      </main>

      {/* Cookie Consent Banner */}
      <CookieConsentBanner
        isOpen={showCookieBanner}
        initialAnalytics={analyticsConsent}
        onSave={(prefs) => {
          setAnalyticsConsent(prefs.analytics);
          setShowCookieBanner(false);
        }}
        onDismiss={() => {
          setAnalyticsConsent(false);
          setShowCookieBanner(false);
        }}
        onOpenPrivacy={() => {
          setShowCookieBanner(false);
          handleNavigateToTab("privacy");
        }}
      />

      {/* Unified Client & Merchant Auth Modal */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authModalMode}
            initialRole={authModalRole}
            targetInvoiceNumber={selectedInvoice?.invoiceNumber}
          />
        </Suspense>
      )}
    </div>
  );
}
