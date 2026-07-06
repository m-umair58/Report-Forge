/**
 * Internal mutable representation of a report tree node.
 * Used only during report construction inside @reportforge/core.
 * Not part of the public API.
 *
 * Nodes hold parent references to support scoped builders that need to
 * navigate from a child context back to its container.
 * Parent references are set at creation and never reassigned.
 */
export interface InternalNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children: InternalNode[];
  /** Reference to the containing node. Null only for the root 'report' node. */
  parent: InternalNode | null;
  /** Inline style token overrides. Resolved against the active theme at layout time. */
  style: Record<string, unknown>;
  /** Suggestions for the layout engine. Not commands. */
  layoutHints: Record<string, unknown>;
}

/**
 * Creates a new internal node with empty children, style, and layoutHints.
 *
 * @param id - Unique identifier for this node within the report.
 * @param type - Component type discriminator (e.g. 'title', 'table').
 * @param props - Component-specific data.
 * @param parent - The containing node, or null for the report root.
 */
export function createNode(
  id: string,
  type: string,
  props: Record<string, unknown>,
  parent: InternalNode | null,
): InternalNode {
  return {
    id,
    type,
    props,
    children: [],
    parent,
    style: {},
    layoutHints: {},
  };
}
