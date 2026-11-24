import { Invoice } from "../types";

export const initialInvoices: Invoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-001",
    clientName: "Acme Global Industries",
    clientEmail: "billing@acmeglobal.com",
    amount: 8450.00,
    issuedDate: "2026-05-15",
    dueDate: "2026-06-15",
    status: "Overdue",
    items: [
      { id: "item-1", description: "Strategic Cybersecurity Architecture Audit", quantity: 1, rate: 5000.00 },
      { id: "item-2", description: "Enterprise Cloud-Run Integration Implementation", quantity: 15, rate: 230.00 }
    ],
    isSecureSigned: true,
    secureIPLock: true,
    autoReminders: true,
    trustSealHash: "SHA256-4f9e8a71b2d03e5a6f8c7b90aefd1234c",
    fraudRiskScore: 3,
    notes: "Requires secure direct deposit confirmation under standard agency protocol.",
    paymentDetails: {
      bankName: "First National Trust Bank",
      routingNo: "121000248",
      accountNo: "9048394821",
      iban: "US56FNTB1210002489048394821",
      swift: "FNTBUSA33"
    },
    auditLogs: [
      { 
        timestamp: "2026-05-15T09:00:00-07:00", 
        action: "Invoice Registered & Cryptographically Sealed", 
        ipAddress: "192.168.1.100", 
        status: "success", 
        eventType: "invoice_created",
        details: "Invoice INV-2026-001 generated with SHA-256 seal (SHA256-4f9e8a71b2d03e5a6f8c7b90aefd1234c)." 
      },
      { 
        timestamp: "2026-05-15T09:05:12-07:00", 
        action: "Email Invoice Notification Dispatched", 
        ipAddress: "mail-relay.trustinvoice.io", 
        status: "info", 
        eventType: "reminder_sent",
        details: "Secure invoice transmission sent via TLS 1.3 to billing@acmeglobal.com." 
      },
      { 
        timestamp: "2026-05-15T11:24:38-07:00", 
        action: "Email Invoice Opened by Recipient", 
        ipAddress: "64.233.160.15", 
        location: "New York, NY, United States",
        userAgent: "Apple Mail / macOS 14.5",
        status: "success", 
        eventType: "email_open",
        details: "Recipient billing@acmeglobal.com opened email invoice message (Message-ID: <msg-acme-20260515@trustinvoice.io>). Pixel tracking verified." 
      },
      { 
        timestamp: "2026-05-15T11:25:02-07:00", 
        action: "Secure Client Portal Link Clicked", 
        ipAddress: "64.233.160.15", 
        location: "New York, NY, United States",
        userAgent: "Safari 17.5 on macOS",
        status: "success", 
        eventType: "link_click",
        details: "Clicked secure inspection link from email (token #tk_acme_948210). IP lock verified." 
      },
      { 
        timestamp: "2026-06-15T00:00:01-07:00", 
        action: "Payment Status Updated: Overdue", 
        ipAddress: "cron-engine.trustinvoice.io", 
        status: "warn", 
        eventType: "payment_update",
        details: "Due date 2026-06-15 reached with uncollected balance of $8,450.00. Automatic status transition to OVERDUE." 
      },
      { 
        timestamp: "2026-06-16T08:30:00-07:00", 
        action: "AI Escalation Reminder Dispatched", 
        ipAddress: "system-cron", 
        status: "info", 
        eventType: "reminder_sent",
        details: "Automated Level-1 collection notice generated using AI Formal tone, sent to billing@acmeglobal.com." 
      },
      { 
        timestamp: "2026-06-16T09:12:44-07:00", 
        action: "Reminder Email Opened by Recipient", 
        ipAddress: "64.233.160.18", 
        location: "New York, NY, United States",
        userAgent: "Outlook 365 / Windows 11",
        status: "success", 
        eventType: "email_open",
        details: "Overdue escalation reminder email opened by Accounts Payable department." 
      },
      { 
        timestamp: "2026-06-16T09:14:10-07:00", 
        action: "Direct Remittance Link Clicked", 
        ipAddress: "64.233.160.18", 
        location: "New York, NY, United States",
        userAgent: "Chrome 125.0 on Windows 11",
        status: "success", 
        eventType: "link_click",
        details: "Clicked 'View & Settle Account' link from reminder email. Banking remittance coordinates reviewed." 
      }
    ]
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-002",
    clientName: "Starlight Digital Agency",
    clientEmail: "accounts@starlight.co",
    amount: 3200.00,
    issuedDate: "2026-06-01",
    dueDate: "2026-07-01",
    status: "Sent",
    items: [
      { id: "item-3", description: "Full-Stack Brand Strategy & UI Framework", quantity: 1, rate: 3200.00 }
    ],
    isSecureSigned: true,
    secureIPLock: false,
    autoReminders: true,
    trustSealHash: "SHA256-b8e7c6d5f4a392810ce7b6e5d4c3b2a1a",
    fraudRiskScore: 12,
    notes: "Client requested secondary email invoice backup.",
    paymentDetails: {
      bankName: "Chase Manhattan Security",
      routingNo: "021000021",
      accountNo: "4829103948",
      iban: "US49CHAS0210000214829103948",
      swift: "CHASUS33"
    },
    auditLogs: [
      { 
        timestamp: "2026-06-01T10:15:22-07:00", 
        action: "Invoice Registered & Sealed", 
        ipAddress: "192.168.1.100", 
        status: "success", 
        eventType: "invoice_created",
        details: "Cryptographic hash SHA256-b8e7c6d5f4a392810ce7b6e5d4c3b2a1a generated." 
      },
      { 
        timestamp: "2026-06-01T10:16:05-07:00", 
        action: "Email Invoice Dispatched", 
        ipAddress: "mail-relay.trustinvoice.io", 
        status: "info", 
        eventType: "reminder_sent",
        details: "Invoice dispatched to accounts@starlight.co with verified DKIM & SPF signatures." 
      },
      { 
        timestamp: "2026-06-02T11:03:45-07:00", 
        action: "Email Invoice Opened", 
        ipAddress: "23.45.120.91", 
        location: "San Francisco, CA, United States",
        userAgent: "Gmail Web Client / Chrome 125 (macOS)",
        status: "success", 
        eventType: "email_open",
        details: "Email opened by recipient accounts@starlight.co." 
      },
      { 
        timestamp: "2026-06-02T11:04:10-07:00", 
        action: "Client Portal Link Clicked", 
        ipAddress: "23.45.120.91", 
        location: "San Francisco, CA, United States",
        userAgent: "Chrome 125 on macOS",
        status: "success", 
        eventType: "link_click",
        details: "Client accessed secure inspection portal from email link." 
      },
      { 
        timestamp: "2026-06-02T11:06:30-07:00", 
        action: "Payment Status Updated: Pending Wire", 
        ipAddress: "system-portal", 
        status: "info", 
        eventType: "payment_update",
        details: "Counterparty reviewed wire transit ABA #021000021 and account parameters for pending settlement." 
      }
    ]
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-003",
    clientName: "Nouveau Creative Labs",
    clientEmail: "finance@nouveaulabs.io",
    amount: 1450.00,
    issuedDate: "2026-05-10",
    dueDate: "2025-06-10",
    status: "Paid",
    items: [
      { id: "item-4", description: "Swiss Minimalist Visual Assets Kit", quantity: 5, rate: 290.00 }
    ],
    isSecureSigned: true,
    secureIPLock: true,
    autoReminders: false,
    trustSealHash: "SHA256-ff4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c",
    fraudRiskScore: 0,
    notes: "Paid in full via instant secure wire routing.",
    paymentDetails: {
      bankName: "First National Trust Bank",
      routingNo: "121000248",
      accountNo: "9048394821",
      iban: "US56FNTB1210002489048394821",
      swift: "FNTBUSA33"
    },
    auditLogs: [
      { 
        timestamp: "2026-05-10T14:00:00-07:00", 
        action: "Invoice Registered & Certified", 
        ipAddress: "192.168.1.100", 
        status: "success", 
        eventType: "invoice_created",
        details: "Invoice INV-2026-003 generated and cryptographically sealed." 
      },
      { 
        timestamp: "2026-05-10T14:01:30-07:00", 
        action: "Email Invoice Dispatched", 
        ipAddress: "mail-relay.trustinvoice.io", 
        status: "info", 
        eventType: "reminder_sent",
        details: "Invoice delivered to finance@nouveaulabs.io." 
      },
      { 
        timestamp: "2026-05-10T15:30:20-07:00", 
        action: "Email Invoice Opened", 
        ipAddress: "72.14.201.2", 
        location: "Austin, TX, United States",
        userAgent: "Superhuman / iOS 17.5",
        status: "success", 
        eventType: "email_open",
        details: "finance@nouveaulabs.io opened the invoice email on mobile." 
      },
      { 
        timestamp: "2026-05-10T15:31:05-07:00", 
        action: "Secure Remittance Link Clicked", 
        ipAddress: "72.14.201.2", 
        location: "Austin, TX, United States",
        userAgent: "Mobile Safari / iOS 17.5",
        status: "success", 
        eventType: "link_click",
        details: "Clicked direct payment portal link from notification." 
      },
      { 
        timestamp: "2026-05-11T16:44:12-07:00", 
        action: "Instant Bank Wire Initiated", 
        ipAddress: "72.14.201.2", 
        location: "Austin, TX, United States",
        userAgent: "Chrome 125 (macOS)",
        status: "success", 
        eventType: "payment_update",
        details: "Client authorized direct electronic wire transfer of $1,450.00." 
      },
      { 
        timestamp: "2026-05-11T16:45:00-07:00", 
        action: "Payment Status Updated: Paid in Full", 
        ipAddress: "system-bank-gateway", 
        status: "success", 
        eventType: "payment_update",
        details: "Interbank Fedwire funds settled ($1,450.00). Ledger marked PAID." 
      }
    ]
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-2026-004",
    clientName: "Apex Vector Ventures",
    clientEmail: "apex.payments@apexventures.io",
    amount: 12500.00,
    issuedDate: "2026-06-18",
    dueDate: "2026-07-18",
    status: "Review",
    items: [
      { id: "item-5", description: "Anti-Fraud Infrastructure Dev", quantity: 1, rate: 12500.00 }
    ],
    isSecureSigned: false,
    secureIPLock: true,
    autoReminders: true,
    trustSealHash: "SHA256-unsigned-8392104938a9284faefea",
    fraudRiskScore: 48,
    notes: "Requires urgent secure deposit bank detail checks due to unusual client domain change.",
    paymentDetails: {
      bankName: "Chase Manhattan Security",
      routingNo: "021000021",
      accountNo: "4829103948",
      iban: "US49CHAS0210000214829103948",
      swift: "CHASUS33"
    },
    auditLogs: [
      { 
        timestamp: "2026-06-18T11:22:00-07:00", 
        action: "Invoice Registered as Draft", 
        ipAddress: "192.168.1.100", 
        status: "info", 
        eventType: "invoice_created",
        details: "Flagged: Client email mismatched with registrar databases." 
      },
      { 
        timestamp: "2026-06-18T11:25:00-07:00", 
        action: "Payment Status Updated: Under Review", 
        ipAddress: "security-daemon", 
        status: "warn", 
        eventType: "payment_update",
        details: "Anti-fraud scanner held automatic dispatch pending manual authorization." 
      }
    ]
  }
];
