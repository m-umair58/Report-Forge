# Package Responsibilities

Each ReportForge package has a clearly defined ownership boundary. Packages communicate through interfaces in `@reportforge/shared` — never through direct imports of implementation code across layer boundaries.

## Dependency Graph

```
@reportforge/cli
      ↓
@reportforge/core ──→ @reportforge/shared
      ↓                      ↑
@reportforge/layout ─────────┘
      ↓
@reportforge/renderer-pdf

@reportforge/themes ──→ @reportforge/shared
@reportforge/templates ──→ @reportforge/core, @reportforge/shared
```

Solid arrows indicate allowed dependencies. No package below the layout layer imports `@reportforge/core`.

## @reportforge/core

**Owns:** Builder API, component tree, report schema serialization, validation orchestration, plugin registry, and report lifecycle coordination.

| Responsibility       | Details                                           |
| -------------------- | ------------------------------------------------- |
| `Report.create()`    | Entry point for the Builder API                   |
| Component tree       | Construction and freezing of `IComponent` trees   |
| Schema serialization | Component tree → `IReportNode` JSON               |
| Validation           | Built-in and plugin validator orchestration       |
| Plugin registry      | `IPluginRegistry` implementation                  |
| Lifecycle            | Coordinates layout engine and renderer invocation |

**Must never:**

- Import renderer packages (`@reportforge/renderer-pdf`, etc.)
- Contain layout algorithms (positioning, pagination)
- Generate output bytes (PDF, HTML, images)
- Reference format-specific concepts (PDF operators, HTML tags)

**May depend on:**

- `@reportforge/shared` — interfaces and types

## @reportforge/shared

**Owns:** Cross-package interfaces, shared types, utility functions, and constants.

| Responsibility | Details                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Interfaces     | `IComponent`, `IBuilder`, `IReportNode`, `ILayoutEngine`, `IRenderer`, `IRenderContext`, `ITheme`, `IPlugin` |
| Types          | Schema types, layout types, validation result types                                                          |
| Utilities      | ID generation, deep freeze, type guards                                                                      |

**Must never:**

- Import any other `@reportforge/*` package
- Contain business logic or implementations
- Orchestrate the report lifecycle

**May depend on:**

- Nothing within the monorepo (leaf package)

## @reportforge/layout

**Owns:** Layout engine implementation — pagination, spacing, positioning, text wrapping, table splitting, header/footer repetition.

| Responsibility   | Details                                 |
| ---------------- | --------------------------------------- |
| `ILayoutEngine`  | Implementation of layout computation    |
| Pagination       | Page break logic                        |
| Positioning      | Element x/y/width/height calculation    |
| Text measurement | Line wrapping based on theme typography |
| Table splitting  | Multi-page table support                |

**Must never:**

- Import `@reportforge/core` (no Builder API, no component tree)
- Import renderer packages
- Generate output bytes
- Modify the report schema

**May depend on:**

- `@reportforge/shared` — interfaces and types

## @reportforge/renderer-pdf

**Owns:** PDF output generation implementing `IRenderer`.

| Responsibility  | Details                             |
| --------------- | ----------------------------------- |
| `IRenderer`     | PDF-specific implementation         |
| Font embedding  | PDF font dictionary management      |
| Image embedding | PDF image XObject creation          |
| PDF metadata    | Document properties (title, author) |

**Must never:**

- Import `@reportforge/core`
- Compute layout (positions, pagination)
- Parse the Builder API or component tree
- Validate the report schema

**May depend on:**

- `@reportforge/shared` — interfaces and types
- PDF generation library (implementation detail, not exposed)

## @reportforge/themes

**Owns:** Built-in theme definitions, theme resolution, and theme token types.

| Responsibility   | Details                               |
| ---------------- | ------------------------------------- |
| Built-in themes  | `default`, `minimal`, `corporate`     |
| Theme resolution | Resolve theme name to `ITheme` tokens |
| Theme types      | `ThemeTokens`, `ColorTokens`, etc.    |

**Must never:**

- Import renderer packages
- Import `@reportforge/layout`
- Contain format-specific style values (CSS, PDF operators)

**May depend on:**

- `@reportforge/shared` — `ITheme` interface

## @reportforge/templates

**Owns:** Reusable report templates that compose Builder API calls.

| Responsibility             | Details                                      |
| -------------------------- | -------------------------------------------- |
| Built-in templates         | Invoice, statement, summary report templates |
| Template registry          | Template lookup by name                      |
| Template builder functions | Functions that populate an `IBuilder`        |

**Must never:**

- Import renderer packages
- Import `@reportforge/layout`
- Generate output directly

**May depend on:**

- `@reportforge/core` — `IBuilder` for template composition
- `@reportforge/shared` — shared types

## @reportforge/cli

**Owns:** Command-line interface for report generation, scaffolding, and validation.

| Responsibility  | Details                                                 |
| --------------- | ------------------------------------------------------- |
| CLI commands    | `generate`, `validate`, `list-themes`, `list-templates` |
| Configuration   | CLI flags and config file parsing                       |
| Output handling | Write buffers to files or stdout                        |

**Must never:**

- Implement report logic (delegates to `@reportforge/core`)
- Implement layout or rendering directly

**May depend on:**

- `@reportforge/core`
- `@reportforge/shared`
- `@reportforge/templates`
- Renderer packages (selected at runtime via flags)

## Boundary Enforcement

| Rule                                | Enforcement                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| Renderers never import core         | ESLint `import/no-restricted-paths` (future)                 |
| Layout never imports renderers      | Package dependency constraints                               |
| Shared has no internal dependencies | `package.json` has zero `@reportforge/*` deps                |
| Schema is the handoff contract      | Layout and renderers consume `IReportNode`, not `IComponent` |

## Adding a New Package

When adding a new package (e.g., `@reportforge/renderer-html`):

1. Implement `IRenderer` from `@reportforge/shared`.
2. Add no dependency on `@reportforge/core` or `@reportforge/layout`.
3. Register via the plugin system or as a built-in renderer in core's renderer resolution.
4. Document supported schema versions and renderer-specific options.
