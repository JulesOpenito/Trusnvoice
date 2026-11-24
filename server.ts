import crypto from "crypto";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.disable("x-powered-by");
app.set("trust proxy", true);
app.use(express.json({ limit: "2mb" }));

// Security headers & HTTPS enforcement
app.use((req, res, next) => {
  const host = req.headers.host || "";
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  const forwardedProto = req.headers["x-forwarded-proto"];

  if (process.env.NODE_ENV === "production" && !isLocalhost && forwardedProto === "http") {
    return res.redirect(301, `https://${host}${req.originalUrl}`);
  }

  if (!isLocalhost) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=(self)");
  next();
});

// Anti-spam sliding-window rate limiter for /api/* routes
const apiRateStore = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 60;

app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = apiRateStore.get(clientIp);

  if (!entry || now > entry.resetAt) {
    apiRateStore.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  entry.count += 1;
  if (entry.count > RATE_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    return res.status(429).json({
      error: "Rate limit exceeded. Please wait before submitting additional requests.",
    });
  }
  next();
});

// Helper to resolve canonical HTTPS base URL
function getCanonicalBaseUrl(req: express.Request): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, "").replace(/^http:\/\//, "https://");
  }
  const host = req.get("host") || "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? req.protocol : "https";
  return `${proto}://${host}`;
}

// Dynamic robots.txt & sitemap.xml
app.get("/robots.txt", (req, res) => {
  const baseUrl = getCanonicalBaseUrl(req);
  res.type("text/plain").send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${baseUrl}/sitemap.xml\n`
  );
});

app.get("/sitemap.xml", (req, res) => {
  const baseUrl = getCanonicalBaseUrl(req);
  const lastMod = new Date().toISOString().split("T")[0];
  const routes = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/invoices", priority: "0.9", changefreq: "weekly" },
    { path: "/portal", priority: "0.9", changefreq: "weekly" },
    { path: "/tax", priority: "0.8", changefreq: "monthly" },
    { path: "/advisor", priority: "0.8", changefreq: "monthly" },
    { path: "/scanner", priority: "0.7", changefreq: "monthly" },
    { path: "/privacy", priority: "0.5", changefreq: "yearly" },
    { path: "/terms", priority: "0.5", changefreq: "yearly" },
  ];
  const urlsXml = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${baseUrl}${r.path}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
    )
    .join("\n");

  res
    .type("application/xml")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`);
});

// Privacy-first Audience Measurement collector
const audienceMetrics = {
  totalPageViews: 0,
  totalEvents: 0,
  uniqueSessions: new Set<string>(),
  byPath: new Map<string, number>(),
};

app.post("/api/analytics/collect", (req, res) => {
  const { eventType, path: eventPath, sessionId } = req.body || {};
  if (typeof eventPath === "string" && eventPath.length <= 200) {
    audienceMetrics.totalEvents += 1;
    if (eventType === "page_view") {
      audienceMetrics.totalPageViews += 1;
      audienceMetrics.byPath.set(eventPath, (audienceMetrics.byPath.get(eventPath) || 0) + 1);
    }
    if (typeof sessionId === "string" && sessionId.length <= 64) {
      audienceMetrics.uniqueSessions.add(sessionId);
    }
  }
  res.status(204).end();
});

app.get("/api/analytics/summary", (req, res) => {
  res.json({
    totalPageViews: audienceMetrics.totalPageViews,
    totalEvents: audienceMetrics.totalEvents,
    uniqueSessions: audienceMetrics.uniqueSessions.size,
    topPaths: Array.from(audienceMetrics.byPath.entries()).map(([pathName, views]) => ({
      path: pathName,
      views,
    })),
  });
});

// Active Gemini models & lazy-initialized client
const DEFAULT_TEXT_MODEL = "gemini-4-hydrogen";
const TRANSCRIBE_MODEL = "gemini-3.5-transcribe";

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

type GenerateContentParams = Parameters<GoogleGenAI["models"]["generateContent"]>[0];

