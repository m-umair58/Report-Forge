# Report Lifecycle

This document describes the complete lifecycle of report generation, from the developer's first API call to the final output artifact.

## Lifecycle Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Phase 1: Construction                                        │
│   Report.create() → Builder API calls → Component Tree       │
├──────────────────────────────────────────────────────────────┤
│ Phase 2: Serialization                                       │
│   Component Tree → Report Schema (JSON IR)                   │
├──────────────────────────────────────────────────────────────┤
│ Phase 3: Validation                                          │
│   Schema validation → Plugin validators → Pass or Fail       │
├──────────────────────────────────────────────────────────────┤
│ Phase 4: Theme Resolution                                    │
│   Metadata theme name → Resolved ITheme tokens               │
├──────────────────────────────────────────────────────────────┤
│ Phase 5: Layout                                              │
│   Schema + Theme → Layout Engine → Positioned pages          │
├──────────────────────────────────────────────────────────────┤
│ Phase 6: Rendering                                           │
│   Layout output + Theme → Renderer → Output bytes            │
├──────────────────────────────────────────────────────────────┤
│ Phase 7: Delivery                                            │
│   Return buffer, write file, or pipe stream to consumer      │
└──────────────────────────────────────────────────────────────┘
```

## Phase 1: Construction

**Trigger:** `Report.create(options)` followed by Builder API calls.

**Package:** `@reportforge/core`

**Steps:**

1. Core creates an `IBuilder` instance with metadata and plugin registrations.
2. Plugins register components, themes, renderers, templates, and validators via `IPluginRegistry`.
3. Developer calls fluent methods (`.title()`, `.table()`, `.section()`, etc.).
4. Each method creates an `IComponent` and attaches it to the component tree.
5. Scoped builders (`.section()`, `.header()`) push/pop a context stack for nesting.

**Output:** Mutable component tree rooted at a `Report` component.

**Developer visibility:** Full — this is the primary API surface.

## Phase 2: Serialization

**Trigger:** `report.toSchema()` or `report.render()` (which calls serialization internally).

**Package:** `@reportforge/core`

**Steps:**

1. Component tree is deep-frozen (immutable).
2. Each `IComponent` is converted to an `IReportNode` via type-specific serializers.
3. Plugin-registered components use their custom `serialize` function.
4. Metadata is attached at the schema root.
5. Schema version is set.

**Output:** `ReportSchema` JSON object.

**Developer visibility:** Optional — `toSchema()` exposes the IR for debugging, storage, or custom processing.

## Phase 3: Validation

**Trigger:** Automatically after serialization when rendering, or explicitly via validation API.

**Package:** `@reportforge/core`

**Steps:**

1. Validate schema version compatibility.
2. Walk the node tree and check structural rules (unique IDs, allowed children, required props).
3. Run built-in validators (node type registration, prop schemas).
4. Run plugin-registered validators in registration order.
5. Collect all errors or pass.

**Output:** Validated schema or `ValidationError[]`.

**Developer visibility:** Errors are thrown with structured messages. No silent fixes.

## Phase 4: Theme Resolution

**Trigger:** Between validation and layout.

**Package:** `@reportforge/themes` (resolution), orchestrated by `@reportforge/core`

**Steps:**

1. Read `metadata.theme` from the schema (default: `'default'`).
2. Look up theme in built-in themes and plugin-registered themes.
3. Resolve theme inheritance (base theme + overrides).
4. Produce a fully resolved `ITheme` with concrete token values.

**Output:** `ITheme` instance.

**Developer visibility:** Transparent — theme is selected via metadata or `Report.create()` options.

## Phase 5: Layout

**Trigger:** After theme resolution, before rendering.

**Package:** `@reportforge/layout`

**Steps:**

1. Initialize page model from theme page tokens and report metadata.
2. Extract header and footer nodes for repetition.
3. Walk the content tree depth-first.
4. For each node: resolve styles, measure content, assign position.
5. Paginate when content exceeds page bounds.
6. Split tables across pages with optional header repetition.
7. Place header/footer on every page.

**Output:** `LayoutOutput` with positioned pages and elements.

**Developer visibility:** None — internal. Layout bugs surface as renderer errors or validation warnings.

## Phase 6: Rendering

**Trigger:** After layout completes.

**Package:** `@reportforge/renderer-pdf` (or other renderer packages)

**Steps:**

1. Core selects the renderer based on `render({ format })` option.
2. Construct `IRenderContext` with layout output, theme, metadata, and options.
3. Call `IRenderer.render(context)`.
4. Renderer iterates pages and elements, emitting format-native output.
5. Embed fonts, images, and metadata in the output format.

**Output:** `Uint8Array` buffer.

**Developer visibility:** Format selection via `render({ format: 'pdf' })`. Renderer-specific options via `render({ options: { ... } })`.

## Phase 7: Delivery

**Trigger:** After rendering completes.

**Package:** `@reportforge/core` (orchestration), `@reportforge/cli` (file writing)

**Steps:**

1. Return the buffer to the caller, or
2. Write to a file path if `output` option is provided, or
3. Pipe to a writable stream (future API).

**Output:** PDF file, buffer, or stream consumed by the developer.

**Developer visibility:** Full — the developer receives the final artifact.

## Lifecycle Timing Diagram

```
Developer          Core              Themes        Layout         Renderer
    │                │                  │             │              │
    │ Report.create()│                  │             │              │
    │───────────────>│                  │             │              │
    │ .title().table()                  │             │              │
    │───────────────>│                  │             │              │
    │ .render()      │                  │             │              │
    │───────────────>│                  │             │              │
    │                │ serialize()      │             │              │
    │                │ validate()       │             │              │
    │                │ resolve theme    │             │              │
    │                │─────────────────>│             │              │
    │                │<─────────────────│             │              │
    │                │ layout()         │             │              │
    │                │──────────────────────────────>│              │
    │                │<──────────────────────────────│              │
    │                │ render()         │             │              │
    │                │─────────────────────────────────────────────>│
    │                │<─────────────────────────────────────────────│
    │<───────────────│                  │             │              │
    │  Uint8Array    │                  │             │              │
```

## Error Propagation

Errors at any phase halt the lifecycle and propagate to the developer:

| Phase            | Error Type           | Example                          |
| ---------------- | -------------------- | -------------------------------- |
| Construction     | `BuilderError`       | Invalid table column definition  |
| Serialization    | `SerializationError` | Unknown component type           |
| Validation       | `ValidationError`    | Duplicate node ID                |
| Theme Resolution | `ThemeError`         | Unknown theme name               |
| Layout           | `LayoutError`        | Unbreakable content exceeds page |
| Rendering        | `RendererError`      | Font embedding failure           |
| Delivery         | `IOError`            | Cannot write to output path      |

All errors include the phase name and relevant context (node ID, theme name, renderer name).

## Short-Circuit Paths

Not every lifecycle path executes all phases:

| Path                | Phases executed                                    |
| ------------------- | -------------------------------------------------- |
| `report.toSchema()` | Construction → Serialization                       |
| `report.validate()` | Construction → Serialization → Validation          |
| `report.render()`   | All phases                                         |
| Template + render   | Construction (via template) → all remaining phases |

## Future Lifecycle Extensions

- **Streaming layout** — layout and rendering interleaved for very large reports.
- **Incremental rendering** — render pages as they are laid out.
- **Caching** — cache layout output for re-rendering in different formats.
- **Preview** — render to a low-resolution preview during construction.
