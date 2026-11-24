import { TaxExpense, Contractor1099, QuarterlyVoucher, TaxReturnFiling } from "../types";

export const initialTaxExpenses: TaxExpense[] = [
  {
    id: "exp-1",
    date: "2026-02-14",
    vendor: "Amazon Web Services & Cloud Infrastructure",
    description: "Production Cloud Hosting & Microservice VPC Cluster",
    category: "software_cloud_saas",
    amount: 1840.00,
    deductiblePercent: 100,
    hasReceipt: true,
    notes: "Auto-synced from monthly billing statement"
  },
  {
    id: "exp-2",
    date: "2026-03-01",
    vendor: "Vercel / GitHub Enterprise",
    description: "CI/CD Pipeline & Developer Workspace Seats",
    category: "software_cloud_saas",
    amount: 480.00,
    deductiblePercent: 100,
    hasReceipt: true
  },
  {
    id: "exp-3",
    date: "2026-04-12",
    vendor: "Alex Chen (Frontend Specialist)",
    description: "Contract Labor - UI Component Security Optimization",
    category: "contract_labor",
    amount: 3500.00,
    deductiblePercent: 100,
    hasReceipt: true,
    notes: "Form W-9 received and verified on file"
  },
  {
    id: "exp-4",
    date: "2026-05-18",
    vendor: "Stripe & Interbank Settlement Fees",
    description: "Merchant Payment Gateway & Wire Transfer Verification Fees",
    category: "bank_processing_fees",
    amount: 624.50,
    deductiblePercent: 100,
    hasReceipt: true
  },
  {
    id: "exp-5",
    date: "2026-05-22",
    vendor: "Kearny Legal & IP Counsel LLP",
    description: "SaaS Terms of Service & Enterprise Master Services Agreement (MSA)",
    category: "legal_professional",
    amount: 2200.00,
    deductiblePercent: 100,
    hasReceipt: true
  },
  {
    id: "exp-6",
    date: "2026-06-04",
    vendor: "Apple Store Online",
    description: "M3 Max MacBook Pro for Secure Build Station (Section 179)",
    category: "depreciation_179",
    amount: 3499.00,
    deductiblePercent: 100,
    hasReceipt: true,
    notes: "100% business use equipment eligible for direct Section 179 write-off"
  },
  {
    id: "exp-7",
    date: "2026-06-15",
    vendor: "WeWork Financial District",
    description: "Dedicated Office & Meeting Room Suite",
    category: "rent_lease",
    amount: 2800.00,
    deductiblePercent: 100,
    hasReceipt: true
  },
  {
    id: "exp-8",
    date: "2026-06-20",
    vendor: "Client Strategy Dinner (Acme Global Execs)",
    description: "Business Meals - Q3 Architecture Roadmap Discussion",
    category: "meals_50",
    amount: 380.00,
    deductiblePercent: 50,
    hasReceipt: true,
    notes: "Subject to 50% IRS business meals limitation"
  },
  {
    id: "exp-9",
    date: "2026-06-28",
    vendor: "Google Workspace & Gemini AI Pro",
    description: "Business Email, Drive Storage & GenAI Assistant Seats",
    category: "software_cloud_saas",
    amount: 360.00,
    deductiblePercent: 100,
    hasReceipt: true
  }
];

export const initialContractors1099: Contractor1099[] = [
  {
    id: "c1099-1",
    name: "Alex Chen Consulting",
    tin: "XX-XXX4910",
    type: "Subcontractor_1099_Filed",
    amount: 3500.00,
    formType: "1099-NEC",
    w9Status: "Verified",
    address: "742 Evergreen Terrace, Austin, TX 78701",
    email: "alex.chen.dev@gmail.com"
  },
  {
    id: "c1099-2",
    name: "Acme Global Industries",
    tin: "XX-XXX8211",
    type: "Client_1099_Received",
    amount: 8450.00,
    formType: "1099-NEC",
    w9Status: "Verified",
    address: "100 Innovation Way, Suite 400, New York, NY 10001",
    email: "billing@acmeglobal.com"
  },
  {
    id: "c1099-3",
    name: "Apex Vector Ventures",
    tin: "XX-XXX3094",
    type: "Client_1099_Received",
    amount: 12500.00,
    formType: "1099-NEC",
    w9Status: "Pending",
    address: "500 Sand Hill Road, Menlo Park, CA 94025",
    email: "apex.payments@apexventures.io"
  }
];

export const initialQuarterlyVouchers: QuarterlyVoucher[] = [
  {
    quarter: "Q1",
    period: "Jan 1 – Mar 31",
    dueDate: "2026-04-15",
    projectedIncome: 14500.00,
    estimatedTaxDue: 2150.00,
    status: "Paid",
    paidDate: "2026-04-14",
    confirmationNumber: "EFTPS-2026-0414-9842"
  },
  {
    quarter: "Q2",
    period: "Apr 1 – May 31",
    dueDate: "2026-06-15",
    projectedIncome: 16800.00,
    estimatedTaxDue: 2480.00,
    status: "Paid",
    paidDate: "2026-06-12",
    confirmationNumber: "EFTPS-2026-0612-3819"
  },
  {
    quarter: "Q3",
    period: "Jun 1 – Aug 31",
    dueDate: "2026-09-15",
    projectedIncome: 18200.00,
    estimatedTaxDue: 2750.00,
    status: "Upcoming"
  },
  {
    quarter: "Q4",
    period: "Sep 1 – Dec 31",
    dueDate: "2027-01-15",
    projectedIncome: 21000.00,
    estimatedTaxDue: 3100.00,
    status: "Pending"
  }
];

export const initialTaxReturn: TaxReturnFiling = {
  taxYear: 2026,
  entityType: "SoleProp_ScheduleC",
  businessName: "TrustInvoice Software Technologies LLC",
  einOrSsn: "88-3928104",
  principalActivity: "Software Architecture & Cybersecurity Services",
  naicsCode: "541511", // Custom Computer Programming Services
  accountingMethod: "Cash",
  filingStatus: "Single",
  state: "California",
  grossReceipts: 25600.00,
  returnsAndAllowances: 0,
  costOfGoodsSold: 0,
  expenses: initialTaxExpenses,
  totalDeductions: 15483.50,
  netBusinessProfit: 10116.50,
  selfEmploymentTax: 1429.46,
  seTaxDeduction: 714.73,
  qbiDeduction: 2023.30,
  federalTaxableIncome: 7378.47,
  estimatedFederalTax: 738.00,
  estimatedStateTax: 405.00,
  totalTaxLiability: 2572.46,
  totalPrepaidEstimates: 4630.00,
  refundOrBalanceDue: -2057.54, // Refund expected of $2,057.54
  auditRiskScore: 14,
  auditRiskLevel: "Low",
  eFileStatus: "Draft",
  signerName: "Ali Wer",
  signerTitle: "Founder & Chief Architect",
  bankDirectDebit: {
    bankName: "First National Trust Bank",
    routingNo: "121000248",
    accountNo: "9048394821",
    debitDate: "2026-10-15"
  }
};
