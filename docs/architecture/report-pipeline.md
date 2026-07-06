# Report Pipeline

The report pipeline is the central data flow of ReportForge. Every report passes through the same ordered stages. Each stage has a defined input, output, and contract.

## Pipeline Diagram

```
┌─────────────────┐
│ Developer Code  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Builder API   │  Fluent API: report.title(), report.table(), ...
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Component Tree  │  In-memory tree of IComponent instances
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Report Schema  │  Portable JSON intermediate representation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Validation    │  Schema rules, constraints, plugin validators
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Layout Engine   │  Pagination, spacing, positioning
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Renderer     │  Format-specific output generation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Output      │  Buffer, stream, or file
└─────────────────┘
```

## Stage Details

### 1. Developer Code

The entry point. Developers import ReportForge packages and write report definitions using the Builder API. No knowledge of internal pipeline stages is required.

### 2. Builder API

The public-facing fluent interface provided by `@reportforge/core`. Method calls append components to an in-memory tree and return `this` for chaining.

**Input:** Developer method calls and configuration options.

**Output:** A populated component tree attached to an `IBuilder` instance.

**Boundary:** The Builder never references renderers, layout algorithms, or output formats.

### 3. Component Tree

An in-memory tree of `IComponent` instances. Each node knows its type, properties, and children. The tree is mutable during construction and frozen before serialization.

**Input:** Builder API calls.

**Output:** Root `IComponent` (typically a `Report` component) with nested children.

**Boundary:** Components describe _what_ to render, not _where_ or _how_ in a specific format.

### 4. Report Schema

A portable JSON intermediate representation (IR) produced by serializing the component tree. The schema is the canonical handoff format between core, layout, and renderers.

**Input:** Frozen component tree.

**Output:** `IReportNode` tree as JSON.

**Boundary:** The schema contains no absolute coordinates, page numbers, or format-specific instructions.

### 5. Validation

Schema validation ensures structural integrity and business rules before layout begins. Built-in validators check node types, required fields, and tree shape. Plugins can register custom validators.

**Input:** Report schema JSON.

**Output:** Validated schema or a structured validation error.

**Boundary:** Validators inspect and reject; they do not transform layout or output.

### 6. Layout Engine

Computes the physical arrangement of content: page dimensions, margins, element positions, pagination, table splitting, and header/footer repetition.

**Input:** Validated report schema and theme tokens.

**Output:** A laid-out document model with resolved positions and page breaks.

**Boundary:** The layout engine produces a format-agnostic layout model. It does not emit PDF operators, HTML tags, or image bytes.

### 7. Renderer

Converts the laid-out document into a specific output format. Each renderer implements `IRenderer` and handles format-specific details internally.

**Input:** Laid-out document and `IRenderContext`.

**Output:** `Uint8Array` buffer or readable stream.

**Boundary:** Renderers consume layout output. They never parse the Builder API or traverse the raw component tree.

### 8. Output

The final artifact returned to the developer: a PDF buffer, HTML string, image file, etc. The output format is determined by which renderer was selected.

## Cross-Layer Rules

1. **Downward-only data flow** — information flows from Builder toward Output. Renderers never call back into the Builder.
2. **Interface boundaries** — adjacent layers communicate through typed interfaces (`IComponent`, `IReportNode`, `ILayoutEngine`, `IRenderer`).
3. **Schema as contract** — the report schema is the stable contract between core and downstream packages. Layout and renderers depend on the schema, not on core internals.
4. **Theme injection** — themes are resolved before layout and passed through to the renderer via `IRenderContext`. Themes are renderer-independent token sets.

## Error Handling

Each stage can fail independently:

| Stage          | Typical Errors                                   |
| -------------- | ------------------------------------------------ |
| Builder API    | Invalid arguments, unknown component types       |
| Component Tree | Structural inconsistencies during construction   |
| Report Schema  | Serialization failures                           |
| Validation     | Missing required fields, constraint violations   |
| Layout Engine  | Unbreakable content, overflow without pagination |
| Renderer       | Format-specific generation failures              |

Errors are structured with stage context so developers can diagnose issues without reading framework internals.
