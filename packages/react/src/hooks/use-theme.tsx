'use client';
import { useInsertionEffect } from 'react';
// hooks/useTheme.ts
import { useGoDaddyContext } from '@/godaddy-provider';

export const themes = {
  base: { value: 'theme-base', label: 'Base' },
  purple: { value: 'theme-purple', label: 'Purple' },
  orange: { value: 'theme-orange', label: 'Orange' },
} as const;

export type Theme = keyof typeof themes;

/**
 * Hook that applies theme from override or context
 * @param {Theme} [overrideTheme] - Optional theme that overrides context theme
 */
export function useTheme(overrideTheme?: Theme | null, target?: HTMLElement) {
  const { appearance, uiContainer } = useGoDaddyContext();

  // Priority: overrideTheme > context.appearance.theme
  const theme = overrideTheme ?? appearance?.theme;

  useInsertionEffect(() => {
    const root = target ?? uiContainer ?? document.documentElement;
    // Remove all theme classes
    root.classList.remove(...Object.values(themes).map(t => t.value));

    if (theme && theme !== 'base') {
      root.classList.add(themes?.[theme]?.value);
    }
  }, [theme, target, uiContainer]);
}
