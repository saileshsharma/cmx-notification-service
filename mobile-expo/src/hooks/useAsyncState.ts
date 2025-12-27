/**
 * useAsyncState Hook - Unified async operation state management
 * Handles loading, error, and success states for async operations
 * Provides optimistic updates and retry functionality
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '../utils/logger';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isIdle: boolean;
}

interface UseAsyncStateOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseAsyncStateReturn<T> extends AsyncState<T> {
  execute: <P extends unknown[]>(
    asyncFn: (...args: P) => Promise<T>,
    ...args: P
  ) => Promise<T | null>;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  retry: () => Promise<T | null>;
}

export function useAsyncState<T>(
  options: UseAsyncStateOptions<T> = {}
): UseAsyncStateReturn<T> {
  const {
    initialData = null,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    status: 'idle',
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
  });

  // Store last operation for retry
  const lastOperationRef = useRef<{
    fn: (...args: unknown[]) => Promise<T>;
    args: unknown[];
  } | null>(null);

  const attemptCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateState = useCallback((updates: Partial<AsyncState<T>>) => {
    if (!mountedRef.current) return;

    setState((prev) => {
      const newStatus = updates.status || prev.status;
      return {
        ...prev,
        ...updates,
        isLoading: newStatus === 'loading',
        isError: newStatus === 'error',
        isSuccess: newStatus === 'success',
        isIdle: newStatus === 'idle',
      };
    });
  }, []);

  const execute = useCallback(
    async <P extends unknown[]>(
      asyncFn: (...args: P) => Promise<T>,
      ...args: P
    ): Promise<T | null> => {
      // Store for retry
      lastOperationRef.current = {
        fn: asyncFn as (...args: unknown[]) => Promise<T>,
        args,
      };
      attemptCountRef.current = 0;

      updateState({ status: 'loading', error: null });

      const attemptOperation = async (): Promise<T | null> => {
        try {
          const result = await asyncFn(...args);

          if (!mountedRef.current) return null;

          updateState({ data: result, status: 'success', error: null });
          onSuccess?.(result);
          return result;
        } catch (err) {
          attemptCountRef.current++;
          const errorMessage = err instanceof Error ? err.message : 'An error occurred';

          // Retry if we haven't exceeded retry count
          if (attemptCountRef.current <= retryCount) {
            logger.debug(`[useAsyncState] Retrying (${attemptCountRef.current}/${retryCount})...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
            return attemptOperation();
          }

          if (!mountedRef.current) return null;

          updateState({ status: 'error', error: errorMessage });
          onError?.(errorMessage);
          logger.error('[useAsyncState] Operation failed:', errorMessage);
          return null;
        }
      };

      return attemptOperation();
    },
    [updateState, onSuccess, onError, retryCount, retryDelay]
  );

  const setData = useCallback(
    (data: T | null) => {
      updateState({ data, status: data !== null ? 'success' : 'idle' });
    },
    [updateState]
  );

  const setError = useCallback(
    (error: string | null) => {
      updateState({
        error,
        status: error !== null ? 'error' : 'idle',
      });
    },
    [updateState]
  );

  const reset = useCallback(() => {
    updateState({
      data: initialData,
      status: 'idle',
      error: null,
    });
    lastOperationRef.current = null;
    attemptCountRef.current = 0;
  }, [updateState, initialData]);

  const retry = useCallback(async (): Promise<T | null> => {
    if (!lastOperationRef.current) {
      logger.warn('[useAsyncState] No operation to retry');
      return null;
    }

    const { fn, args } = lastOperationRef.current;
    attemptCountRef.current = 0;
    return execute(fn, ...args);
  }, [execute]);

  return {
    ...state,
    execute,
    setData,
    setError,
    reset,
    retry,
  };
}

/**
 * Hook for managing multiple async operations
 */
interface AsyncOperations {
  [key: string]: {
    status: AsyncStatus;
    error: string | null;
  };
}

export function useAsyncOperations() {
  const [operations, setOperations] = useState<AsyncOperations>({});

  const startOperation = useCallback((key: string) => {
    setOperations((prev) => ({
      ...prev,
      [key]: { status: 'loading', error: null },
    }));
  }, []);

  const completeOperation = useCallback((key: string) => {
    setOperations((prev) => ({
      ...prev,
      [key]: { status: 'success', error: null },
    }));
  }, []);

  const failOperation = useCallback((key: string, error: string) => {
    setOperations((prev) => ({
      ...prev,
      [key]: { status: 'error', error },
    }));
  }, []);

  const resetOperation = useCallback((key: string) => {
    setOperations((prev) => {
      const newOps = { ...prev };
      delete newOps[key];
      return newOps;
    });
  }, []);

  const isLoading = useCallback(
    (key: string) => operations[key]?.status === 'loading',
    [operations]
  );

  const hasError = useCallback(
    (key: string) => operations[key]?.status === 'error',
    [operations]
  );

  const getError = useCallback(
    (key: string) => operations[key]?.error || null,
    [operations]
  );

  const isAnyLoading = Object.values(operations).some(
    (op) => op.status === 'loading'
  );

  return {
    operations,
    startOperation,
    completeOperation,
    failOperation,
    resetOperation,
    isLoading,
    hasError,
    getError,
    isAnyLoading,
  };
}
