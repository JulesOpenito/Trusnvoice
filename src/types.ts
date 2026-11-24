export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export type AuditEventType = 
  | "email_open" 
  | "link_click" 
  | "payment_update" 
  | "reminder_sent" 
  | "invoice_created" 
  | "security_seal" 
  | "system";

export interface SecurityAuditEntry {
  timestamp: string;
  action: string;
  ipAddress: string;
  status: "success" | "warn" | "info" | "error";
  details: string;
  eventType?: AuditEventType;
  userAgent?: string;
  location?: string;
  device?: string;
  metadata?: Record<string, any>;
}

export interface BankDetails {
  bankName: string;
  routingNo: string;
  accountNo: string;
  iban: string;
  swift: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  status: "Paid" | "Sent" | "Overdue" | "Review";
  items: InvoiceItem[];
  isSecureSigned: boolean;
  secureIPLock: boolean;
  autoReminders: boolean;
  trustSealHash: string;
  fraudRiskScore: number;
  notes: string;
  paymentDetails: BankDetails;
  auditLogs: SecurityAuditEntry[];
  payStubDetails?: Partial<PayStubConfig>;
  receiptDetails?: Partial<ReceiptConfig>;
}

export type DocumentFormat = "invoice" | "receipt" | "paystub";

export type AccountRole = "merchant" | "client";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  companyName: string;
  accountRole: AccountRole;
  phone?: string;
  taxId?: string;
  billingAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PayStubConfig {
  employeeName: string;
  employeeId: string;
  ssnMasked: string;
  designation: string;
  payType: "W2_Hourly" | "W2_Salary" | "1099_Contractor";
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  checkNumber: string;
  hoursWorked: number;
  hourlyRate: number;
  grossEarnings: number;
  federalTaxWithholding: number;
  stateTaxWithholding: number;
  socialSecurityTax: number;
  medicareTax: number;
  healthInsurance: number;
  retirement401k: number;
  totalDeductions: number;
  netPay: number;
  ytdGross: number;
  ytdDeductions: number;
  ytdNet: number;
  depositBank: string;
  depositAccountMasked: string;
}

export interface ReceiptConfig {
  receiptNumber: string;
  paymentMethod: "Fedwire Wire Transfer" | "ACH Direct Debit" | "Credit Card (Corporate Visa)" | "Corporate Check" | "Zelle / Instant Rail";
  transactionId: string;
  paidDate: string;
  paidTime: string;
  totalPaid: number;
  balanceRemaining: number;
  paymentStatus: "Settled & Cleared" | "Authorized" | "Processing";
  payerName: string;
  payerEmail: string;
  payeeName: string;
  payeeTaxId: string;
  authCode: string;
  notes: string;
}

export type TaxEntity = 
  | "SoleProp_ScheduleC" 
  | "LLC_Disregarded" 
  | "SCorp_1120S" 
  | "CCorp_1120" 
  | "Partnership_1065";

export type TaxExpenseCategory =
  | "software_cloud_saas"
  | "contract_labor"
  | "office_supplies"
  | "advertising"
  | "legal_professional"
  | "bank_processing_fees"
  | "car_mileage"
  | "travel"
  | "meals_50"
  | "depreciation_179"
  | "rent_lease"
  | "utilities_internet"
  | "home_office"
  | "insurance"
  | "taxes_licenses"
  | "repairs_maintenance"
  | "other";

export interface TaxExpense {
  id: string;
  date: string;
  vendor: string;
  description: string;
  category: TaxExpenseCategory;
  amount: number;
  deductiblePercent: number;
  hasReceipt: boolean;
  notes?: string;
  isAuditFlagged?: boolean;
}

export interface Contractor1099 {
  id: string;
  name: string;
  tin: string;
  type: "Client_1099_Received" | "Subcontractor_1099_Filed";
  amount: number;
  formType: "1099-NEC" | "1099-K" | "1099-MISC";
  w9Status: "Verified" | "Pending" | "Missing";
  address: string;
  email?: string;
}

export interface QuarterlyVoucher {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  period: string;
  dueDate: string;
  projectedIncome: number;
  estimatedTaxDue: number;
  status: "Paid" | "Pending" | "Upcoming" | "Overdue";
  paidDate?: string;
  confirmationNumber?: string;
}

export interface TaxReturnFiling {
  taxYear: number;
  entityType: TaxEntity;
  businessName: string;
  einOrSsn: string;
  principalActivity: string;
  naicsCode: string;
  accountingMethod: "Cash" | "Accrual";
  filingStatus: "Single" | "Married_Joint" | "Head_Of_Household" | "Corporate";
  state: string;
  grossReceipts: number;
  returnsAndAllowances: number;
  costOfGoodsSold: number;
  expenses: TaxExpense[];
  totalDeductions: number;
  netBusinessProfit: number;
  selfEmploymentTax: number;
  seTaxDeduction: number;
  qbiDeduction: number;
  federalTaxableIncome: number;
  estimatedFederalTax: number;
  estimatedStateTax: number;
  totalTaxLiability: number;
  totalPrepaidEstimates: number;
  refundOrBalanceDue: number;
  auditRiskScore: number;
  auditRiskLevel: "Low" | "Moderate" | "High";
  eFileStatus: "Draft" | "Validated" | "Submitted" | "Accepted";
  eFileSubmissionId?: string;
  irsTrackingDcn?: string;
  submissionTimestamp?: string;
  sha256Seal?: string;
  signerName: string;
  signerTitle: string;
  bankDirectDebit?: {
    bankName: string;
    routingNo: string;
    accountNo: string;
    debitDate: string;
  };
}

export interface AITaxAuditResponse {
  auditRiskScore: number;
  auditRiskLevel: "Low" | "Moderate" | "High";
  redFlags: Array<{
    title: string;
    severity: "low" | "medium" | "high";
    description: string;
    recommendation: string;
  }>;
  overlookedDeductions: Array<{
    title: string;
    estimatedSavings: number;
    category: TaxExpenseCategory;
    ircCode: string;
    rationale: string;
  }>;
  totalPotentialSavings: number;
  executiveSummary: string;
  qbiDeductionEligible: boolean;
  sCorpRecommendation: {
    recommended: boolean;
    estimatedAnnualSavings: number;
    explanation: string;
  };
}
