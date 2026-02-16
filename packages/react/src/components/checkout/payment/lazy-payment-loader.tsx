'use client';

import { type ComponentType, lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type AvailablePaymentProviders,
  PaymentMethodType,
  type PaymentMethodValue,
  PaymentProvider,
} from '@/types';

// Define lazy-loaded components
const LazyComponents = {
  // Credit Card Forms
  GoDaddyCreditCardForm: lazy(() =>
    import(
      '@/components/checkout/payment/payment-methods/credit-card/godaddy'
    ).then(module => ({
      default: module.GoDaddyCreditCardForm,
    }))
  ),
  StripeCreditCardForm: lazy(() =>
    import(
      '@/components/checkout/payment/payment-methods/credit-card/stripe'
    ).then(module => ({
      default: module.StripeCreditCardForm,
    }))
  ),
  SquareCreditCardForm: lazy(() =>
    import(
      '@/components/checkout/payment/payment-methods/credit-card/square'
    ).then(module => ({
      default: module.SquareCreditCardForm,
    }))
  ),
  PayPalCreditCardForm: lazy(() =>
    import(
      '@/components/checkout/payment/payment-methods/credit-card/paypal'
    ).then(module => ({
      default: module.PayPalCreditCardForm,
    }))
  ),
  MercadoPagoCreditCardForm: lazy(() =>
    import(
      '@/components/checkout/payment/payment-methods/credit-card/mercadopago'
    ).then(module => ({
      default: module.MercadoPagoCreditCardForm,
    }))
  ),

  // Credit Card Buttons
  CreditCardCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/credit-card/godaddy'
    ).then(module => ({
      default: module.CreditCardCheckoutButton,
    }))
  ),
  StripeCreditCardCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/credit-card/stripe'
    ).then(module => ({
      default: module.StripeCreditCardCheckoutButton,
    }))
  ),
  SquareCreditCardCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/credit-card/square'
    ).then(module => ({
      default: module.SquareCreditCardCheckoutButton,
    }))
  ),
  PayPalCreditCardCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/credit-card/paypal'
    ).then(module => ({
      default: module.PayPalCreditCardCheckoutButton,
    }))
  ),
  MercadoPagoCreditCardCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/credit-card/mercadopago'
    ).then(module => ({
      default: module.MercadoPagoCreditCardCheckoutButton,
    }))
  ),

  // Express Buttons
  ExpressCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/express/godaddy'
    ).then(module => ({
      default: module.ExpressCheckoutButton,
    }))
  ),
  StripeExpressCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/express/stripe'
    ).then(module => ({
      default: module.StripeExpressCheckoutButton,
    }))
  ),

  // Other Payment Methods
  PayPalCheckoutButton: lazy(() =>
    import('@/components/checkout/payment/checkout-buttons/paypal/paypal').then(
      module => ({
        default: module.PayPalCheckoutButton,
      })
    )
  ),
  GoDaddyGooglePayCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/googlePay/godaddy'
    ).then(module => ({
      default: module.GoDaddyGooglePayCheckoutButton,
    }))
  ),
  OfflinePaymentCheckoutButton: lazy(() =>
    import(
      '@/components/checkout/payment/checkout-buttons/offline/default'
    ).then(module => ({
      default: module.OfflinePaymentCheckoutButton,
    }))
  ),
  PazeCheckoutButton: lazy(() =>
    import('@/components/checkout/payment/checkout-buttons/paze/godaddy').then(
      module => ({ default: module.PazeCheckoutButton })
    )
  ),

  // Container Components
  CreditCardContainer: lazy(() =>
    import(
      '@/components/checkout/payment/payment-methods/credit-card/container'
    ).then(module => ({
      default: module.CreditCardContainer,
    }))
  ),
};

type PaymentComponentKey = keyof typeof LazyComponents;

interface PaymentComponentProps {
  isExpress?: boolean;
}

// Component registry mapping
type PaymentComponentRegistry = {
  [PaymentMethodType.CREDIT_CARD]: {
    [PaymentProvider.GODADDY]: {
      form: PaymentComponentKey;
      button: PaymentComponentKey;
    };
    [PaymentProvider.STRIPE]: {
      form: PaymentComponentKey;
      button: PaymentComponentKey;
    };
    [PaymentProvider.SQUARE]: {
      form: PaymentComponentKey;
      button: PaymentComponentKey;
    };
    [PaymentProvider.PAYPAL]: {
      form: PaymentComponentKey;
      button: PaymentComponentKey;
    };
  };
  [PaymentMethodType.EXPRESS]?: {
    [PaymentProvider.GODADDY]: {
      button: PaymentComponentKey;
    };
    [PaymentProvider.STRIPE]: {
      button: PaymentComponentKey;
    };
  };
  [PaymentMethodType.PAYPAL]?: {
    [PaymentProvider.PAYPAL]: {
      button: PaymentComponentKey;
    };
  };
  [PaymentMethodType.GOOGLE_PAY]?: {
    [PaymentProvider.GODADDY]: {
      button: PaymentComponentKey;
    };
  };
  [PaymentMethodType.OFFLINE]?: {
    [PaymentProvider.OFFLINE]: {
      button: PaymentComponentKey;
    };
  };
  [PaymentMethodType.PAZE]?: {
    [PaymentProvider.GODADDY]: {
      button: PaymentComponentKey;
    };
  };
  [PaymentMethodType.MERCADOPAGO]?: {
    [PaymentProvider.MERCADOPAGO]: {
      form: PaymentComponentKey;
      button: PaymentComponentKey;
    };
  };
};

