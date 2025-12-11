import { useState, useCallback } from 'react';
import { toast } from 'sonner';
export interface TransactionReceipt {
  id: string;
  timestamp: number;
  supplierName: string;
  material: string;
  weight: number;
  amount: number;
  currency: string;
}
export function usePrinter() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const connect = useCallback(async () => {
    // Industrial printers usually use Web Serial or Web USB.
    // For now we mock the successful connection.
    try {
      setStatus('connected');
      toast.success("Thermal Printer Linked", { description: "Ready for high-speed industrial printing." });
    } catch (e) {
      toast.error("Printer link failed");
    }
  }, []);
  const printReceipt = useCallback(async (data: TransactionReceipt) => {
    if (status !== 'connected') {
      toast.error("Printer offline", { description: "Please connect a receipt printer first." });
      return;
    }
    setIsPrinting(true);
    // ESC/POS Mock: centering, bold, and double-height logic
    const esc = {
      INIT: '\x1b\x40',
      CENTER: '\x1b\x61\x01',
      BOLD_ON: '\x1b\x45\x01',
      BOLD_OFF: '\x1b\x45\x00',
      DOUBLE_HEIGHT: '\x1d\x21\x11',
      NORMAL_SIZE: '\x1d\x21\x00',
      FEED_AND_CUT: '\x1d\x56\x41\x03',
    };
    console.log("SENDING TO PRINTER:", {
      header: "SUITEWASTE OS",
      receiptId: data.id,
      supplier: data.supplierName,
      material: data.material,
      weight: `${data.weight}kg`,
      total: `${data.currency} ${data.amount.toFixed(2)}`,
    });
    // Simulate thermal head latency
    await new Promise(r => setTimeout(r, 1500));
    setIsPrinting(false);
    toast.success("Receipt Printed", { description: `Slip #${data.id.substring(0, 8)} finalized.` });
  }, [status]);
  return { isPrinting, status, connect, printReceipt };
}