import { ServiceResponse } from '../types/models';

/**
 * Wraps a promise with a 10-second timeout, 1 retry on error, and fallback handling.
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  fallbackValue: T,
  sourceName: string,
  timeoutMs: number = 10000
): Promise<ServiceResponse<T>> {
  const executeWithTimeout = async (): Promise<T> => {
    let timer: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs / 1000}s`)), timeoutMs);
    });

    try {
      const result = await Promise.race([fn(), timeoutPromise]);
      clearTimeout(timer);
      return result;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  // Attempt 1
  try {
    const data = await executeWithTimeout();
    return {
      status: 'ok',
      data,
      source: sourceName,
      fetchedAt: new Date().toISOString(),
    };
  } catch (firstError: any) {
    console.warn(`[${sourceName}] First attempt failed: ${firstError?.message || firstError}. Retrying once...`);
    // Attempt 2 (Retry 1)
    try {
      const data = await executeWithTimeout();
      return {
        status: 'ok',
        data,
        source: `${sourceName} (retry)`,
        fetchedAt: new Date().toISOString(),
      };
    } catch (secondError: any) {
      console.warn(`[${sourceName}] Second attempt failed: ${secondError?.message || secondError}. Using reliable fallback.`);
      return {
        status: 'fallback',
        data: fallbackValue,
        source: `${sourceName} (offline fallback)`,
        fetchedAt: new Date().toISOString(),
        error: secondError?.message || 'Network request failed',
      };
    }
  }
}
