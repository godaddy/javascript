const CART_ORDER_ID_KEY = 'godaddy_cart_order_id';
const CART_CREATED_AT_KEY = 'godaddy_cart_created_at';
const CART_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Get the cart order ID from localStorage.
 * Returns null if the cart doesn't exist or has expired.
 */
export function getCartOrderId(): string | null {
  if (typeof window === 'undefined') {
    // SSR safety
    return null;
  }

  const orderId = localStorage.getItem(CART_ORDER_ID_KEY);
  const createdAt = localStorage.getItem(CART_CREATED_AT_KEY);

  // No cart exists
  if (!orderId) {
    return null;
  }

  // Check if cart has expired (30 days old)
  if (createdAt) {
    const age = Date.now() - parseInt(createdAt, 10);
    if (age > CART_TTL) {
      // Cart expired, clean it up
      clearCartOrderId();
      return null;
    }
  }

  return orderId;
}

/**
 * Save the cart order ID to localStorage with a timestamp.
 */
export function setCartOrderId(orderId: string): void {
  if (typeof window === 'undefined') {
    // SSR safety
    return;
  }

  localStorage.setItem(CART_ORDER_ID_KEY, orderId);
  localStorage.setItem(CART_CREATED_AT_KEY, Date.now().toString());
}

/**
 * Remove the cart order ID and timestamp from localStorage.
 */
export function clearCartOrderId(): void {
  if (typeof window === 'undefined') {
    // SSR safety
    return;
  }

  localStorage.removeItem(CART_ORDER_ID_KEY);
  localStorage.removeItem(CART_CREATED_AT_KEY);
}

/**
 * Get the age of the current cart in days.
 * Returns null if no cart exists.
 */
export function getCartAge(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const createdAt = localStorage.getItem(CART_CREATED_AT_KEY);
  if (!createdAt) {
    return null;
  }

  const ageMs = Date.now() - parseInt(createdAt, 10);
  return Math.floor(ageMs / (24 * 60 * 60 * 1000)); // Convert to days
}