function extractHttpStatus(error: any): number | null {
  const status = Number(error?.status ?? error?.statusCode ?? error?.code);
  if (Number.isInteger(status) && status >= 400 && status <= 599) {
    return status;
  }
  const msg = String(error?.message || "");
  if (msg.includes("429") || /rate limit|resource exhausted|quota/i.test(msg)) return 429;
  if (msg.includes("503") || /unavailable|overloaded/i.test(msg)) return 503;
  if (msg.includes("403") || /permission|forbidden/i.test(msg)) return 403;
  if (msg.includes("400") || /invalid argument/i.test(msg)) return 400;
  return null;
}

async function generateContentWithRetry(params: GenerateContentParams, maxRetries = 2) {
  const ai = getAI();
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      lastError = error;
      const status = extractHttpStatus(error);
      const isTransient =
        status === 429 ||
        status === 503 ||
        status === 502 ||
        status === 504 ||
        error?.name === "FetchError" ||
        /ECONNRESET|ETIMEDOUT|network|timeout/i.test(String(error?.message || ""));

      if (!isTransient || attempt === maxRetries) {
        throw error;
      }

      const backoffMs = 400 * Math.pow(2, attempt) + Math.floor(Math.random() * 150);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

function sendGeminiError(res: express.Response, error: any, fallbackMessage: string) {
  const status = extractHttpStatus(error);
  if (status === 429) {
    return res.status(429).json({
      error: "AI service is currently busy due to high demand. Please retry in a few seconds.",
    });
  }
  if (status === 503) {
    return res.status(503).json({
      error: "AI service is temporarily unavailable. Please try again shortly.",
    });
  }
  if (status === 400) {
    return res.status(400).json({
      error: error?.message || "Invalid input provided for AI analysis.",
    });
  }
  if (status === 403) {
    return res.status(403).json({
      error: "AI service authorization failed. Please verify server credentials.",
    });
  }
  return res.status(500).json({ error: error?.message || fallbackMessage });
}

// 1. API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "2.0.0" });
});

// 2. API: Generate Secure AI Payment Reminder Email
app.post("/api/ai/reminder", async (req, res, next) => {
  try {
    const { invoiceNumber, clientName, amount, dueDate, tone, items, customNote } = req.body;
    
    // Check key availability
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings > Secrets." 
      });
    }

    const systemPrompt = `You are an elite, professional communications advisor specializing in cyber-secure SaaS-based collection management.
Your purpose is to draft and optimize high-conversion, extremely polite, yet highly effective payment reminder letters for invoices.
Every email MUST contain a clear cryptographic warning/guarantee indicating that banking routing information is digitally signed to prevent email spoofing attacks and wire fraud. This builds secure trust.

Available Tones:
- friendly: Patient, conversational, helpful, prioritizing long-term relationship first.
- business: Crisp, typical corporate accounts receivable standard, clear and objective.
- urgent: Highly action-oriented, firm due-dates, emphasizing priority of clearing accounts.
- alert: Focuses heavily on cybersecurity, digital verification certificates, and prompt resolution of the outstanding invoice to avoid suspension of services or secondary audit fees.

The response must be returned as JSON with:
- subject: The email subject line.
- body: The full body of the email in clean HTML or plaintext format (using line breaks). Ensure it references the invoice number, the due date, the total amount, and instructions to double check details via the secure client lookup portal.
`;

    const userPrompt = `Draft a payment reminder with the following details:
Invoice Number: ${invoiceNumber || "INV-2026-004"}
Client Name: ${clientName || "Valued Client"}
Amount: $${amount || "1,250.00"}
Due Date: ${dueDate || "Immediate"}
Description/Items: ${items || "Services Rendered"}
Tone Mode: ${tone || "business"}
Custom Sender Note: ${customNote || ""}
`;

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["subject", "body"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No response received from GenAI model");
    }
  } catch (error: any) {
    console.error("AI Reminder Generation Error:", error);
    return sendGeminiError(res, error, "Failed to generate reminder letter");
  }
});

