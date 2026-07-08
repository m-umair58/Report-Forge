import {
  defineTemplate,
  executiveSummarySection,
  revenueSection,
  signatureSection,
  termsAndConditionsSection,
  type BrandingConfig,
  type TemplateOptions,
} from '@reportforge/templates-core';

export interface BusinessBranding extends Partial<BrandingConfig> {
  readonly companyName?: string;
}

export interface LineItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly total: number;
}

export interface InvoiceData {
  readonly invoiceNumber: string;
  readonly billTo: string;
  readonly invoiceDate: string;
  readonly dueDate: string;
  readonly items: readonly LineItem[];
  readonly subtotal: number;
  readonly tax: number;
  readonly total: number;
  readonly currency?: string;
  readonly terms?: readonly string[];
  readonly branding?: BusinessBranding;
}

export interface PurchaseOrderData {
  readonly poNumber: string;
  readonly vendor: string;
  readonly orderDate: string;
  readonly items: readonly LineItem[];
  readonly total: number;
  readonly branding?: BusinessBranding;
}

export interface QuotationData {
  readonly quoteNumber: string;
  readonly client: string;
  readonly validUntil: string;
  readonly items: readonly LineItem[];
  readonly total: number;
  readonly branding?: BusinessBranding;
}

export interface ReceiptData {
  readonly receiptNumber: string;
  readonly customer: string;
  readonly date: string;
  readonly amount: number;
  readonly paymentMethod: string;
  readonly branding?: BusinessBranding;
}

export interface SalesReportData {
  readonly period: string;
  readonly summary: string;
  readonly highlights: readonly { readonly label: string; readonly value: string; readonly trend?: string }[];
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly branding?: BusinessBranding;
}

export interface FinancialReportData {
  readonly period: string;
  readonly summary: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly totals?: readonly { readonly label: string; readonly value: string }[];
  readonly branding?: BusinessBranding;
}

export interface InventoryReportData {
  readonly asOfDate: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly branding?: BusinessBranding;
}

const lineItemColumns = [
  { key: 'description', title: 'Description' },
  { key: 'quantity', title: 'Qty', align: 'right' as const },
  { key: 'unitPrice', title: 'Unit Price', align: 'right' as const },
  { key: 'total', title: 'Total', align: 'right' as const },
];

export const InvoiceTemplate = defineTemplate<InvoiceData, TemplateOptions>({
  id: 'invoice',
  name: 'Invoice',
  description: 'Professional invoice with line items, totals, and payment terms.',
  category: 'business',
  fields: [
    { path: 'invoiceNumber', required: true, type: 'string' },
    { path: 'billTo', required: true, type: 'string' },
    { path: 'items', required: true, type: 'array' },
    { path: 'total', required: true, type: 'number' },
  ],
  build(ctx) {
    const currency = ctx.options.currency ?? ctx.data.currency ?? 'USD';
    ctx.builder.title(`Invoice ${ctx.data.invoiceNumber}`);
    ctx.builder.paragraph(`Bill To: ${ctx.data.billTo}`);
    ctx.builder.paragraph(`Invoice Date: ${ctx.data.invoiceDate} · Due: ${ctx.data.dueDate}`);
    ctx.builder.divider();
    ctx.section('Line Items', (s) => {
      s.table({ columns: lineItemColumns, rows: ctx.data.items as unknown as readonly Readonly<Record<string, unknown>>[] });
      s.summaryCard({ label: 'Subtotal', value: `${currency} ${ctx.data.subtotal.toFixed(2)}` });
      s.summaryCard({ label: 'Tax', value: `${currency} ${ctx.data.tax.toFixed(2)}` });
      s.summaryCard({ label: 'Total Due', value: `${currency} ${ctx.data.total.toFixed(2)}` });
    });
    termsAndConditionsSection({
      ...ctx,
      data: ctx.data.terms !== undefined ? { terms: ctx.data.terms } : {},
    });
  },
  metadata: (data) => ({ title: `Invoice ${data.invoiceNumber}`, subject: 'Invoice' }),
});

export const PurchaseOrderTemplate = defineTemplate<PurchaseOrderData, TemplateOptions>({
  id: 'purchase-order',
  name: 'Purchase Order',
  description: 'Purchase order document for vendor procurement.',
  category: 'business',
  fields: [
    { path: 'poNumber', required: true, type: 'string' },
    { path: 'vendor', required: true, type: 'string' },
    { path: 'items', required: true, type: 'array' },
  ],
  build(ctx) {
    ctx.builder.title(`Purchase Order ${ctx.data.poNumber}`);
    ctx.builder.paragraph(`Vendor: ${ctx.data.vendor}`);
    ctx.builder.paragraph(`Order Date: ${ctx.data.orderDate}`);
    ctx.section('Items', (s) => {
      s.table({ columns: lineItemColumns, rows: ctx.data.items as unknown as readonly Readonly<Record<string, unknown>>[] });
      s.summaryCard({ label: 'Total', value: String(ctx.data.total) });
    });
    signatureSection({ ...ctx, data: {} });
  },
  metadata: (data) => ({ title: `PO ${data.poNumber}` }),
});

