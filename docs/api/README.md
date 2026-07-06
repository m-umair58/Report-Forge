# API Reference

Public API documentation for ReportForge packages.

## Architecture Documents

The Builder API and component system are documented in the architecture docs:

- [Builder API](../architecture/builder-api.md) — fluent public API design with examples
- [Component System](../architecture/component-system.md) — component hierarchy and extensibility
- [Report Schema](../architecture/report-schema.md) — intermediate representation format
- [Plugin System](../architecture/plugin-system.md) — extension points

## Interface Contracts

TypeScript interfaces are defined in `@reportforge/shared`:

```typescript
import type {
  IBuilder,
  IComponent,
  IReportNode,
  ILayoutEngine,
  IRenderer,
  IRenderContext,
  ITheme,
  IPlugin,
} from '@reportforge/shared';
```

Implementation of these interfaces will be added in future milestones.

## Packages

| Package                     | API Surface                                              |
| --------------------------- | -------------------------------------------------------- |
| `@reportforge/core`         | `Report.create()`, Builder API, `toSchema()`, `render()` |
| `@reportforge/shared`       | Interfaces and shared types                              |
| `@reportforge/layout`       | `ILayoutEngine` implementation                           |
| `@reportforge/renderer-pdf` | `IRenderer` implementation for PDF                       |
| `@reportforge/themes`       | Built-in themes and theme resolution                     |
| `@reportforge/templates`    | Reusable report templates                                |
| `@reportforge/cli`          | Command-line interface                                   |
