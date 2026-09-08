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
});
