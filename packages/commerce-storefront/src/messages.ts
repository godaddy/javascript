/**
 * One piece of package text. `{name}` placeholders are replaced with values, and numbers are formatted for the
 * messages' `locale`. A message with a `count` can be an object of plural forms, chosen with `Intl.PluralRules`.
 */
export type StorefrontMessage =
  | string
  | ({ readonly other: string } & Partial<Record<Intl.LDMLPluralRule, string>>);

const englishText = {
  // Connection
  connectPrompt: 'Connect a store to show products.',
  connecting: 'Connecting to the store…',
  retryConnection: 'Retry connection',
  connectionSlow: 'The store is taking too long to connect.',
  invalidConfiguration: 'The store returned invalid configuration.',
  // Errors
  requestFailed: 'Commerce request failed. Please retry.',
  requestFailedStatus: 'Commerce request failed ({status}). Please retry.',
  requestTimeout: 'Commerce information took too long to load. Please retry.',
  unknownError: 'Something went wrong. Please retry.',
  storageUnavailable: 'Your browser cannot save the cart. Keep this page open while shopping.',
  invalidAddItem: 'Select a product variant and a positive quantity.',
  addReturnedNoCart: 'Commerce did not return a cart with items. Refresh before retrying.',
  itemNotInCart: 'This item is no longer in the cart.',
  invalidQuantity: 'Quantity must be a positive whole number.',
  updateReturnedNoCart: 'Commerce did not return the updated cart. Refresh before retrying.',
  discountMissing: 'Add an item and enter a promotion code.',
  discountReturnedNoCart: 'Commerce did not return the updated cart.',
  checkoutDisabled: 'Checkout has not been enabled for this store.',
  checkoutEmpty: 'Add an item before checking out.',
  checkoutNoUrl: 'Commerce did not return a checkout URL.',
  checkoutInvalidUrl: 'Commerce returned an invalid checkout URL.',
  // Screen reader announcements
  itemAdded: '{name} added to your cart.',
  sampleItemAdded: '{name} added to your sample cart.',
  itemRemoved: 'Item removed from cart.',
  quantityUpdated: 'Cart quantity updated.',
  discountsUpdated: 'Promotion codes updated.',
  sampleQuantityUpdated: 'Sample cart quantity updated.',
  sampleItemRemoved: 'Sample item removed from cart.',
  // Cart button and add to cart
  cartButtonLabel: { one: 'Cart, {count} item', other: 'Cart, {count} items' },
  addToCart: 'Add to cart',
  addToCartWithPrice: 'Add to cart · {price}',
  addToCartWithPriceName: 'Add to cart, {price}',
  adding: 'Adding…',
  outOfStock: 'Out of stock',
  addReasonUnbound: 'Connect a store to add items to the cart.',
  addReasonError: 'The store could not be reached.',
  addReasonNoSku: 'This item cannot be added to the cart.',
  loadingCart: 'Loading your cart…',
  quantityNotWhole: 'Enter a whole number of 1 or more.',
  quantityOverStock: 'Only {count} available.',
  // Cart
  cartTitle: 'Your cart',
  sampleCartTitle: 'Sample cart',
  cartDescription: 'Review your items before checkout.',
  sampleCartDescription: 'Example products and prices in {currency}. Nothing can be purchased.',
  closeCart: 'Close cart',
  refreshCart: 'Refresh cart',
  priceUnavailable: 'Price unavailable',
  decreaseQuantity: 'Decrease quantity of {name}',
  increaseQuantity: 'Increase quantity of {name}',
  quantityPrefix: 'Quantity: ',
  remove: 'Remove',
  itemOption: '{attribute}: {values}',
  cartEmpty: 'Your cart is empty',
  cartEmptyHint: 'Add something you love and it will show up here.',
  sampleCartEmptyHint: 'Add a sample product to try the cart.',
  browseProducts: 'Browse products',
  subtotal: 'Subtotal',
  sampleSubtotal: 'Sample subtotal',
  checkoutAdjustments: 'Shipping, taxes & discounts',
  checkoutAdjustmentsValue: 'Calculated at checkout',
  sampleCheckoutNote: 'Example total in {currency}. Checkout is not set up yet.',
  checkoutUnavailable: 'Checkout is not available yet.',
  checkout: 'Proceed to checkout',
  openingCheckout: 'Opening checkout…',
  continueShopping: 'Continue shopping',
  // Catalog
  catalogTitle: 'Shop all products',
  catalogDescription: 'Explore the collection and find your favorites.',
  sampleCatalogSummary: 'Sample products · Example prices in {currency}',
  loadingProducts: 'Loading products…',
  productsUnavailable: 'Products unavailable',
  productCount: { one: 'Showing {count} product', other: 'Showing {count} products' },
  retryProducts: 'Retry products',
  noProducts: 'No products available.',
  productPages: 'Product pages',
  firstPage: 'First page',
  nextPage: 'Next page',
  sampleProductName: 'Product {number}',
  relatedTitle: 'You may also like',
  // Product cards
  imageUnavailable: '{name}: image unavailable',
  noImage: 'No image available',
  sale: 'Sale',
  wasPrice: 'Was',
  swatchSummary: {
    one: '{count} {attribute} option: {values}',
    other: '{count} {attribute} options: {values}',
  },
  chooseOptions: 'Choose options',
  viewProduct: 'View product',
  addSampleToCart: 'Add {name} to sample cart',
  sampleItemName: '({name}, sample)',
  // Product page
  loadingProduct: 'Loading product…',
  productUnavailable: 'Product unavailable',
  retryProduct: 'Retry product',
  productNotFound: 'Product not found',
  backToShop: 'Back to shop',
  viewImage: 'View image {number}',
  priceFrom: 'From {price}',
  selectAllOptions: 'Select all options to add this item to your cart.',
  checkingVariant: 'Checking this variant…',
  variantCheckFailed: 'Availability for this selection could not be checked.',
  combinationUnavailable: 'This combination is unavailable. Choose different options.',
  notPurchasable: 'This product is not currently available to purchase.',
  selectAttribute: 'Select {attribute}',
  selectAttributeError: 'Select {attribute}.',
  selectOption: 'Select an option',
  skuOptionLabel: 'Option',
  soldOutOption: '{label} (sold out)',
  soldOutChoice: '{label}, sold out',
  retryAvailability: 'Retry availability',
  availableToOrder: 'Available to order',
  variantOutOfStock: 'This variant is out of stock',
  availableCount: '{count} available',
  quantity: 'Quantity',
} satisfies Record<string, StorefrontMessage>;

