# Theme Engine (`@reportforge/theme`)

Renderer-independent theme resolution for ReportForge.

## Core exports

| Export | Purpose |
|--------|---------|
| `Theme` | Named theme with design tokens |
| `ThemeRegistry` | Register and resolve themes by name |
| `ThemeProvider` | Resolve theme objects or names |
| `StyleResolver` | Resolve component styles from tokens |
| `DefaultTheme` | Built-in default token set |
| `applyThemeToLayout()` | Apply resolved styles to layout output |
| `toLayoutTheme()` | Adapt theme for layout engine |

## Packages

- `@reportforge/theme` — engine, tokens, resolver
- `@reportforge/themes` — built-in preset themes

## Validation

```typescript
import { validateTheme } from '@reportforge/theme';

const result = validateTheme(myTheme);
if (!result.valid) console.error(result.errors);
```

## Performance

- Themes are cached after first resolution in `ThemeRegistry`
- Component styles are cached in `StyleResolver`
- Token lookups happen once per render pass

## Not implemented (future milestones)

- CSS parser
- Animations
- Responsive themes
- Theme editor UI
