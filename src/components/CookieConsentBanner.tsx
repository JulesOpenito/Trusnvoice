import React, { useState } from "react";
import { Cookie, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { CookieConsentPreferences, saveCookieConsent } from "../utils/analytics";

interface CookieConsentBannerProps {
  isOpen: boolean;
  initialAnalytics?: boolean;
  onSave: (prefs: CookieConsentPreferences) => void;
  onDismiss: () => void;
  onOpenPrivacy: () => void;
}

export default function CookieConsentBanner({
  isOpen,
  initialAnalytics = false,
  onSave,
  onDismiss,
  onOpenPrivacy,
}: CookieConsentBannerProps) {
  const [showCustomize, setShowCustomize] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(initialAnalytics);

  if (!isOpen) return null;

  const handleAcceptAll = () => {
    const prefs = saveCookieConsent(true);
    onSave(prefs);
  };

  const handleEssentialOnly = () => {
    const prefs = saveCookieConsent(false);
    onSave(prefs);
  };

  const handleSaveCustom = () => {
    const prefs = saveCookieConsent(analyticsEnabled);
    onSave(prefs);
  };

  return (
    <aside
      role="region"
      aria-label="Cookie consent preferences"
      className="fixed bottom-4 left-4 right-4 z-[90] max-w-4xl mx-auto bg-white border-2 border-black neo-shadow-lg p-4 sm:p-5 text-black"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-black text-emerald-400 border border-black shrink-0 mt-0.5">
              <Cookie size={18} aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xs sm:text-sm font-mono font-extrabold uppercase tracking-wider text-black">
                Cookie &amp; Privacy Preferences
              </h2>
              <p className="text-xs text-zinc-700 leading-relaxed">
                TrustInvoice uses strictly essential cookies for authentication and anti-fraud security, plus optional audience measurement analytics to improve portal speed and usability. Read our{" "}
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenPrivacy();
                  }}
                  className="font-bold underline text-black hover:text-emerald-700"
                >
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close cookie preferences with essential cookies only"
            className="p-2 text-zinc-700 hover:text-black cursor-pointer shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {showCustomize && (
          <div className="bg-zinc-50 border-2 border-black p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-zinc-200">
              <div>
                <div className="font-mono font-bold text-black flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-700" aria-hidden="true" />
                  <span>Essential Security &amp; Auth Cookies</span>
                </div>
                <p className="text-zinc-700 mt-0.5">
                  Required for encrypted sign-in, Firestore persistence, and anti-spam protection. Always active.
                </p>
              </div>
              <span className="font-mono font-bold text-[11px] uppercase text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-1 shrink-0">
                Always On
              </span>
            </div>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="font-mono font-bold text-black">
                  Audience Measurement &amp; Performance Analytics
                </div>
                <p className="text-zinc-700 mt-0.5">
                  Measures aggregate page views, load performance, and navigation flows without selling personal data.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer shrink-0"
              />
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="bg-zinc-100 hover:bg-zinc-200 text-black border-2 border-black px-4 py-2.5 min-h-[44px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            <span>{showCustomize ? "Hide Options" : "Customize"}</span>
          </button>

          <button
            type="button"
            onClick={handleEssentialOnly}
            className="bg-white hover:bg-zinc-100 text-black border-2 border-black px-4 py-2.5 min-h-[44px] font-bold uppercase cursor-pointer transition-colors"
          >
            Essential Only
          </button>

          {showCustomize ? (
            <button
              type="button"
              onClick={handleSaveCustom}
              className="bg-black hover:bg-zinc-800 text-white border-2 border-black px-5 py-2.5 min-h-[44px] font-bold uppercase cursor-pointer transition-colors"
            >
              Save Preferences
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAcceptAll}
              className="bg-black hover:bg-zinc-800 text-white border-2 border-black px-5 py-2.5 min-h-[44px] font-bold uppercase cursor-pointer transition-colors"
            >
              Accept All
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
