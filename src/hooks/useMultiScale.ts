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
  const keepReadingRef = useRef<boolean>(false);
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    try {
      if (readerRef.current) {
        // Cancel first to break the read loop's await reader.read()
        await readerRef.current.cancel('Intentional disconnect');
        readerRef.current.releaseLock();
        readerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } catch (err) {
      console.warn('Disconnect cleanup warning:', err);
    } finally {
      setStatus('disconnected');
      setWeight(0);
      setDevices([]);
    }
  }, []);
  const handleReadLoopError = useCallback(async (err: unknown) => {
    // Distinguish between intentional cancellation and actual errors
    if (!keepReadingRef.current) return;
    console.error('Scale stream error:', err instanceof Error ? err.message : String(err));
    setStatus('error');
    toast.error('Scale connection lost');
    await disconnect();
  }, [disconnect]);
  const startReadLoop = useCallback(async () => {
    const reader = readerRef.current;
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = '';
    keepReadingRef.current = true;
    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done || !keepReadingRef.current) break;
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
      await handleReadLoopError(err);
    }
  }, [handleReadLoopError]);
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
      setDevices([{ 
        id: 'main-scale', 
        name: 'Primary Scale', 
        status: 'connected' as ScaleStatus, 
        lastSeen: Date.now() 
      }]);
      startReadLoop();
    } catch (err) {
      setStatus('error');
      if (err instanceof Error && err.name !== 'NotFoundError') {
        toast.error('Scale connection failed', { description: err.message });
      } else {
        setStatus('disconnected');
      }
      await disconnect();
    }
  }, [disconnect, startReadLoop]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'connected' || status === 'parsing') {
        const mainDevice = devices.find(d => d.id === 'main-scale');
        if (mainDevice && Date.now() - mainDevice.lastSeen > 5000) {
          setStatus('failover');
          toast.warning('Scale stream timeout - check physical connection');
        }
      }
    }, 10000);
    return () => {
      clearInterval(interval);
      if (portRef.current) {
        disconnect();
      }
    };
  }, [status, devices, disconnect]);
  return { weight, status, connect, disconnect, devices };
}