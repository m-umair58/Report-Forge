/** Supported chart kinds. Placeholder kinds render a labeled stub scene graph. */
export type ChartKind =
  | 'bar'
  | 'horizontal-bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'heatmap'
  | 'treemap'
  | 'radar'
  | 'gauge';

export type LegendPosition = 'top' | 'bottom' | 'left' | 'right' | 'hidden';

export type ScaleKind = 'linear' | 'band' | 'ordinal' | 'time' | 'log';

/** A single numeric observation in a series. */
export interface DataPoint {
  readonly x: string | number;
  readonly y: number;
  readonly label?: string;
  readonly series?: string;
}

/** Named collection of data points. */
export interface DataSeries {
  readonly name: string;
  readonly points: readonly DataPoint[];
  readonly color?: string;
}

/** Legacy dataset shape used by early chart props. */
export interface ChartDatasetInput {
  readonly label: string;
  readonly values: readonly number[];
}

/** Legacy chart data shape. */
export interface ChartDataInput {
  readonly labels: readonly string[];
  readonly datasets: readonly ChartDatasetInput[];
}

/** Row-oriented chart data (array of objects). */
export type ChartRowData = readonly Readonly<Record<string, unknown>>[];

/** Normalized internal representation after data mapping. */
export interface NormalizedChartData {
  readonly categories: readonly string[];
  readonly series: readonly DataSeries[];
}

export interface ChartTheme {
  readonly colors: readonly string[];
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontSizeSmall: number;
  readonly fontSizeTitle: number;
  readonly textColor: string;
  readonly mutedColor: string;
  readonly gridColor: string;
  readonly axisColor: string;
  readonly background: string;
  readonly strokeWidth: number;
  readonly spacing: number;
}

export interface AxisConfig {
  readonly title?: string;
  readonly tickCount?: number;
  readonly format?: (value: string | number) => string;
  readonly showGrid?: boolean;
}

export interface ChartBuildConfig {
  readonly type: ChartKind;
  readonly title?: string;
  readonly width: number;
  readonly height: number;
  readonly data: NormalizedChartData;
  readonly theme: ChartTheme;
  readonly legend?: LegendPosition;
  readonly xAxis?: AxisConfig;
  readonly yAxis?: AxisConfig;
  readonly innerRadius?: number;
}

export interface ChartLayout {
  readonly width: number;
  readonly height: number;
  readonly plotArea: PlotArea;
  readonly titleArea?: PlotArea;
  readonly legendArea?: PlotArea;
  readonly xAxisArea?: PlotArea;
  readonly yAxisArea?: PlotArea;
}

export interface PlotArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ChartAccessibilityMetadata {
  readonly chartType: ChartKind;
  readonly title?: string;
  readonly series: readonly {
    readonly name: string;
    readonly values: readonly { readonly label: string; readonly value: number }[];
  }[];
  readonly categories: readonly string[];
}

export interface ChartValidationIssue {
  readonly message: string;
  readonly path?: string;
}

export interface ChartValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ChartValidationIssue[];
}

/** Animation hooks — not implemented; reserved for future milestones. */
export interface ChartAnimationHooks {
  readonly enabled?: boolean;
  readonly durationMs?: number;
  readonly easing?: string;
}

export type SceneNode =
  | SceneRectNode
  | SceneLineNode
  | ScenePathNode
  | SceneTextNode
  | SceneCircleNode
  | SceneGroupNode;

export interface SceneRectNode {
  readonly kind: 'rect';
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly cornerRadius?: number;
  readonly opacity?: number;
}

export interface SceneLineNode {
  readonly kind: 'line';
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly stroke: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export interface ScenePathNode {
  readonly kind: 'path';
  readonly pathData: string;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export interface SceneTextNode {
  readonly kind: 'text';
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
  readonly text: string;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontWeight?: 'normal' | 'bold';
  readonly fill?: string;
  readonly textAlign?: 'left' | 'center' | 'right';
  readonly opacity?: number;
}

export interface SceneCircleNode {
  readonly kind: 'circle';
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
  readonly fill?: string;
  readonly stroke?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
}

export interface SceneGroupNode {
  readonly kind: 'group';
  readonly children: readonly SceneNode[];
  readonly opacity?: number;
}

export interface SceneGraph {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly SceneNode[];
  readonly accessibility: ChartAccessibilityMetadata;
}

export interface ChartLayoutPayload {
  readonly sceneGraph: SceneGraph;
  readonly width: number;
  readonly height: number;
}

export interface ChartPropsInput {
  readonly type: ChartKind;
  readonly title?: string;
  readonly data: ChartRowData | ChartDataInput;
  readonly x?: string;
  readonly y?: string | readonly string[];
  readonly series?: string;
  readonly width?: number;
  readonly height?: number;
  readonly legend?: LegendPosition;
  readonly xAxis?: AxisConfig;
  readonly yAxis?: AxisConfig;
  readonly innerRadius?: number;
}

/** Tooltip placeholder — reserved for future interactive renderers. */
export interface TooltipPlaceholder {
  readonly enabled: false;
}

export const TOOLTIP_PLACEHOLDER: TooltipPlaceholder = { enabled: false };
