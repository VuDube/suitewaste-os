import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
type ScaleStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'parsing' | 'failover';
interface DeviceHealth {
  id: string;
  name: string;
  status: ScaleStatus;
  lastSeen: number;
}
export function useMultiScale() {
  const [weight, setWeight] = useState<number>(0.0);
  const [status, setStatus] = useState<ScaleStatus>('disconnected');
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const portRef = useRef<any>(null);
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
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      keepReadingRef.current = true;
      setStatus('connected');
      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';
      // Mock device registration for health checks
      setDevices([{ id: 'main-scale', name: 'Primary Scale', status: 'connected', lastSeen: Date.now() }]);
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
        const lines = buffer.split(/[\r\n]+/);
        if (lines.length > 1) {
          const match = lines[lines.length - 2].match(/(\d+\.\d+)/);
          if (match) {
            setWeight(parseFloat(match[1]));
            // Update health timestamp
            setDevices(prev => prev.map(d => d.id === 'main-scale' ? { ...d, lastSeen: Date.now(), status: 'parsing' } : d));
          }
          buffer = lines[lines.length - 1];
        }
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      toast.error('Scale connection failed');
    }
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === 'connected' && !portRef.current) {
        setStatus('failover');
        toast.warning('Primary scale lost. Searching for failover device...');
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      // Ensure we don't block unmounting
      disconnect().catch(err => console.error('Cleanup disconnect failed', err));
    };
  }, [status, disconnect]);
  return { weight, status, connect, disconnect, devices };
}