/**
 * SuiteWaste OS :: Finance Utilities
 * Standardized SARS (South African Revenue Service) compliant calculations.
 */
const VAT_RATE = 0.15; // Current South African VAT Rate
export function calculateVATFromGross(grossAmount: number) {
  const net = grossAmount / (1 + VAT_RATE);
  const vat = grossAmount - net;
  return { net, vat, gross: grossAmount };
}
export function calculateVATFromNet(netAmount: number) {
  const vat = netAmount * VAT_RATE;
  const gross = netAmount + vat;
  return { net: netAmount, vat, gross };
}
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount);
}
export interface SARSSummary {
  taxPeriod: string;
  framework: string;
  standardRateSales: number;
  outputTax: number;
  inputTax: number;
  netVatPayable: number;
}
export function generateSARSSummary(transactions: { amount: number; epr_fee: number }[]): SARSSummary {
  const totalGross = transactions.reduce((acc, t) => acc + t.amount, 0);
  const { net, vat } = calculateVATFromGross(totalGross);
  return {
    taxPeriod: `H2-${new Date().getFullYear()}`,
    framework: 'VAT201',
    standardRateSales: net,
    outputTax: vat,
    inputTax: 0, // In this PWA we primarily track output tax on collections
    netVatPayable: vat,
  };
}