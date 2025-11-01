import React, { useRef, useEffect } from 'react';
import { disconnectSocket } from "../webSocket/webScoket";
import { stopHeartbeat } from "../webSocket/heartBeat";

// Global cleanup utility for React components
export class ComponentCleanup {
  private cleanupFunctions: (() => void)[] = [];
  private mountedRef: React.MutableRefObject<boolean>;

  constructor(mountedRef: React.MutableRefObject<boolean>) {
    this.mountedRef = mountedRef;
  }

  // Add cleanup function
  addCleanup(cleanupFn: () => void) {
    this.cleanupFunctions.push(cleanupFn);
  }

  // Add WebSocket cleanup
  addSocketCleanup() {
    this.addCleanup(() => {
      disconnectSocket();
    });
  }

  // Add heartbeat cleanup
  addHeartbeatCleanup() {
    this.addCleanup(() => {
      stopHeartbeat();
    });
  }

  // Add interval cleanup
  addIntervalCleanup(intervalId: NodeJS.Timeout) {
    this.addCleanup(() => {
      clearInterval(intervalId);
    });
  }

  // Add timeout cleanup
  addTimeoutCleanup(timeoutId: NodeJS.Timeout) {
    this.addCleanup(() => {
      clearTimeout(timeoutId);
    });
  }

  // Add event listener cleanup
  addEventListenerCleanup(
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) {
    this.addCleanup(() => {
      target.removeEventListener(event, handler, options);
    });
  }

  // Execute all cleanup functions
  cleanup() {
    if (!this.mountedRef.current) return;
    
    this.cleanupFunctions.reverse().forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    });
    
    this.cleanupFunctions = [];
    this.mountedRef.current = false;
  }

  // Check if component is still mounted
  isMounted(): boolean {
    return this.mountedRef.current;
  }

  // Safe state update - only updates if component is mounted
  safeSetState<T>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) {
    if (this.isMounted()) {
      setter(value);
    }
  }
}

// Hook for component cleanup
export const useComponentCleanup = () => {
  const mountedRef = useRef(true);
  const cleanupRef = useRef<ComponentCleanup>();

  if (!cleanupRef.current) {
    cleanupRef.current = new ComponentCleanup(mountedRef);
  }

  useEffect(() => {
    return () => {
      cleanupRef.current?.cleanup();
    };
  }, []);

  return {
    mountedRef,
    cleanup: cleanupRef.current,
  };
};

// Utility to create safe async functions
export const createSafeAsync = (
  mountedRef: React.MutableRefObject<boolean>,
  errorHandler?: (error: any) => void
) => {
  return async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      if (!mountedRef.current) return null;
      const result = await asyncFn();
      return mountedRef.current ? result : null;
    } catch (error) {
      console.error('Safe async error:', error);
      if (errorHandler && mountedRef.current) {
        errorHandler(error);
      }
      return null;
    }
  };
};

// Utility for safe API calls
export const createSafeApiCall = (
  mountedRef: React.MutableRefObject<boolean>,
  loadingSetter?: React.Dispatch<React.SetStateAction<boolean>>,
  errorSetter?: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const safeAsync = createSafeAsync(mountedRef, (error) => {
    if (errorSetter && mountedRef.current) {
      errorSetter(error.message || 'An error occurred');
    }
  });

  return async <T>(
    apiCall: () => Promise<T>,
    options?: {
      setLoading?: boolean;
      loadingValue?: boolean;
      errorMessage?: string;
    }
  ): Promise<T | null> => {
    if (options?.setLoading && loadingSetter) {
      loadingSetter(options.loadingValue ?? true);
    }

    const result = await safeAsync(apiCall);

    if (options?.setLoading && loadingSetter) {
      loadingSetter(false);
    }

    return result;
  };
};

// Memory usage monitoring (for development)
export const logMemoryUsage = (label: string) => {
  if (__DEV__) {
    if (global.performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      console.log(`${label} Memory Usage:`, {
        used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
      });
    }
  }
};

// Error boundary helper
export const createErrorHandler = (
  componentName: string,
  mountedRef: React.MutableRefObject<boolean>
) => {
  return (error: any, errorInfo: any) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);
    
    if (mountedRef.current) {
      // You could set an error state here if needed
      // setError('Something went wrong');
    }
  };
};