import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUrlHash(location: Location) {
  return location.hash.replace(/^#/, '');
}

export function getSessionIdFromPath(location: Location) {
  const segments = location.pathname.split('/').filter(Boolean);
  return segments[segments.length - 1];
}

/**
 * Get an environment variable with framework-specific prefix detection.
 * Checks for Next.js (NEXT_PUBLIC_), Vite (VITE_), and unprefixed variables.
 *
 * @param key - The environment variable name without framework prefix
 * @returns The environment variable value or empty string if not found
 *
 * @example
 * ```ts
 * // Automatically checks NEXT_PUBLIC_STRIPE_KEY, VITE_STRIPE_KEY, and STRIPE_KEY
 * const stripeKey = getEnvVar('STRIPE_KEY');
 * ```
 */
export function getEnvVar(key: string): string {
  const prefixes = ['NEXT_PUBLIC_', 'VITE_', ''];

  for (const prefix of prefixes) {
    // In Next.js, process.env.NEXT_PUBLIC_* is replaced at build time
    // But since this is a library, we need to access it from the consuming app's env
    if (typeof process !== 'undefined' && process.env) {
      const value = process.env[`${prefix}${key}`];
      if (value !== undefined) {
        return value;
      }
    }
  }

  return '';
}

export const DEFAULT_API_HOST = 'api.godaddy.com';

export function normalizeApiHost(host?: string): string {
  const baseUrl = host || getEnvVar('GODADDY_API_HOST') || DEFAULT_API_HOST;
  return baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
}
