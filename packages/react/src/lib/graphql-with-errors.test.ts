import { GraphQLError } from 'graphql';
import { ClientError } from 'graphql-request';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GraphQLErrorWithCodes,
  getPaymentActionRequiredResult,
  graphqlRequestWithErrors,
} from './graphql-with-errors';

const requestMock = vi.hoisted(() => vi.fn());

vi.mock('graphql-request', async importOriginal => {
  const actual = await importOriginal<typeof import('graphql-request')>();
  return { ...actual, request: requestMock };
});

describe('graphqlRequestWithErrors', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it.each(['FAILED', 'PENDING', undefined])(
    'preserves optional transaction status %s without changing the error code',
    async transactionStatus => {
      const extensions = {
        code: 'TRANSACTION_PROCESSING_FAILED',
        ...(transactionStatus ? { transactionStatus } : {}),
      };
      requestMock.mockRejectedValue(
        new ClientError(
          {
            status: 200,
            errors: [
              new GraphQLError('Failed to process transaction', { extensions }),
            ],
          },
          {
            query: 'mutation ConfirmCheckout { confirmCheckoutSession { id } }',
          }
        )
      );

      await expect(
        graphqlRequestWithErrors('https://example.test/graphql', 'query')
      ).rejects.toMatchObject({
        codes: ['TRANSACTION_PROCESSING_FAILED'],
        errors: [{ code: 'TRANSACTION_PROCESSING_FAILED', extensions }],
      });
    }
  );

  it('preserves payment action-required extensions', async () => {
    requestMock.mockRejectedValue(
      new ClientError(
        {
          status: 200,
          errors: [
            new GraphQLError('Payment requires additional customer action', {
              extensions: {
                code: 'PAYMENT_ACTION_REQUIRED',
                paymentResult: {
                  status: 'ACTION_REQUIRED',
                  provider: 'STRIPE',
                  nextStep: {
                    type: 'SDK_ACTION',
                    sdk: 'STRIPE_JS',
                    action: 'HANDLE_NEXT_ACTION',
                    clientSecret: 'pi-secret',
                  },
                },
              },
            }),
          ],
        },
        {
          query:
            'mutation ConfirmCheckout { confirmCheckoutSession { status } }',
        }
      )
    );

    let thrown: unknown;
    try {
      await graphqlRequestWithErrors('https://example.test/graphql', 'query');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(GraphQLErrorWithCodes);
    expect(getPaymentActionRequiredResult(thrown)).toEqual({
      status: 'ACTION_REQUIRED',
      provider: 'STRIPE',
      nextStep: {
        type: 'SDK_ACTION',
        sdk: 'STRIPE_JS',
        action: 'HANDLE_NEXT_ACTION',
        clientSecret: 'pi-secret',
      },
    });
  });
  it('preserves tip input paths alongside error extensions', async () => {
    requestMock.mockRejectedValue(
      new ClientError(
        {
          status: 200,
          errors: [
            new GraphQLError('Invalid tip', {
              path: ['confirmCheckoutSession'],
              extensions: { code: 'INVALID_TIP_AMOUNT', path: ['tipAmount'] },
            }),
          ],
        },
        {
          query:
            'mutation ConfirmCheckout { confirmCheckoutSession { status } }',
        }
      )
    );
    await expect(
      graphqlRequestWithErrors('https://example.test/graphql', 'query')
    ).rejects.toMatchObject({
      errors: [
        {
          code: 'INVALID_TIP_AMOUNT',
          path: ['tipAmount'],
          extensions: { path: ['tipAmount'] },
        },
      ],
    });
  });
});