export const lazyPaymentComponentRegistry: PaymentComponentRegistry = {
  [PaymentMethodType.CREDIT_CARD]: {
    [PaymentProvider.GODADDY]: {
      form: 'GoDaddyCreditCardForm',
      button: 'CreditCardCheckoutButton',
    },
    [PaymentProvider.STRIPE]: {
      form: 'StripeCreditCardForm',
      button: 'StripeCreditCardCheckoutButton',
    },
    [PaymentProvider.SQUARE]: {
      form: 'SquareCreditCardForm',
      button: 'SquareCreditCardCheckoutButton',
    },
    [PaymentProvider.PAYPAL]: {
      form: 'PayPalCreditCardForm',
      button: 'PayPalCreditCardCheckoutButton',
    },
  },
  [PaymentMethodType.EXPRESS]: {
    [PaymentProvider.STRIPE]: {
      button: 'StripeExpressCheckoutButton',
    },
    [PaymentProvider.GODADDY]: {
      button: 'ExpressCheckoutButton',
    },
  },
  [PaymentMethodType.PAYPAL]: {
    [PaymentProvider.PAYPAL]: {
      button: 'PayPalCheckoutButton',
    },
  },
  [PaymentMethodType.GOOGLE_PAY]: {
    [PaymentProvider.GODADDY]: {
      button: 'GoDaddyGooglePayCheckoutButton',
    },
  },
  [PaymentMethodType.OFFLINE]: {
    [PaymentProvider.OFFLINE]: {
      button: 'OfflinePaymentCheckoutButton',
    },
  },
  [PaymentMethodType.PAZE]: {
    [PaymentProvider.GODADDY]: {
      button: 'PazeCheckoutButton',
    },
  },
  [PaymentMethodType.MERCADOPAGO]: {
    [PaymentProvider.MERCADOPAGO]: {
      form: 'MercadoPagoCreditCardForm',
      button: 'MercadoPagoCreditCardCheckoutButton',
    },
  },
};

// Payment loading skeleton component
function PaymentLoadingSkeleton({ type }: { type: 'form' | 'button' }) {
  if (type === 'form') {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-10 w-full' />
        <div className='grid grid-cols-2 gap-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>
        <Skeleton className='h-10 w-full' />
      </div>
    );
  }

  return <Skeleton className='h-12 w-full' />;
}

type LazyPaymentMethodRendererProps = {
  type: 'form' | 'button';
  method: PaymentMethodValue;
  provider: AvailablePaymentProviders;
  isExpress?: boolean;
};

export function LazyPaymentMethodRenderer({
  type,
  method,
  provider,
  isExpress,
}: LazyPaymentMethodRendererProps) {
  const methodRegistry =
    lazyPaymentComponentRegistry[
      method as keyof typeof lazyPaymentComponentRegistry
    ];
  const componentEntry =
    methodRegistry?.[provider as keyof typeof methodRegistry];

  if (!componentEntry || !componentEntry[type]) {
    return null;
  }

  const componentKey = componentEntry[type];
  const LazyComponent = LazyComponents[
    componentKey
  ] as ComponentType<PaymentComponentProps>;

  if (method === PaymentMethodType.CREDIT_CARD && type === 'form') {
    const LazyCreditCardContainer = LazyComponents.CreditCardContainer;
    return (
      <Suspense fallback={<PaymentLoadingSkeleton type={type} />}>
        <LazyCreditCardContainer>
          <LazyComponent />
        </LazyCreditCardContainer>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PaymentLoadingSkeleton type={type} />}>
      <LazyComponent isExpress={isExpress} />
    </Suspense>
  );
}

export function hasLazyPaymentMethodButton(
  method: PaymentMethodValue,
  provider: AvailablePaymentProviders
): boolean {
  const methodRegistry =
    lazyPaymentComponentRegistry[
      method as keyof typeof lazyPaymentComponentRegistry
    ];
  const componentEntry = methodRegistry?.[
    provider as keyof typeof methodRegistry
  ] as { button?: string } | undefined;
  return !!componentEntry?.button;
}

export function hasLazyPaymentMethodForm(
  method: PaymentMethodValue,
  provider: AvailablePaymentProviders
): boolean {
  const methodRegistry =
    lazyPaymentComponentRegistry[
      method as keyof typeof lazyPaymentComponentRegistry
    ];
  const componentEntry = methodRegistry?.[
    provider as keyof typeof methodRegistry
  ] as { form?: string } | undefined;
  return !!componentEntry?.form;
}
