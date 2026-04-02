'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { ProductDetailsTarget } from '../targets/product-details-target';

export interface ProductDetailsContextValue {
  targets?: Partial<
    Record<
      ProductDetailsTarget,
      (props: { skuId: string | null; storeId: string | undefined }) => ReactNode
    >
  >;
  skuId: string | null;
}

const productDetailsContext = createContext<ProductDetailsContextValue | null>(
  null
);

export const ProductDetailsProvider = productDetailsContext.Provider;

export function useProductDetailsContext(): ProductDetailsContextValue {
  const ctx = useContext(productDetailsContext);
  if (!ctx) {
    throw new Error(
      'useProductDetailsContext must be used within a <ProductDetails /> component'
    );
  }
  return ctx;
}
