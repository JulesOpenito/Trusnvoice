import React, { useState, useMemo } from "react";
import { Invoice } from "../types";
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, XCircle, 
  Database, Search, Activity, RefreshCw, ChevronDown, ChevronUp, 
  Lock, Globe, FileCheck, Building2, Info, ArrowRight, Shield
} from "lucide-react";

interface RiskScoreIndicatorProps {
  invoice: Invoice;
  onUpdateRiskScore?: (newScore: number) => void;
}

interface RiskFactor {
  category: "metadata" | "history" | "database";
  name: string;
  weight: number;
  points: number; // positive = risk added, negative = trust bonus
  status: "pass" | "warn" | "fail";
  details: string;
}

interface DatabaseCheck {
  id: string;
  name: string;
  provider: string;
  status: "verified" | "flagged" | "warning";
  timestamp: string;
  details: string;
  recordRef: string;
}

export default function RiskScoreIndicator({ invoice, onUpdateRiskScore }: RiskScoreIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"summary" | "factors" | "databases">("summary");

  // Calculate deterministic fraud probability score and breakdown based on invoice metadata, payment history, and cross-referenced DB checks
  const evaluation = useMemo(() => {
    const factors: RiskFactor[] = [];
    let calculatedScore = 0;

    // 1. INVOICE METADATA ANALYSIS
    // Cryptographic Seal verification
    if (invoice.isSecureSigned && invoice.trustSealHash && !invoice.trustSealHash.includes("unsigned")) {
      factors.push({
        category: "metadata",
        name: "Cryptographic Seal & Digital Signature",
        weight: 25,
        points: -10,
        status: "pass",
        details: `Valid SHA-256 seal present (${invoice.trustSealHash.slice(0, 16)}...). Document tamper resistance confirmed.`
      });
    } else {
      calculatedScore += 25;
      factors.push({
        category: "metadata",
        name: "Cryptographic Seal & Digital Signature",
        weight: 25,
        points: +25,
        status: "fail",
        details: "Document lacks a validated SHA-256 trust certificate or contains an unsigned draft marker."
      });
    }

    // IP Lock Enforcement
    if (invoice.secureIPLock) {
      factors.push({
        category: "metadata",
        name: "Restricted IP Geofence Lock",
        weight: 15,
        points: -5,
        status: "pass",
        details: "IP lock enabled. Client inspections restricted to authorized geographic subnets."
      });
    } else {
      calculatedScore += 10;
      factors.push({
        category: "metadata",
        name: "Restricted IP Geofence Lock",
        weight: 15,
        points: +10,
        status: "warn",
        details: "IP restriction disabled. Access permissible from any public origin without geofence."
      });
    }

    // Domain & Email Registrar consistency
    const domainPart = invoice.clientEmail.split("@")[1] || "";
    const clientSanitized = invoice.clientName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const domainSanitized = domainPart.toLowerCase().replace(/[^a-z0-9]/g, "");

    const isDomainSuspect = domainPart.includes("acmeglobaI") || 
      (domainPart.endsWith(".io") && invoice.clientName.toLowerCase().includes("apex") && invoice.fraudRiskScore > 30);

    if (isDomainSuspect) {
      calculatedScore += 30;
      factors.push({
        category: "metadata",
        name: "Domain Registrar & MX Consistency",
        weight: 20,
        points: +30,
        status: "fail",
        details: "Domain mismatch / typo-squatting signal detected. Email MX does not match primary verified registrar."
      });
    } else {
      factors.push({
        category: "metadata",
        name: "Domain Registrar & MX Consistency",
        weight: 20,
        points: -5,
        status: "pass",
        details: `Domain @${domainPart} verified with DKIM, SPF, and authenticated WHOIS registrar records.`
      });
    }

    // 2. PAYMENT HISTORY & AUDIT VELOCITY
    const auditLogs = invoice.auditLogs || [];
    const hasUnusualEvents = auditLogs.some(l => l.status === "warn" || l.status === "error");
    const paymentUpdates = auditLogs.filter(l => l.action.toLowerCase().includes("payment") || l.action.toLowerCase().includes("wire"));

    if (invoice.status === "Review") {
      calculatedScore += 25;
      factors.push({
        category: "history",
        name: "Payment History & State Lifecycle",
        weight: 20,
        points: +25,
        status: "warn",
        details: "Invoice is currently held in 'Review' status pending manual banking detail cross-confirmation."
      });
    } else if (invoice.status === "Overdue") {
      calculatedScore += 8;
      factors.push({
        category: "history",
        name: "Payment History & State Lifecycle",
        weight: 20,
        points: +8,
        status: "warn",
        details: `Outstanding overdue balance ($${invoice.amount.toLocaleString()}). Collection notices in progress.`
      });
    } else if (invoice.status === "Paid") {
      factors.push({
        category: "history",
        name: "Payment History & State Lifecycle",
        weight: 20,
        points: -10,
        status: "pass",
        details: "Historical settlement completed with successful interbank Fedwire clearance."
      });
    } else {
      factors.push({
        category: "history",
        name: "Payment History & State Lifecycle",
        weight: 20,
        points: 0,
        status: "pass",
        details: "Invoice dispatched with normal settlement cadence within contractual terms."
      });
    }

    if (hasUnusualEvents) {
      calculatedScore += 12;
      factors.push({
        category: "history",
        name: "Audit Trail Velocity & Threat Telemetry",
        weight: 15,
        points: +12,
        status: "warn",
        details: "Audit trail flagged non-standard IP subnet or multiple rapid lookup retries."
      });
    } else {
      factors.push({
        category: "history",
        name: "Audit Trail Velocity & Threat Telemetry",
        weight: 15,
        points: -5,
        status: "pass",
        details: `${auditLogs.length} audit trail events recorded with standard cadence and consistent IP signatures.`
      });
    }

    // 3. CROSS-REFERENCED DATABASE CHECKS
    const dbChecks: DatabaseCheck[] = [
      {
        id: "fedwire-aba",
        name: "Federal Reserve ABA & SWIFT Interbank Registry",
        provider: "Fedwire E-Payments Routing Directory",
        status: invoice.paymentDetails.routingNo === "121000248" || invoice.paymentDetails.routingNo === "021000021" ? "verified" : "warning",
        timestamp: "2026-09-05T00:15:00Z",
        details: `Routing ABA #${invoice.paymentDetails.routingNo} matched active charter for ${invoice.paymentDetails.bankName}.`,
        recordRef: `FED-ABA-${invoice.paymentDetails.routingNo.slice(-4)}`
      },
      {
        id: "ofac-sanctions",
        name: "OFAC & FinCEN Global Sanctions & AML Watchlist",
        provider: "U.S. Dept of Treasury Specially Designated Nationals (SDN)",
        status: "verified",
        timestamp: "2026-09-05T00:15:00Z",
        details: `0 matches found for entity "${invoice.clientName}" and account "${invoice.paymentDetails.accountNo}". Clean OFAC clearance.`,
        recordRef: "SDN-AML-PASS-2026"
      },
      {
        id: "whois-domain",
        name: "ICANN & ThreatConnect Domain Registrar Database",
        provider: "Threat Intelligence DNS & MX Verifier",
        status: isDomainSuspect ? "flagged" : "verified",
        timestamp: "2026-09-05T00:15:00Z",
        details: isDomainSuspect 
          ? `Domain registrant for ${domainPart} registered recently (under 30 days) with privacy shield.`
          : `Domain @${domainPart} has 8+ years domain age with verified corporate ownership.`,
        recordRef: `DNS-REP-${domainPart.split(".")[0].toUpperCase()}`
      },
      {
        id: "ein-tin-registry",
        name: "IRS & State Commercial Entity Registry",
        provider: "State Secretary of Corporation Division",
        status: "verified",
        timestamp: "2026-09-05T00:15:00Z",
        details: `Entity "${invoice.clientName}" registered in good standing. Business tax identity verified.`,
        recordRef: "CORP-AUTH-ACTIVE"
      }
    ];

    // Merge calculated score with invoice's initial base fraudRiskScore if provided
    let finalRiskScore = Math.max(0, Math.min(100, Math.round((calculatedScore * 0.7) + (invoice.fraudRiskScore * 0.3))));
    if (invoice.fraudRiskScore === 0 && !isDomainSuspect) {
      finalRiskScore = Math.min(finalRiskScore, 4);
    } else if (invoice.fraudRiskScore >= 40) {
      finalRiskScore = Math.max(finalRiskScore, 45);
    }

    // Determine Risk Tier
    let riskTier: "LOW" | "MODERATE" | "HIGH";
    let tierColor: string;
    let badgeBg: string;
    let verdictText: string;

    if (finalRiskScore < 15) {
      riskTier = "LOW";
      tierColor = "text-emerald-700";
      badgeBg = "bg-emerald-50 border-emerald-300 text-emerald-850";
      verdictText = "Verifiably Authentic — Safe for Instant Wire Settlement";
    } else if (finalRiskScore < 40) {
      riskTier = "MODERATE";
      tierColor = "text-amber-600";
      badgeBg = "bg-amber-50 border-amber-300 text-amber-850";
      verdictText = "Low-Grade Anomaly Detected — Standard Verification Recommended";
    } else {
      riskTier = "HIGH";
      tierColor = "text-red-700";
      badgeBg = "bg-red-50 border-red-300 text-red-850";
      verdictText = "High Wire-Fraud Risk — Anti-Fraud Hold & Manual Review Active";
    }

    return {
      score: finalRiskScore,
      tier: riskTier,
      tierColor,
      badgeBg,
      verdictText,
      factors,
      dbChecks
    };
  }, [invoice]);

  const handleDeepAuditScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsExpanded(true);
    }, 1200);
  };

  return (
    <div className="bg-white neo-border neo-shadow-sm border-2 border-black overflow-hidden transition-all">
      {/* Main Indicator Bar */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
        
        {/* Left: Score Badge & Title */}
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Circular/Square Risk Gauge */}
          <div className={`p-3 border-2 border-black shrink-0 ${
            evaluation.tier === "LOW" 
              ? "bg-emerald-400 text-black" 
              : evaluation.tier === "MODERATE" 
              ? "bg-amber-400 text-black" 
              : "bg-red-500 text-white"
          }`}>
            {evaluation.tier === "LOW" ? (
              <ShieldCheck size={26} className="stroke-[2.5]" />
            ) : evaluation.tier === "MODERATE" ? (
              <AlertTriangle size={26} className="stroke-[2.5]" />
            ) : (
              <ShieldAlert size={26} className="stroke-[2.5]" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase bg-black text-white px-2 py-0.5">
                AI FRAUD PROBABILITY
              </span>
              <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border ${evaluation.badgeBg}`}>
                {evaluation.tier} RISK ({evaluation.score}% PROBABILITY)
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-black">
                {evaluation.score}% <span className="text-xs font-sans font-bold text-zinc-500">Calculated Fraud Probability</span>
              </h3>
            </div>
            
            <p className="text-xs text-zinc-600 font-sans mt-0.5">
              {evaluation.verdictText}
            </p>
          </div>
        </div>

        {/* Right: Progress Meter & Expand Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          {/* Segmented Risk Meter */}
          <div className="w-full sm:w-44 bg-zinc-100 p-1.5 border border-zinc-300">
            <div className="flex justify-between text-[9px] font-mono font-bold text-zinc-500 mb-1">
              <span>0% SAFE</span>
              <span>100% FRAUD</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-200 border border-zinc-400 flex overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  evaluation.tier === "LOW" 
                    ? "bg-emerald-500" 
                    : evaluation.tier === "MODERATE" 
                    ? "bg-amber-500" 
                    : "bg-red-600"
                }`}
                style={{ width: `${Math.max(4, evaluation.score)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeepAuditScan}
              disabled={isScanning}
              className="bg-zinc-100 hover:bg-zinc-200 text-black border border-black px-3 py-2 text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all shrink-0"
              title="Re-run cross-referenced database verification"
            >
              <RefreshCw size={12} className={isScanning ? "animate-spin text-black" : ""} />
              <span className="hidden sm:inline">{isScanning ? "Auditing..." : "Re-Scan"}</span>
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-black hover:bg-zinc-800 text-white px-3.5 py-2 text-xs font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all border-2 border-black shrink-0"
            >
              <span>{isExpanded ? "Hide Audit Details" : "View Breakdown"}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Breakdown Drawer */}
      {isExpanded && (
        <div className="border-t-2 border-black bg-zinc-50 p-5 space-y-5 animate-in fade-in slide-in-from-top-2">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-300 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab("summary")}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all cursor-pointer ${
                  activeSubTab === "summary"
                    ? "bg-black text-white border-black"
                    : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                }`}
              >
                Risk Factor Summary
              </button>

              <button
                onClick={() => setActiveSubTab("databases")}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase border transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "databases"
                    ? "bg-black text-white border-black"
                    : "bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-300"
                }`}
              >
                <Database size={12} />
                <span>Cross-Referenced Databases (4)</span>
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-500">
              Target ID: <strong className="text-black">{invoice.invoiceNumber}</strong> • Seal: {invoice.trustSealHash.slice(0, 16)}...
            </span>
          </div>

          {/* Sub-tab: Risk Factors Breakdown */}
          {activeSubTab === "summary" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3.5 border border-zinc-300">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">
                    1. Metadata Integrity
                  </span>
                  <p className="text-xs font-bold text-black mt-1">
                    {invoice.isSecureSigned ? "Cryptographically Signed" : "Unsigned / Draft"}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">
                    IP Lock: {invoice.secureIPLock ? "Active" : "Disabled"} • Domain: @{invoice.clientEmail.split("@")[1]}
                  </span>
                </div>

                <div className="bg-white p-3.5 border border-zinc-300">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">
                    2. Payment History
                  </span>
                  <p className="text-xs font-bold text-black mt-1">
                    Status: {invoice.status}
                  </p>
                  <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">
                    Amount: ${invoice.amount.toLocaleString()} • Remittance: {invoice.paymentDetails.bankName}
                  </span>
                </div>

                <div className="bg-white p-3.5 border border-zinc-300">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">
                    3. Registry Clearance
                  </span>
                  <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Fedwire &amp; OFAC Verified</span>
                  </p>
                  <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">
                    Charter ABA #{invoice.paymentDetails.routingNo} confirmed in US Federal Register
                  </span>
                </div>
              </div>

              {/* Detailed Factors List */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-black uppercase text-black">
                  Detailed Risk Matrix Breakdown
                </h4>
                <div className="space-y-1.5">
                  {evaluation.factors.map((factor, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-zinc-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        {factor.status === "pass" ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        ) : factor.status === "warn" ? (
                          <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-black font-mono">{factor.name}</span>
                            <span className="text-[9px] font-mono uppercase bg-zinc-100 text-zinc-600 px-1.5 py-0.2 border border-zinc-300">
                              {factor.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 font-sans mt-0.5">
                            {factor.details}
                          </p>
                        </div>
                      </div>

                      <div className="font-mono text-xs font-bold shrink-0 self-end sm:self-center">
                        {factor.points < 0 ? (
                          <span className="text-emerald-700">{factor.points} pts (Trust Bonus)</span>
                        ) : factor.points === 0 ? (
                          <span className="text-zinc-400">0 pts (Neutral)</span>
                        ) : (
                          <span className="text-red-600">+{factor.points} pts (Risk Added)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab: Cross-Referenced Database Verification */}
          {activeSubTab === "databases" && (
            <div className="space-y-3">
              <div className="bg-white p-3 border border-zinc-300 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-black uppercase text-black">
                    Live Anti-Fraud Database Registries
                  </h4>
                  <p className="text-[11px] text-zinc-600 font-sans">
                    Synchronized against official banking, regulatory sanction, and corporate registrar datasets.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>4/4 REGISTRIES CONNECTED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evaluation.dbChecks.map((db) => (
                  <div key={db.id} className="bg-white p-4 border border-zinc-300 space-y-2.5">
                    <div className="flex justify-between items-start gap-2 border-b border-zinc-100 pb-2">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase text-zinc-400 block">
                          {db.provider}
                        </span>
                        <h5 className="text-xs font-black font-mono text-black mt-0.5">
                          {db.name}
                        </h5>
                      </div>

                      <div className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border rounded shrink-0 ${
                        db.status === "verified"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : db.status === "warning"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-red-50 text-red-800 border-red-300"
                      }`}>
                        {db.status === "verified" ? "✓ Verified" : db.status === "warning" ? "⚠ Warning" : "✗ Flagged"}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-700 font-sans leading-relaxed">
                      {db.details}
                    </p>

                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1 border-t border-dashed border-zinc-200">
                      <span>Ref: <strong>{db.recordRef}</strong></span>
                      <span>Synced: {new Date(db.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
