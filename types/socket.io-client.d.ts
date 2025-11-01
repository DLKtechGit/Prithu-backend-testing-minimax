declare module 'socket.io-client' {
  import { EventEmitter } from 'events';

  interface SocketOptions {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    forceNew?: boolean;
    multiplex?: boolean;
    transports?: string[];
    upgrade?: boolean;
    rememberUpgrade?: boolean;
    parser?: any;
    auth?: any;
  }

  interface Socket extends EventEmitter {
    connected: boolean;
    id: string | undefined;
    transport: any;

    connect(): Socket;
    disconnect(): Socket;
    emit(event: string, ...args: any[]): Socket;
    on(event: string, listener: (...args: any[]) => void): Socket;
    once(event: string, listener: (...args: any[]) => void): Socket;
    removeListener(event: string, listener: (...args: any[]) => void): Socket;
    removeAllListeners(event?: string): Socket;
    listeners(event: string): Function[];
    hasListeners(event: string): boolean;

    // Event methods
    onAny(listener: (...args: any[]) => void): Socket;
    onAnyOutsideNamespace(listener: (...args: any[]) => void): Socket;
    offAny(listener?: (...args: any[]) => void): Socket;
    offAnyOutsideNamespace(listener?: (...args: any[]) => void): Socket;
    listenersAny(): Array<(...args: any[]) => void>;
  }

  interface SocketConstructor {
    new (url: string, opts?: SocketOptions): Socket;
    new (url: string, opts?: SocketOptions): Socket;
    (url: string, opts?: SocketOptions): Socket;
  }

  const io: SocketConstructor;
  export = io;
}