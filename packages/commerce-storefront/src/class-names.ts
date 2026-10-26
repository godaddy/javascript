// Colors come in pairs that stay legible on any host background:
// - accent fill with on-accent text, ringed in the accent, which must already contrast with the page;
// - transparent, with lines, tints and muted text derived from the inherited text color (commerce-*);
// - the opaque surface (bg-white) with its own text color (text-neutral-900), for inputs and the drawer.
// Disabled buttons switch to the transparent pair, so they read on whatever the button sits on.
export const buttonClass: string =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-commerce-accent px-5 py-2 text-sm font-medium text-commerce-on-accent transition-colors hover:bg-commerce-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-commerce-accent disabled:cursor-not-allowed disabled:bg-commerce-tint-strong disabled:text-commerce-muted disabled:hover:bg-commerce-tint-strong';
/** A quieter button for repeated or secondary actions: transparent, outlined in the inherited text color. */
export const secondaryButtonClass: string =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-commerce-edge px-5 py-2 text-sm font-medium transition-colors hover:bg-commerce-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:cursor-not-allowed disabled:border-commerce-line disabled:text-commerce-muted disabled:hover:bg-transparent';
// The focus ring sits inside the border, over the input's own surface, so it shows on any page background.
export const inputClass: string =
  'min-h-11 rounded-lg border border-neutral-400 bg-white px-3 py-2 text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-neutral-900';
/** A self-contained message box: its own background and text, so it reads on any page or surface. */
export const errorNoticeClass: string = 'rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800';
/** The underlined action inside an `errorNoticeClass` box. */
export const errorActionClass: string =
  'mt-1 min-h-11 font-medium text-red-800 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-800 disabled:cursor-not-allowed';
/** The Sale badge: its own fill and text, so it reads over an image or on any page. */
export const saleBadgeClass: string =
  'inline-flex rounded bg-commerce-sale px-2 py-0.5 text-xs font-semibold leading-5 text-commerce-on-sale';
