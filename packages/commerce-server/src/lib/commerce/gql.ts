/**
 * Shared GraphQL transport for the commerce kits.
 *
 * Server-only by convention — `gqlRequest` is invoked from the proxy routes
 * under `src/server/api/commerce/**`. The error class and response shapes are
 * isomorphic and safe to import from anywhere.
 */

import { UpstreamError } from './errors';

export type GraphQLVariables = Record<string, unknown>;

export interface GraphQLResponseError {
  message?: string;
  extensions?: {
    code?: string;
    status?: number;
    http?: {
      status?: number;
    } | null;
  } | null;
}

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLResponseError[];
}

export interface GqlRequestOptions<TVariables extends object = GraphQLVariables> {
  endpoint: string;
  query: string;
  variables?: TVariables;
  headers?: HeadersInit;
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

/** `status` is the upstream HTTP status; the route responds with `httpStatus` (502) unless mapped. */
export class GraphQLErrorWithCodes<
  T extends { message?: string; code?: string; status?: number } = {
    message?: string;
    code?: string;
    status?: number;
  },
> extends UpstreamError {
  constructor(
    public errors: T[],
    public status?: number,
  ) {
    const errorMessage =
      errors.length === 1
        ? `${errors[0]?.message || 'Unknown error'}`
        : errors
            .map((error) => error.message)
            .filter(Boolean)
            .join('; ');

    super(errorMessage, {
      unauthorized: status === 401 || status === 403,
      details: {
        upstreamStatus: status,
        upstreamCodes: errors.map((error) => error.code).filter(Boolean),
        upstreamStatuses: errors.map((error) => error.status).filter((value) => typeof value === 'number'),
      },
    });
    this.name = 'GraphQLErrorWithCodes';
  }

  get codes(): string[] {
    return this.errors.map((error) => error.code).filter(Boolean) as string[];
  }

  get messages(): string[] {
    return this.errors.map((error) => error.message).filter(Boolean) as string[];
  }

  get statuses(): number[] {
    return this.errors
      .map((error) => error.status)
      .filter((status): status is number => typeof status === 'number');
  }
}

export interface Money {
  value?: number | null;
  currencyCode?: string | null;
}

export interface StorefrontHeadersInput {
  storeId: string;
  clientId: string;
}

export function storefrontHeaders({ storeId, clientId }: StorefrontHeadersInput): HeadersInit {
  return {
    'X-Store-ID': storeId,
    'X-Client-ID': clientId,
  };
}

export async function gqlRequest<TData, TVariables extends object = GraphQLVariables>({
  endpoint,
  query,
  variables,
  headers: headersInit,
  fetch: fetchImplementation,
}: GqlRequestOptions<TVariables>): Promise<TData> {
  const requestHeaders = new Headers(headersInit);
  requestHeaders.set('Accept', 'application/json');
  requestHeaders.set('Content-Type', 'application/json');

  const requestFetch = fetchImplementation ?? fetch;
  let response: Response;
  try {
    response = await requestFetch(endpoint, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({ query, variables: variables ?? {} }),
      cache: 'no-store',
    });
  } catch (cause) {
    throw new UpstreamError('GraphQL request could not reach Commerce', { cause, details: { endpoint } });
  }

  let result: GraphQLResponse<TData>;

  try {
    result = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw new GraphQLErrorWithCodes(
      [
        {
          message: `GraphQL request failed: ${response.status} ${response.statusText}`,
          status: response.status,
        },
      ],
      response.ok ? undefined : response.status,
    );
  }

  if (result.errors?.length) {
    throw new GraphQLErrorWithCodes(
      result.errors.map((error) => ({
        message: error.message,
        code: error.extensions?.code,
        status:
          error.extensions?.status ??
          error.extensions?.http?.status ??
          (response.ok ? undefined : response.status),
      })),
      response.ok ? undefined : response.status,
    );
  }

  if (!response.ok) {
    throw new GraphQLErrorWithCodes(
      [
        {
          message: `GraphQL request failed: ${response.status} ${response.statusText}`,
          status: response.status,
        },
      ],
      response.status,
    );
  }

  if (result.data === undefined) {
    throw new UpstreamError('GraphQL response did not include data', { details: { endpoint } });
  }

  return result.data;
}
