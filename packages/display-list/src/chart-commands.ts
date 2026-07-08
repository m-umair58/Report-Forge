import type {
  DisplayCommand,
  DrawCircleCommand,
  DrawLineCommand,
  DrawPathCommand,
  DrawRectangleCommand,
  DrawTextCommand,
  FontWeight,
  TextAlign,
} from './commands.js';
import type { SceneGraph, SceneNode } from '@reportforge/chart-core';

export interface SceneGraphRenderContext {
  readonly sourceNodeId: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly defaultOpacity?: number;
}

/** Converts a chart scene graph into display-list draw commands. */
export function sceneGraphToDisplayCommands(
  scene: SceneGraph,
  context: SceneGraphRenderContext,
): DisplayCommand[] {
  const commands: DisplayCommand[] = [];
  const opacity = context.defaultOpacity ?? 1;

  for (const node of scene.nodes) {
    commands.push(...sceneNodeToCommands(node, context, opacity));
  }

  return commands;
}

function sceneNodeToCommands(
  node: SceneNode,
  context: SceneGraphRenderContext,
  opacity: number,
): DisplayCommand[] {
  switch (node.kind) {
    case 'group':
      return node.children.flatMap((child) => sceneNodeToCommands(child, context, node.opacity ?? opacity));
    case 'rect':
      return [toRectangle(node, context, opacity)];
    case 'line':
      return [toLine(node, context, opacity)];
    case 'path':
      return [toPath(node, context, opacity)];
    case 'text':
      return [toText(node, context, opacity)];
    case 'circle':
      return [toCircle(node, context, opacity)];
    default:
      return [];
  }
}

function toRectangle(
  node: Extract<SceneNode, { kind: 'rect' }>,
  context: SceneGraphRenderContext,
  opacity: number,
): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: context.sourceNodeId,
    x: context.offsetX + node.x,
    y: context.offsetY + node.y,
    width: node.width,
    height: node.height,
    fillColor: node.fill ?? null,
    borderColor: node.stroke ?? null,
    borderWidth: node.strokeWidth ?? 0,
    cornerRadius: node.cornerRadius ?? 0,
    opacity: node.opacity ?? opacity,
  };
}

function toLine(
  node: Extract<SceneNode, { kind: 'line' }>,
  context: SceneGraphRenderContext,
  opacity: number,
): DrawLineCommand {
  return {
    kind: 'draw-line',
    sourceNodeId: context.sourceNodeId,
    x1: context.offsetX + node.x1,
    y1: context.offsetY + node.y1,
    x2: context.offsetX + node.x2,
    y2: context.offsetY + node.y2,
    color: node.stroke,
    width: node.strokeWidth ?? 1,
    opacity: node.opacity ?? opacity,
  };
}

function toPath(
  node: Extract<SceneNode, { kind: 'path' }>,
  context: SceneGraphRenderContext,
  opacity: number,
): DrawPathCommand {
  return {
    kind: 'draw-path',
    sourceNodeId: context.sourceNodeId,
    pathData: node.pathData,
    fillColor: node.fill ?? null,
    strokeColor: node.stroke ?? null,
    strokeWidth: node.strokeWidth ?? 1,
    opacity: node.opacity ?? opacity,
  };
}

function toText(
  node: Extract<SceneNode, { kind: 'text' }>,
  context: SceneGraphRenderContext,
  opacity: number,
): DrawTextCommand {
  const fontWeight: FontWeight = node.fontWeight === 'bold' ? 'bold' : 'normal';
  const textAlign: TextAlign = node.textAlign ?? 'left';
  const fontSize = node.fontSize ?? 11;
  const width = node.width ?? 200;
  const height = node.height ?? fontSize * 1.2;

  return {
    kind: 'draw-text',
    sourceNodeId: context.sourceNodeId,
    text: node.text,
    font: node.fontFamily ?? 'Helvetica',
    fontSize,
    fontWeight,
    lineHeight: 1.2,
    color: node.fill ?? '#1a1a1a',
    x: context.offsetX + node.x,
    y: context.offsetY + node.y,
    width,
    height,
    rotation: 0,
    opacity: node.opacity ?? opacity,
    textAlign,
  };
}

function toCircle(
  node: Extract<SceneNode, { kind: 'circle' }>,
  context: SceneGraphRenderContext,
  opacity: number,
): DrawCircleCommand {
  return {
    kind: 'draw-circle',
    sourceNodeId: context.sourceNodeId,
    cx: context.offsetX + node.cx,
    cy: context.offsetY + node.cy,
    radius: node.radius,
    fillColor: node.fill ?? null,
    strokeColor: node.stroke ?? null,
    strokeWidth: node.strokeWidth ?? 0,
    opacity: node.opacity ?? opacity,
  };
}
