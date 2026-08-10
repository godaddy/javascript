import type { UseFormReturn } from 'react-hook-form';
import { GraphQLErrorWithCodes } from '@/lib/graphql-with-errors';

/**
 * Marks a tip error as set from a server response rather than by the form
 * resolver, so `TipsForm` can clear it once the customer changes the amount —
 * react-hook-form only clears the errors its own resolver produced.
 */
export const TIP_SERVER_ERROR_TYPE = 'server';

/**
 * Attach a tip rejection to the tip field.
 *
 * The API tags its tip errors (`TIP_EXCEEDS_LIMIT`, `INVALID_TIP_AMOUNT`,
 * `TIPS_NOT_ENABLED`) with `extensions.path: ['tipAmount']`, so the field is
 * taken from the response rather than an allow-list of codes that would have to
 * be kept in step with the API.
 *
 * The error also stays in the checkout-wide list, which scrolls itself into view
 * and covers the case where the tip section is not rendered at all.
 *
 * @param translate resolves an error code to localized copy
 * @returns true when the error was attributed to the tip field
 */
export function applyTipFieldError(
  form: Pick<UseFormReturn, 'setError'> | null | undefined,
  error: unknown,
  translate: (code: string) => string | undefined
): boolean {
  if (!form || !(error instanceof GraphQLErrorWithCodes)) return false;

  const tipError = error.errors.find(item => item.path?.[0] === 'tipAmount');
  if (!tipError) return false;

  form.setError('tipAmount', {
    type: TIP_SERVER_ERROR_TYPE,
    // The API message is developer-facing and untranslated, so prefer localized
    // copy for the code and fall back to the bare code, matching what
    // CheckoutErrorList renders for an unmapped code.
    message: (tipError.code && translate(tipError.code)) || tipError.code,
  });

  return true;
}
