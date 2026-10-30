import {
  enUS,
  formatMessage,
  isEnglish,
  type MessageValues,
  StorefrontError,
  type StorefrontMessageKey,
  type StorefrontMessages,
} from './messages';

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
  /** The failure response's `code`, such as `not_found`, when the server sent one. */
  public readonly code: string | undefined;
  /** Package text to show in place of `message`, for failures the package describes itself. */
  public readonly text: { key: StorefrontMessageKey; values?: MessageValues } | undefined;

  constructor(
    message: string,
    public readonly status: number,
    options?: ErrorOptions & { code?: string; text?: { key: StorefrontMessageKey; values?: MessageValues } },
  ) {
    super(message, options);
    this.code = options?.code;
    this.text = options?.text;
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
        const text = { key: 'requestFailedStatus', values: { status: response.status } } as const;
        throw new ApiError(formatMessage(enUS, text.key, text.values), response.status, { cause, text });
      }
    })();
    const body: Record<string, unknown> = typeof parsed === 'object' && parsed !== null ? { ...parsed } : {};
    const code: string | undefined = typeof body.code === 'string' ? body.code : undefined;
    if (typeof body.error === 'string') throw new ApiError(body.error, response.status, { code });
    throw new ApiError(formatMessage(enUS, 'requestFailed'), response.status, {
      code,
      text: { key: 'requestFailed' },
    });
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
      throw new ApiError(formatMessage(enUS, 'requestTimeout'), 408, {
        cause,
        text: { key: 'requestTimeout' },
      });
    }
    throw cause;
  }
}

const currencyFormats = new Map<string, { format: Intl.NumberFormat; scale: number }>();

// Every price on the page formats through here, so formatters are kept per locale and currency.
function currencyFormat(currency: string, locale: string): { format: Intl.NumberFormat; scale: number } {
  const key: string = `${locale}|${currency}`;
  let cached = currencyFormats.get(key);
  if (!cached) {
    const format: Intl.NumberFormat = new Intl.NumberFormat(locale, { style: 'currency', currency });
    cached = { format, scale: 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2) };
    currencyFormats.set(key, cached);
  }
  return cached;
}

/** Formats minor units, such as cents, as currency. Inside the provider, prefer `useMoney`, which follows its `locale`. */
export function money(value: number, currency: string, locale: string = 'en-US'): string {
  const { format, scale } = currencyFormat(currency, locale);
  return format.format(value / scale);
}

/** Formats a range of minor units the way `locale` writes ranges, such as `$20.00 – $25.00` or `20,00–25,00 €`. */
export function moneyRange(min: number, max: number, currency: string, locale: string = 'en-US'): string {
  const { format, scale } = currencyFormat(currency, locale);
  // `formatRange` writes an equal range as an approximation, such as `~$20.00`.
  if (min === max) return format.format(min / scale);
  // Browsers from before 2023 lack `formatRange`, and early versions throw when `min` is above `max`.
  try {
    if (typeof format.formatRange === 'function') return format.formatRange(min / scale, max / scale);
  } catch {}
  return `${format.format(min / scale)} – ${format.format(max / scale)}`;
}

/**
 * The text to show for a failure, in the language of `messages`. Server messages are English, so other languages
 * show the text for the response's `code`, or a generic message.
 */
export function describeError(error: unknown, messages: StorefrontMessages): string {
  // Own keys only, so a code such as `constructor` cannot match an inherited property.
  const coded: unknown =
    error instanceof ApiError && error.code && Object.hasOwn(messages.errorCodes, error.code)
      ? messages.errorCodes[error.code]
      : undefined;
  if (typeof coded === 'string' && coded) return coded;
  const text = error instanceof StorefrontError || error instanceof ApiError ? textOf(error) : undefined;
  if (text) return formatMessage(messages, text.key, text.values);
  if (error instanceof ApiError)
    return isEnglish(messages) ? error.message : formatMessage(messages, 'requestFailed');
  if (error instanceof Error && isEnglish(messages)) return error.message;
  return formatMessage(messages, 'unknownError');
}

const textOf = (error: StorefrontError | ApiError): ApiError['text'] =>
  error instanceof StorefrontError ? { key: error.key, values: error.values } : error.text;