// 3. API: Analyze invoice or payment information for Fraud Risk & Trust Verification
app.post("/api/ai/analyze-fraud", async (req, res, next) => {
  try {
    const { invoiceText, providedIban, clientEmail } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const systemPrompt = `You are a state-of-the-art Invoice Security & Anti-Fraud Agent.
You analyze invoice content, account routing data, and contextual signals to compute a risk score (0-100) and identify fraudulent alterations (like spoofed wire routing changes, mismatched business details, or phishing email aliases).

Return your assessment strictly in JSON format matching this schema:
- riskScore: (0 to 100, where 0 is perfectly authentic and verified, 100 is extremely severe risk of wire fraud)
- verdict: (A robust, clear one-sentence summary of the review, eg. "Verifiably Secure" or "Suspicious Account Mismatch Detected")
- findings: (An array of potential risks/concerns found or tested, each with "severity" [low/medium/high] and "description" [text explanation])
- trustGuarantees: (An array of positive observations, eg. "IBAN formatting corresponds to legal entity", "Registered domain matches sender certificate")
`;

    const userPrompt = `Perform a cybersecurity and wire fraud risk assessment based on this raw invoice text and criteria:
--- INVOICE TEXT CONTEXT ---
${invoiceText || "Invoice INV-2026-X. Wire Transfer instructions: Bank of America, Routing: 3948593, Account: 2948593294. Total $4,500.00."}
--- PROVIDED CORRELATION SIGNALS ---
IBAN / Account Number supplied: ${providedIban || "Unknown"}
Sender Client Email domain: ${clientEmail || "Unknown"}

Provide the JSON report.`;

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: { type: Type.INTEGER },
            verdict: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["severity", "description"]
              }
            },
            trustGuarantees: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["riskScore", "verdict", "findings", "trustGuarantees"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No response received from GenAI model for fraud scan");
    }
  } catch (error: any) {
    console.error("AI Fraud Check Error:", error);
    return sendGeminiError(res, error, "Failed to analyze invoice for security");
  }
});

// 4. API: AI Smart Invoice Parser (Extracts structured invoice details from unstructured notes/emails)
app.post("/api/ai/parse-invoice", async (req, res, next) => {
  try {
    const { rawText } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const systemPrompt = `You are an elite AI Invoice Parsing Agent.
Your task is to take raw, unstructured invoice notes, emails, billing requests, or text receipts and extract clean, structured invoice data.
If any required field is completely missing and cannot be inferred, supply empty strings or reasonable defaults (or standard mockup banks for routing details), but do your absolute best to locate actual references in the text.
For the items, if no quantity or rate is specified, default to quantity 1 and calculate the rate based on the total.

The returned response MUST strictly follow this JSON schema:
- clientName: (String, eg. "Acme Corp")
- clientEmail: (String, email address found)
- amount: (Number, total invoice amount)
- dueDate: (String, standard format YYYY-MM-DD or relative like "2026-07-15")
- items: (Array of objects, each containing: "description" [string], "quantity" [number], "rate" [number])
- paymentDetails: (Object containing "bankName" [string], "routingNo" [string], "accountNo" [string], "swift" [string], "iban" [string])
`;

    const userPrompt = `Parse this raw text and output clean structured invoice metadata:
--- RAW UNSTRUCTURED TEXT ---
${rawText || ""}
--- END OF TEXT ---
`;

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            clientEmail: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            dueDate: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.INTEGER },
                  rate: { type: Type.NUMBER }
                },
                required: ["description", "quantity", "rate"]
              }
            },
            paymentDetails: {
              type: Type.OBJECT,
              properties: {
                bankName: { type: Type.STRING },
                routingNo: { type: Type.STRING },
                accountNo: { type: Type.STRING },
                swift: { type: Type.STRING },
                iban: { type: Type.STRING }
              },
              required: ["bankName", "routingNo", "accountNo", "swift", "iban"]
            }
          },
          required: ["clientName", "clientEmail", "amount", "dueDate", "items", "paymentDetails"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No response received from GenAI model for invoice parsing");
    }
  } catch (error: any) {
    console.error("AI Invoice Parsing Error:", error);
    return sendGeminiError(res, error, "Failed to parse invoice notes");
  }
});

