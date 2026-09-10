interface TaxAmount {
  included?: boolean | null;
  amount?: {
    value?: number | null;
  } | null;
}

export function getIncludedTaxTotal(
  taxes?: readonly TaxAmount[] | null
): number {
  return (
    taxes?.reduce(
      (total, tax) =>
        total + (tax.included === true ? tax.amount?.value || 0 : 0),
      0
    ) ?? 0
  );
}
