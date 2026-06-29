import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getRequiredFieldsFromSchema } from './get-required-fields-from-schema';

describe('getRequiredFieldsFromSchema', () => {
  it('maps required and optional fields from a plain ZodObject', () => {
    const schema = z.object({
      requiredName: z.string(),
      optionalNote: z.string().optional(),
    });

    expect(getRequiredFieldsFromSchema(schema)).toEqual({
      requiredName: true,
      optionalNote: false,
    });
  });

  it('unwraps a ZodEffects object schema', () => {
    const schema = z
      .object({
        email: z.string().email(),
        notes: z.string().optional(),
      })
      .superRefine(() => undefined);

    expect(getRequiredFieldsFromSchema(schema)).toEqual({
      email: true,
      notes: false,
    });
  });

  it('unwraps ZodDefault fields before detecting optional fields', () => {
    const schema = z.object({
      requiredWithDefault: z.string().default('value'),
      optionalWithDefault: z.string().optional().default('value'),
      defaultThenOptional: z.string().default('value').optional(),
    });

    expect(getRequiredFieldsFromSchema(schema)).toEqual({
      requiredWithDefault: true,
      optionalWithDefault: false,
      defaultThenOptional: false,
    });
  });

  it('throws on non-object schemas', () => {
    expect(() => getRequiredFieldsFromSchema(z.string())).toThrow(
      'getRequiredFields only works on ZodObject schemas'
    );
  });
});
