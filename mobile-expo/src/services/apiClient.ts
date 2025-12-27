/**
 * API Client - Enhanced HTTP client with:
 * - Circuit breaker pattern
 * - Exponential backoff with jitter
 * - Request deduplication
 * - Timeout handling
 * - Sentry performance tracking
 */
import {
  API_BASE_URL,
  API_TIMEOUTS,
  RETRY_CONFIG,
  CIRCUIT_BREAKER_CONFIG
} from '../config/api';
import { logger } from '../utils/logger';
import { startTransaction, addSentryBreadcrumb } from '../config/sentry';

// ==================== Types ====================

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  skipRetry?: boolean;
  skipDedup?: boolean;
  idempotencyKey?: string;
}

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
  cached?: boolean;
}

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  nextRetryTime: number;
}

interface PendingRequest {
  promise: Promise<ApiResponse<unknown>>;
  timestamp: number;
}

// ==================== Circuit Breaker ====================

class CircuitBreaker {
  private circuits: Map<string, CircuitBreakerState> = new Map();

  private getCircuit(endpoint: string): CircuitBreakerState {
    // Use base path for circuit (e.g., /mobile/login -> /mobile)
    const basePath = endpoint.split('/').slice(0, 2).join('/');

    if (!this.circuits.has(basePath)) {
      this.circuits.set(basePath, {
        state: 'closed',
        failures: 0,
        successes: 0,
        lastFailureTime: 0,
        nextRetryTime: 0,
      });
    }
    return this.circuits.get(basePath)!;
  }

  canRequest(endpoint: string): boolean {
    const circuit = this.getCircuit(endpoint);

    if (circuit.state === 'closed') {
      return true;
    }

    if (circuit.state === 'open') {
      // Check if we should try again (half-open)
      if (Date.now() >= circuit.nextRetryTime) {
        circuit.state = 'half-open';
        logger.debug(`[CircuitBreaker] ${endpoint} transitioning to half-open`);
        return true;
      }
      return false;
    }

    // half-open: allow one request
    return true;
  }

  recordSuccess(endpoint: string): void {
    const circuit = this.getCircuit(endpoint);

    if (circuit.state === 'half-open') {
      circuit.successes++;
      if (circuit.successes >= CIRCUIT_BREAKER_CONFIG.successThreshold) {
        circuit.state = 'closed';
        circuit.failures = 0;
        circuit.successes = 0;
        logger.info(`[CircuitBreaker] ${endpoint} circuit closed`);
      }
    } else {
      circuit.failures = 0;
    }
  }

  recordFailure(endpoint: string): void {
    const circuit = this.getCircuit(endpoint);

    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === 'half-open') {
      // Immediately open on failure in half-open state
      circuit.state = 'open';
      circuit.nextRetryTime = Date.now() + CIRCUIT_BREAKER_CONFIG.timeout;
      circuit.successes = 0;
      logger.warn(`[CircuitBreaker] ${endpoint} circuit opened (half-open failure)`);
    } else if (circuit.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      circuit.state = 'open';
      circuit.nextRetryTime = Date.now() + CIRCUIT_BREAKER_CONFIG.timeout;
      logger.warn(`[CircuitBreaker] ${endpoint} circuit opened after ${circuit.failures} failures`);
    }
  }

  getState(endpoint: string): CircuitState {
    return this.getCircuit(endpoint).state;
  }

  reset(): void {
    this.circuits.clear();
  }
}

// ==================== Request Deduplication ====================

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map();
  private readonly TTL = 5000; // 5 seconds

  private generateKey(method: string, endpoint: string, body?: unknown): string {
    const bodyHash = body ? JSON.stringify(body).substring(0, 100) : '';
    return `${method}:${endpoint}:${bodyHash}`;
  }

  getDuplicate(method: string, endpoint: string, body?: unknown): Promise<ApiResponse<unknown>> | null {
    const key = this.generateKey(method, endpoint, body);
    const pending = this.pending.get(key);

    if (pending && Date.now() - pending.timestamp < this.TTL) {
      logger.debug(`[Dedup] Returning cached request for ${method} ${endpoint}`);
      return pending.promise;
    }

    return null;
  }

  register(
    method: string,
    endpoint: string,
    body: unknown | undefined,
    promise: Promise<ApiResponse<unknown>>
  ): void {
    const key = this.generateKey(method, endpoint, body);
    this.pending.set(key, { promise, timestamp: Date.now() });

    // Auto-cleanup after TTL
    setTimeout(() => {
      this.pending.delete(key);
    }, this.TTL);
  }

  clear(): void {
    this.pending.clear();
  }
}

