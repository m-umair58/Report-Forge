# Theme & Styling Guide

ReportForge themes control report appearance through **design tokens** — renderer-independent values resolved once before rendering.

## Quick start

```typescript
import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';
import { CorporateTheme } from '@reportforge/themes';

const report = Report.create({ theme: CorporateTheme })
  .add(Components.Title({ text: 'Monthly Sales' }))
  .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }));

await report.toPDF('report.pdf');
```

Themes can also be passed by registered name:

```typescript
Report.create({ theme: 'corporate' });
```

## Architecture

```
Report.create({ theme })
       ↓
ThemeProvider.resolve()
       ↓
StyleResolver (per component)
       ↓
LayoutEngine + applyThemeToLayout()
       ↓
DisplayListGenerator (resolved styles)
       ↓
PDF Renderer (draws concrete values)
```

Renderers never resolve token names — they receive resolved hex colors, font sizes, and spacing.

## Design tokens

| Category | Examples |
|----------|----------|
| Colors | `primary`, `surface`, `textPrimary`, `muted`, `success`, `danger` |
| Typography | `fontFamily`, scale (`xs`–`2xl`), `lineHeight`, heading/paragraph styles |
| Spacing | `0`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| Radius | `none`, `sm`, `md`, `lg`, `xl`, `full` |
| Opacity | `disabled`, `muted`, `overlay` |

## Inheritance order

1. Component prop overrides (`color`, `fontSize`, `background`)
2. Local `style` object
3. Section theme (via `section({ theme: 'dark' })` prop — future)
4. Global report theme
5. Default theme

## Component overrides

```typescript
Components.Title({ text: 'Sales', color: 'primary' });
Components.Paragraph({ text: 'Summary', fontSize: 'lg' });
Components.SummaryCard({ title: 'Revenue', value: '$1.2M', background: 'surface' });
```

## Built-in themes

| Theme | Package export |
|-------|----------------|
| Default | `DefaultTheme` |
| Minimal | `MinimalTheme` |
| Corporate | `CorporateTheme` |
| Dark | `DarkTheme` |
| Healthcare | `HealthcareTheme` |
| Financial | `FinancialTheme` |

## Custom themes

```typescript
import { createTheme, DefaultTheme } from '@reportforge/theme';

export const BrandTheme = createTheme(
  'brand',
  {
    colors: { primary: '#004488', surface: '#f4f8fc' },
    components: {
      title: { color: 'primary', fontSize: '2xl' },
      // ...other component defaults
    },
  },
  DefaultTheme,
);
```

## Examples

```bash
pnpm example corporate-theme
pnpm example dark-theme
pnpm example healthcare-theme
pnpm example financial-theme
```

See [packages/theme/README.md](../../packages/theme/README.md) for the full API reference.
