# Architecture

ReportForge follows a layered, renderer-independent architecture. The documents in this directory are the **source of truth** for all implementation milestones.

## Pipeline

```
Developer Code → Builder API → Component Tree → Report Schema → Validation → Layout Engine → Renderer → Output
```

## Documents

| Document                                                     | Description                                         |
| ------------------------------------------------------------ | --------------------------------------------------- |
| [overview.md](./overview.md)                                 | High-level architecture and design principles       |
| [report-pipeline.md](./report-pipeline.md)                   | Detailed pipeline stages and data flow              |
| [component-system.md](./component-system.md)                 | Component hierarchy, composition, and extensibility |
| [report-schema.md](./report-schema.md)                       | Intermediate representation (JSON schema)           |
| [builder-api.md](./builder-api.md)                           | Public fluent API design (examples only)            |
| [layout-engine.md](./layout-engine.md)                       | Layout responsibilities and constraints             |
| [renderer.md](./renderer.md)                                 | Renderer contract and future output formats         |
| [plugin-system.md](./plugin-system.md)                       | Extension points for components, themes, renderers  |
| [theme-system.md](./theme-system.md)                         | Token-based theming architecture                    |
| [package-responsibilities.md](./package-responsibilities.md) | Package ownership and dependency rules              |
| [lifecycle.md](./lifecycle.md)                               | End-to-end report generation lifecycle              |

## Interfaces

Cross-package contracts are defined as TypeScript interfaces in `@reportforge/shared`:

- `IBuilder` — fluent report construction API
- `IComponent` — component tree node
- `IReportNode` — report schema node
- `ILayoutEngine` — layout computation
- `IRenderer` — output generation
- `IRenderContext` — renderer input context
- `ITheme` — design tokens
- `IPlugin` — extension registration

See `packages/shared/src/contracts/` for interface definitions.
