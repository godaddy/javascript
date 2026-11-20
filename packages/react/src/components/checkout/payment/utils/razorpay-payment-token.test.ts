import { describe, expect, it } from 'vitest';
import { encodeRazorpayPaymentToken } from './razorpay-payment-token';

describe('encodeRazorpayPaymentToken', () => {
  it('encodes the versioned handler response as unpadded base64url', () => {
    const token = encodeRazorpayPaymentToken({
      v: 1,
      paymentId: 'pay_29QQoUBi66xm2f',
      orderId: 'order_9A33XWu170gUtm',
      signature: '9ef4dffbfd84f1318',
    });

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/u);

    const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    expect(JSON.parse(atob(padded))).toEqual({
      v: 1,
      paymentId: 'pay_29QQoUBi66xm2f',
      orderId: 'order_9A33XWu170gUtm',
      signature: '9ef4dffbfd84f1318',
    });
  });
});
