import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
// Define Web Serial types for the hook
type SerialPortRequestOptions = {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
};
type SerialPort = EventTarget & {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  addEventListener(type: 'disconnect', listener: (ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'disconnect', listener: (ev: Event) => any, options?: boolean | EventListenerOptions): void;
};
declare global {
  interface Navigator {
    serial: {
      requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
      getPorts(): Promise<SerialPort[]>;
    };
  }
}
type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'parsing' | 'failover';
interface DeviceHealth {
  id: string;
  name: string;
  status: ScaleStatus;
  lastSeen: number;
}
const WEIGHT_REGEX = /(\d+\.\d+)/;
export function useMultiScale() {
  const [weight, setWeight] = useState<number>(0.0);
  const [status, setStatus] = useState<ScaleStatus>('disconnected');
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const keepReadingRef = useRef<boolean>(true);
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (e) {
        console.warn('Reader cancel failed or already closed', e);
      }
      try {
        readerRef.current.releaseLock();
      } catch (e) {
        // Lock may already be released
      }
      readerRef.current = null;
    }
    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (e) {
        console.error('Failed to close serial port', e);
      }
      portRef.current = null;
    }
    setStatus('disconnected');
    setWeight(0.0);
  }, []);
  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      toast.error('Web Serial not supported');
      return;
    }
    setStatus('connecting');
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      keepReadingRef.current = true;
      setStatus('connected');
      if (!port.readable) {
        throw new Error('Port not readable');
      }
      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';
      setDevices([{ id: 'main-scale', name: 'Primary Scale', status: 'connected', lastSeen: Date.now() }]);
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/[\r\n]+/);
        if (lines.length > 1) {
          const completeLine = lines[lines.length - 2];
          const match = completeLine.match(WEIGHT_REGEX);
          if (match && match[1]) {
            const parsedWeight = parseFloat(match[1]);
            setWeight(parsedWeight);
            setDevices(prev => prev.map(d =>
              d.id === 'main-scale'
                ? { ...d, lastSeen: Date.now(), status: 'parsing' as ScaleStatus }
                : d
            ));
          }
          buffer = lines[lines.length - 1];
        }
      }
    } catch (err) {
      console.error('Scale connection error:', err);
      setStatus('error');
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error('Scale connection failed', { description: err.message });
      }
      portRef.current = null;
    }
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'connected' && !portRef.current) {
        setStatus('failover');
        toast.warning('Primary scale connection lost. Please reconnect.');
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      disconnect().catch(err => console.error('Cleanup disconnect failed', err));
    };
  }, [status, disconnect]);
  return { weight, status, connect, disconnect, devices };
}