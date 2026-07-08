/** Horizontal text alignment within a cell. */
export type CellAlign = 'left' | 'center' | 'right';

/** Vertical alignment within a cell. */
export type CellVerticalAlign = 'top' | 'middle' | 'bottom';

/** Column width specification. */
export type ColumnWidth =
  | number
  | 'auto'
  | `${number}%`;

/** Insets applied to a cell or the table. */
export interface TableInsets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Border configuration for table regions. */
export interface TableBorderStyle {
  readonly width?: number;
  readonly color?: string;
}

/** Styling for header, body, footer, and individual cells. */
export interface TableStyle {
  readonly border?: TableBorderStyle;
  readonly headerBackground?: string;
  readonly headerColor?: string;
  readonly headerFontWeight?: 'normal' | 'bold';
  readonly footerBackground?: string;
  readonly footerColor?: string;
  readonly bodyBackground?: string;
  readonly alternateRowBackground?: string;
  readonly cellPadding?: number | TableInsets;
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly lineHeight?: number;
}

/** Column definition supplied by the builder API. */
export interface ColumnDefinition {
  readonly key: string;
  /** Display title (alias: `label`). */
  readonly title?: string;
  readonly label?: string;
  readonly align?: CellAlign;
  readonly width?: ColumnWidth;
  readonly minWidth?: number;
  readonly maxWidth?: number;
}

/** Cell content — text, image placeholder, or nested component placeholder. */
export interface TableCellContent {
  readonly type: 'text' | 'image' | 'component';
  readonly value: string;
}

/** A single table cell. */
export interface TableCell {
  readonly columnKey: string;
  readonly content: TableCellContent;
  readonly align?: CellAlign;
  readonly verticalAlign?: CellVerticalAlign;
  readonly padding?: number | TableInsets;
  readonly backgroundColor?: string;
  readonly border?: TableBorderStyle;
  /** Placeholder — full merge support is a future milestone. */
  readonly rowSpan?: number;
  /** Placeholder — full merge support is a future milestone. */
  readonly colSpan?: number;
}

/** A table row in header, body, or footer. */
export interface TableRow {
  readonly kind: 'header' | 'body' | 'footer';
  readonly cells: readonly TableCell[];
  readonly sourceIndex?: number;
}

/** Logical table sections. */
export interface TableHeader {
  readonly rows: readonly TableRow[];
}

export interface TableBody {
  readonly rows: readonly TableRow[];
}

export interface TableFooter {
  readonly rows: readonly TableRow[];
}

/** Resolved column width after the sizing algorithm runs. */
export interface ResolvedColumn {
  readonly key: string;
  readonly title: string;
  readonly width: number;
  readonly align: CellAlign;
  readonly minWidth: number;
  readonly maxWidth: number;
}

/** Wrapped text lines inside a laid-out cell. */
export interface LaidOutCellText {
  readonly lines: readonly string[];
  readonly lineHeight: number;
}

/** Absolute layout for a single cell within a table fragment. */
export interface LaidOutCell {
  readonly columnKey: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly align: CellAlign;
  readonly verticalAlign: CellVerticalAlign;
  readonly padding: TableInsets;
  readonly backgroundColor?: string;
  readonly text: LaidOutCellText;
  readonly rowSpan?: number;
  readonly colSpan?: number;
}

/** Absolute layout for a row within a table fragment. */
export interface LaidOutRow {
  readonly kind: 'header' | 'body' | 'footer';
  readonly y: number;
  readonly height: number;
  readonly cells: readonly LaidOutCell[];
  readonly sourceIndex?: number;
  readonly alternateShaded?: boolean;
}

/** Complete layout for one table fragment (single page segment). */
export interface TableLayout {
  readonly columns: readonly ResolvedColumn[];
  readonly rows: readonly LaidOutRow[];
  readonly width: number;
  readonly height: number;
  readonly style: Required<Pick<TableStyle, 'border'>> & TableStyle;
  readonly fragmentIndex: number;
  readonly totalFragments: number;
  readonly repeatHeader: boolean;
  readonly bodyStartIndex: number;
  readonly bodyEndIndex: number;
}

/** Theme tokens consumed by the table engine. */
export interface TableTheme {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly borderWidth: number;
  readonly borderColor: string;
  readonly textColor: string;
  readonly headerBackground: string;
  readonly headerColor: string;
  readonly footerBackground: string;
  readonly alternateRowBackground: string;
  readonly cellPadding: number;
}

/** Options controlling pagination and header repetition. */
export interface TableLayoutOptions {
  readonly repeatHeader?: boolean;
  readonly minOrphanRows?: number;
  readonly style?: TableStyle;
}

/** Input for building a table from builder-style column/row data. */
export interface TableDataInput {
  readonly columns: readonly ColumnDefinition[];
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly headerRows?: readonly Readonly<Record<string, unknown>>[];
  readonly footerRows?: readonly Readonly<Record<string, unknown>>[];
}

/** Pagination input for splitting a table across pages. */
export interface PaginateTableInput {
  readonly table: TableDataInput;
  readonly tableWidth: number;
  readonly pageHeights: readonly number[];
  readonly theme: TableTheme;
  readonly options?: TableLayoutOptions;
}

/** Result of paginating a table. */
export interface PaginateTableResult {
  readonly fragments: readonly TableLayout[];
  readonly totalHeight: number;
}

/** Validation issue. */
export interface TableValidationIssue {
  readonly message: string;
  readonly path?: string;
}

/** Validation result. */
export interface TableValidationResult {
  readonly valid: boolean;
  readonly errors: readonly TableValidationIssue[];
}
