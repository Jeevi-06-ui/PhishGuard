export class ApiError extends Error {
  public readonly status?: number;
  public readonly code: string;
  public readonly isServiceUnavailable: boolean;

  constructor(options: {
    message: string;
    code: string;
    status?: number;
    isServiceUnavailable?: boolean;
  }) {
    super(options.message);
    this.name = 'ApiError';
    this.code = options.code;
    this.status = options.status;
    this.isServiceUnavailable = options.isServiceUnavailable ?? false;
  }
}

const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS ?? 45000);

function normalizeApiBaseUrl(raw: string): string {
  if (!raw) return '';
  const cleaned = raw.replace(/\/+$/, '');
  if (cleaned.endsWith('/api/v1')) return cleaned;
  return `${cleaned}/api/v1`;
}

export const apiConfig = {
  baseUrl: normalizeApiBaseUrl(RAW_BASE_URL),
  isConfigured: RAW_BASE_URL.length > 0,
  plannedEndpoint: 'http://localhost:8000/api/v1',
};

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${apiConfig.baseUrl}${normalizedPath}`;
  if (!query) return fullUrl;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `${fullUrl}?${qs}` : fullUrl;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiConfig.isConfigured) {
    throw new ApiError({
      code: 'BACKEND_NOT_CONFIGURED',
      isServiceUnavailable: true,
      message:
        'Backend API service is not connected. Start the FastAPI server and set VITE_API_BASE_URL to enable live data.',
    });
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      let detail = `Request failed with status ${response.status}`;
      try {
        const errorPayload = (await response.json()) as { detail?: string; message?: string };
        detail = errorPayload.detail ?? errorPayload.message ?? detail;
      } catch {
        // Keep HTTP fallback message
      }
      throw new ApiError({
        status: response.status,
        code: `HTTP_${response.status}`,
        isServiceUnavailable: response.status >= 500,
        message: detail,
      });
    }

    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError({
        code: 'REQUEST_TIMEOUT',
        isServiceUnavailable: true,
        message: 'Backend request timed out. Verify that the FastAPI server is responding.',
      });
    }
    throw new ApiError({
      code: 'SERVICE_UNREACHABLE',
      isServiceUnavailable: true,
      message: 'Unable to reach the FastAPI backend service. Verify the server is running.',
    });
  } finally {
    window.clearTimeout(timeout);
  }
}
