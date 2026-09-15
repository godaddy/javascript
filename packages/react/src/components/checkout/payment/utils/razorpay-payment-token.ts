export type RazorpayPaymentTokenV1 = {
  v: 1;
  paymentId: string;
  orderId: string;
  signature: string;
};

export function encodeRazorpayPaymentToken(
  payload: RazorpayPaymentTokenV1
): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/u, '');
}
