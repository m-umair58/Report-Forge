# Architecture Overview

ReportForge is a layered reporting framework for Node.js. Developers describe reports using a fluent Builder API. The framework converts that description into a structured intermediate representation, validates it, computes layout, and delegates output generation to a pluggable renderer.

ReportForge is **not** a PDF library. It is a reporting framework where layout and rendering are separate concerns connected only through well-defined interfaces.

## Design Principles

1. **Separation of concerns** — each layer has a single responsibility and communicates through interfaces.
2. **Renderer independence** — the Builder and layout engine know nothing about PDF, HTML, or any output format.
3. **Composition over inheritance** — components are composed into trees, not extended through deep class hierarchies.
4. **Type safety** — every public contract is fully typed with strict TypeScript.
5. **Extensibility** — components, themes, renderers, templates, and validators are pluggable.

## Reporting Pipeline

```
Developer Code
      ↓
Builder API
      ↓
Component Tree
      ↓
Report Schema (Intermediate Representation)
      ↓
Validation
      ↓
Layout Engine
      ↓
Renderer
      ↓
Output
```

Each stage transforms data and passes it to the next. No stage skips ahead or reaches backward across layer boundaries.

## Layer Responsibilities

| Layer          | Responsibility                                     | Must never                                          |
| -------------- | -------------------------------------------------- | --------------------------------------------------- |
| Builder API    | Fluent developer-facing API for describing reports | Know about PDF, pixels, or drawing primitives       |
| Component Tree | In-memory tree of typed component instances        | Serialize directly to output formats                |
| Report Schema  | Portable JSON intermediate representation          | Contain layout coordinates or renderer instructions |
| Validation     | Enforce schema rules and business constraints      | Modify layout or render output                      |
| Layout Engine  | Compute positions, pagination, and spacing         | Generate PDF/HTML bytes                             |
| Renderer       | Convert laid-out document to output bytes          | Parse Builder API or mutate the component tree      |
| Output         | Final artifact (file buffer, stream, etc.)         | —                                                   |

## Package Map

| Package                     | Role                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| `@reportforge/core`         | Builder API, component tree, schema serialization, validation orchestration |
| `@reportforge/shared`       | Shared interfaces, types, and utilities used across packages                |
| `@reportforge/layout`       | Layout engine implementation                                                |
| `@reportforge/renderer-pdf` | PDF renderer implementation                                                 |
| `@reportforge/themes`       | Theme definitions and theme resolution                                      |
| `@reportforge/templates`    | Reusable report templates                                                   |
| `@reportforge/cli`          | Command-line interface                                                      |

See [package-responsibilities.md](./package-responsibilities.md) for detailed ownership rules.

## Key Interfaces

All cross-package communication uses interfaces defined in `@reportforge/shared`:

- `IBuilder` — fluent report construction API
- `IComponent` — component contract in the component tree
- `IReportNode` — node in the report schema (IR)
- `ILayoutEngine` — layout computation
- `IRenderer` — output generation
- `IRenderContext` — context passed to renderers during output generation
- `ITheme` — typography, colors, and spacing tokens
- `IPlugin` — extension registration contract

## Data Flow Example

```typescript
// 1. Developer uses Builder API (core)
const report = Report.create()
  .title('Quarterly Sales')
  .table({ columns, rows })
  .footer('Confidential');

// 2. Component tree is built internally (core)
// 3. Tree is serialized to Report Schema JSON (core)
const schema = report.toSchema();

// 4. Schema is validated (core)
const validated = validateSchema(schema);

// 5. Layout engine computes positions (layout)
const laidOut = layoutEngine.layout(validated, { theme });

// 6. Renderer produces output (renderer-pdf)
const pdf = await renderer.render({ document: laidOut, theme });

// 7. Output is returned to the developer
return pdf;
```

Steps 2–4 happen inside `report.render()` — the developer only interacts with the Builder API.

## Further Reading

- [report-pipeline.md](./report-pipeline.md) — detailed pipeline stages
- [component-system.md](./component-system.md) — component hierarchy and extensibility
- [report-schema.md](./report-schema.md) — intermediate representation format
- [builder-api.md](./builder-api.md) — public API design
- [layout-engine.md](./layout-engine.md) — layout responsibilities
- [renderer.md](./renderer.md) — renderer contract
- [plugin-system.md](./plugin-system.md) — extension points
- [theme-system.md](./theme-system.md) — theming architecture
- [lifecycle.md](./lifecycle.md) — end-to-end generation lifecycle
- [package-responsibilities.md](./package-responsibilities.md) — package boundaries
