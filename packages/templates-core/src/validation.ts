import type {
  TemplateFieldRule,
  TemplateOptions,
  TemplateValidationIssue,
  TemplateValidationResult,
} from './types.js';

export function validateRequiredFields(
  data: unknown,
  fields: readonly TemplateFieldRule[],
): TemplateValidationResult {
  const errors: TemplateValidationIssue[] = [];

  for (const field of fields) {
    if (field.required !== true) continue;
    const value = getPath(data, field.path);
    if (value === undefined || value === null || value === '') {
      errors.push({ message: `Required field '${field.path}' is missing.`, path: field.path });
      continue;
    }
    if (field.type === 'array' && !Array.isArray(value)) {
      errors.push({ message: `'${field.path}' must be an array.`, path: field.path });
    }
    if (field.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      errors.push({ message: `'${field.path}' must be an object.`, path: field.path });
    }
    if (field.type === 'string' && typeof value !== 'string') {
      errors.push({ message: `'${field.path}' must be a string.`, path: field.path });
    }
    if (field.type === 'number' && typeof value !== 'number') {
      errors.push({ message: `'${field.path}' must be a number.`, path: field.path });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateTemplateOptions<TOptions extends TemplateOptions>(
  options: TOptions,
  allowedKeys: readonly (keyof TemplateOptions)[],
): TemplateValidationResult {
  const errors: TemplateValidationIssue[] = [];
  const allowed = new Set<string>(allowedKeys as readonly string[]);

  for (const key of Object.keys(options)) {
    if (!allowed.has(key)) {
      errors.push({ message: `Unknown template option '${key}'.`, path: `options.${key}` });
    }
  }

  return { valid: errors.length === 0, errors };
}

function getPath(data: unknown, path: string): unknown {
  if (data === null || typeof data !== 'object') return undefined;
  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function mergeValidation(
  ...results: readonly TemplateValidationResult[]
): TemplateValidationResult {
  const errors = results.flatMap((result) => result.errors);
  return { valid: errors.length === 0, errors };
}
