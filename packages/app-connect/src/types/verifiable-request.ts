/**
 * Represents a request that can be verified
 * This is a framework-agnostic representation of an HTTP request
 */
export interface VerifiableRequest {
  /** The HTTP method (GET, POST, etc.) */
  method: string;

  /** The full URL of the request */
  url: string;

  /** The path component of the URL */
  path: string;

  /** The query parameters as a record */
  query: Record<string, string | string[] | undefined>;

  /** The request headers as a record */
  headers: Record<string, string | string[] | undefined>;

  /**
   * The request body, if any.
   * - For Express action middleware: pre-parsed object from express.json()
   * - For Express webhook middleware: req.rawBody when kept, otherwise req.body
   * - For TanStack middleware: raw text (actions) or raw bytes (webhooks)
   * - For Next.js: caller-provided (for webhooks, pass Buffer.from(await request.arrayBuffer()))
   *
   * Webhook signatures are over the raw bytes, so pass a Buffer, ArrayBuffer or string.
   */
  body?: unknown;
}
