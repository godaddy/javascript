'use client';
import { useEffect } from 'react';
// hooks/useTheme.ts
import { useGoDaddyContext } from '@/godaddy-provider';

export const themes = {
  base: { value: 'theme-base', label: 'Base' },
  purple: { value: 'theme-purple', label: 'Purple' },
  orange: { value: 'theme-orange', label: 'Orange' },
} as const;

export type Theme = keyof typeof themes;

export function useTheme() {
  const { appearance } = useGoDaddyContext();
  const theme = appearance?.theme;

  useEffect(() => {
    // Remove all theme classes
    document.documentElement.classList.remove(...Object.values(themes).map(t => t.value));

    if (theme && theme !== 'base') {
      document.documentElement.classList.add(themes?.[theme]?.value);
    }
  }, [theme]);
}
