export const cx = (...classes: Array<string | undefined>): string => classes.filter(Boolean).join(' ');

/** Classes for the element that receives a part's `className`. The package CSS reset skips `commerce-part`. */
export const partClass = (...classes: Array<string | undefined>): string => cx('commerce-part', ...classes);
