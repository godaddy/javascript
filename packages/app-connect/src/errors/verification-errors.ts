import { VerificationError } from './base-error';

/**
 * Error thrown when a required signature header is missing
 */
export class MissingHeaderError extends VerificationError {
  constructor({
    headerName,
    correlationId,
  }: {
    headerName: string;
    correlationId?: string;
  }) {
    super({
      name: 'MISSING_SIGNATURE_HEADER',
      message: `Missing required header: ${headerName}`,
      correlationId,
      details: [
        {
          issue: 'MISSING_REQUIRED_HEADER',
          description: `The ${headerName} header is required for request verification`,
          field: headerName,
          location: 'header', // Now explicitly supported in the schema
        },
      ],
    });
  }
}

/**
 * Error thrown when the signature timestamp is too old
 */
export class ExpiredSignatureError extends VerificationError {
  constructor({
    timestamp,
    maxAge,
    correlationId,
  }: {
    timestamp: string;
    maxAge: number;
    correlationId?: string;
  }) {
    super({
      name: 'EXPIRED_SIGNATURE',
      message: `Signature timestamp expired: ${timestamp}`,
      correlationId,
      details: [
        {
          issue: 'SIGNATURE_EXPIRED',
          description: `Signature timestamp is older than ${maxAge} seconds`,
          field: 'x-godaddy-signature-timestamp',
          value: timestamp,
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Error thrown when signature verification fails
 */
export class InvalidSignatureError extends VerificationError {
  constructor({ correlationId }: { correlationId?: string } = {}) {
    super({
      name: 'INVALID_SIGNATURE',
      message: 'The request signature is invalid',
      correlationId,
      details: [
        {
          issue: 'SIGNATURE_VERIFICATION_FAILED',
          description:
            'The request signature could not be verified with the provided public key',
          field: 'x-godaddy-signature',
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Error thrown when the signature algorithm is not supported
 */
export class InvalidAlgorithmError extends VerificationError {
  constructor({
    algorithm,
    correlationId,
  }: {
    algorithm: string;
    correlationId?: string;
  }) {
    super({
      name: 'INVALID_ALGORITHM',
      message: `Unsupported signature algorithm: ${algorithm}`,
      correlationId,
      details: [
        {
          issue: 'UNSUPPORTED_ALGORITHM',
          description: 'Only ECDSA-P256-SHA256 is supported',
          field: 'x-godaddy-signature-algorithm',
          value: algorithm,
          location: 'header',
        },
      ],
    });
  }
}

/**
 * Error thrown when the signature version is not supported
 */
export class InvalidVersionError extends VerificationError {
  constructor({
    version,
    correlationId,
  }: {
    version: string;
    correlationId?: string;
  }) {
    super({
      name: 'INVALID_VERSION',
      message: `Unsupported signature version: ${version}`,
      correlationId,
      details: [
        {
          issue: 'UNSUPPORTED_VERSION',
          description: 'Only version 1.0 is supported',
          field: 'x-godaddy-signature-version',
          value: version,
          location: 'header',
        },
      ],
    });
  }
}
