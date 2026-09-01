/**
 * Safe API fetch utility that handles HTML responses from static hosts (e.g. Netlify/Vercel)
 * and upstream errors without throwing "Unexpected token '<'".
 */

export interface SafeApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
  isHtml: boolean;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs = 10000
): Promise<SafeApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const text = await res.text();
    const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html');

    if (isHtml) {
      return {
        ok: false,
        status: res.status,
        data: null,
        rawText: text,
        isHtml: true,
        error: `Host returned HTML instead of JSON (Status ${res.status}). Serverless API route is building or connecting.`,
      };
    }

    try {
      const data = JSON.parse(text) as T;
      const rawErr = (data as any)?.error || (data as any)?.message;
      const formattedErr = typeof rawErr === 'object' && rawErr !== null
        ? (rawErr.message || rawErr.msg || JSON.stringify(rawErr))
        : (typeof rawErr === 'string' ? rawErr : (res.ok ? undefined : `HTTP ${res.status}`));

      return {
        ok: res.ok && !(data as any)?.error,
        status: res.status,
        data,
        rawText: text,
        isHtml: false,
        error: res.ok ? undefined : formattedErr,
      };
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        rawText: text,
        isHtml: false,
        error: `Invalid response format from server: ${text.slice(0, 100)}`,
      };
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      data: null,
      rawText: '',
      isHtml: false,
      error: err.name === 'AbortError' ? 'Connection timed out (10s)' : err.message || 'Network request failed',
    };
  }
}
