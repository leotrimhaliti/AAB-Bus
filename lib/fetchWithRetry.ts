export type FetchOptions = RequestInit & { signal?: AbortSignal };

export async function fetchWithRetry(
  input: RequestInfo,
  init: FetchOptions = {},
  {
    retries = 3,
    initialDelayMs = 500,
    factor = 2,
    onRetry,
  }: { retries?: number; initialDelayMs?: number; factor?: number; onRetry?: (attempt: number, err: any) => void } = {}
) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    attempt++;
    try {
      const resp = await fetch(input, { ...init, cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp;
    } catch (err: any) {
      // if aborted, rethrow immediately
      if (init.signal && init.signal.aborted) throw err;
      if (attempt > retries) throw err;
      if (onRetry) onRetry(attempt, err);
      await new Promise((res) => setTimeout(res, delay));
      delay = Math.round(delay * factor);
    }
  }
}