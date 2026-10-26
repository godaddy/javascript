import { Children, Fragment, isValidElement, type ReactNode, useCallback, useMemo, useRef } from 'react';

/**
 * Whether `children` renders anything, so `{custom && <Part />}` with `custom` false falls back to the default. Blank
 * text and fragments holding nothing count as nothing. A component element counts as content: what it renders is
 * not known until it renders.
 */
export const hasChildren = (children: ReactNode): boolean =>
  Children.toArray(children).some((child) => {
    if (typeof child === 'string') return child.trim() !== '';
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment)
      return hasChildren(child.props.children);
    return true;
  });

export const cx = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(' ');

/** Classes for the element that receives a part's `className`. The package CSS reset skips `commerce-part`. */
export const partClass = (...classes: Array<string | undefined>): string => cx('commerce-part', ...classes);

/**
 * Props for a part's outer element: `partClass` plus `data-commerce-part`, the part's name in kebab case, such as
 * `cart-checkout`. The attribute is a stable styling hook; internal utility classes are not.
 */
export const partProps = (
  name: string,
  ...classes: Array<string | undefined>
): { className: string; 'data-commerce-part': string } => ({
  className: partClass(...classes),
  'data-commerce-part': name,
});

/** Replacement content for a part's text: content, or a function of the part's state. */
export type PartLabel<State> = ReactNode | ((state: State) => ReactNode);

/** The host's label for `state`, or `fallback` when the host gave none or it renders nothing. */
export function renderLabel<State>(
  label: PartLabel<State> | undefined,
  state: State,
  fallback: ReactNode,
): ReactNode {
  if (typeof label === 'function') {
    const content: ReactNode = label(state);
    return hasChildren(content) ? content : fallback;
  }
  return hasChildren(label) ? label : fallback;
}

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
