import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
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
  const disconnect = useCallback(async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel('Scale disconnected');
        readerRef.current.releaseLock();
      }
      if (portRef.current) {
        await portRef.current.close();
      }
    } catch (err) {
      console.warn('Disconnect cleanup failed:', err);
    } finally {
      readerRef.current = null;
      portRef.current = null;
      setStatus('disconnected');
      setWeight(0);
      setDevices([]);
    }
  }, []);
  const handleReadLoopError = useCallback(async (err: unknown) => {
    console.error('Scale read loop error:', err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err));
    setStatus('error');
    toast.error('Scale stream failed');
    await disconnect();
  }, [disconnect]);
  const startReadLoop = useCallback(async () => {
    const reader = readerRef.current;
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        for (const line of lines) {
          const match = line.match(WEIGHT_REGEX);
          if (match?.[1]) {
            const w = parseFloat(match[1]);
            if (!isNaN(w)) {
              setWeight(w);
              setDevices(d => d.map(dd =>
                dd.id === 'main-scale'
                  ? { ...dd, lastSeen: Date.now(), status: 'parsing' as ScaleStatus }
                  : dd
              ));
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      throw err;
    }
  }, [setWeight, setDevices]);
  const connect = useCallback(async () => {
    if (!('serial' in navigator)) {
      toast.error('Web Serial not supported');
      return;
    }
    if (portRef.current) {
      await disconnect();
    }
    setStatus('connecting');
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      if (!port.readable) {
        throw new Error('Port not readable');
      }
      const reader = port.readable.getReader();
      readerRef.current = reader;
      setStatus('connected');
      setDevices([{ id: 'main-scale', name: 'Primary Scale', status: 'connected' as ScaleStatus, lastSeen: Date.now() }]);
      startReadLoop().catch(handleReadLoopError);
    } catch (err) {
      setStatus('error');
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error('Scale connection failed', { description: err.message });
      }
      await disconnect();
    }
  }, [disconnect, startReadLoop, handleReadLoopError]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'connected' && (!portRef.current || !portRef.current.readable)) {
        setStatus('failover');
        toast.warning('Scale connection lost - tap to retry');
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      disconnect().catch(err => console.error('Cleanup disconnect failed', err));
    };
  }, [status, disconnect]);
  return { weight, status, connect, disconnect, devices };
}