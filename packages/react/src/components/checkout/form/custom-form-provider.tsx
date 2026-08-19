import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { FormProvider } from 'react-hook-form';
import type { CheckoutFormData } from '../checkout';

export function CustomFormProvider<
  TFormValues extends Record<string, unknown> = CheckoutFormData,
>({
  children,
  ...methods
}: { children: React.ReactNode } & UseFormReturn<TFormValues>) {
  return <FormProvider {...methods}>{children}</FormProvider>;
}