// ==================== API Client ====================

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private circuitBreaker: CircuitBreaker;
  private deduplicator: RequestDeduplicator;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.circuitBreaker = new CircuitBreaker();
    this.deduplicator = new RequestDeduplicator();
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  private getDefaultHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private getRetryDelay(attempt: number): number {
    const baseDelay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
    const cappedDelay = Math.min(baseDelay, RETRY_CONFIG.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * RETRY_CONFIG.jitterFactor * Math.random();
    return Math.floor(cappedDelay + jitter);
  }

  private isRetryableError(status: number): boolean {
    // Retry on 5xx server errors, 408 timeout, 429 rate limit
    return status >= 500 || status === 408 || status === 429;
  }

  private isRetryableNetworkError(error: Error): boolean {
    const retryableMessages = [
      'network request failed',
      'failed to fetch',
      'network error',
      'timeout',
      'aborted',
    ];
    const message = error.message.toLowerCase();
    return retryableMessages.some(m => message.includes(m));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeout);
    return controller;
  }

  /**
   * Make HTTP request with retry logic, circuit breaker, and deduplication
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_TIMEOUTS.default,
      retries = RETRY_CONFIG.maxRetries,
      skipRetry = false,
      skipDedup = false,
      idempotencyKey,
    } = config;

    // Check circuit breaker
    if (!this.circuitBreaker.canRequest(endpoint)) {
      logger.warn(`[API] Circuit open for ${endpoint}`);
      addSentryBreadcrumb({
        category: 'api',
        message: `Circuit breaker open for ${endpoint}`,
        level: 'warning',
      });
      return {
        data: null,
        error: 'Service temporarily unavailable. Please try again later.',
        status: 503,
        ok: false,
      };
    }

    // Check for duplicate in-flight request (only for GET and idempotent requests)
    if (!skipDedup && (method === 'GET' || idempotencyKey)) {
      const duplicate = this.deduplicator.getDuplicate(method, endpoint, body);
      if (duplicate) {
        const result = await duplicate;
        return { ...result, cached: true } as ApiResponse<T>;
      }
    }

    // Start Sentry transaction for performance monitoring
    const transaction = startTransaction(`API ${method}`, 'http.client');

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      ...this.getDefaultHeaders(),
      ...headers,
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    };

    let lastError: string | null = null;
    let lastStatus = 0;

    const executeRequest = async (): Promise<ApiResponse<T>> => {
      for (let attempt = 0; attempt <= (skipRetry ? 0 : retries); attempt++) {
        try {
          if (attempt > 0) {
            addSentryBreadcrumb({
              category: 'api',
              message: `Retry attempt ${attempt} for ${endpoint}`,
              level: 'info',
            });
          }

          logger.debug(`[API] ${method} ${endpoint}`, { attempt, hasBody: !!body });

          const controller = this.createAbortController(timeout);
          const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
          });

          lastStatus = response.status;

          if (!response.ok) {
            // Check if retryable
            if (!skipRetry && attempt < retries && this.isRetryableError(response.status)) {
              const delay = this.getRetryDelay(attempt);
              logger.warn(`[API] Retry ${attempt + 1}/${retries} in ${delay}ms`, {
                endpoint,
                status: response.status
              });
              await this.sleep(delay);
              continue;
            }

            // Parse error response
            let errorMessage = `HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              // Ignore JSON parse errors
            }

            this.circuitBreaker.recordFailure(endpoint);

            transaction?.end();
            return {
              data: null,
              error: errorMessage,
              status: response.status,
              ok: false,
            };
          }

          // Parse successful response
          let data: T | null = null;
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            data = await response.json();
          }

          this.circuitBreaker.recordSuccess(endpoint);

          transaction?.end();
          return {
            data,
            error: null,
            status: response.status,
            ok: true,
          };
        } catch (error) {
          // Handle abort/timeout
          if (error instanceof Error && error.name === 'AbortError') {
            lastError = 'Request timeout';
            logger.warn(`[API] Timeout`, { endpoint });
          } else if (error instanceof Error) {
            lastError = error.message;
            logger.error(`[API] Error`, { endpoint, error: lastError });
          } else {
            lastError = 'Network error';
          }

          // Retry on retryable network errors
          if (
            !skipRetry &&
            attempt < retries &&
            error instanceof Error &&
            this.isRetryableNetworkError(error)
          ) {
            const delay = this.getRetryDelay(attempt);
            logger.warn(`[API] Retry ${attempt + 1}/${retries} in ${delay}ms`, { endpoint });
            await this.sleep(delay);
            continue;
          }

          // Final failure
          this.circuitBreaker.recordFailure(endpoint);
        }
      }

      transaction?.end();
      return {
        data: null,
        error: lastError || 'Unknown error',
        status: lastStatus,
        ok: false,
      };
    };

    // Register for deduplication
    const promise = executeRequest();
    if (!skipDedup && (method === 'GET' || idempotencyKey)) {
      this.deduplicator.register(method, endpoint, body, promise as Promise<ApiResponse<unknown>>);
    }

    return promise;
  }

  // Convenience methods with appropriate timeouts
  get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body, skipDedup: true });
  }

  put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body, skipDedup: true });
  }

  delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE', skipDedup: true });
  }

  patch<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body, skipDedup: true });
  }

  // Utility methods
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  getCircuitState(endpoint: string): CircuitState {
    return this.circuitBreaker.getState(endpoint);
  }

  clearDeduplicationCache(): void {
    this.deduplicator.clear();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
export type { RequestConfig, ApiResponse, CircuitState };
