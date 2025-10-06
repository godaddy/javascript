/**
 * GoDaddy standard error schema
 * Based on https://godaddy.com/schemas/common/error.v1
 */

export interface ErrorDetails {
  field?: string;
  value?: string;
  location?: 'body' | 'path' | 'query' | 'header';
  issue: string;
  description?: string;
}

export interface LinkDescription {
  href: string;
  rel: string;
  title?: string;
  targetMediaType?: string;
  targetSchema?: unknown;
  method?: string;
  submissionMediaType?: string;
  submissionSchema?: unknown;
}

export interface GoDaddyError {
  name: string;
  correlationId: string;
  message: string;
  informationLink?: string;
  details?: ErrorDetails[];
  links?: LinkDescription[];
}
