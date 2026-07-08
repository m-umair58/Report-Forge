import type { ComponentDescriptor } from './style.js';
import type { ComponentRegistry } from './registry.js';

export interface ComponentValidationIssue {
  readonly message: string;
  readonly path?: string;
}

export interface ComponentValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ComponentValidationIssue[];
}

function issue(message: string, path?: string): ComponentValidationIssue {
  return path !== undefined ? { message, path } : { message };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validatePropValues(descriptor: ComponentDescriptor, path: string): ComponentValidationIssue[] {
  const errors: ComponentValidationIssue[] = [];
  const props = descriptor.props;

  switch (descriptor.type) {
    case 'title':
    case 'subtitle':
    case 'heading':
    case 'paragraph':
    case 'caption':
    case 'label':
    case 'badge':
    case 'status-pill':
      if (!isNonEmptyString(props['text'])) {
        errors.push(issue(`'${descriptor.type}' requires non-empty 'text'.`, path));
      }
      break;

    case 'summary-card':
      if (!isNonEmptyString(props['value'])) {
        errors.push(issue(`'summary-card' requires non-empty 'value'.`, path));
      }
      if (!isNonEmptyString(props['label']) && !isNonEmptyString(props['title'])) {
        errors.push(issue(`'summary-card' requires 'label' or 'title'.`, path));
      }
      break;

    case 'metric-card':
      if (!isNonEmptyString(props['label'])) {
        errors.push(issue(`'metric-card' requires non-empty 'label'.`, path));
      }
      if (!isNonEmptyString(props['value'])) {
        errors.push(issue(`'metric-card' requires non-empty 'value'.`, path));
      }
      break;

    case 'kpi':
      if (!isNonEmptyString(props['name'])) {
        errors.push(issue(`'kpi' requires non-empty 'name'.`, path));
      }
      if (!isNonEmptyString(props['value'])) {
        errors.push(issue(`'kpi' requires non-empty 'value'.`, path));
      }
      break;

    case 'info-box':
    case 'alert-box':
      if (!isNonEmptyString(props['message'])) {
        errors.push(issue(`'${descriptor.type}' requires non-empty 'message'.`, path));
      }
      break;

    case 'image':
    case 'logo':
      if (!isNonEmptyString(props['src'])) {
        errors.push(issue(`'${descriptor.type}' requires non-empty 'src'.`, path));
      }
      break;

    case 'icon':
      if (!isNonEmptyString(props['name'])) {
        errors.push(issue(`'icon' requires non-empty 'name'.`, path));
      }
      break;

    case 'spacer': {
      const size = props['size'];
      if (size !== undefined && (typeof size !== 'number' || size < 0)) {
        errors.push(issue(`'spacer.size' must be a non-negative number.`, path));
      }
      break;
    }

    case 'table': {
      const columns = props['columns'];
      if (!Array.isArray(columns) || columns.length === 0) {
        errors.push(issue(`'table' requires at least one column.`, path));
      } else {
        const seenKeys = new Set<string>();
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i] as Record<string, unknown> | undefined;
          if (column === undefined) continue;
          const key = column['key'];
          if (typeof key !== 'string' || key.trim().length === 0) {
            errors.push(issue(`Column key must be non-empty.`, `${path}.columns[${i.toString()}].key`));
          } else if (seenKeys.has(key)) {
            errors.push(issue(`Duplicate column key '${key}'.`, `${path}.columns[${i.toString()}].key`));
          } else {
            seenKeys.add(key);
          }

          const title = column['title'] ?? column['label'];
          if (typeof title !== 'string' || title.trim().length === 0) {
            errors.push(issue(`Column header must be non-empty.`, `${path}.columns[${i.toString()}].title`));
          }

          const width = column['width'];
          if (typeof width === 'number' && width < 0) {
            errors.push(issue(`Column width must be non-negative.`, `${path}.columns[${i.toString()}].width`));
          }
        }
      }

      if (!Array.isArray(props['rows'])) {
        errors.push(issue(`'table' requires a 'rows' array.`, path));
      }

      const tableStyle = props['tableStyle'] as Record<string, unknown> | undefined;
      const padding = tableStyle?.['cellPadding'];
      if (typeof padding === 'number' && padding < 0) {
        errors.push(issue(`'table.tableStyle.cellPadding' must be non-negative.`, path));
      }
      break;
    }

    case 'chart': {
      if (!isNonEmptyString(props['type'])) {
        errors.push(issue(`'chart' requires 'type'.`, path));
      }
      const data = props['data'];
      if (data === undefined || (typeof data !== 'object' && !Array.isArray(data))) {
        errors.push(issue(`'chart' requires 'data'.`, path));
      } else if (Array.isArray(data) && data.length === 0) {
        errors.push(issue(`'chart' data array must not be empty.`, path));
      }
      break;
    }
  }

  if (descriptor.style?.opacity !== undefined) {
    const opacity = descriptor.style.opacity;
    if (opacity < 0 || opacity > 1) {
      errors.push(issue(`'style.opacity' must be between 0 and 1.`, path));
    }
  }

  return errors;
}

