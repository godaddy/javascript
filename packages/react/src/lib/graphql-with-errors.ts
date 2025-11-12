import type { DocumentNode } from 'graphql';
import { ClientError, request, type Variables } from 'graphql-request';

// Define the shape of GraphQL errors explicitly
export class GraphQLErrorWithCodes<
  T extends { message?: string; code?: string } = {
    message?: string;
    code?: string;
  },
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

export async function graphqlRequestWithErrors<T = any>(
  endpoint: string,
  query: DocumentNode,
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
      }));
      throw new GraphQLErrorWithCodes(parsedErrors);
    }
    throw err; // network or unknown error
  }
}
