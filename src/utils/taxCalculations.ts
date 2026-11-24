import { TaxReturnFiling, TaxExpense, TaxEntity } from "../types";

export interface TaxComputationResult {
  grossReceipts: number;
  returnsAndAllowances: number;
  grossIncome: number;
  totalDeductions: number;
  deductionsByCategory: Record<string, number>;
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
  effectiveTaxRate: number;
  auditRiskScore: number;
  auditRiskLevel: "Low" | "Moderate" | "High";
  detectedAuditFlags: string[];
}

export function computeTaxReturn(
  filing: TaxReturnFiling,
  expenses: TaxExpense[],
  grossReceiptsOverride?: number,
  prepaidEstimatesOverride?: number
): TaxComputationResult {
  const grossReceipts = grossReceiptsOverride !== undefined ? grossReceiptsOverride : filing.grossReceipts;
  const returns = filing.returnsAndAllowances || 0;
  const cogs = filing.costOfGoodsSold || 0;
  const grossIncome = Math.max(0, grossReceipts - returns - cogs);

  // Compute deductible amount per expense
  const deductionsByCategory: Record<string, number> = {};
  let totalDeductions = 0;

  expenses.forEach((exp) => {
    const deductibleAmt = (exp.amount * (exp.deductiblePercent || 100)) / 100;
    totalDeductions += deductibleAmt;
    deductionsByCategory[exp.category] = (deductionsByCategory[exp.category] || 0) + deductibleAmt;
  });

  const netBusinessProfit = Math.max(0, grossIncome - totalDeductions);

  // Self-Employment Tax computation (Schedule SE):
  // 92.35% of net business profit is subject to SE tax (15.3%: 12.4% OASDI + 2.9% Medicare)
  let selfEmploymentTax = 0;
  let seTaxDeduction = 0;

  if (filing.entityType === "SoleProp_ScheduleC" || filing.entityType === "LLC_Disregarded") {
    const seEarnings = netBusinessProfit * 0.9235;
    selfEmploymentTax = seEarnings * 0.153;
    seTaxDeduction = selfEmploymentTax * 0.5; // 50% above-the-line deduction
  } else if (filing.entityType === "SCorp_1120S") {
    // S-Corps do not pay SE tax on distributions, only payroll taxes on officer W-2 salary
    selfEmploymentTax = 0;
    seTaxDeduction = 0;
  } else {
    selfEmploymentTax = netBusinessProfit * 0.9235 * 0.153;
    seTaxDeduction = selfEmploymentTax * 0.5;
  }

  // Section 199A Qualified Business Income (QBI) Deduction (20% of net profit minus SE tax deduction)
  const qbiEligibleProfit = Math.max(0, netBusinessProfit - seTaxDeduction);
  const qbiDeduction = qbiEligibleProfit * 0.20;

  // Standard Federal AGI / Taxable Income (assuming standard deduction ~$14,600 for Single in 2026)
  const standardDeduction = 14600;
  const adjustedGrossIncome = Math.max(0, netBusinessProfit - seTaxDeduction);
  const federalTaxableIncome = Math.max(0, adjustedGrossIncome - qbiDeduction - (filing.filingStatus === "Single" ? standardDeduction * 0.5 : standardDeduction));

  // 2026 Marginal Federal Tax Brackets calculation
  let estimatedFederalTax = 0;
  if (federalTaxableIncome > 0) {
    if (federalTaxableIncome <= 11925) {
      estimatedFederalTax = federalTaxableIncome * 0.10;
    } else if (federalTaxableIncome <= 48475) {
      estimatedFederalTax = 1192.50 + (federalTaxableIncome - 11925) * 0.12;
    } else if (federalTaxableIncome <= 103350) {
      estimatedFederalTax = 5578.50 + (federalTaxableIncome - 48475) * 0.22;
    } else {
      estimatedFederalTax = 17651.00 + (federalTaxableIncome - 103350) * 0.24;
    }
  }

  // State Tax Estimation based on state
  let stateRate = 0.05; // Default ~5%
  if (filing.state === "California") stateRate = 0.06;
  if (filing.state === "New York") stateRate = 0.058;
  if (filing.state === "Texas" || filing.state === "Florida" || filing.state === "Washington") stateRate = 0;
  
  const estimatedStateTax = netBusinessProfit * stateRate;

  const totalTaxLiability = estimatedFederalTax + selfEmploymentTax + estimatedStateTax;
  const totalPrepaidEstimates = prepaidEstimatesOverride !== undefined ? prepaidEstimatesOverride : filing.totalPrepaidEstimates;
  const refundOrBalanceDue = totalTaxLiability - totalPrepaidEstimates;

  const effectiveTaxRate = grossIncome > 0 ? (totalTaxLiability / grossIncome) * 100 : 0;

  // IRS Red-Flag and Audit Risk Detector
  const detectedAuditFlags: string[] = [];
  let auditRiskScore = 10;

  // Flag 1: High meals/entertainment ratio (>10% of total deductions)
  const mealsDeduction = deductionsByCategory["meals_50"] || 0;
  if (totalDeductions > 0 && mealsDeduction / totalDeductions > 0.12) {
    detectedAuditFlags.push("Meals expense ratio exceeds 12% of total business deductions (IRS scrutiny flag).");
    auditRiskScore += 18;
  }

  // Flag 2: Rounded Numbers Check (IRS flags multiple expenses ending in exact 00.00)
  const roundedExpensesCount = expenses.filter(e => e.amount % 100 === 0).length;
  if (roundedExpensesCount > 4) {
    detectedAuditFlags.push("Multiple exact hundred-dollar round expense amounts detected. Keep itemized receipts.");
    auditRiskScore += 12;
  }

  // Flag 3: Large Net Loss in Service Business
  if (grossIncome > 0 && totalDeductions > grossIncome * 1.5) {
    detectedAuditFlags.push("Business shows substantial net loss relative to gross receipts (Hobby Loss IRC §183 check).");
    auditRiskScore += 25;
  }

  // Flag 4: Missing receipts on high dollar transactions (>$75 requires receipt by IRS regulations)
  const missingReceiptsHighValue = expenses.filter(e => !e.hasReceipt && e.amount > 75).length;
  if (missingReceiptsHighValue > 0) {
    detectedAuditFlags.push(`${missingReceiptsHighValue} transactions over $75 lack digital receipt attachments (IRS §274).`);
    auditRiskScore += missingReceiptsHighValue * 6;
  }

  // Flag 5: High Home Office or Vehicle Travel
  if ((deductionsByCategory["car_mileage"] || 0) > 8000) {
    detectedAuditFlags.push("Vehicle mileage deduction requires strict concurrent mileage travel log.");
    auditRiskScore += 10;
  }

  auditRiskScore = Math.min(99, Math.max(5, auditRiskScore));
  let auditRiskLevel: "Low" | "Moderate" | "High" = "Low";
  if (auditRiskScore >= 50) auditRiskLevel = "High";
  else if (auditRiskScore >= 25) auditRiskLevel = "Moderate";

  return {
    grossReceipts,
    returnsAndAllowances: returns,
    grossIncome,
    totalDeductions,
    deductionsByCategory,
    netBusinessProfit,
    selfEmploymentTax,
    seTaxDeduction,
    qbiDeduction,
    federalTaxableIncome,
    estimatedFederalTax,
    estimatedStateTax,
    totalTaxLiability,
    totalPrepaidEstimates,
    refundOrBalanceDue,
    effectiveTaxRate,
    auditRiskScore,
    auditRiskLevel,
    detectedAuditFlags
  };
}

