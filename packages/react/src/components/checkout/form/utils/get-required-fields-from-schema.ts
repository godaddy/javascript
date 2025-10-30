import {
  ZodDefault,
  ZodEffects,
  ZodObject,
  ZodOptional,
  type ZodTypeAny,
  type z,
} from 'zod';

/**
 * Recursively unwrap ZodEffects / ZodDefault to the core schema
 */
function unwrap(schema: ZodTypeAny): ZodTypeAny {
  if (schema instanceof ZodEffects) {
    return unwrap(schema._def.schema);
  }
  if (schema instanceof ZodDefault) {
    return unwrap(schema._def.innerType);
  }
  return schema;
}

/**
 * Extract required/optional flags from a Zod schema
 */
export function getRequiredFieldsFromSchema<
  T extends ZodObject<any> | ZodEffects<any>,
>(schema: T) {
  const unwrapped = unwrap(schema);

  if (!(unwrapped instanceof ZodObject)) {
    throw new Error('getRequiredFields only works on ZodObject schemas');
  }

  const shape = unwrapped.shape;
  const requiredMap: Record<string, boolean> = {};

  for (const key in shape) {
    if (Object.hasOwn(shape, key)) {
      let field: ZodTypeAny = shape[key];
      field = unwrap(field); // in case inner fields are wrapped too

      requiredMap[key] = !(field instanceof ZodOptional);
    }
  }

  return requiredMap as {
    [K in keyof z.infer<T>]: boolean;
  };
}
