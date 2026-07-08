import { defineTemplate, type BrandingConfig, type TemplateOptions } from '@reportforge/templates-core';

export interface HRBranding extends Partial<BrandingConfig> {
  readonly companyName?: string;
}

export interface PayslipData {
  readonly employeeName: string;
  readonly employeeId: string;
  readonly payPeriod: string;
  readonly grossPay: number;
  readonly deductions: readonly { readonly name: string; readonly amount: number }[];
  readonly netPay: number;
  readonly branding?: HRBranding;
}

export interface EmployeeSummaryData {
  readonly employeeName: string;
  readonly employeeId: string;
  readonly department: string;
  readonly role: string;
  readonly startDate: string;
  readonly summary: string;
  readonly metrics?: readonly { readonly label: string; readonly value: string }[];
  readonly branding?: HRBranding;
}

export const PayslipTemplate = defineTemplate<PayslipData, TemplateOptions>({
  id: 'payslip',
  name: 'Payslip',
  description: 'Employee payslip with earnings and deductions.',
  category: 'hr',
  fields: [
    { path: 'employeeName', required: true, type: 'string' },
    { path: 'netPay', required: true, type: 'number' },
  ],
  build(ctx) {
    const currency = ctx.options.currency ?? 'USD';
    ctx.builder.title('Payslip');
    ctx.builder.paragraph(`Employee: ${ctx.data.employeeName} (${ctx.data.employeeId})`);
    ctx.builder.paragraph(`Pay Period: ${ctx.data.payPeriod}`);
    ctx.section('Earnings', (s) => {
      s.summaryCard({ label: 'Gross Pay', value: `${currency} ${ctx.data.grossPay.toFixed(2)}` });
    });
    ctx.section('Deductions', (s) => {
      s.table({
        columns: [{ key: 'name', title: 'Deduction' }, { key: 'amount', title: 'Amount', align: 'right' }],
        rows: ctx.data.deductions as unknown as readonly Readonly<Record<string, unknown>>[],
      });
    });
    ctx.builder.summaryCard({ label: 'Net Pay', value: `${currency} ${ctx.data.netPay.toFixed(2)}` });
  },
  metadata: (data) => ({ title: `Payslip — ${data.employeeName}` }),
});

export const EmployeeSummaryTemplate = defineTemplate<EmployeeSummaryData, TemplateOptions>({
  id: 'employee-summary',
  name: 'Employee Summary',
  description: 'Employee profile and performance summary.',
  category: 'hr',
  fields: [{ path: 'employeeName', required: true, type: 'string' }],
  build(ctx) {
    ctx.builder.title('Employee Summary');
    ctx.builder.paragraph(`${ctx.data.employeeName} · ${ctx.data.role}`);
    ctx.builder.paragraph(`Department: ${ctx.data.department} · ID: ${ctx.data.employeeId}`);
    ctx.builder.paragraph(`Start Date: ${ctx.data.startDate}`);
    ctx.section('Overview', (s) => s.paragraph(ctx.data.summary));
    ctx.section('Key Metrics', (s) => {
      for (const metric of ctx.data.metrics ?? []) {
        s.summaryCard({ label: metric.label, value: metric.value });
      }
    }, (ctx.data.metrics?.length ?? 0) > 0);
  },
  metadata: (data) => ({ title: `Employee Summary — ${data.employeeName}` }),
});
