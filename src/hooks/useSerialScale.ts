import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'parsing';
interface SerialScale {
  weight: number;
  status: ScaleStatus;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}
// Common scale data patterns:
// - Mettler Toledo: "ST,GS,  10.123 kg\r\n" (Stable, Gross) or "US,GS,  -0.123 kg\r\n" (Unstable)
// - Generic: "10.12 kg", "Weight: 10.123kg"
const WEIGHT_REGEX = /(\d+\.\d+)/;
export function useSerialScale(): SerialScale {
  const [weight, setWeight] = useState<number>(0.0);
  const [status, setStatus] = useState<ScaleStatus>('disconnected');
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef<boolean>(true);
  const readLoop = useCallback(async () => {
    if (!portRef.current || !readerRef.current) return;
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    setStatus('parsing');
    while (portRef.current.readable && keepReadingRef.current) {
      try {
        const { value, done } = await readerRef.current.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/[\r\n]+/);
        if (lines.length > 1) {
          const completeLine = lines[lines.length - 2]; // Process the second to last line
          const match = completeLine.match(WEIGHT_REGEX);
          if (match && match[1]) {
            const parsedWeight = parseFloat(match[1]);
            setWeight(parsedWeight);
          }
          buffer = lines[lines.length - 1]; // Keep the last partial line
        }
      } catch (error) {
        console.error('Error during read loop:', error);
        toast.error('Scale read error', { description: 'The connection was lost.' });
        setStatus('error');
        break;
      }
    }
  }, []);
  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      toast.error('Web Serial API not supported', {
        description: 'Please use a compatible browser like Chrome or Edge.',
      });
      setStatus('error');
      return;
    }
    if (portRef.current) {
      toast.info('A scale is already connected.');
      return;
    }
    setStatus('connecting');
    try {
      const port = await navigator.serial.requestPort();
      portRef.current = port;
      // Try common baud rates
      try {
        await port.open({ baudRate: 9600 });
      } catch (e) {
        console.warn('Failed to open at 9600 baud, trying 19200');
        await port.open({ baudRate: 19200 });
      }
      keepReadingRef.current = true;
      port.addEventListener('disconnect', () => {
        toast.warning('Scale disconnected.');
        disconnect();
      });
      if (port.readable) {
        readerRef.current = port.readable.getReader();
        setStatus('connected');
        toast.success('Scale connected successfully!');
        readLoop();
      }
    } catch (err) {
      setStatus('error');
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error('Failed to connect to scale', { description: err.message });
      } else {
        setStatus('disconnected'); // User cancelled the dialog
      }
      portRef.current = null;
    }
  }, [readLoop]);
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (error) {
        // Ignore cancel error
      } finally {
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (error) {
        console.error('Failed to close port:', error);
      } finally {
        portRef.current = null;
      }
    }
    setStatus('disconnected');
    setWeight(0.0);
  }, []);
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (portRef.current) {
        disconnect();
      }
    };
  }, [disconnect]);
  return { weight, status, connect, disconnect };
}