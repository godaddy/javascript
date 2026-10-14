/**
 * Shared HTTP handling for calls to Commerce, so every upstream failure is an `UpstreamError`
 * with the same log details: the request's `details` plus `upstreamStatus` once a response exists.
 */
import { UpstreamError } from './errors';

export type UpstreamFetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface UpstreamRequest {
  /** Names the call in internal messages, e.g. "Order lookup". */
  operation: string;
  /** Logged with every failure of this call; never sent to the browser. */
  details: Record<string, unknown>;
}

export async function fetchUpstream(
  input: string | URL,
  init: RequestInit,
  { operation, details }: UpstreamRequest,
  fetchImplementation: UpstreamFetch = fetch,
): Promise<Response> {
  try {
    return await fetchImplementation(input, init);
  } catch (cause) {
    throw new UpstreamError(`${operation} could not reach Commerce`, { cause, details });
  }
}

export async function readUpstreamJson<T>(
  response: Response,
  { operation, details }: UpstreamRequest,
): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch (cause) {
    throw new UpstreamError(`${operation} returned a non-JSON response`, {
      cause,
      details: { ...details, upstreamStatus: response.status },
    });
  }
}

/** Builds the error for a non-2xx response. 401 and 403 always mean this server's credentials were rejected. */
export async function upstreamStatusError(
  response: Response,
  { operation, details }: UpstreamRequest,
  { unauthorized = false }: { unauthorized?: boolean } = {},
): Promise<UpstreamError> {
  // Unread bodies can hold pooled connections while callers poll.
  if (!response.bodyUsed) await response.body?.cancel();
  return new UpstreamError(`${operation} failed: upstream returned ${response.status}`, {
    unauthorized: unauthorized || response.status === 401 || response.status === 403,
    details: { ...details, upstreamStatus: response.status },
  });
}