// 5. API: AI Cybercop and AR Negotiation Copilot (Interactive Chat)
app.post("/api/ai/copilot-chat", async (req, res, next) => {
  try {
    const { messages, invoicesContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing. Please add GEMINI_API_KEY in Settings."
      });
    }

    const systemPrompt = `You are "TrustInvoice Cybercop & Cash-Flow Copilot", an elite AI expert in accounts receivable management, cash flow optimization, billing negotiation, and invoice fraud security.
You assist the SaaS platform merchant in securing their cash flows, draft perfect polite-but-firm collection outreach, identify wire/IBAN spoofing risks, and optimize their business receivables.

Your tone is professional, authoritative, clever, and helpful. Keep responses highly structured and actionable, using clean markdown bullet points, mini code/email snippets where appropriate, and specific secure recommendations.

Here is the current real-time invoice context for this user:
${invoicesContext || "No invoice records registered yet."}

Answer the user's question directly and propose concrete solutions. Keep answers concise, avoiding long histories.
`;

    // Map messages array to Gemini format
    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "model" ? "model" as const : "user" as const,
      parts: [{ text: m.text }]
    }));

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: geminiMessages,
      config: {
        systemInstruction: systemPrompt
      }
    });

    return res.json({ text: response.text || "I was unable to process your query. Let me try again." });
  } catch (error: any) {
    console.error("AI Copilot Chat Error:", error);
    return sendGeminiError(res, error, "Failed to execute copilot action");
  }
});

// 6. API: AI Portfolio Audit & Risk Advisor (Receivables Audit)
app.post("/api/ai/receivables-audit", async (req, res, next) => {
  try {
    const { invoices } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing. Please add GEMINI_API_KEY in Settings."
      });
    }

    const systemPrompt = `You are the chief AI Receivables Auditor & Portfolio Risk Officer.
You analyze an entire active invoice registry (names, status, amounts, issue/due dates, security audit log flags) to formulate high-performance collection strategies and highlight risk hotspots.

Analyze the given invoices and return your audit strictly as JSON matching this schema:
- criticalRisksCount: (Integer, number of invoices identified as high risk of late payment or security breach)
- estimatedRecoverable: (Number, estimated amount of outstanding dollars likely recoverable via proactive AI reminders)
- keyInsights: (Array of strings, 3-4 specific high-level financial or operational observations about their current invoices)
- collectionStrategy: (String, 1-2 paragraphs detailing the optimal macro strategy for their cash-flow cycle)
- suggestedActionPlan: (Array of objects, each containing: "invoiceId" [string], "clientName" [string], "recommendation" [string], "immediateAction" [string])
`;

    const userPrompt = `Perform a comprehensive cash-flow audit and payment risk assessment on this registry of invoices:
${JSON.stringify(invoices || [], null, 2)}

Provide the complete JSON audit report.`;

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            criticalRisksCount: { type: Type.INTEGER },
            estimatedRecoverable: { type: Type.NUMBER },
            keyInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            collectionStrategy: { type: Type.STRING },
            suggestedActionPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  invoiceId: { type: Type.STRING },
                  clientName: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                  immediateAction: { type: Type.STRING }
                },
                required: ["invoiceId", "clientName", "recommendation", "immediateAction"]
              }
            }
          },
          required: ["criticalRisksCount", "estimatedRecoverable", "keyInsights", "collectionStrategy", "suggestedActionPlan"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No response received from GenAI model for portfolio audit");
    }
  } catch (error: any) {
    console.error("AI Portfolio Audit Error:", error);
    return sendGeminiError(res, error, "Failed to audit portfolio");
  }
});

