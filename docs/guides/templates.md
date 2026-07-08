# Document Templates Guide

ReportForge templates provide production-ready document layouts built on the component system. Templates are **renderer-independent** — they produce Report DOM structures that flow through the same layout and PDF pipeline as hand-built reports.

## Quick start

```typescript
import { Templates } from '@reportforge/templates';

const report = Templates.Invoice.create({
  invoiceNumber: 'INV-2026-0042',
  billTo: 'Northwind Traders',
  invoiceDate: 'July 1, 2026',
  dueDate: 'July 31, 2026',
  items: [
    { description: 'Consulting', quantity: 40, unitPrice: 150, total: 6000 },
  ],
  subtotal: 6000,
  tax: 510,
  total: 6510,
});

await report.toPDF('invoice.pdf');
```

## Architecture

```
Templates.Invoice.create(data, options)
       ↓
TemplateResolver + TemplateContext
       ↓
ReportBuilder (Report DOM)
       ↓
LayoutEngine → DisplayList → PDF Renderer
```

Templates never render directly to PDF. They compose sections, tables, and summary cards through `@reportforge/core`.

## Packages

| Package | Purpose |
|---------|---------|
| `@reportforge/templates-core` | Template engine: registry, builder, context, validation, reusable sections |
| `@reportforge/templates` | Built-in templates and the `Templates` namespace API |

## Built-in templates

### Business

| Template | API | Description |
|----------|-----|-------------|
| Invoice | `Templates.Invoice` | Line items, totals, payment terms |
| Purchase Order | `Templates.PurchaseOrder` | Vendor procurement document |
| Quotation | `Templates.Quotation` | Sales quote with validity period |
| Receipt | `Templates.Receipt` | Payment confirmation |
| Sales Report | `Templates.SalesReport` | Executive summary + regional table |
| Financial Report | `Templates.FinancialReport` | Financial breakdown with totals |
| Inventory Report | `Templates.InventoryReport` | SKU-level stock levels |

### Education

| Template | API |
|----------|-----|
| Student Transcript | `Templates.StudentTranscript` |
| Report Card | `Templates.ReportCard` |
| Certificate | `Templates.Certificate` |

### Healthcare

| Template | API |
|----------|-----|
| Patient Report | `Templates.PatientReport` |
| Lab Result | `Templates.LabResult` |
| Prescription | `Templates.Prescription` (layout only) |

### HR

| Template | API |
|----------|-----|
| Payslip | `Templates.Payslip` |
| Employee Summary | `Templates.EmployeeSummary` |

### General

| Template | API |
|----------|-----|
| Letter | `Templates.Letter` |
| Resume | `Templates.Resume` |
| Company Profile | `Templates.CompanyProfile` |

## Customization

Pass options as the second argument:

```typescript
Templates.Invoice.create(data, {
  showLogo: true,
  showFooter: false,
  showHeader: true,
  showPageNumbers: true,
  currency: 'USD',
  locale: 'en-US',
  theme: CorporateTheme,
  watermark: false, // placeholder — rendering deferred
});
```

### Branding

Include branding in your data payload:

```typescript
Templates.Invoice.create({
  // ... invoice fields
  branding: {
    companyName: 'Acme Corp',
    logoSrc: '/assets/logo.png',
    primaryColor: '#1a1a2e',
    secondaryColor: '#555555',
    fontFamily: 'Helvetica',
    address: '123 Business Street',
    email: 'hello@acme.example',
    phone: '+1 555 0100',
    website: 'https://acme.example',
    footerText: 'Thank you for your business.',
  },
});
```

Branding merges in order: defaults → template defaults → data.branding.

### Theme inheritance

Templates accept a `theme` option and pass it to `Report.create()`. Theme tokens flow through layout and rendering like any other report.

## Reusable sections

`@reportforge/templates-core` exports section helpers used by built-in templates:

- `executiveSummarySection` — summary paragraph + highlight cards
- `revenueSection` — titled data table
- `signatureSection` — authorized signature block
- `termsAndConditionsSection` — bullet terms list
- `companyInfoSection` — company details block
- `contactSection` — email, phone, website

## Validation

Templates validate before building:

- **Required fields** — missing data throws with a clear error
- **Field types** — string, number, array, object checks
- **Branding** — company name, logo URL, hex colors
- **Unknown options** — unsupported option keys are rejected

```typescript
const result = Templates.Invoice.validate(data, { currency: 'USD' });
if (!result.valid) {
  console.error(result.errors);
}
```

## Registry

All built-in templates register automatically on import:

```typescript
import { defaultTemplateRegistry } from '@reportforge/templates';

defaultTemplateRegistry.list(); // ['certificate', 'company-profile', ...]
defaultTemplateRegistry.get('invoice');
```

Register custom templates with `defineTemplate`:

```typescript
import { defineTemplate, defaultTemplateRegistry } from '@reportforge/templates-core';

const MyTemplate = defineTemplate({
  id: 'my-template',
  name: 'My Template',
  description: 'Custom document',
  category: 'general',
  build(ctx) {
    ctx.builder.title('Hello');
  },
});

defaultTemplateRegistry.register(MyTemplate.definition);
```

## Examples

```bash
pnpm example invoice
pnpm example quotation
pnpm example financial-report
pnpm example certificate
pnpm example payslip
```

## Migration from manual reports

**Before** (manual builder):

```typescript
Report.create({ metadata: { title: 'Invoice' } })
  .title('Invoice INV-001')
  .section('Items', (s) => s.table({ columns, rows }));
```

**After** (template):

```typescript
Templates.Invoice.create({ invoiceNumber: 'INV-001', /* ... */ });
```

Benefits:

- Consistent header/footer/page numbers across documents
- Built-in validation for required business fields
- Shared section components (terms, signatures, summaries)
- Category-organized registry for discovery

Keep manual builders when you need fully custom one-off layouts. Use templates when generating standard business documents with minimal configuration.

## Out of scope (future milestones)

- Visual template editor
- Template marketplace
- Online editor
- Watermark rendering (option exists as placeholder)
