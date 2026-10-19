/**
 * GET /api/commerce/order-status?orderId=...
 *
 * Thin HTTP wrapper around `getOrderStatus()` in
 * `lib/commerce/get-order-status.ts`. The browser may call this route to read
 * order data after checkout. Other server-side code in the same app (e.g.
 * an appointment-booking handler in a payment adapter) should NOT
 * loopback-fetch this endpoint; import `getOrderStatus` from the lib module
 * and call it in-process so the inbound request's auth context isn't stripped.
 *
 * Query:
 *   orderId  - GoDaddy order id (required)
 *
 * Responses:
 *   200 { success: true, order: CommerceOrderStatus }
 *       order.status is the payment status returned by the authorized Orders API.
 *   400 missing, blank, padded, `.` or `..` orderId, or one the Orders API rejects as malformed
 *   404 no order with that id in the configured store and channel
 *   500 credential, upstream, or configuration failure
 * The host must authorize the caller's access to the requested order.
 */
import type { Request, Response } from 'express';

import { commerceConfigurationForResponse } from '@/lib/commerce/config';
import { getOrderStatus } from '@/lib/commerce/get-order-status';

const invalidOrderIdBody = { success: false, error: 'missing or invalid orderId query parameter' };

// Matched by name, not instanceof, so errors still match when a host has several copies of this package.
function hasErrorName(error: unknown, name: string): boolean {
  return error instanceof Error && error.name === name;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.query;
    // getOrderStatus validates string IDs; only repeated or nested query values need rejecting here.
    if (typeof orderId !== 'string') {
      res.status(400).json(invalidOrderIdBody);
      return;
    }

    const order = await getOrderStatus(orderId, commerceConfigurationForResponse(res));
    res.status(200).json({ success: true, order });
  } catch (error) {
    if (hasErrorName(error, 'InvalidOrderIdError')) {
      res.status(400).json(invalidOrderIdBody);
      return;
    }
    if (hasErrorName(error, 'OrderNotFoundError')) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }
    // The detail can name upstream statuses, credentials, or configuration, so it stays server-side.
    console.error('order-status: failed to get order status', error);
    res.status(500).json({ success: false, error: 'Failed to get order status' });
  }
}
