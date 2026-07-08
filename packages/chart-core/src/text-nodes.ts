import type { ChartTheme, SceneTextNode } from './types.js';

export function createTitleText(
  title: string,
  chartWidth: number,
  theme: ChartTheme,
  y = 8,
  height = 24,
): SceneTextNode {
  return {
    kind: 'text',
    x: 0,
    y,
    width: chartWidth,
    height,
    text: title,
    fontFamily: theme.fontFamily,
    fontSize: theme.fontSizeTitle,
    fontWeight: 'bold',
    fill: theme.textColor,
    textAlign: 'center',
  };
}

export function createTickLabel(
  x: number,
  y: number,
  text: string,
  theme: ChartTheme,
  textAlign: 'left' | 'center' | 'right',
  width: number,
  fontSize = theme.fontSizeSmall,
  fontWeight: 'normal' | 'bold' = 'normal',
): SceneTextNode {
  return {
    kind: 'text',
    x,
    y,
    width,
    height: fontSize * 1.3,
    text,
    fontFamily: theme.fontFamily,
    fontSize,
    fontWeight,
    fill: theme.mutedColor,
    textAlign,
  };
}

/** Rough label width estimate without font metrics (pt). */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.55;
}

export function measureYAxisWidth(
  labels: readonly string[],
  fontSize: number,
  padding = 10,
): number {
  if (labels.length === 0) return 44;
  const maxWidth = Math.max(...labels.map((label) => estimateTextWidth(label, fontSize)));
  return Math.max(44, Math.ceil(maxWidth + padding));
}
