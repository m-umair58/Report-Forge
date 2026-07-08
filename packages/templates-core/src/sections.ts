import type { SectionBuilder } from '@reportforge/core';

import type { BrandingConfig, TemplateContext, TemplateOptions } from './types.js';

export interface ExecutiveSummaryData {
  readonly summary?: string;
  readonly highlights?: readonly { readonly label: string; readonly value: string; readonly trend?: string }[];
}

export function executiveSummarySection(
  ctx: TemplateContext<ExecutiveSummaryData, TemplateOptions>,
): void {
  ctx.section('Executive Summary', (s) => {
    if (ctx.data.summary !== undefined) {
      s.paragraph(ctx.data.summary);
    }
    for (const item of ctx.data.highlights ?? []) {
      s.summaryCard({ label: item.label, value: item.value, ...(item.trend !== undefined ? { trend: item.trend } : {}) });
    }
  }, ctx.data.summary !== undefined || (ctx.data.highlights?.length ?? 0) > 0);
}

export interface RevenueSectionData {
  readonly title?: string;
  readonly rows: readonly Readonly<Record<string, unknown>>[];
  readonly columns: readonly { readonly key: string; readonly title: string; readonly align?: 'left' | 'center' | 'right' }[];
}

export function revenueSection(
  ctx: TemplateContext<RevenueSectionData, TemplateOptions>,
  label = 'Revenue',
): void {
  ctx.section(label, (s) => {
    if (ctx.data.title !== undefined) s.subtitle(ctx.data.title);
    s.table({ columns: ctx.data.columns, rows: ctx.data.rows });
  }, ctx.data.rows.length > 0);
}

export interface SignatureSectionData {
  readonly signatory?: string;
  readonly title?: string;
  readonly date?: string;
}

export function signatureSection(ctx: TemplateContext<SignatureSectionData, TemplateOptions>): void {
  ctx.section('Signature', (s) => {
    s.paragraph('Authorized Signature:');
    s.paragraph('_'.repeat(40));
    if (ctx.data.signatory !== undefined) s.paragraph(ctx.data.signatory);
    if (ctx.data.title !== undefined) s.paragraph(ctx.data.title);
    if (ctx.data.date !== undefined) s.paragraph(`Date: ${ctx.data.date}`);
  }, ctx.data.signatory !== undefined);
}

export interface TermsSectionData {
  readonly terms?: readonly string[];
}

export function termsAndConditionsSection(ctx: TemplateContext<TermsSectionData, TemplateOptions>): void {
  ctx.section('Terms & Conditions', (s) => {
    for (const term of ctx.data.terms ?? []) {
      s.paragraph(`• ${term}`);
    }
  }, (ctx.data.terms?.length ?? 0) > 0);
}

export function companyInfoSection(branding: BrandingConfig, section: SectionBuilder): void {
  section.subtitle('Company Information');
  section.paragraph(branding.companyName);
  if (branding.address !== undefined) section.paragraph(branding.address);
  if (branding.email !== undefined) section.paragraph(`Email: ${branding.email}`);
  if (branding.phone !== undefined) section.paragraph(`Phone: ${branding.phone}`);
}

export function contactSection(branding: BrandingConfig, section: SectionBuilder): void {
  section.subtitle('Contact');
  if (branding.email !== undefined) section.paragraph(branding.email);
  if (branding.phone !== undefined) section.paragraph(branding.phone);
  if (branding.website !== undefined) section.paragraph(branding.website);
}
