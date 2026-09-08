import {
  ClientError,
  type RequestDocument,
  request,
  type Variables,
} from 'graphql-request';

export type GraphQLErrorDetails = {
  message?: string;
  code?: string;
  extensions?: Record<string, unknown>;
};

export class GraphQLErrorWithCodes<
  T extends GraphQLErrorDetails = GraphQLErrorDetails,
> extends Error {
  constructor(public errors: T[]) {
    const errorMessage =
      errors.length === 1
        ? `${errors[0].message || 'Unknown error'}`
        : `${errors
            .map(e => e.message)
            .filter(Boolean)
            .join('; ')}`;

    super(errorMessage);
    this.name = 'GraphQLErrorWithCodes';
  }

  get codes(): string[] {
    return this.errors.map(e => e.code).filter(Boolean) as string[];
  }

  get messages(): string[] {
    return this.errors.map(e => e.message).filter(Boolean) as string[];
  }
}

export type PaymentActionRequiredResult = {
  status: 'ACTION_REQUIRED';
  provider?: string;
  reason?: string;
  transactionId?: string;
  paymentReference?: string;
  nextStep: Record<string, unknown> & { type: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getPaymentActionRequiredResult(
  error: unknown
): PaymentActionRequiredResult | undefined {
  if (!(error instanceof GraphQLErrorWithCodes)) return undefined;

  for (const graphqlError of error.errors) {
    if (graphqlError.code !== 'PAYMENT_ACTION_REQUIRED') continue;

    const paymentResult = graphqlError.extensions?.paymentResult;
    if (
      !isRecord(paymentResult) ||
      paymentResult.status !== 'ACTION_REQUIRED'
    ) {
      continue;
    }

    const nextStep = paymentResult.nextStep;
    if (!isRecord(nextStep) || typeof nextStep.type !== 'string') continue;

    return paymentResult as PaymentActionRequiredResult;
  }

  return undefined;
}

export async function graphqlRequestWithErrors<T = any>(
  endpoint: string,
  query: RequestDocument,
  variables?: Variables,
  headers?: HeadersInit
): Promise<T> {
  try {
    return await request<T>(endpoint, query, variables, headers);
  } catch (err) {
    if (err instanceof ClientError && err.response?.errors?.length) {
      const parsedErrors = err.response.errors.map(e => ({
        message: e.message as string,
        code: e.extensions?.code as string,
        extensions: e.extensions as Record<string, unknown> | undefined,
      }));
      throw new GraphQLErrorWithCodes(parsedErrors);
    }
    throw err; // network or unknown error
  }
}
