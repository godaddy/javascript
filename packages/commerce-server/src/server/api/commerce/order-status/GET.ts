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
 * Response: { success: true, order: CommerceOrderStatus }
 *   order.status is the payment status returned by the authorized Orders API.
 * The host must authorize the caller's access to the requested order.
 */
import type { Request, Response } from 'express';

import { commerceConfigurationForResponse } from '@/lib/commerce/config';
import { getOrderStatus } from '@/lib/commerce/get-order-status';

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { orderId } = req.query;
    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({ success: false, error: 'missing or invalid orderId query parameter' });
      return;
    }

    const order = await getOrderStatus(orderId, commerceConfigurationForResponse(res));
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get order status',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