/**
 * Validates a single component descriptor against the registry and business rules.
 */
export function validateDescriptor(
  descriptor: ComponentDescriptor,
  registry: ComponentRegistry,
  parentType?: string,
  path = 'root',
): ComponentValidationResult {
  const errors: ComponentValidationIssue[] = [];

  if (!registry.has(descriptor.type)) {
    errors.push(issue(`Unknown component type '${descriptor.type}'.`, path));
    return { valid: false, errors };
  }

  if (parentType !== undefined) {
    const parentEntry = registry.resolve(parentType);
    if (parentEntry !== undefined && !parentEntry.allowedChildren.has(descriptor.type)) {
      errors.push(
        issue(`'${descriptor.type}' is not allowed as a child of '${parentType}'.`, path),
      );
    }

    const entry = registry.resolve(descriptor.type);
    if (entry !== undefined && !entry.allowedParents.has(parentType)) {
      errors.push(
        issue(`'${descriptor.type}' cannot be nested under '${parentType}'.`, path),
      );
    }
  }

  const entry = registry.resolve(descriptor.type);
  if (entry !== undefined) {
    for (const prop of entry.requiredProps) {
      if (!(prop in descriptor.props) || descriptor.props[prop] === undefined) {
        errors.push(issue(`Missing required prop '${prop}'.`, path));
      }
    }
  }

  errors.push(...validatePropValues(descriptor, path));

  if (descriptor.id !== undefined && descriptor.id.trim().length === 0) {
    errors.push(issue(`'id' must be a non-empty string when provided.`, path));
  }

  const children = descriptor.children ?? [];
  const entryForChildren = registry.resolve(descriptor.type);
  if (entryForChildren !== undefined && children.length > 0 && entryForChildren.allowedChildren.size === 0) {
    errors.push(issue(`'${descriptor.type}' does not accept children.`, path));
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child === undefined) continue;
    const childPath = `${path}.children[${i.toString()}]`;
    const childResult = validateDescriptor(child, registry, descriptor.type, childPath);
    errors.push(...childResult.errors);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a list of descriptors and checks for duplicate explicit IDs.
 */
export function validateDescriptors(
  descriptors: readonly ComponentDescriptor[],
  registry: ComponentRegistry,
  parentType?: string,
): ComponentValidationResult {
  const errors: ComponentValidationIssue[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < descriptors.length; i++) {
    const descriptor = descriptors[i];
    if (descriptor === undefined) continue;

    if (descriptor.id !== undefined) {
      if (seenIds.has(descriptor.id)) {
        errors.push(issue(`Duplicate component id '${descriptor.id}'.`, `root[${i.toString()}]`));
      }
      seenIds.add(descriptor.id);
    }

    const result = validateDescriptor(descriptor, registry, parentType, `root[${i.toString()}]`);
    errors.push(...result.errors);
    collectIds(descriptor, seenIds, errors);
  }

  return { valid: errors.length === 0, errors };
}

function collectIds(
  descriptor: ComponentDescriptor,
  seenIds: Set<string>,
  errors: ComponentValidationIssue[],
  path = 'root',
): void {
  const children = descriptor.children ?? [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child === undefined) continue;
    const childPath = `${path}.children[${i.toString()}]`;
    if (child.id !== undefined) {
      if (seenIds.has(child.id)) {
        errors.push(issue(`Duplicate component id '${child.id}'.`, childPath));
      }
      seenIds.add(child.id);
    }
    collectIds(child, seenIds, errors, childPath);
  }
}
