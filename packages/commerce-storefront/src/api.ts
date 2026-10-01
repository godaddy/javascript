export interface StorefrontConfig {
  cartScope: string;
  currencyCode: string;
  catalogPath: string;
  productPath: string;
  checkoutSuccessPath?: string;
}

export class CartIdStorage {
  private currentId: string | null = null;
  private pendingWrite: boolean = false;

  constructor(private readonly key: string) {}

  read(): string | null {
    if (this.pendingWrite) return this.currentId;
    return localStorage.getItem(this.key);
  }

  write(id: string | null): void {
    this.currentId = id;
    this.pendingWrite = true;
    if (id) localStorage.setItem(this.key, id);
    else localStorage.removeItem(this.key);
    this.pendingWrite = false;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export const checkedFetch: typeof globalThis.fetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const response: Response = await fetch(input, init);
  if (!response.ok) {
    const data: string = await response.text();
    const parsed: unknown = ((): unknown => {
      try {
        return JSON.parse(data) as unknown;
      } catch (cause: unknown) {
        throw new ApiError(`Commerce request failed (${response.status}). Please retry.`, response.status, {
          cause,
        });
      }
    })();
    const detail: string =
      typeof parsed === 'object' && parsed !== null && 'error' in parsed && typeof parsed.error === 'string'
        ? parsed.error
        : 'Commerce request failed. Please retry.';
    throw new ApiError(detail, response.status);
  }
  return response;
};

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const timeout: AbortSignal | undefined =
    !init?.method || init.method.toUpperCase() === 'GET' ? AbortSignal.timeout(15_000) : undefined;
  const signal: AbortSignal | null | undefined = timeout
    ? AbortSignal.any([timeout, ...(init?.signal ? [init.signal] : [])])
    : init?.signal;
  try {
    const response: Response = await checkedFetch(`/api/commerce${path}`, {
      ...init,
      signal,
      headers,
      cache: 'no-store',
    });
    return (await response.json()) as T;
  } catch (cause: unknown) {
    if (timeout?.aborted && !init?.signal?.aborted) {
      throw new ApiError('Commerce information took too long to load. Please retry.', 408, {
        cause,
      });
    }
    throw cause;
  }
}

export function money(value: number, currency: string): string {
  const formatter: Intl.NumberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  const digits: number = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(value / 10 ** digits);
}

export function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please retry.';
}
