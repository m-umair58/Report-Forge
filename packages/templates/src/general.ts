import {
  companyInfoSection,
  contactSection,
  defineTemplate,
  type BrandingConfig,
  type TemplateOptions,
} from '@reportforge/templates-core';

export interface GeneralBranding extends Partial<BrandingConfig> {}

export interface LetterData {
  readonly recipient: string;
  readonly subject: string;
  readonly body: readonly string[];
  readonly sender?: string;
  readonly date: string;
  readonly branding?: GeneralBranding;
}

export interface ResumeData {
  readonly name: string;
  readonly title: string;
  readonly summary: string;
  readonly experience: readonly { readonly company: string; readonly role: string; readonly period: string; readonly description: string }[];
  readonly skills: readonly string[];
  readonly branding?: GeneralBranding;
}

export interface CompanyProfileData {
  readonly about: string;
  readonly founded?: string;
  readonly employees?: string;
  readonly headquarters?: string;
  readonly branding?: GeneralBranding;
}

export const LetterTemplate = defineTemplate<LetterData, TemplateOptions>({
  id: 'letter',
  name: 'Letter',
  description: 'Formal business letter layout.',
  category: 'general',
  fields: [{ path: 'recipient', required: true, type: 'string' }, { path: 'body', required: true, type: 'array' }],
  build(ctx) {
    ctx.builder.paragraph(ctx.data.date);
    ctx.builder.paragraph(ctx.data.recipient);
    ctx.builder.title(ctx.data.subject);
    for (const paragraph of ctx.data.body) {
      ctx.builder.paragraph(paragraph);
    }
    ctx.when(ctx.data.sender !== undefined, () => {
      ctx.builder.paragraph('Sincerely,');
      ctx.builder.paragraph(ctx.data.sender ?? '');
    });
  },
  metadata: (data) => ({ title: data.subject }),
});

export const ResumeTemplate = defineTemplate<ResumeData, TemplateOptions>({
  id: 'resume',
  name: 'Resume',
  description: 'Professional resume with experience and skills.',
  category: 'general',
  fields: [{ path: 'name', required: true, type: 'string' }],
  defaultOptions: { showHeader: false },
  build(ctx) {
    ctx.builder.title(ctx.data.name);
    ctx.builder.subtitle(ctx.data.title);
    ctx.builder.paragraph(ctx.data.summary);
    ctx.section('Experience', (s) => {
      for (const job of ctx.data.experience) {
        s.subtitle(`${job.role} — ${job.company}`);
        s.paragraph(`${job.period}`);
        s.paragraph(job.description);
        s.divider();
      }
    });
    ctx.section('Skills', (s) => {
      s.paragraph(ctx.data.skills.join(' · '));
    });
  },
  metadata: (data) => ({ title: `Resume — ${data.name}` }),
});

export const CompanyProfileTemplate = defineTemplate<CompanyProfileData, TemplateOptions>({
  id: 'company-profile',
  name: 'Company Profile',
  description: 'Company overview with contact and info sections.',
  category: 'general',
  fields: [{ path: 'about', required: true, type: 'string' }],
  build(ctx) {
    ctx.builder.title(`${ctx.branding.companyName} — Company Profile`);
    ctx.builder.paragraph(ctx.data.about);
    ctx.section('Overview', (s) => {
      companyInfoSection(ctx.branding, s);
      if (ctx.data.founded !== undefined) s.paragraph(`Founded: ${ctx.data.founded}`);
      if (ctx.data.employees !== undefined) s.paragraph(`Employees: ${ctx.data.employees}`);
      if (ctx.data.headquarters !== undefined) s.paragraph(`Headquarters: ${ctx.data.headquarters}`);
    });
    ctx.section('Contact', (s) => contactSection(ctx.branding, s));
  },
  metadata: () => ({ title: 'Company Profile' }),
});
