import type { NextFunction, Request, Response } from 'express';
import type { VerifiableRequest } from '../types/verifiable-request';
import type {
  VerificationOptions,
  WebhookVerificationOptions,
} from '../utils/config';
import { verifyAction } from '../utils/verification';
import { verifyWebhookSubscription } from '../utils/webhook';

/**
 * Creates a middleware for Express.js that verifies signed action requests
 */
export function createActionMiddleware(options?: VerificationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const verifiableRequest: VerifiableRequest = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query as Record<string, string | string[] | undefined>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      body: req.body,
    };

    const result = await verifyAction(verifiableRequest, options);

    if (!result.success) {
      return res.status(401).json(result.error);
    }

    next();
  };
}

/**
 * Creates a middleware for Express.js that verifies webhook subscription requests
 */
export function createWebhookMiddleware(options?: WebhookVerificationOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const verifiableRequest: VerifiableRequest = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query as Record<string, string | string[] | undefined>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      body: req.body,
    };

    const result = verifyWebhookSubscription(verifiableRequest, options);

    if (!result.success) {
      return res.status(401).json(result.error);
    }

    next();
  };
}
