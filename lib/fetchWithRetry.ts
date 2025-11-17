export type FetchOptions = RequestInit & { signal?: AbortSignal };

export interface RetryOptions {
  retries?: number;
  initialDelayMs?: number;
  factor?: number;
  maxDelay?: number;
  shouldRetry?: (error: any, response?: Response) => boolean;
  onRetry?: (attempt: number, err: any, nextDelay: number) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  retries: 3,
  initialDelayMs: 500,
  factor: 2,
  maxDelay: 10000,
  shouldRetry: (error, response) => {
    // Don't retry client errors (4xx) except 429 (rate limit)
    if (response && response.status >= 400 && response.status < 500 && response.status !== 429) {
      return false;
    }
    // Retry network errors and server errors (5xx)
    return true;
  },
  onRetry: () => {},
};

export async function fetchWithRetry(
  input: RequestInfo,
  init: FetchOptions = {},
  options: RetryOptions = {}
): Promise<Response> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let attempt = 0;
  let delay = config.initialDelayMs;
  let lastError: any;

  while (attempt <= config.retries) {
    attempt++;
    
    try {
      const resp = await fetch(input, { ...init, cache: 'no-store' });
      
      if (!resp.ok) {
        const error = new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        (error as any).response = resp;
        (error as any).status = resp.status;
        
        if (!config.shouldRetry(error, resp)) {
          throw error;
        }
        
        lastError = error;
        
        if (attempt > config.retries) {
          throw error;
        }
      } else {
        return resp;
      }
    } catch (err: any) {
      lastError = err;
      
      // If aborted, rethrow immediately
      if (init.signal && init.signal.aborted) {
        throw err;
      }
      
      // Check if we should retry this error
      if (!config.shouldRetry(err)) {
        throw err;
      }
      
      // Max retries reached
      if (attempt > config.retries) {
        throw err;
      }
    }
    
    // Calculate next delay with exponential backoff
    const nextDelay = Math.min(delay, config.maxDelay);
    
    if (config.onRetry) {
      config.onRetry(attempt, lastError, nextDelay);
    }
    
    await new Promise((res) => setTimeout(res, nextDelay));
    delay = Math.round(delay * config.factor);
  }

  throw lastError;
}
