/// <reference types="vite/client" />
/**
 * Web Serial API Types
 */
interface SerialPortRequestOptions {
  filters?: { usbVendorId?: number; usbProductId?: number }[];
}
interface SerialPort extends EventTarget {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  addEventListener(type: 'disconnect', listener: (ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'disconnect', listener: (ev: Event) => any, options?: boolean | EventListenerOptions): void;
}
interface Serial extends EventTarget {
  onconnect: ((this: Serial, ev: Event) => any) | null;
  ondisconnect: ((this: Serial, ev: Event) => any) | null;
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  addEventListener(type: 'connect' | 'disconnect', listener: (ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: 'connect' | 'disconnect', listener: (ev: Event) => any, options?: boolean | EventListenerOptions): void;
}
interface Navigator {
  readonly serial: Serial;
}