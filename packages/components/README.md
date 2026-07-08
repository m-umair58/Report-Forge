# Component Library (`@reportforge/components`)

The official ReportForge component library provides reusable, high-level business
components for building professional reports.

**Components do not render themselves.** Each factory function returns a
`ComponentDescriptor` — a blueprint for a Report DOM node. The Builder API
materialises descriptors into the component tree; layout and renderers handle
the rest.

## Quick start

```typescript
import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const report = Report.create()
  .add(Components.Title({ text: 'Monthly Sales' }))
  .add(Components.Paragraph({ text: 'Summary...' }))
  .add(Components.Divider())
  .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }));

await report.toPDF('report.pdf');
```

## Component categories

### Typography

| Component   | Factory                  | Required props |
| ----------- | ------------------------ | -------------- |
| Title       | `Components.Title()`       | `text`         |
| Subtitle    | `Components.Subtitle()`    | `text`         |
| Heading     | `Components.Heading()`     | `text`         |
| Paragraph   | `Components.Paragraph()`   | `text`         |
| Caption     | `Components.Caption()`     | `text`         |
| Label       | `Components.Label()`       | `text`         |

### Layout

| Component | Factory                | Children |
| --------- | ---------------------- | -------- |
| Section   | `Components.Section()` | Yes      |
| Container | `Components.Container()` | Yes    |
| Stack     | `Components.Stack()`   | Yes (vertical) |
| Row       | `Components.Row()`     | Yes (horizontal flow) |
| Spacer    | `Components.Spacer()`  | No       |
| Divider   | `Components.Divider()` | No       |

### Media

| Component | Factory              | Notes              |
| --------- | -------------------- | ------------------ |
| Image     | `Components.Image()` | `src` required   |
| Logo      | `Components.Logo()`  | Branded image slot |
| Icon      | `Components.Icon()`  | Placeholder only   |

### Business

| Component   | Factory                    |
| ----------- | -------------------------- |
| SummaryCard | `Components.SummaryCard()` |
| MetricCard  | `Components.MetricCard()`  |
| KPI         | `Components.KPI()`         |
| Badge       | `Components.Badge()`       |
| StatusPill  | `Components.StatusPill()`  |
| InfoBox     | `Components.InfoBox()`     |
| AlertBox    | `Components.AlertBox()`    |

### Placeholders (future milestones)

`Components.Table()` and `Components.Chart()` accept props but rendering is deferred.

## Common props

Every component supports:

- `id` — explicit node identifier
- `style` — renderer-independent style tokens
- `margin` / `padding` — spacing (number, string, or `{ top, right, bottom, left }`)
- `visibility` — `true`, `false`, `'visible'`, or `'hidden'`
- `children` — nested descriptors (container components)

## Styling

```typescript
Components.Paragraph({
  text: 'Highlighted metric',
  style: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: 'bold',
    background: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: 8,
    alignment: 'center',
    opacity: 0.95,
  },
});
```

## Composition

```typescript
Components.Section({
  label: 'Results',
  children: [
    Components.Title({ text: 'Q2 Highlights' }),
    Components.Paragraph({ text: 'Revenue grew 12%.' }),
    Components.SummaryCard({ label: 'Revenue', value: '$3.8M' }),
    Components.Divider(),
  ],
});
```

## Validation

Descriptors are validated when passed to `report.add()`:

- Required props present
- Invalid values (empty text, negative spacer size)
- Unsupported parent/child nesting
- Duplicate explicit IDs

Use `validateDescriptor()` and `validateDescriptors()` for standalone checks.

## Examples

```bash
pnpm example executive-summary
pnpm example dashboard
pnpm example company-profile
```
