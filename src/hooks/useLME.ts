import { useState, useEffect, useCallback } from 'react';
export interface LMEPrice {
  id: string;
  name: string;
  priceZAR: number;
  changePct: number;
  unit: 'kg' | 't';
}
const INITIAL_PRICES: LMEPrice[] = [
  { id: 'lme-cu', name: 'Copper Grade A', priceZAR: 165.40, changePct: 1.2, unit: 'kg' },
  { id: 'lme-al', name: 'Aluminum Siding', priceZAR: 38.20, changePct: -0.5, unit: 'kg' },
  { id: 'lme-zn', name: 'Zinc High Grade', priceZAR: 52.10, changePct: 0.8, unit: 'kg' },
  { id: 'lme-pb', name: 'Lead Scrap', priceZAR: 32.50, changePct: 0.2, unit: 'kg' },
];
export function useLME() {
  const [prices, setPrices] = useState<LMEPrice[]>(INITIAL_PRICES);
  const simulateUpdate = useCallback(() => {
    setPrices(current => current.map(p => ({
      ...p,
      priceZAR: p.priceZAR + (Math.random() - 0.5) * 0.5,
      changePct: p.changePct + (Math.random() - 0.5) * 0.1
    })));
  }, []);
  useEffect(() => {
    const interval = setInterval(simulateUpdate, 5000);
    return () => clearInterval(interval);
  }, [simulateUpdate]);
  const getPriceForMaterial = useCallback((materialName: string): LMEPrice | undefined => {
    const lower = materialName.toLowerCase();
    if (lower.includes('copper')) return prices.find(p => p.id === 'lme-cu');
    if (lower.includes('alum')) return prices.find(p => p.id === 'lme-al');
    if (lower.includes('zinc')) return prices.find(p => p.id === 'lme-zn');
    if (lower.includes('lead')) return prices.find(p => p.id === 'lme-pb');
    return undefined;
  }, [prices]);
  return { prices, getPriceForMaterial };
}