export const QuotationTemplate = defineTemplate<QuotationData, TemplateOptions>({
  id: 'quotation',
  name: 'Quotation',
  description: 'Sales quotation with validity period and pricing.',
  category: 'business',
  fields: [
    { path: 'quoteNumber', required: true, type: 'string' },
    { path: 'client', required: true, type: 'string' },
    { path: 'items', required: true, type: 'array' },
  ],
  build(ctx) {
    ctx.builder.title(`Quotation ${ctx.data.quoteNumber}`);
    ctx.builder.paragraph(`Prepared for: ${ctx.data.client}`);
    ctx.builder.paragraph(`Valid until: ${ctx.data.validUntil}`);
    ctx.section('Quoted Items', (s) => {
      s.table({ columns: lineItemColumns, rows: ctx.data.items as unknown as readonly Readonly<Record<string, unknown>>[] });
      s.summaryCard({ label: 'Quoted Total', value: String(ctx.data.total) });
    });
    termsAndConditionsSection({ ...ctx, data: { terms: ['Prices valid until date shown.', 'Payment terms: Net 30.'] } });
  },
  metadata: (data) => ({ title: `Quotation ${data.quoteNumber}` }),
});

export const ReceiptTemplate = defineTemplate<ReceiptData, TemplateOptions>({
  id: 'receipt',
  name: 'Receipt',
  description: 'Payment receipt for customer transactions.',
  category: 'business',
  fields: [
    { path: 'receiptNumber', required: true, type: 'string' },
    { path: 'amount', required: true, type: 'number' },
  ],
  build(ctx) {
    const currency = ctx.options.currency ?? 'USD';
    ctx.builder.title(`Receipt ${ctx.data.receiptNumber}`);
    ctx.builder.paragraph(`Customer: ${ctx.data.customer}`);
    ctx.builder.paragraph(`Date: ${ctx.data.date}`);
    ctx.builder.summaryCard({ label: 'Amount Paid', value: `${currency} ${ctx.data.amount.toFixed(2)}` });
    ctx.builder.paragraph(`Payment Method: ${ctx.data.paymentMethod}`);
  },
  metadata: (data) => ({ title: `Receipt ${data.receiptNumber}` }),
});

export const SalesReportTemplate = defineTemplate<SalesReportData, TemplateOptions>({
  id: 'sales-report',
  name: 'Sales Report',
  description: 'Executive sales report with highlights and regional breakdown.',
  category: 'business',
  fields: [{ path: 'period', required: true, type: 'string' }],
  build(ctx) {
    ctx.builder.title(`Sales Report — ${ctx.data.period}`);
    executiveSummarySection({
      ...ctx,
      data: {
        ...(ctx.data.summary !== undefined ? { summary: ctx.data.summary } : {}),
        ...(ctx.data.highlights !== undefined ? { highlights: ctx.data.highlights } : {}),
      },
    });
    revenueSection(
      { ...ctx, data: { rows: ctx.data.rows, columns: [{ key: 'region', title: 'Region' }, { key: 'revenue', title: 'Revenue', align: 'right' }, { key: 'growth', title: 'Growth', align: 'right' }] } },
      'Regional Performance',
    );
  },
  metadata: (data) => ({ title: `Sales Report — ${data.period}` }),
});

export const FinancialReportTemplate = defineTemplate<FinancialReportData, TemplateOptions>({
  id: 'financial-report',
  name: 'Financial Report',
  description: 'Financial summary with tabular breakdown and totals.',
  category: 'business',
  fields: [{ path: 'period', required: true, type: 'string' }, { path: 'rows', required: true, type: 'array' }],
  build(ctx) {
    ctx.builder.title(`Financial Report — ${ctx.data.period}`);
    ctx.builder.paragraph(ctx.data.summary);
    revenueSection({
      ...ctx,
      data: {
        rows: ctx.data.rows,
        columns: [
          { key: 'category', title: 'Category' },
          { key: 'amount', title: 'Amount', align: 'right' },
        ],
      },
    });
    ctx.when((ctx.data.totals?.length ?? 0) > 0, () => {
      ctx.section('Totals', (s) => {
        for (const item of ctx.data.totals ?? []) {
          s.summaryCard({ label: item.label, value: item.value });
        }
      });
    });
  },
  metadata: (data) => ({ title: `Financial Report — ${data.period}` }),
});

export const InventoryReportTemplate = defineTemplate<InventoryReportData, TemplateOptions>({
  id: 'inventory-report',
  name: 'Inventory Report',
  description: 'Inventory status report with SKU-level detail.',
  category: 'business',
  fields: [{ path: 'asOfDate', required: true, type: 'string' }, { path: 'rows', required: true, type: 'array' }],
  build(ctx) {
    ctx.builder.title('Inventory Report');
    ctx.builder.paragraph(`As of ${ctx.data.asOfDate}`);
    revenueSection(
      {
        ...ctx,
        data: {
          rows: ctx.data.rows,
          columns: [
            { key: 'sku', title: 'SKU' },
            { key: 'name', title: 'Product' },
            { key: 'quantity', title: 'Qty', align: 'right' },
            { key: 'location', title: 'Location' },
          ],
        },
      },
      'Stock Levels',
    );
  },
  metadata: (data) => ({ title: `Inventory Report — ${data.asOfDate}` }),
});
