import type { IReportNode, ReportMetadata, ReportSchema } from '@reportforge/shared';

import type { InternalNode } from './node.js';

/** Current report schema version. Increment on breaking changes. */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Serializes a component tree rooted at `rootNode` into a portable `ReportSchema`.
 *
 * The resulting schema is a self-contained JSON-compatible object.
 * It does not contain layout coordinates, page numbers, or renderer instructions.
 *
 * @param rootNode - The root 'report' node of the internal component tree.
 * @param metadata - Report-level metadata (title, author, theme, etc.).
 */
export function serialize(rootNode: InternalNode, metadata: ReportMetadata): ReportSchema {
  return {
    version: SCHEMA_VERSION,
    metadata,
    root: serializeNode(rootNode),
  };
}

/**
 * Recursively serializes a single internal node to an `IReportNode`.
 * Parent references are dropped — the schema tree is parent-less.
 */
function serializeNode(node: InternalNode): IReportNode {
  const serialized: IReportNode = {
    id: node.id,
    type: node.type,
    props: { ...node.props },
    children: node.children.map(serializeNode),
    style: { ...node.style },
    layoutHints: { ...node.layoutHints },
  };
  return serialized;
}

// ─── Deserialization ────────────────────────────────────────────────────────

import { DeserializationError } from './errors.js';
import { createNode } from './node.js';
import { isPlainObject } from './utils.js';

/**
 * Result of deserializing a report schema back into the internal tree format.
 */
export interface DeserializedReport {
  readonly rootNode: InternalNode;
  readonly metadata: ReportMetadata;
}

/**
 * Deserializes a `ReportSchema` (or an unknown JSON value) back into the
 * internal `InternalNode` tree and report metadata.
 *
 * Use this to reconstruct a builder from a previously serialized schema.
 * The original node IDs are preserved exactly.
 *
 * @param input - A `ReportSchema` object (e.g. from `toJSON()`).
 * @throws {DeserializationError} If the input is not a valid report schema.
 *
 * @example
 * const { rootNode, metadata } = deserialize(report.toJSON());
 */
export function deserialize(input: unknown): DeserializedReport {
  if (!isPlainObject(input)) {
    throw new DeserializationError('Report schema must be a plain object.');
  }

  const version = input['version'];
  if (typeof version !== 'string') {
    throw new DeserializationError('Report schema must have a string "version" field.');
  }

  if (version !== SCHEMA_VERSION) {
    throw new DeserializationError(
      `Unsupported schema version '${version}'. Expected '${SCHEMA_VERSION}'.`,
    );
  }

  const metadataRaw = input['metadata'];
  if (!isPlainObject(metadataRaw)) {
    throw new DeserializationError('Report schema must have an object "metadata" field.');
  }
  const metadata = parseMetadata(metadataRaw);

  const rootRaw = input['root'];
  if (!isPlainObject(rootRaw)) {
    throw new DeserializationError('Report schema must have an object "root" field.');
  }

  const rootNode = deserializeNode(rootRaw, null);
  return { rootNode, metadata };
}

/**
 * Parses a string field from raw metadata.
 * @throws {DeserializationError} If the field is present but not a string.
 */
function parseStringField(raw: Record<string, unknown>, field: string): string | undefined {
  const value = raw[field];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new DeserializationError(`metadata.${field} must be a string if provided.`);
  }
  return value;
}

/**
 * Parses and validates the metadata object from raw input.
 *
 * Uses explicit conditional assignment to satisfy `exactOptionalPropertyTypes` —
 * optional fields are omitted entirely when undefined rather than set to `undefined`.
 * The `as unknown as ReportMetadata` cast is necessary because we construct a plain
 * string dictionary and narrow it to the typed interface at the boundary.
 */
function parseMetadata(raw: Record<string, unknown>): ReportMetadata {
  const orientationRaw = raw['orientation'];
  if (
    orientationRaw !== undefined &&
    orientationRaw !== 'portrait' &&
    orientationRaw !== 'landscape'
  ) {
    throw new DeserializationError(
      `metadata.orientation must be 'portrait' or 'landscape' if provided.`,
    );
  }

  // Type the accumulator precisely so no cast is needed at the return boundary.
  // exactOptionalPropertyTypes: each field is only assigned when non-undefined.
  const out: {
    title?: string;
    author?: string;
    createdAt?: string;
    locale?: string;
    pageSize?: string;
    theme?: string;
    orientation?: 'portrait' | 'landscape';
  } = {};

  const title = parseStringField(raw, 'title');
  const author = parseStringField(raw, 'author');
  const createdAt = parseStringField(raw, 'createdAt');
  const locale = parseStringField(raw, 'locale');
  const pageSize = parseStringField(raw, 'pageSize');
  const theme = parseStringField(raw, 'theme');

  if (title !== undefined) out.title = title;
  if (author !== undefined) out.author = author;
  if (createdAt !== undefined) out.createdAt = createdAt;
  if (locale !== undefined) out.locale = locale;
  if (pageSize !== undefined) out.pageSize = pageSize;
  if (theme !== undefined) out.theme = theme;
  // orientationRaw type is narrowed by the guard above to 'portrait' | 'landscape' | undefined
  if (orientationRaw !== undefined) out.orientation = orientationRaw;

  return out;
}

/**
 * Recursively deserializes a raw node object into an `InternalNode`.
 * Rebuilds parent-child links as the tree is reconstructed.
 */
function deserializeNode(raw: Record<string, unknown>, parent: InternalNode | null): InternalNode {
  const id = raw['id'];
  if (typeof id !== 'string' || id.length === 0) {
    throw new DeserializationError('Each schema node must have a non-empty string "id".');
  }

  const type = raw['type'];
  if (typeof type !== 'string' || type.length === 0) {
    throw new DeserializationError(`Node '${id}' must have a non-empty string "type".`);
  }

  const propsRaw = raw['props'];
  const props = isPlainObject(propsRaw) ? { ...propsRaw } : {};

  const styleRaw = raw['style'];
  const style = isPlainObject(styleRaw) ? { ...styleRaw } : {};

  const hintsRaw = raw['layoutHints'];
  const layoutHints = isPlainObject(hintsRaw) ? { ...hintsRaw } : {};

  const node = createNode(id, type, props, parent);
  node.style = style;
  node.layoutHints = layoutHints;

  const childrenRaw = raw['children'];
  if (!Array.isArray(childrenRaw)) {
    throw new DeserializationError(`Node '${id}' must have an array "children" field.`);
  }

  for (const childRaw of childrenRaw) {
    if (!isPlainObject(childRaw)) {
      throw new DeserializationError(`Children of node '${id}' must be plain objects.`);
    }
    const childNode = deserializeNode(childRaw, node);
    node.children.push(childNode);
  }

  return node;
}