export type StorefrontMessageKey = keyof typeof englishText;

/** Error codes from `@godaddy/gd-commerce-server` failure responses. Other codes may be added. */
export type CommerceErrorCode =
  | 'invalid_request'
  | 'scope_mismatch'
  | 'not_found'
  | 'not_configured'
  | 'upstream_unauthorized'
  | 'upstream_error'
  | 'internal_error';

/**
 * All of the package's text. Pass a complete set, such as `frFR` from
 * `@godaddy/gd-commerce-storefront/messages/fr-FR`, or only the keys to change, to `CommerceProvider`'s `messages`.
 */
export type StorefrontMessages = { readonly [Key in StorefrontMessageKey]: StorefrontMessage } & {
  /** The BCP 47 locale the text is written in. Chooses plural forms and formats numbers inside messages. */
  readonly locale: string;
  /**
   * Text for server failures, by the response's `code`. The server's own messages are English, so English text
   * shows them for any code not listed here; text in other languages shows `requestFailed` instead.
   */
  readonly errorCodes: Partial<Record<CommerceErrorCode | (string & {}), string>>;
};

/** The package's English text, the default for every key a site does not set. */
export const enUS: StorefrontMessages = { locale: 'en-US', errorCodes: {}, ...englishText };

export type MessageValues = Readonly<Record<string, string | number>>;

/** `key` from `messages`, with its plural form chosen by `values.count` and its placeholders filled in. */
export function formatMessage(
  messages: StorefrontMessages,
  key: StorefrontMessageKey,
  values: MessageValues = {},
): string {
  // Messages can come from JSON, so a malformed one shows the English text rather than breaking rendering.
  const text: string =
    pickText(messages[key], values.count, messages.locale) ??
    pickText(enUS[key], values.count, enUS.locale) ??
    key;
  return text.replace(/\{(\w+)\}/g, (placeholder: string, name: string): string => {
    const value: string | number | undefined = values[name];
    if (value === undefined) return placeholder;
    return typeof value === 'number' ? numberFormat(messages.locale).format(value) : value;
  });
}

function pickText(message: unknown, count: unknown, locale: string): string | undefined {
  if (typeof message === 'string') return message;
  if (typeof message !== 'object' || message === null) return undefined;
  const forms = message as Partial<Record<Intl.LDMLPluralRule, unknown>>;
  const form: Intl.LDMLPluralRule | undefined =
    typeof count === 'number' ? pluralRules(locale).select(count) : undefined;
  const chosen: unknown = form && forms[form];
  if (typeof chosen === 'string' && chosen) return chosen;
  return typeof forms.other === 'string' ? forms.other : undefined;
}

/** Whether the text is English, the language of the server's own error messages. */
export const isEnglish = (messages: StorefrontMessages): boolean => /^en(?:-|$)/i.test(messages.locale);

/** An error whose text is a package message, so it shows in the provider's language. */
export class StorefrontError extends Error {
  constructor(
    public readonly key: StorefrontMessageKey,
    public readonly values: MessageValues = {},
    options?: ErrorOptions,
  ) {
    super(formatMessage(enUS, key, values), options);
    this.name = 'StorefrontError';
  }
}

const pluralRulesCache = new Map<string, Intl.PluralRules>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();

function pluralRules(locale: string): Intl.PluralRules {
  let rules: Intl.PluralRules | undefined = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(safeLocale(locale));
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

function numberFormat(locale: string): Intl.NumberFormat {
  let format: Intl.NumberFormat | undefined = numberFormatCache.get(locale);
  if (!format) {
    format = new Intl.NumberFormat(safeLocale(locale));
    numberFormatCache.set(locale, format);
  }
  return format;
}

/** `locale`, or `en-US` when it is not a valid tag, so a typo in a message file cannot break rendering. */
function safeLocale(locale: string): string {
  try {
    return Intl.getCanonicalLocales(locale)[0] ?? 'en-US';
  } catch {
    return 'en-US';
  }
}
