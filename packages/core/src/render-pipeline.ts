import type { DisplayList } from '@reportforge/display-list';
import { DisplayListGenerator } from '@reportforge/display-list';
import { LayoutEngine } from '@reportforge/layout';
import {
  ThemeProvider,
  applyThemeToLayout,
  createDisplayListThemeOptions,
  toLayoutTheme,
} from '@reportforge/theme';
import { defaultThemeRegistry } from '@reportforge/themes';
import type { ReportSchema } from '@reportforge/shared';

import type { ReportBuilder } from './builder.js';
import { ValidationFailureError } from './errors.js';

const defaultThemeProvider = new ThemeProvider(defaultThemeRegistry);

async function emitHook(
  builder: ReportBuilder,
  name: string,
  context: unknown,
): Promise<void> {
  const runtime = builder.getPluginRuntime();
  if (runtime?.emitHook !== undefined) {
    await runtime.emitHook(name, context);
  }
}

function resolveThemeProvider(builder: ReportBuilder): ThemeProvider {
  const runtime = builder.getPluginRuntime();
  if (runtime?.themeRegistry !== undefined) {
    return new ThemeProvider(runtime.themeRegistry);
  }
  return defaultThemeProvider;
}

export interface DisplayListPipelineResult {
  readonly schema: ReportSchema;
  readonly displayList: DisplayList;
  readonly pageBackground?: string;
}

/** Shared pipeline: validate → layout → display list. Used by all format renderers. */
export async function buildDisplayListFromBuilder(
  builder: ReportBuilder,
): Promise<DisplayListPipelineResult> {
  const schema = builder.toSchema();
  await emitHook(builder, 'beforeReportValidation', { schema });

  const validation = builder.validate();
  await emitHook(builder, 'afterReportValidation', { validation, schema });

  if (!validation.valid) {
    const messages = validation.errors.map((error) => error.message).join('; ');
    throw new ValidationFailureError(`Report validation failed: ${messages}`);
  }

  await emitHook(builder, 'beforeLayout', { schema });

  const provider = resolveThemeProvider(builder);
  const theme = provider.resolve(builder.getTheme());
  const layoutEngine = new LayoutEngine();
  const rawLayout = layoutEngine.layout({ schema, theme: toLayoutTheme(theme) });
  const themedLayout = applyThemeToLayout(rawLayout, theme, schema.root);

  await emitHook(builder, 'afterLayout', { schema, layout: themedLayout });

  const displayOptions = createDisplayListThemeOptions(theme);
  const generator = new DisplayListGenerator();
  const displayList = generator.generate(themedLayout, {
    defaultFont: displayOptions.defaultFont,
    defaultFontSize: displayOptions.defaultFontSize,
    defaultColor: displayOptions.defaultColor,
  });

  return {
    schema,
    displayList,
    ...(displayOptions.pageBackground !== undefined
      ? { pageBackground: displayOptions.pageBackground }
      : {}),
  };
}

export { emitHook };