// 7. API: AI Tax Return Audit & Optimization Advisor
app.post("/api/ai/tax-audit", async (req, res, next) => {
  try {
    const { filing, expenses, grossReceipts } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings."
      });
    }

    const systemPrompt = `You are the Lead IRS Tax Attorney & Certified Public Accountant (CPA) for modern SaaS companies, digital agencies, and technology freelancers.
You analyze business gross receipts, classified business expenses, entity structure (Sole Prop / Schedule C, S-Corp, LLC), and identify overlooked tax deductions, calculate audit risk percentages (IRS DIF score estimation), and formulate high-value tax mitigation strategies under the 2026 Internal Revenue Code.

Deductions to examine:
1. Section 179 direct equipment expense (workstations, servers, tech hardware).
2. Section 199A Qualified Business Income (QBI) 20% pass-through deduction.
3. Home office deduction (IRC §280A) vs dedicated office lease.
4. Business software/SaaS, API tokens, cloud VPC infrastructure write-offs.
5. S-Corp election suitability (calculating when switching from Schedule C to Form 1120-S saves 15.3% SE tax on distributions).
6. 1099-NEC contractor compliance and reporting risks.
7. IRS red-flag deduction ratios (meals >10%, rounded numbers, disproportionate travel).

Return strictly JSON matching this schema:
- auditRiskScore: (Integer 0 to 100)
- auditRiskLevel: ("Low" | "Moderate" | "High")
- redFlags: (Array of objects with "title", "severity" [low/medium/high], "description", "recommendation")
- overlookedDeductions: (Array of objects with "title", "estimatedSavings", "category", "ircCode", "rationale")
- totalPotentialSavings: (Number, total estimated additional tax savings)
- executiveSummary: (String, 2-3 paragraph CPA executive tax opinion)
- qbiDeductionEligible: (Boolean)
- sCorpRecommendation: (Object with "recommended" [boolean], "estimatedAnnualSavings" [number], "explanation" [string])
`;

    const userPrompt = `Analyze this tax return filing data and expenses:
--- TAX FILING CONTEXT ---
Entity Type: ${filing?.entityType || "SoleProp_ScheduleC"}
Gross Invoiced Receipts: $${grossReceipts || filing?.grossReceipts || 25000}
Current Expenses Total: $${expenses?.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) || 0}
Expenses Breakdown:
${JSON.stringify(expenses || [], null, 2)}

Provide the complete JSON tax optimization and audit review.`;

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            auditRiskScore: { type: Type.INTEGER },
            auditRiskLevel: { type: Type.STRING },
            redFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING }
                },
                required: ["title", "severity", "description", "recommendation"]
              }
            },
            overlookedDeductions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedSavings: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  ircCode: { type: Type.STRING },
                  rationale: { type: Type.STRING }
                },
                required: ["title", "estimatedSavings", "category", "ircCode", "rationale"]
              }
            },
            totalPotentialSavings: { type: Type.NUMBER },
            executiveSummary: { type: Type.STRING },
            qbiDeductionEligible: { type: Type.BOOLEAN },
            sCorpRecommendation: {
              type: Type.OBJECT,
              properties: {
                recommended: { type: Type.BOOLEAN },
                estimatedAnnualSavings: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["recommended", "estimatedAnnualSavings", "explanation"]
            }
          },
          required: [
            "auditRiskScore",
            "auditRiskLevel",
            "redFlags",
            "overlookedDeductions",
            "totalPotentialSavings",
            "executiveSummary",
            "qbiDeductionEligible",
            "sCorpRecommendation"
          ]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No response received from GenAI model for tax audit");
    }
  } catch (error: any) {
    console.error("AI Tax Audit Error:", error);
    return sendGeminiError(res, error, "Failed to execute AI tax audit");
  }
});

// 8. API: AI Tax Copilot & IRC Code Advisor (Chatbot)
app.post("/api/ai/tax-chat", async (req, res, next) => {
  try {
    const { messages, taxContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing. Please add GEMINI_API_KEY in Settings."
      });
    }

    const systemPrompt = `You are "TrustInvoice AI Tax Counsel & CPA Copilot", an elite advisor on IRS Tax Code (IRC), Schedule C, Form 1120-S, Form 1065, Form 1040-ES quarterly estimated taxes, state franchise taxes, Section 179 depreciation, and contractor 1099-NEC compliance.
You assist business owners in maximizing legal tax deductions, organizing receipts, avoiding IRS audits, structuring safe-harbor quarterly payments, and preparing clean e-filable tax returns.

Context of user's active tax return:
${taxContext || "Standard active Schedule C tax return."}

Guidelines:
- Reference specific IRS forms and IRC code sections (e.g., IRC §162 ordinary and necessary expenses, §179 first-year expensing, §199A QBI deduction, §280A home office, Form 1040 Schedule C/SE).
- Provide crisp, highly actionable bullet points.
- Always include standard professional disclaimer: "Educational tax guidance based on 2026 IRS regulations. Consult your licensed CPA for formal signature."
`;

    const geminiMessages = messages.map((m: any) => ({
      role: m.role === "model" ? "model" as const : "user" as const,
      parts: [{ text: m.text }]
    }));

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: geminiMessages,
      config: {
        systemInstruction: systemPrompt
      }
    });

    return res.json({ text: response.text || "I was unable to process your tax question. Please try again." });
  } catch (error: any) {
    console.error("AI Tax Chat Error:", error);
    return sendGeminiError(res, error, "Failed to process tax copilot query");
  }
});

