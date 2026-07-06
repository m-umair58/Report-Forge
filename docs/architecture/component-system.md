# Component System

The component system is how developers describe report content. Components form a tree that mirrors the logical structure of a report. ReportForge uses **composition over inheritance** — components are nested, not subclassed.

## Component Hierarchy

```
Report (root)
├── Header
├── Section
│   ├── Title
│   ├── Subtitle
│   ├── Paragraph
│   ├── Table
│   ├── Image
│   ├── Chart
│   ├── SummaryCard
│   ├── Divider
│   ├── QRCode
│   └── Barcode
├── Section
│   └── ...
└── Footer
```

## Built-in Components

| Component     | Purpose                                 | Typical Parent      |
| ------------- | --------------------------------------- | ------------------- |
| `Report`      | Root container for the entire report    | —                   |
| `Header`      | Repeating top-of-page content           | `Report`            |
| `Footer`      | Repeating bottom-of-page content        | `Report`            |
| `Section`     | Logical grouping of content             | `Report`, `Section` |
| `Title`       | Primary heading                         | `Section`, `Report` |
| `Subtitle`    | Secondary heading                       | `Section`           |
| `Paragraph`   | Body text block                         | `Section`           |
| `Table`       | Tabular data with columns and rows      | `Section`           |
| `Image`       | Embedded or referenced image            | `Section`           |
| `Chart`       | Data visualization                      | `Section`           |
| `SummaryCard` | Highlighted metric or summary block     | `Section`           |
| `Divider`     | Visual separator between content blocks | `Section`           |
| `QRCode`      | QR code encoding                        | `Section`           |
| `Barcode`     | Barcode encoding                        | `Section`           |

## Composition vs Inheritance

### Composition (preferred)

ReportForge composes reports from discrete component instances:

```typescript
report
  .section('Sales Overview')
  .title('Q1 Results')
  .paragraph('Revenue increased by 12%.')
  .table({ columns, rows })
  .endSection();
```

Each component is an independent unit with its own properties and optional children. New component types are added by implementing `IComponent` — no existing components are modified.

### Inheritance (avoided)

ReportForge does **not** use deep inheritance hierarchies like `BaseElement → TextElement → Title`. Inheritance creates tight coupling and makes extension fragile.

Instead:

- All components implement the same `IComponent` interface.
- Component behavior is defined by a `type` discriminator and a typed property bag.
- Shared behavior lives in utility functions, not base classes.

## Component Contract

Every component implements `IComponent`:

```typescript
interface IComponent {
  readonly type: string;
  readonly id: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly children: readonly IComponent[];
}
```

Components are immutable once the tree is frozen for serialization.

## Allowed Children

Each component type declares which child types it accepts:

| Parent      | Allowed Children                                                  |
| ----------- | ----------------------------------------------------------------- |
| `Report`    | `Header`, `Footer`, `Section`, `Title`, `Paragraph`, `Table`, ... |
| `Section`   | `Title`, `Subtitle`, `Paragraph`, `Table`, `Image`, `Chart`, ...  |
| `Header`    | `Title`, `Paragraph`, `Image`                                     |
| `Footer`    | `Paragraph`, `Image`                                              |
| `Table`     | _(leaf — no children)_                                            |
| `Paragraph` | _(leaf — no children)_                                            |

Validation enforces these rules during the validation stage.

## Extensibility

### Registering Custom Components

Plugins register custom components via the plugin system:

```typescript
const plugin: IPlugin = {
  name: 'acme-components',
  register(registry) {
    registry.registerComponent('CustomWidget', {
      allowedParents: ['Section'],
      allowedChildren: [],
      serialize: (component) => ({/* schema node */}),
    });
  },
};
```

Custom components:

1. Implement `IComponent` with a unique `type` string.
2. Define a serialization function that produces an `IReportNode`.
3. Optionally provide a Builder API method via plugin registration.
4. Optionally provide layout hints and renderer adapters.

### Component Lifecycle

1. **Construction** — Builder API creates component instances and attaches them to the tree.
2. **Freeze** — Tree becomes immutable before serialization.
3. **Serialization** — Each component is converted to an `IReportNode`.
4. **Layout** — Layout engine reads schema nodes and computes positions.
5. **Render** — Renderer draws the laid-out elements.

Components do not participate in layout or rendering directly.

## Design Guidelines

1. **Describe, don't draw** — components express intent ("a table with these columns") not instructions ("draw a rectangle at x,y").
2. **Leaf vs container** — leaf components hold data; container components hold children.
3. **Minimal surface** — each component exposes only the properties needed to describe its content.
4. **Renderer-agnostic props** — no PDF-specific properties (e.g., `strokeWidth`, `fontName`) on components.

## Relationship to Other Layers

```
Builder API  →  creates  →  Component Tree
Component Tree  →  serializes to  →  Report Schema
Report Schema  →  consumed by  →  Layout Engine + Renderer
```

The component system lives entirely within `@reportforge/core`. Layout and renderer packages never import component classes.
