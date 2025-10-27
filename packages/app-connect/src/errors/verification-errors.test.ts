import { describe, expect, it } from 'vitest';
import {
  ExpiredSignatureError,
  InvalidAlgorithmError,
  InvalidSignatureError,
  InvalidVersionError,
  MissingHeaderError,
} from './verification-errors';

describe('Verification Errors', () => {
  describe('MissingHeaderError', () => {
    it('should format error with correct schema', () => {
      const error = new MissingHeaderError({
        headerName: 'x-godaddy-signature',
      });
      expect(error.name).toBe('MISSING_SIGNATURE_HEADER');
      expect(error.message).toBe(
        'Missing required header: x-godaddy-signature',
      );
      expect(error.correlationId).toBeDefined();
      expect(error.details).toHaveLength(1);
      expect(error.details?.[0].issue).toBe('MISSING_REQUIRED_HEADER');
    });

    it('should use provided correlationId', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new MissingHeaderError({
        headerName: 'x-godaddy-signature',
        correlationId,
      });
      expect(error.correlationId).toBe(correlationId);
    });
  });

  describe('ExpiredSignatureError', () => {
    it('should format error with correct schema', () => {
      const timestamp = '2023-01-01T00:00:00Z';
      const error = new ExpiredSignatureError({
        timestamp,
        maxAge: 300,
      });
      expect(error.name).toBe('EXPIRED_SIGNATURE');
      expect(error.message).toBe(`Signature timestamp expired: ${timestamp}`);
      expect(error.correlationId).toBeDefined();
      expect(error.details).toHaveLength(1);
      expect(error.details?.[0].issue).toBe('SIGNATURE_EXPIRED');
      expect(error.details?.[0].value).toBe(timestamp);
    });
  });

  describe('InvalidSignatureError', () => {
    it('should format error with correct schema', () => {
      const error = new InvalidSignatureError();
      expect(error.name).toBe('INVALID_SIGNATURE');
      expect(error.message).toBe('The request signature is invalid');
      expect(error.correlationId).toBeDefined();
      expect(error.details).toHaveLength(1);
      expect(error.details?.[0].issue).toBe('SIGNATURE_VERIFICATION_FAILED');
    });
  });

  describe('InvalidAlgorithmError', () => {
    it('should format error with correct schema', () => {
      const algorithm = 'INVALID-ALG';
      const error = new InvalidAlgorithmError({
        algorithm,
      });
      expect(error.name).toBe('INVALID_ALGORITHM');
      expect(error.message).toBe(
        `Unsupported signature algorithm: ${algorithm}`,
      );
      expect(error.correlationId).toBeDefined();
      expect(error.details).toHaveLength(1);
      expect(error.details?.[0].issue).toBe('UNSUPPORTED_ALGORITHM');
      expect(error.details?.[0].value).toBe(algorithm);
    });
  });

  describe('InvalidVersionError', () => {
    it('should format error with correct schema', () => {
      const version = '2.0';
      const error = new InvalidVersionError({
        version,
      });
      expect(error.name).toBe('INVALID_VERSION');
      expect(error.message).toBe(`Unsupported signature version: ${version}`);
      expect(error.correlationId).toBeDefined();
      expect(error.details).toHaveLength(1);
      expect(error.details?.[0].issue).toBe('UNSUPPORTED_VERSION');
      expect(error.details?.[0].value).toBe(version);
    });
  });

  describe('Error serialization', () => {
    it('should correctly serialize to JSON', () => {
      const correlationId = '123e4567-e89b-12d3-a456-426614174000';
      const error = new MissingHeaderError({
        headerName: 'x-godaddy-signature',
        correlationId,
      });

      const serialized = error.toJSON();

      expect(serialized).toEqual({
        name: 'MISSING_SIGNATURE_HEADER',
        correlationId,
        message: 'Missing required header: x-godaddy-signature',
        details: [
          {
            issue: 'MISSING_REQUIRED_HEADER',
            description:
              'The x-godaddy-signature header is required for request verification',
            field: 'x-godaddy-signature',
            location: 'header',
          },
        ],
      });
    });
  });
});
