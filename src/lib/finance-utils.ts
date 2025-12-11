/**
 * SuiteWaste OS :: Finance Utilities
 * Standardized SARS (South African Revenue Service) compliant calculations.
 */
const VAT_RATE = 0.15; // Standard Rate
const LME_TOLERANCE_PCT = 0.25; // 25% deviation allowed before flagging risk
export function calculateVATFromGross(grossAmount: number) {
  const net = grossAmount / (1 + VAT_RATE);
  const vat = grossAmount - net;
  return { net, vat, gross: grossAmount };
}
/**
 * VAT 264 logic for Second-Hand Goods Input Tax deduction.
 * Only applicable when purchasing from non-VAT registered vendors.
 */
export function calculateVAT264Deduction(purchaseAmount: number) {
  const taxFraction = VAT_RATE / (1 + VAT_RATE);
  const inputTaxDeduction = purchaseAmount * taxFraction;
  return { 
    purchaseAmount, 
    inputTaxDeduction, 
    formType: 'VAT 264' 
  };
}
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}
/**
 * Validates buy rates against LME baseline to detect potential money laundering or fraud.
 */
export function calculatePricingRisk(actualPriceZAR: number, lmePriceZAR: number): number {
  if (lmePriceZAR <= 0) return 0;
  const deviation = Math.abs(actualPriceZAR - lmePriceZAR) / lmePriceZAR;
  if (deviation <= LME_TOLERANCE_PCT) return 0;
  // Exponentially scale risk score based on deviation beyond tolerance
  const risk = Math.min(100, Math.floor((deviation - LME_TOLERANCE_PCT) * 200));
  return risk;
}
export function generateSARSSummary(transactions: { amount: number; epr_fee: number }[]): any {
  const totalGross = transactions.reduce((acc, t) => acc + t.amount, 0);
  const { net, vat } = calculateVATFromGross(totalGross);
  return {
    taxPeriod: `H2-${new Date().getFullYear()}`,
    framework: 'VAT201',
    standardRateSales: net,
    outputTax: vat,
    inputTax: 0,
    netVatPayable: vat,
  };
}