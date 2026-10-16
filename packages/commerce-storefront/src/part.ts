import { Children, type ReactNode, useCallback, useMemo, useRef } from 'react';

/** Whether `children` renders anything, so `{custom && <Part />}` with `custom` false falls back to the default. */
export const hasChildren = (children: ReactNode): boolean =>
  Children.toArray(children).some((child) => child !== '');

export const cx = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(' ');

/** Classes for the element that receives a part's `className`. The package CSS reset skips `commerce-part`. */
export const partClass = (...classes: Array<string | undefined>): string => cx('commerce-part', ...classes);

export interface PartRegistry {
  /** Call from a part's effect; returns the cleanup. */
  register: (key: string) => () => void;
  has: (key: string) => boolean;
}

/**
 * Counts the parts mounted under a root, by key. Parts register in an effect, and a parent's effects run after its
 * children's, so the root can read `has` in its own effect. `onChange` must be stable; it runs after each change.
 */
export function usePartRegistry(onChange?: (has: PartRegistry['has']) => void): PartRegistry {
  const counts = useRef<Map<string, number>>(new Map());
  const has = useCallback((key: string): boolean => counts.current.has(key), []);
  const register = useCallback(
    (key: string): (() => void) => {
      counts.current.set(key, (counts.current.get(key) ?? 0) + 1);
      onChange?.(has);
      return () => {
        const count: number = (counts.current.get(key) ?? 1) - 1;
        if (count > 0) counts.current.set(key, count);
        else counts.current.delete(key);
        onChange?.(has);
      };
    },
    [has, onChange],
  );
  return useMemo(() => ({ register, has }), [register, has]);
}
