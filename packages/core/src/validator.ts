import type {
  IReportNode,
  ReportSchema,
  ValidationError,
  ValidationResult,
} from '@reportforge/shared';

import type { ComponentRegistry } from './registry.js';

// ─── Validator function type ─────────────────────────────────────────────────

/**
 * A single validation function.
 * Receives a node and its parent (null for the root) and returns any errors found.
 * Must never modify the schema or produce side effects.
 */
export type ValidatorFunction = (
  node: IReportNode,
  parent: IReportNode | null,
  context: ValidationContext,
) => ValidationError[];

/** Context passed to each validator during a validation run. */
export interface ValidationContext {
  /** The full schema being validated. */
  readonly schema: ReportSchema;
  /** Registry of known component types. */
  readonly registry: ComponentRegistry;
}

// ─── Validation Framework ────────────────────────────────────────────────────

/**
 * Extensible validation framework for report schemas.
 * Runs a sequence of validator functions over every node in the schema tree.
 *
 * Built-in validators cover structural rules (unique IDs, known types, hierarchy).
 * Additional validators can be registered for custom business rules.
 *
 * @example
 * const framework = new ValidationFramework();
 * framework.addValidator(myCustomValidator);
 * const result = framework.validate(schema, registry);
 */
export class ValidationFramework {
  private readonly validators: ValidatorFunction[] = [];

  /**
   * Adds a validator to the framework.
   * Validators run in registration order.
   */
  addValidator(validator: ValidatorFunction): void {
    this.validators.push(validator);
  }

  /**
   * Validates every node in the schema tree.
   *
   * @param schema - The report schema to validate.
   * @param registry - Registry used to check component type definitions.
   * @returns A `ValidationResult` with `valid: true` or a list of errors.
   */
  validate(schema: ReportSchema, registry: ComponentRegistry): ValidationResult {
    const context: ValidationContext = { schema, registry };
    const errors: ValidationError[] = [];

    walkTree(schema.root, null, (node, parent) => {
      for (const validator of this.validators) {
        const nodeErrors = validator(node, parent, context);
        errors.push(...nodeErrors);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ─── Tree walker ─────────────────────────────────────────────────────────────

/** Depth-first tree walk calling `visit` for each node with its parent. */
function walkTree(
  node: IReportNode,
  parent: IReportNode | null,
  visit: (node: IReportNode, parent: IReportNode | null) => void,
): void {
  visit(node, parent);
  for (const child of node.children) {
    walkTree(child, node, visit);
  }
}

// ─── Built-in Validators ──────────────────────────────────────────────────────

/**
 * Detects duplicate node IDs across the entire schema tree.
 * Every node must have a unique `id`.
 */
export const duplicateIdValidator: ValidatorFunction = (node, _parent, context) => {
  // The set is built once per full walk, but this function is called per node.
  // We collect all IDs in a single pass by using the context schema.
  // This validator counts how many times `node.id` appears in the tree.
  // A more efficient approach would pre-collect IDs once; this is intentionally
  // kept simple — validation runs infrequently (not in hot paths).
  const count = countId(context.schema.root, node.id);
  if (count > 1) {
    return [
      {
        nodeId: node.id,
        message: `Duplicate node ID '${node.id}' found ${count} times in the schema.`,
      },
    ];
  }
  return [];
};

/** Counts occurrences of `targetId` in the subtree rooted at `node`. */
function countId(node: IReportNode, targetId: string): number {
  let count = node.id === targetId ? 1 : 0;
  for (const child of node.children) {
    count += countId(child, targetId);
  }
  return count;
}

/**
 * Checks that every node's `type` is registered in the component registry.
 * Catches typos and missing plugin registrations.
 */
export const knownTypeValidator: ValidatorFunction = (node, _parent, context) => {
  if (!context.registry.has(node.type)) {
    return [
      {
        nodeId: node.id,
        message: `Unknown component type '${node.type}'. Register it via the plugin system or check for typos.`,
      },
    ];
  }
  return [];
};

/**
 * Checks that each node's `type` is allowed as a child of its parent.
 * Uses the `allowedChildren` sets from the component registry.
 */
export const allowedChildrenValidator: ValidatorFunction = (node, parent, context) => {
  if (parent === null) return [];

  const parentEntry = context.registry.resolve(parent.type);
  if (parentEntry === undefined) return []; // knownTypeValidator handles unknown parents

  if (!parentEntry.allowedChildren.has(node.type)) {
    return [
      {
        nodeId: node.id,
        message: `Component '${node.type}' is not allowed as a child of '${parent.type}'.`,
        path: `${parent.id} > ${node.id}`,
      },
    ];
  }
  return [];
};

/**
 * Checks that all required props are present (non-undefined) for each node type.
 */
export const requiredPropsValidator: ValidatorFunction = (node, _parent, context) => {
  const entry = context.registry.resolve(node.type);
  if (entry === undefined) return []; // knownTypeValidator handles unknown types

  const errors: ValidationError[] = [];
  for (const prop of entry.requiredProps) {
    if (!(prop in node.props) || node.props[prop] === undefined) {
      errors.push({
        nodeId: node.id,
        message: `Component '${node.type}' is missing required prop '${prop}'.`,
      });
    }
  }
  return errors;
};

/**
 * Creates a ValidationFramework pre-loaded with all built-in validators.
 *
 * @example
 * const framework = createDefaultValidationFramework();
 * const result = framework.validate(schema, registry);
 */
export function createDefaultValidationFramework(): ValidationFramework {
  const framework = new ValidationFramework();
  framework.addValidator(knownTypeValidator);
  framework.addValidator(allowedChildrenValidator);
  framework.addValidator(requiredPropsValidator);
  framework.addValidator(duplicateIdValidator);
  return framework;
}
