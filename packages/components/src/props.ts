import type { BaseComponentProps, ComponentDescriptor } from './style.js';

// ─── Typography ───────────────────────────────────────────────────────────────

export interface TitleProps extends BaseComponentProps {
  readonly text: string;
}

export interface SubtitleProps extends BaseComponentProps {
  readonly text: string;
}

export interface HeadingProps extends BaseComponentProps {
  readonly text: string;
  readonly level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ParagraphProps extends BaseComponentProps {
  readonly text: string;
}

export interface CaptionProps extends BaseComponentProps {
  readonly text: string;
}

export interface LabelProps extends BaseComponentProps {
  readonly text: string;
  readonly htmlFor?: string;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export interface SectionProps extends BaseComponentProps {
  readonly label?: string;
  readonly children?: readonly ComponentDescriptor[];
}

export interface ContainerProps extends BaseComponentProps {
  readonly children?: readonly ComponentDescriptor[];
}

export interface StackProps extends BaseComponentProps {
  readonly gap?: number;
  readonly children?: readonly ComponentDescriptor[];
}

export interface RowProps extends BaseComponentProps {
  readonly gap?: number;
  readonly children?: readonly ComponentDescriptor[];
}

export interface SpacerProps extends BaseComponentProps {
  readonly size?: number;
}

export interface DividerProps extends BaseComponentProps {}

// ─── Media ────────────────────────────────────────────────────────────────────

export interface ImageProps extends BaseComponentProps {
  readonly src: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface LogoProps extends BaseComponentProps {
  readonly src: string;
  readonly alt?: string;
  readonly width?: number;
  readonly height?: number;
}

export interface IconProps extends BaseComponentProps {
  readonly name: string;
  readonly size?: number;
}

// ─── Business ─────────────────────────────────────────────────────────────────

export interface SummaryCardProps extends BaseComponentProps {
  /** Display label (alias: `title`). */
  readonly label?: string;
  /** Alias for `label` — accepted by the factory for ergonomic APIs. */
  readonly title?: string;
  readonly value: string;
  readonly trend?: string;
}

export interface MetricCardProps extends BaseComponentProps {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly change?: string;
}

export interface KPIProps extends BaseComponentProps {
  readonly name: string;
  readonly value: string;
  readonly target?: string;
  readonly status?: 'on-track' | 'at-risk' | 'off-track';
}

export interface BadgeProps extends BaseComponentProps {
  readonly text: string;
  readonly variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export interface StatusPillProps extends BaseComponentProps {
  readonly text: string;
  readonly status?: 'active' | 'inactive' | 'pending' | 'error' | 'success';
}

export interface InfoBoxProps extends BaseComponentProps {
  readonly title?: string;
  readonly message: string;
}

export interface AlertBoxProps extends BaseComponentProps {
  readonly title?: string;
  readonly message: string;
  readonly severity?: 'info' | 'success' | 'warning' | 'error';
}

// ─── Placeholders (future milestones) ─────────────────────────────────────────

export interface TableColumn {
  readonly key: string;
  readonly label: string;
  readonly align?: 'left' | 'center' | 'right';
}

/** Placeholder table props — full table rendering is a future milestone. */
export interface TableProps extends BaseComponentProps {
  readonly columns: readonly TableColumn[];
  readonly rows: readonly Readonly<Record<string, unknown>>[];
}

export interface ChartDataset {
  readonly label: string;
  readonly values: readonly number[];
}

export interface ChartData {
  readonly labels: readonly string[];
  readonly datasets: readonly ChartDataset[];
}

export type ChartType = 'bar' | 'line' | 'pie' | 'area';

/** Placeholder chart props — chart rendering is a future milestone. */
export interface ChartProps extends BaseComponentProps {
  readonly type: ChartType;
  readonly title?: string;
  readonly data: ChartData;
}

export interface QRCodeProps extends BaseComponentProps {
  readonly value: string;
}

export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'CODE39';

export interface BarcodeProps extends BaseComponentProps {
  readonly value: string;
  readonly format?: BarcodeFormat;
}
