/** Unified render operation model — renderer-independent drawing primitives. */

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface TextOperation {
  readonly type: 'text';
  readonly sourceNodeId: string;
  readonly text: string;
  readonly font: string;
  readonly fontSize: number;
  readonly fontWeight: 'normal' | 'bold';
  readonly lineHeight: number;
  readonly color: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly opacity: number;
  readonly textAlign: 'left' | 'center' | 'right' | 'justify';
}

export interface RectangleOperation {
  readonly type: 'rectangle';
  readonly sourceNodeId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fillColor: string | null;
  readonly borderColor: string | null;
  readonly borderWidth: number;
  readonly cornerRadius: number;
  readonly opacity: number;
}

export interface LineOperation {
  readonly type: 'line';
  readonly sourceNodeId: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  readonly width: number;
  readonly opacity: number;
}

export interface ImageOperation {
  readonly type: 'image';
  readonly sourceNodeId: string;
  readonly src: string;
  readonly alt: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly opacity: number;
}

export interface PathOperation {
  readonly type: 'path';
  readonly sourceNodeId: string;
  readonly pathData: string;
  readonly fillColor: string | null;
  readonly strokeColor: string | null;
  readonly strokeWidth: number;
  readonly opacity: number;
}

export interface CircleOperation {
  readonly type: 'circle';
  readonly sourceNodeId: string;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly fillColor: string | null;
  readonly strokeColor: string | null;
  readonly strokeWidth: number;
  readonly opacity: number;
}

export interface EllipseOperation {
  readonly type: 'ellipse';
  readonly sourceNodeId: string;
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly fillColor: string | null;
  readonly strokeColor: string | null;
  readonly strokeWidth: number;
  readonly opacity: number;
}

export interface PolygonOperation {
  readonly type: 'polygon';
  readonly sourceNodeId: string;
  readonly points: readonly Point2D[];
  readonly fillColor: string | null;
  readonly strokeColor: string | null;
  readonly strokeWidth: number;
  readonly opacity: number;
}

export interface GroupOperation {
  readonly type: 'group';
  readonly sourceNodeId: string;
  readonly children: readonly RenderOperation[];
  readonly opacity: number;
}

export interface ClipOperation {
  readonly type: 'clip';
  readonly sourceNodeId: string;
  readonly pathData: string;
  readonly children: readonly RenderOperation[];
}

export interface TransformOperation {
  readonly type: 'transform';
  readonly sourceNodeId: string;
  readonly translateX: number;
  readonly translateY: number;
  readonly rotate: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly children: readonly RenderOperation[];
}

export interface TableOperation {
  readonly type: 'table';
  readonly sourceNodeId: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly columns: readonly unknown[];
  readonly rows: readonly unknown[];
  readonly tableLayout?: Record<string, unknown>;
  readonly opacity: number;
}

export type RenderOperation =
  | TextOperation
  | RectangleOperation
  | LineOperation
  | ImageOperation
  | PathOperation
  | CircleOperation
  | EllipseOperation
  | PolygonOperation
  | GroupOperation
  | ClipOperation
  | TransformOperation
  | TableOperation;

export type RenderOperationType = RenderOperation['type'];
