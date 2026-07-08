import type {
  ChartDataInput,
  ChartPropsInput,
  ChartRowData,
  ChartValidationIssue,
  ChartValidationResult,
  DataPoint,
  DataSeries,
  NormalizedChartData,
} from './types.js';

const PLACEHOLDER_CHARTS = new Set(['heatmap', 'treemap', 'radar', 'gauge']);

function isChartDataInput(data: unknown): data is ChartDataInput {
  return (
    data !== null &&
    typeof data === 'object' &&
    'labels' in data &&
    'datasets' in data &&
    Array.isArray((data as ChartDataInput).labels) &&
    Array.isArray((data as ChartDataInput).datasets)
  );
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function categoryLabel(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

/** Maps row-oriented or legacy chart data into normalized series. */
export function mapChartData(
  data: ChartRowData | ChartDataInput,
  xField?: string,
  yField?: string | readonly string[],
  seriesField?: string,
): NormalizedChartData {
  if (isChartDataInput(data)) {
    return mapLegacyChartData(data);
  }

  if (!Array.isArray(data) || data.length === 0) {
    return { categories: [], series: [] };
  }

  const xKey = xField ?? inferField(data, ['x', 'label', 'category', 'month', 'name']);
  const yKeys = normalizeYFields(yField, data);
  const seriesKey = seriesField;

  if (seriesKey !== undefined) {
    return mapGroupedRows(data, xKey, yKeys[0] ?? 'y', seriesKey);
  }

  if (yKeys.length <= 1) {
    return mapSimpleRows(data, xKey, yKeys[0] ?? 'y');
  }

  return mapMultiSeriesRows(data, xKey, yKeys);
}

function normalizeYFields(yField: string | readonly string[] | undefined, data: ChartRowData): readonly string[] {
  if (Array.isArray(yField)) return yField;
  if (typeof yField === 'string') return [yField];
  const inferred = inferField(data, ['y', 'value', 'amount', 'revenue', 'count']);
  return inferred.length > 0 ? [inferred] : ['y'];
}

function inferField(data: ChartRowData, candidates: readonly string[]): string {
  const first = data[0];
  if (first === undefined) return candidates[0] ?? 'value';
  for (const key of candidates) {
    if (key in first) return key;
  }
  const keys = Object.keys(first);
  return keys[0] ?? 'value';
}

function mapLegacyChartData(data: ChartDataInput): NormalizedChartData {
  const categories = [...data.labels];
  const series: DataSeries[] = data.datasets.map((dataset) => ({
    name: dataset.label,
    points: dataset.values.map((value, index) => {
      const label = categories[index] ?? String(index);
      return { x: label, y: value, label };
    }),
  }));
  return { categories, series };
}

function mapSimpleRows(data: ChartRowData, xKey: string, yKey: string): NormalizedChartData {
  const categories: string[] = [];
  const points: DataPoint[] = [];

  for (const row of data) {
    const x = categoryLabel(row[xKey]);
    const y = toNumber(row[yKey]);
    if (y === undefined) continue;
    categories.push(x);
    points.push({ x, y, label: x });
  }

  return {
    categories,
    series: [{ name: yKey, points }],
  };
}

function mapMultiSeriesRows(data: ChartRowData, xKey: string, yKeys: readonly string[]): NormalizedChartData {
  const categories: string[] = [];
  const categorySet = new Set<string>();

  for (const row of data) {
    const x = categoryLabel(row[xKey]);
    if (!categorySet.has(x)) {
      categorySet.add(x);
      categories.push(x);
    }
  }

  const series: DataSeries[] = yKeys.map((yKey) => ({
    name: yKey,
    points: data.flatMap((row) => {
      const y = toNumber(row[yKey]);
      if (y === undefined) return [];
      const x = categoryLabel(row[xKey]);
      return [{ x, y, label: x } satisfies DataPoint];
    }),
  }));

  return { categories, series };
}

function mapGroupedRows(
  data: ChartRowData,
  xKey: string,
  yKey: string,
  seriesKey: string,
): NormalizedChartData {
  const categories: string[] = [];
  const categorySet = new Set<string>();
  const seriesMap = new Map<string, DataPoint[]>();

  for (const row of data) {
    const x = categoryLabel(row[xKey]);
    const seriesName = categoryLabel(row[seriesKey]);
    const y = toNumber(row[yKey]);
    if (y === undefined) continue;

    if (!categorySet.has(x)) {
      categorySet.add(x);
      categories.push(x);
    }

    const bucket = seriesMap.get(seriesName) ?? [];
    bucket.push({ x, y, label: x, series: seriesName });
    seriesMap.set(seriesName, bucket);
  }

  const series: DataSeries[] = [...seriesMap.entries()].map(([name, points]) => ({ name, points }));
  return { categories, series };
}

export function validateChartProps(input: ChartPropsInput): ChartValidationResult {
  const errors: ChartValidationIssue[] = [];

  if (input.type.trim().length === 0) {
    errors.push({ message: 'Chart type is required.', path: 'type' });
  }

  if (input.data === undefined) {
    errors.push({ message: 'Chart data is required.', path: 'data' });
    return { valid: false, errors };
  }

  if (Array.isArray(input.data)) {
    if (input.data.length === 0) {
      errors.push({ message: 'Chart data array must not be empty.', path: 'data' });
    }
    if (!isChartDataInput(input.data) && input.x === undefined) {
      const first = input.data[0];
      if (first !== undefined && !('x' in first) && !('month' in first) && !('label' in first)) {
        errors.push({ message: 'Row data requires an x field mapping.', path: 'x' });
      }
    }
  } else if (!isChartDataInput(input.data)) {
    errors.push({ message: 'Chart data must be an array or { labels, datasets } object.', path: 'data' });
  }

  if (input.width !== undefined && input.width <= 0) {
    errors.push({ message: 'Chart width must be positive.', path: 'width' });
  }
  if (input.height !== undefined && input.height <= 0) {
    errors.push({ message: 'Chart height must be positive.', path: 'height' });
  }

  if (!PLACEHOLDER_CHARTS.has(input.type)) {
    const normalized = mapChartData(
      input.data,
      input.x,
      input.y,
      input.series,
    );
    if (normalized.series.length === 0 || normalized.series.every((s) => s.points.length === 0)) {
      errors.push({ message: 'Chart data contains no plottable values.', path: 'data' });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function parseChartProps(
  props: Readonly<Record<string, unknown>>,
  fallbackWidth: number,
  fallbackHeight: number,
): ChartPropsInput {
  const type = String(props['type'] ?? 'bar') as ChartPropsInput['type'];
  const data = props['data'] as ChartRowData | ChartDataInput;
  const x = typeof props['x'] === 'string' ? props['x'] : undefined;
  const y = props['y'] as string | readonly string[] | undefined;
  const series = typeof props['series'] === 'string' ? props['series'] : undefined;
  const width = typeof props['width'] === 'number' ? props['width'] : fallbackWidth;
  const height = typeof props['height'] === 'number' ? props['height'] : fallbackHeight;
  const title = typeof props['title'] === 'string' ? props['title'] : undefined;
  const legend = props['legend'] as ChartPropsInput['legend'];

  return {
    type,
    data,
    width,
    height,
    ...(title !== undefined ? { title } : {}),
    ...(x !== undefined ? { x } : {}),
    ...(y !== undefined ? { y } : {}),
    ...(series !== undefined ? { series } : {}),
    ...(legend !== undefined ? { legend } : {}),
  };
}

export function buildNormalizedData(input: ChartPropsInput): NormalizedChartData {
  return mapChartData(input.data, input.x, input.y, input.series);
}

export function buildAccessibilityFromData(
  type: ChartPropsInput['type'],
  title: string | undefined,
  data: NormalizedChartData,
): import('./types.js').ChartAccessibilityMetadata {
  return {
    chartType: type,
    ...(title !== undefined ? { title } : {}),
    categories: data.categories,
    series: data.series.map((series) => ({
      name: series.name,
      values: series.points.map((point) => ({
        label: point.label ?? String(point.x),
        value: point.y,
      })),
    })),
  };
}