export const CATEGORY_LABELS: Record<string, { label: string; line: string; description: string }> = {
  software_cloud_saas: { label: "Cloud, Software & SaaS Subscriptions", line: "Line 27a (Other)", description: "Server hosting, developer tooling, AI APIs, workspace apps" },
  contract_labor: { label: "Contract Labor / Freelancers", line: "Line 11", description: "Payments made to 1099 independent contractors" },
  depreciation_179: { label: "Section 179 Property & Equipment", line: "Line 13", description: "Laptops, workstations, test servers written off in full" },
  legal_professional: { label: "Legal & Professional Services", line: "Line 17", description: "Attorney counsel, CPA audits, tax prep, IP filing" },
  office_supplies: { label: "Office Supplies & Hardware", line: "Line 18", description: "Desk peripherals, stationery, cables, testing hardware" },
  rent_lease: { label: "Office & Workspace Rent / Lease", line: "Line 20b", description: "Coworking memberships, private studio leases" },
  advertising: { label: "Advertising & Marketing", line: "Line 8", description: "Search ads, social media campaigns, sponsorship costs" },
  bank_processing_fees: { label: "Bank & Merchant Processing Fees", line: "Line 10 / Line 27a", description: "Stripe fees, wire transfer processing, merchant discount" },
  car_mileage: { label: "Car & Truck Expenses (Mileage)", line: "Line 9", description: "Standard mileage rate (67¢/mile) or actual operational costs" },
  travel: { label: "Business Travel & Lodging", line: "Line 24a", description: "Flights, trains, hotels for client meetings and tech conferences" },
  meals_50: { label: "Business Meals (50% Deductible)", line: "Line 24b", description: "Client strategy meals, late team dinners on projects" },
  utilities_internet: { label: "Utilities & Business Fiber Internet", line: "Line 25", description: "High-speed broadband, business telecom connections" },
  home_office: { label: "Home Office Deduction (Simplified / Actual)", line: "Line 30", description: "$5/sq ft up to 300 sq ft or actual proportion of home" },
  insurance: { label: "Business Insurance & Errors & Omissions", line: "Line 15", description: "Cyber liability, general business umbrella insurance" },
  taxes_licenses: { label: "Taxes & Local Business Licenses", line: "Line 23", description: "City business license, state registration fees, franchise tax" },
  repairs_maintenance: { label: "Repairs & Maintenance", line: "Line 21", description: "Hardware repairs, workstation screen replacements" },
  other: { label: "Other Miscellaneous Expenses", line: "Line 27a", description: "Domain renewals, security hardware tokens, reference books" }
};
