import type { ComponentDescriptor } from '@reportforge/components';
import { resolveDescriptorPresentation, validateDescriptor } from '@reportforge/components';

import { BuilderError } from './errors.js';
import type { InternalNode } from './node.js';
import { createNode } from './node.js';
import type { ComponentRegistry } from './registry.js';

/**
 * Materialises a `ComponentDescriptor` (and its children) onto the report tree.
 */
export function applyDescriptor(
  contextNode: InternalNode,
  idGen: (type: string) => string,
  descriptor: ComponentDescriptor,
  registry: ComponentRegistry,
  parentType: string,
): InternalNode {
  const validation = validateDescriptor(descriptor, registry, parentType);
  if (!validation.valid) {
    const message = validation.errors.map((e) => e.message).join('; ');
    throw new BuilderError(`Invalid component descriptor: ${message}`);
  }

  const nodeId = descriptor.id ?? idGen(descriptor.type);
  const node = createNode(nodeId, descriptor.type, { ...descriptor.props }, contextNode);

  const presentation = resolveDescriptorPresentation(descriptor);
  if (Object.keys(presentation.style).length > 0) {
    node.style = presentation.style;
  }
  if (Object.keys(presentation.layoutHints).length > 0) {
    node.layoutHints = presentation.layoutHints;
  }

  contextNode.children.push(node);

  const children = descriptor.children ?? [];
  for (const child of children) {
    applyDescriptor(node, idGen, child, registry, descriptor.type);
  }

  return node;
}
