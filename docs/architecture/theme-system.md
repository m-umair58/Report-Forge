# Theme System

Themes define the visual language of a report: typography, colors, spacing, and borders. Themes are **renderer-independent** token sets that both the layout engine and renderers resolve into concrete values.

Themes live in `@reportforge/themes`. Theme definitions implement `ITheme`.

## Design Principles

1. **Token-based** — themes define abstract tokens, not format-specific values.
2. **Renderer-independent** — the same theme works with PDF, HTML, and image renderers.
3. **Composable** — themes can extend or override a base theme.
4. **Resolvable** — layout and renderers resolve tokens to format-appropriate values.

## Theme Structure

```typescript
interface ITheme {
  readonly name: string;
  readonly tokens: ThemeTokens;
}
```

```typescript
interface ThemeTokens {
  readonly colors: ColorTokens;
  readonly typography: TypographyTokens;
  readonly spacing: SpacingTokens;
  readonly borders: BorderTokens;
  readonly components: ComponentStyleTokens;
  readonly page: PageTokens;
}
```

## Typography

Typography tokens define font families, sizes, weights, and line heights:

```typescript
interface TypographyTokens {
  readonly fontFamily: string;
  readonly fontFamilyMono: string;
  readonly fontSize: number;
  readonly fontSizeSmall: number;
  readonly fontSizeLarge: number;
  readonly fontSizeTitle: number;
  readonly fontSizeSubtitle: number;
  readonly lineHeight: number;
  readonly fontWeightNormal: number;
  readonly fontWeightBold: number;
}
```

### Resolution by Renderer

| Token                 | PDF Resolution               | HTML Resolution                  |
| --------------------- | ---------------------------- | -------------------------------- |
| `fontFamily: 'Inter'` | Embed or reference Inter TTF | `font-family: Inter, sans-serif` |
| `fontSizeTitle: 24`   | 24pt font size               | `font-size: 24px`                |
| `lineHeight: 1.5`     | 1.5× line spacing            | `line-height: 1.5`               |

The theme stores the intent. Each renderer maps tokens to format-native properties.

## Colors

```typescript
interface ColorTokens {
  readonly primary: string;
  readonly secondary: string;
  readonly text: string;
  readonly textMuted: string;
  readonly background: string;
  readonly border: string;
  readonly accent: string;
  readonly error: string;
  readonly success: string;
}
```

Colors are hex strings or named tokens. Inline `style` overrides on schema nodes reference these token names:

```json
{
  "style": {
    "color": "primary",
    "backgroundColor": "background"
  }
}
```

## Spacing

```typescript
interface SpacingTokens {
  readonly unit: number;
  readonly section: number;
  readonly paragraph: number;
  readonly title: number;
  readonly table: number;
  readonly component: number;
  readonly pageMarginTop: number;
  readonly pageMarginBottom: number;
  readonly pageMarginLeft: number;
  readonly pageMarginRight: number;
}
```

Spacing values are in abstract units. The layout engine converts them to points (PDF) or pixels (HTML) based on the target format.

## Borders

```typescript
interface BorderTokens {
  readonly width: number;
  readonly color: string;
  readonly radius: number;
  readonly style: 'solid' | 'dashed' | 'dotted' | 'none';
}
```

## Component Styling

Per-component style defaults:

```typescript
interface ComponentStyleTokens {
  readonly title: Readonly<Record<string, unknown>>;
  readonly subtitle: Readonly<Record<string, unknown>>;
  readonly paragraph: Readonly<Record<string, unknown>>;
  readonly table: Readonly<Record<string, unknown>>;
  readonly header: Readonly<Record<string, unknown>>;
  readonly footer: Readonly<Record<string, unknown>>;
  readonly summaryCard: Readonly<Record<string, unknown>>;
  readonly divider: Readonly<Record<string, unknown>>;
}
```

Example:

```typescript
{
  title: {
    color: 'primary',
    fontSize: 'fontSizeTitle',
    fontWeight: 'fontWeightBold',
    textAlign: 'left',
    marginBottom: 'spacing.title',
  },
  table: {
    borderColor: 'border',
    borderWidth: 'borders.width',
    headerBackground: 'primary',
    headerColor: 'background',
    rowAlternateBackground: 'background',
  },
}
```

Component style values reference other theme tokens by name. Resolution is recursive.

## Page Settings

```typescript
interface PageTokens {
  readonly size: 'A4' | 'Letter' | 'Legal' | 'A3';
  readonly orientation: 'portrait' | 'landscape';
  readonly marginTop: number;
  readonly marginBottom: number;
  readonly marginLeft: number;
  readonly marginRight: number;
}
```

Report metadata can override page settings per report.

## Theme Resolution Flow

```
1. Report metadata specifies theme: "corporate"
2. Core resolves theme from built-in + plugin themes
3. Layout engine uses spacing, typography, and page tokens
4. Renderer maps color and font tokens to format-native values
```

```
Theme Tokens (abstract)
      ↓
Layout Engine (spacing, margins, text measurement)
      ↓
LayoutOutput (positions + resolved style values)
      ↓
Renderer (format-native colors, fonts, borders)
```

## Built-in Themes

| Theme       | Description                                 |
| ----------- | ------------------------------------------- |
| `default`   | Clean, neutral styling for general reports  |
| `minimal`   | Reduced decoration, maximum content density |
| `corporate` | Professional styling with branded colors    |

Additional themes are registered via the plugin system.

## Theme Inheritance

Themes can extend a base theme and override specific tokens:

```typescript
const corporateTheme: ITheme = {
  name: 'corporate',
  tokens: {
    ...defaultTheme.tokens,
    colors: {
      ...defaultTheme.tokens.colors,
      primary: '#003366',
      accent: '#FF6600',
    },
  },
};
```

## Renderer Independence

Themes never contain:

- PDF font dictionary entries
- HTML `<style>` blocks
- CSS class names tied to a specific renderer
- Pixel-perfect coordinates

Each renderer interprets the same token set independently. This ensures a report styled with the `corporate` theme looks appropriately corporate in both PDF and HTML output.

## Relationship to Other Layers

| Layer         | Theme usage                                 |
| ------------- | ------------------------------------------- |
| Builder API   | Accepts theme name in metadata              |
| Report Schema | Stores theme name in metadata               |
| Layout Engine | Resolves spacing, typography, page settings |
| Renderer      | Maps color and font tokens to output format |