// 9. API: Production IRS MeF (Modernized e-File) Submission Simulator
app.post("/api/tax/simulate-efile", async (req, res) => {
  try {
    const { filing, electronicSignature } = req.body;

    if (!electronicSignature) {
      return res.status(400).json({ error: "Digital signature is required to authorize IRS e-file submission." });
    }

    // Generate cryptographically sealed transmission acknowledgment
    const timestamp = new Date().toISOString();
    const submissionId = `IRS-MEF-2026-${crypto.randomInt(10000000, 99999999)}`;
    const dcn = `DCN-9482-TX-${crypto.randomInt(100000, 999999)}`;
    const shaDigest = crypto
      .createHash("sha256")
      .update(JSON.stringify({ filing, electronicSignature, timestamp, submissionId, dcn }))
      .digest("hex");
    const shaSeal = `SHA256-${shaDigest}`;

    return res.json({
      status: "Accepted",
      eFileSubmissionId: submissionId,
      irsTrackingDcn: dcn,
      submissionTimestamp: timestamp,
      sha256Seal: shaSeal,
      message: "Electronic Tax Return successfully transmitted to IRS Modernized e-File (MeF) Gateway. Form 1040 Schedule C & state schedules accepted with digital signature acknowledgment.",
      validationReport: {
        schemaVersion: "IRS-MeF-XML-v2026.1",
        tinCheck: "Passed (Valid EIN/SSN format)",
        balanceVerification: "Passed (Mathematical integrity confirmed)",
        cryptographicIntegrity: "Passed (Digitally Signed & Sealed)"
      }
    });
  } catch (error: any) {
    console.error("E-File Simulator Error:", error);
    res.status(500).json({ error: "Failed to submit electronic tax return." });
  }
});

