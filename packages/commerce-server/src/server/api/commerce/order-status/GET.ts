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
 *   502 Commerce or token failure (`code: upstream_error | upstream_unauthorized`)
 *   503 Commerce is not configured
 *   500 unexpected server failure
 * Failure bodies are { success: false, error, code, requestId }.
 * The host must authorize the caller's access to the requested order.
 */
import type { Request, Response } from 'express';
import { commerceRoute } from '@/lib/commerce/commerce-route';
import { commerceConfigurationForResponse } from '@/lib/commerce/config';
import { getOrderStatus, InvalidOrderIdError } from '@/lib/commerce/get-order-status';

async function readOrderStatus(req: Request, res: Response): Promise<void> {
  const { orderId } = req.query;
  // getOrderStatus validates string IDs; only repeated or nested query values need rejecting here.
  if (typeof orderId !== 'string') {
    throw new InvalidOrderIdError();
  }

  const order = await getOrderStatus(orderId, commerceConfigurationForResponse(res));
  res.status(200).json({ success: true, order });
}

export default commerceRoute('Failed to get order status', readOrderStatus, {
  failureFields: { success: false },
});
