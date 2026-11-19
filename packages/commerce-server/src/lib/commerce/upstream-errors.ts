/**
 * Known upstream failures that mean something more specific than "Commerce failed" (502).
 * Routes opt in through `commerceRoute`'s `classifyUpstreamError`, so a rule only applies where
 * its evidence does.
 *
 * Add a rule only with evidence of how Commerce reports the case, plus a test. Unmatched
 * upstream errors stay 502; the server log carries their codes and statuses so new rules can
 * be derived from real responses rather than guessed.
 */
import { type CommerceError, InvalidRequestError, NotFoundError, type UpstreamError } from './errors';
import { GraphQLErrorWithCodes } from './gql';

export function isCartNotFoundError(error: unknown): boolean {
  if (!(error instanceof GraphQLErrorWithCodes)) {
    return false;
  }

  // A transport failure or an unrelated GraphQL error must not erase a saved cart.
  // A bare HTTP 404 can also mean the upstream endpoint itself is unavailable.
  const isFailure = (status: number | undefined): boolean =>
    status !== undefined && status >= 400 && status !== 404 && status !== 410;
  if (isFailure(error.status) || error.errors.length === 0) return false;

  return error.errors.every(({ code, message, status }): boolean => {
    if (isFailure(status)) return false;
    // Orders throws this exact message for absent or non-draft orders; Apollo
    // supplies its generic code rather than a domain-specific not-found code.
    if (code === 'INTERNAL_SERVER_ERROR' && message === 'Order not found') return true;
    if (code && /^(?:DRAFT[_-]?)?(?:ORDER|CART)[_-]?(?:NOT[_-]?FOUND|EXPIRED)$/i.test(code)) return true;
    if (code && !/^(?:NOT[_-]?FOUND|EXPIRED)$/i.test(code)) return false;
    return /\b(?:cart|(?:draft[ -])?order)\s+(?:(?:is|was|has)\s+)?(?:not found|expired)\b/i.test(
      message ?? '',
    );
  });
}

// order-api reports its own input validation (catalog option min/max, the TEXT/NUMBER
// single-value rule, a SKU with no price, etc.) with this code on addLineItemBySkuId and
// addDraftOrder. The browser can't have known the catalog-side rule in advance, so this is a
// 400, not a generic 502 — unlike a true upstream outage or an unexpected shape.
export function isBadUserInputError(error: unknown): boolean {
  if (!(error instanceof GraphQLErrorWithCodes)) {
    return false;
  }
  return error.errors.length > 0 && error.errors.every(({ code }) => code === 'BAD_USER_INPUT');
}

interface UpstreamErrorRule {
  matches(error: UpstreamError): boolean;
  toError(error: UpstreamError): CommerceError;
}

const BAD_USER_INPUT_RULE: UpstreamErrorRule = {
  matches: isBadUserInputError,
  toError: (error) =>
    new InvalidRequestError('The requested change is not valid for this cart or its items.', {
      cause: error,
      message: error.message,
    }),
};

const CART_UPSTREAM_ERROR_RULES: readonly UpstreamErrorRule[] = [
  {
    // A completed (paid) draft is reported the same way, so this is "no longer a usable cart".
    matches: isCartNotFoundError,
    toError: (error) => new NotFoundError('Cart not found', { cause: error }),
  },
  BAD_USER_INPUT_RULE,
];

/** For routes acting on an existing saved cart (`/cart/:id`); creating a cart has none to miss. */
export function classifyCartUpstreamError(error: UpstreamError): CommerceError {
  return CART_UPSTREAM_ERROR_RULES.find((rule) => rule.matches(error))?.toError(error) ?? error;
}

/** For `POST /cart`: no existing cart to report missing, but addDraftOrder/addLineItemBySkuId can still reject input. */
export function classifyCartCreationUpstreamError(error: UpstreamError): CommerceError {
  return BAD_USER_INPUT_RULE.matches(error) ? BAD_USER_INPUT_RULE.toError(error) : error;
}