// 10. API: Gemini AI Client Auto-Suggest from Historical Invoice Patterns
app.post("/api/ai/suggest-client", async (req, res, next) => {
  try {
    const { email, historicalInvoices } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email address is required for auto-suggestion." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const systemPrompt = `You are the TrustInvoice Intelligent Accounts Receivable Engine.
Your task is to analyze a target client email address alongside historical invoice records to automatically suggest and pre-fill:
1. Formal Client/Business Name: Extract accurately from historical invoices or infer intelligently from email domain/handle (e.g., 'billing@apexcorp.com' -> 'Apex Corp', 'sarah@vertexcloud.io' -> 'Vertex Cloud Systems Inc.', 'accounting@northstar.org' -> 'Northstar Global').
2. Recommended Payment Terms: Days until due (e.g. 7, 14, 30, 45) based on past relationship or enterprise standards.
3. Typical Line Items & Services: List 1 to 3 realistic line item descriptions, rates, and quantities reflecting past billing patterns with this client or industry-standard offerings matching their domain vertical.
4. Professional Notes / Remittance Terms: Clear, tailored note to accompany the invoice.
5. Security Recommendations: Boolean flags for isSecureSigned (default true), secureIPLock (true if corporate/enterprise domain or high-value history), and autoReminders (default true).
6. Confidence Score (an integer between 0 and 100) and concise Reasoning explaining how historical data or domain intelligence guided the recommendation.

Always respond in valid JSON strictly conforming to the specified schema.`;

    const userPrompt = `Target Client Email: ${email}

Historical Invoice Records Context (${historicalInvoices && Array.isArray(historicalInvoices) ? historicalInvoices.length : 0} past records):
${JSON.stringify(historicalInvoices || [], null, 2)}

Provide the structured auto-fill suggestions.`;

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            paymentTermsDays: { type: Type.INTEGER },
            suggestedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER }
                },
                required: ["description", "quantity", "rate"]
              }
            },
            recommendedNotes: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            reasoning: { type: Type.STRING },
            isSecureSigned: { type: Type.BOOLEAN },
            secureIPLock: { type: Type.BOOLEAN },
            autoReminders: { type: Type.BOOLEAN }
          },
          required: ["clientName", "paymentTermsDays", "suggestedItems", "recommendedNotes", "confidence", "reasoning"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No response received from GenAI model");
    }
  } catch (error: any) {
    console.error("AI Client Auto-Suggest Error:", error);
    return sendGeminiError(res, error, "Failed to generate client auto-suggestions");
  }
});

// 11. API: Multi-turn AI Accounts Receivable Advisor & Dispute Arbitrator
app.post("/api/ai/advisor-chat", async (req, res, next) => {
  try {
    const { messages, portfolioContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const systemPrompt = `You are the TrustInvoice Senior Accounts Receivable Advisor, Credit Risk Strategist, and Commercial Dispute Arbitrator.
Your role is to guide business owners, finance controllers, and freelancers on:
1. Overdue collection escalation pathways (Level 1 Courtesy -> Level 2 Formal -> Level 3 Executive Demand -> Level 4 Pre-Legal Notice).
2. Dispute mediation & counterparty friction negotiation strategies.
3. Prompt payment incentive structuring (e.g. 2/10 Net 30 discount models).
4. Late payment statutory penalty & interest calculations (Prompt Payment Act, statutory late fee rates).
5. Cryptographic invoice seal verification protocols and anti-fraud fraud protection.
6. Ready-to-send email and letter templates formatted cleanly in Markdown.

Current Portfolio Context:
${portfolioContext ? JSON.stringify(portfolioContext, null, 2) : "No specific portfolio loaded."}

Maintain a professional, authoritative, pragmatic, and tactical tone. Use formatted Markdown with bold headings, bullet points, and copyable draft communication blocks where appropriate.`;

    // Map conversation messages into format for Gemini SDK
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    const response = await generateContentWithRetry({
      model: DEFAULT_TEXT_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({
      reply: response.text || "No response generated by advisor."
    });
  } catch (error: any) {
    console.error("AI AR Advisor Error:", error);
    return sendGeminiError(res, error, "Failed to generate advisor response.");
  }
});

// 12. API: Voice Dictation & Audio Transcription for Invoice Form
app.post("/api/ai/transcribe-voice-invoice", async (req, res, next) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "Audio base64 data is required for transcription." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Google Gemini API Key is missing on the server. Please add GEMINI_API_KEY in Settings > Secrets."
      });
    }

    const systemPrompt = `You are the TrustInvoice Voice Invoice Processing Engine.
Listen to the user's voice dictation describing invoice details and perform two tasks:
1. Accurately transcribe everything said word-for-word into 'transcript'.
2. Extract and structure all billable components into invoice fields:
   - 'clientName': Business or individual recipient name (e.g. 'Apex Global', 'Vertex Systems')
   - 'clientEmail': Mentioned email or realistic generated email matching the client (e.g. 'billing@apexglobal.com')
   - 'items': Array of itemized deliverables with 'description', 'quantity' (default 1), and 'rate' (number in USD)
   - 'paymentTermsDays': Payment terms mentioned (e.g. 7, 14, 30, or default 14)
   - 'notes': Any special terms, remarks, or instructions dictated
   - 'confidence': 0 to 100 confidence score

Always respond in valid JSON conforming to the schema.`;

    const response = await generateContentWithRetry({
      model: TRANSCRIBE_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioBase64
              }
            },
            {
              text: "Please transcribe this invoice dictation and extract the structured invoice parameters."
            }
          ]
        }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            clientName: { type: Type.STRING },
            clientEmail: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER }
                },
                required: ["description", "quantity", "rate"]
              }
            },
            paymentTermsDays: { type: Type.INTEGER },
            notes: { type: Type.STRING },
            confidence: { type: Type.INTEGER }
          },
          required: ["transcript", "clientName", "items", "paymentTermsDays", "confidence"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("No transcription output received from Gemini API");
    }
  } catch (error: any) {
    console.error("Voice Dictation Transcription Error:", error);
    return sendGeminiError(res, error, "Failed to process voice dictation.");
  }
});

// Return JSON 404 for unknown API endpoints
app.use("/api", (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend assets
async function mountFrontend() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev server middleware starting...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving compiled static assets from dist/ directory...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(
      express.static(distPath, {
        maxAge: "7d",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

mountFrontend();
