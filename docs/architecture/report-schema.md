# Report Schema

The report schema is ReportForge's intermediate representation (IR). It is a portable JSON tree that describes report content independently of layout coordinates and output format.

The schema is the **stable contract** between `@reportforge/core`, `@reportforge/layout`, and renderer packages.

## Design Goals

1. **Portable** — serializable to JSON, storable, transmittable, and diffable.
2. **Format-agnostic** — no PDF operators, HTML tags, or pixel coordinates.
3. **Versioned** — includes a schema version for forward compatibility.
4. **Typed** — every node has a discriminated `type` field for type-safe processing.

## Schema Structure

```json
{
  "version": "1.0.0",
  "metadata": {},
  "root": {}
}
```

### Top-Level Fields

| Field      | Type          | Description                  |
| ---------- | ------------- | ---------------------------- |
| `version`  | `string`      | Schema version (semver)      |
| `metadata` | `object`      | Report-level metadata        |
| `root`     | `IReportNode` | Root node of the report tree |

## Node Types

Every node in the schema is an `IReportNode` with a discriminated `type`:

```typescript
type ReportNodeType =
  | 'report'
  | 'header'
  | 'footer'
  | 'section'
  | 'title'
  | 'subtitle'
  | 'paragraph'
  | 'table'
  | 'image'
  | 'chart'
  | 'summary-card'
  | 'divider'
  | 'qr-code'
  | 'barcode';
```

Plugins may register additional node types.

## Node Structure

```typescript
interface IReportNode {
  readonly id: string;
  readonly type: string;
  readonly props: Readonly<Record<string, unknown>>;
  readonly children: readonly IReportNode[];
  readonly style?: Readonly<Record<string, unknown>>;
  readonly layoutHints?: Readonly<Record<string, unknown>>;
}
```

### Fields

| Field         | Required | Description                                                     |
| ------------- | -------- | --------------------------------------------------------------- |
| `id`          | Yes      | Unique identifier within the report (UUID or namespaced string) |
| `type`        | Yes      | Discriminator for node kind                                     |
| `props`       | Yes      | Component-specific data (text, columns, image source, etc.)     |
| `children`    | Yes      | Child nodes (empty array for leaf nodes)                        |
| `style`       | No       | Inline style overrides (resolved against theme at layout time)  |
| `layoutHints` | No       | Suggestions for the layout engine (not commands)                |

## Metadata

Report-level metadata travels with the schema:

```json
{
  "metadata": {
    "title": "Quarterly Sales Report",
    "author": "Finance Team",
    "createdAt": "2026-06-30T12:00:00.000Z",
    "locale": "en-US",
    "pageSize": "A4",
    "orientation": "portrait",
    "theme": "default"
  }
}
```

| Field         | Description                               |
| ------------- | ----------------------------------------- |
| `title`       | Human-readable report title               |
| `author`      | Report author or organization             |
| `createdAt`   | ISO 8601 creation timestamp               |
| `locale`      | Locale for formatting dates and numbers   |
| `pageSize`    | Page size name (`A4`, `Letter`, etc.)     |
| `orientation` | `portrait` or `landscape`                 |
| `theme`       | Theme identifier to resolve during layout |

## Styling

Inline `style` overrides on nodes are token references or simple values, not renderer-specific properties:

```json
{
  "id": "title-1",
  "type": "title",
  "props": { "text": "Quarterly Sales" },
  "children": [],
  "style": {
    "color": "primary",
    "fontWeight": "bold",
    "textAlign": "center"
  }
}
```

Theme resolution happens at layout time. The schema stores intent; the theme provides concrete values.

## Layout Hints

Layout hints are **suggestions**, not commands. The layout engine may ignore hints that conflict with pagination rules:

```json
{
  "id": "table-1",
  "type": "table",
  "props": {
    "columns": ["Product", "Revenue", "Units"],
    "rows": [["Widget A", "$12,000", "400"]]
  },
  "children": [],
  "layoutHints": {
    "keepTogether": true,
    "repeatHeader": true,
    "minWidth": "100%"
  }
}
```

| Hint              | Description                               |
| ----------------- | ----------------------------------------- |
| `keepTogether`    | Avoid splitting this node across pages    |
| `repeatHeader`    | Repeat table header on each page (tables) |
| `minWidth`        | Minimum width expression                  |
| `pageBreakBefore` | Suggest a page break before this node     |
| `pageBreakAfter`  | Suggest a page break after this node      |

## Complete Example

```json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Quarterly Sales Report",
    "author": "Finance Team",
    "createdAt": "2026-06-30T12:00:00.000Z",
    "locale": "en-US",
    "pageSize": "A4",
    "orientation": "portrait",
    "theme": "default"
  },
  "root": {
    "id": "report-root",
    "type": "report",
    "props": {},
    "children": [
      {
        "id": "header-1",
        "type": "header",
        "props": {},
        "children": [
          {
            "id": "header-title",
            "type": "title",
            "props": { "text": "Acme Corp" },
            "children": []
          }
        ]
      },
      {
        "id": "section-1",
        "type": "section",
        "props": { "label": "Overview" },
        "children": [
          {
            "id": "section-title",
            "type": "title",
            "props": { "text": "Q1 Sales Summary" },
            "children": []
          },
          {
            "id": "section-paragraph",
            "type": "paragraph",
            "props": { "text": "Revenue increased by 12% compared to Q4." },
            "children": []
          },
          {
            "id": "sales-table",
            "type": "table",
            "props": {
              "columns": [
                { "key": "product", "label": "Product" },
                { "key": "revenue", "label": "Revenue" },
                { "key": "units", "label": "Units" }
              ],
              "rows": [
                { "product": "Widget A", "revenue": 12000, "units": 400 },
                { "product": "Widget B", "revenue": 8500, "units": 275 }
              ]
            },
            "children": [],
            "layoutHints": {
              "repeatHeader": true
            }
          }
        ]
      },
      {
        "id": "footer-1",
        "type": "footer",
        "props": {},
        "children": [
          {
            "id": "footer-text",
            "type": "paragraph",
            "props": { "text": "Confidential — Acme Corp" },
            "children": []
          }
        ]
      }
    ]
  }
}
```

## Validation Rules

The validation stage enforces:

1. `version` is a supported schema version.
2. Every node has a unique `id`.
3. Every `type` is registered (built-in or via plugin).
4. `children` only contain allowed child types for the parent.
5. Required `props` are present for each node type.
6. No circular references in the tree.

## Versioning

Schema versions follow semver:

- **Major** — breaking node structure changes.
- **Minor** — new node types or optional fields.
- **Patch** — documentation or constraint clarifications.

Renderers and layout engines declare which schema versions they support.
