import { type RequestHandler, Router } from 'express';
import { type CommerceConfiguration, createRuntimeCommerceConfiguration } from './lib/commerce/config';
import cartDiscountPost from './server/api/commerce/cart/[id]/discounts/POST';
import cartGet from './server/api/commerce/cart/[id]/GET';
import cartItemDelete from './server/api/commerce/cart/[id]/items/[itemId]/DELETE';
import cartItemPatch from './server/api/commerce/cart/[id]/items/[itemId]/PATCH';
import cartItemPost from './server/api/commerce/cart/[id]/items/POST';
import cartPost from './server/api/commerce/cart/POST';
import checkoutPost from './server/api/commerce/checkout/POST';
import configGet from './server/api/commerce/config/GET';
import orderStatusGet from './server/api/commerce/order-status/GET';
import productGet from './server/api/commerce/products/[id]/GET';
import productsGet from './server/api/commerce/products/GET';
import skuGet from './server/api/commerce/skus/[id]/GET';

export interface CommerceRouterFeatures {
  catalog?: boolean;
  payments?: boolean;
}

export interface CreateCommerceRouterOptions {
  configuration?: CommerceConfiguration;
  features?: CommerceRouterFeatures;
}

export function createCommerceRouter(options: CreateCommerceRouterOptions = {}): Router {
  const router: Router = Router();
  const configuration: CommerceConfiguration = options.configuration ?? createRuntimeCommerceConfiguration();
  const catalogEnabled: boolean = options.features?.catalog ?? true;
  const paymentsEnabled: boolean = options.features?.payments ?? true;

  router.use((_req, res, next): void => {
    res.locals.commerceConfiguration = configuration;
    next();
  });

  if (catalogEnabled) {
    router.get('/config', configGet as RequestHandler);
    router.get('/products', productsGet as RequestHandler);
    router.get('/products/:id', productGet as RequestHandler);
    router.get('/skus/:id', skuGet as RequestHandler);
    router.post('/cart', cartPost as RequestHandler);
    router.get('/cart/:id', cartGet as RequestHandler);
    router.post('/cart/:id/items', cartItemPost as RequestHandler);
    router.patch('/cart/:id/items/:itemId', cartItemPatch as RequestHandler);
    router.delete('/cart/:id/items/:itemId', cartItemDelete as RequestHandler);
    router.post('/cart/:id/discounts', cartDiscountPost as RequestHandler);
  }

  if (paymentsEnabled) {
    router.post('/checkout', checkoutPost as RequestHandler);
    router.get('/order-status', orderStatusGet as RequestHandler);
  }

  return router;
}

export function createCommerceCatalogRouter(configuration?: CommerceConfiguration): Router {
  return createCommerceRouter({ configuration, features: { catalog: true, payments: false } });
}

export function createGoDaddyPaymentsRouter(configuration?: CommerceConfiguration): Router {
  return createCommerceRouter({ configuration, features: { catalog: false, payments: true } });
}
