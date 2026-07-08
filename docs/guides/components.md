# Component Library Guide

The official component library lives in `@reportforge/components`. Components produce
**Report DOM descriptors** — they never render themselves.

## Installation

The package is included when you depend on `@reportforge/core`:

```typescript
import { Components } from '@reportforge/components';
// or
import { Components } from '@reportforge/core';
```

## Builder integration

Use `report.add()` with factory functions:

```typescript
import { Components } from '@reportforge/components';
import { Report } from '@reportforge/core';

const report = Report.create()
  .add(Components.Title({ text: 'Monthly Sales' }))
  .add(Components.Paragraph({ text: 'Summary...' }))
  .add(Components.Divider())
  .add(Components.SummaryCard({ title: 'Revenue', value: '$1.2M' }));
```

The fluent API (`.title()`, `.paragraph()`, etc.) remains fully supported.

## Composition

Nest components inside containers:

```typescript
.add(
  Components.Section({
    label: 'Overview',
    children: [
      Components.Title({ text: 'Results' }),
      Components.Paragraph({ text: 'Details below.' }),
      Components.SummaryCard({ label: 'Total', value: '$1.2M' }),
      Components.Divider(),
    ],
  }),
);
```

## Styling

All components accept `style`, `margin`, `padding`, `visibility`, and `id`:

```typescript
Components.Paragraph({
  text: 'Highlighted',
  style: {
    color: '#222',
    fontSize: 14,
    background: '#f5f5f5',
    borderRadius: 4,
    padding: 8,
    alignment: 'center',
  },
});
```

## Validation

Descriptors are validated when passed to `.add()`. For standalone validation:

```typescript
import { createDefaultRegistry, validateDescriptor } from '@reportforge/components';

const registry = createDefaultRegistry();
const result = validateDescriptor(Components.Paragraph({ text: 'OK' }), registry, 'section');
```

## Examples

```bash
pnpm example executive-summary
pnpm example dashboard
pnpm example company-profile
```

See [packages/components/README.md](../../packages/components/README.md) for the full component reference.
