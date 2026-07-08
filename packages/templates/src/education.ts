import { defineTemplate, signatureSection, type BrandingConfig, type TemplateOptions } from '@reportforge/templates-core';

export interface EducationBranding extends Partial<BrandingConfig> {
  readonly institutionName?: string;
}

export interface StudentTranscriptData {
  readonly studentName: string;
  readonly studentId: string;
  readonly program: string;
  readonly courses: readonly { readonly code: string; readonly name: string; readonly grade: string; readonly credits: number }[];
  readonly gpa: number;
  readonly branding?: EducationBranding;
}

export interface ReportCardData {
  readonly studentName: string;
  readonly gradeLevel: string;
  readonly term: string;
  readonly subjects: readonly { readonly subject: string; readonly grade: string; readonly comments?: string }[];
  readonly branding?: EducationBranding;
}

export interface CertificateData {
  readonly recipientName: string;
  readonly achievement: string;
  readonly date: string;
  readonly issuer?: string;
  readonly branding?: EducationBranding;
}

export const StudentTranscriptTemplate = defineTemplate<StudentTranscriptData, TemplateOptions>({
  id: 'student-transcript',
  name: 'Student Transcript',
  description: 'Academic transcript with course history and GPA.',
  category: 'education',
  fields: [
    { path: 'studentName', required: true, type: 'string' },
    { path: 'courses', required: true, type: 'array' },
  ],
  defaultBranding: { companyName: 'Academic Institution' },
  build(ctx) {
    ctx.builder.title('Official Transcript');
    ctx.builder.paragraph(`Student: ${ctx.data.studentName} (${ctx.data.studentId})`);
    ctx.builder.paragraph(`Program: ${ctx.data.program}`);
    ctx.section('Course History', (s) => {
      s.table({
        columns: [
          { key: 'code', title: 'Code' },
          { key: 'name', title: 'Course' },
          { key: 'grade', title: 'Grade', align: 'center' },
          { key: 'credits', title: 'Credits', align: 'right' },
        ],
        rows: ctx.data.courses as unknown as readonly Readonly<Record<string, unknown>>[],
      });
      s.summaryCard({ label: 'Cumulative GPA', value: ctx.data.gpa.toFixed(2) });
    });
  },
  metadata: (data) => ({ title: `Transcript — ${data.studentName}` }),
});

export const ReportCardTemplate = defineTemplate<ReportCardData, TemplateOptions>({
  id: 'report-card',
  name: 'Report Card',
  description: 'Student report card with subject grades and comments.',
  category: 'education',
  fields: [{ path: 'studentName', required: true, type: 'string' }, { path: 'subjects', required: true, type: 'array' }],
  build(ctx) {
    ctx.builder.title('Report Card');
    ctx.builder.paragraph(`Student: ${ctx.data.studentName}`);
    ctx.builder.paragraph(`Grade Level: ${ctx.data.gradeLevel} · Term: ${ctx.data.term}`);
    ctx.section('Grades', (s) => {
      s.table({
        columns: [
          { key: 'subject', title: 'Subject' },
          { key: 'grade', title: 'Grade', align: 'center' },
          { key: 'comments', title: 'Comments' },
        ],
        rows: ctx.data.subjects as unknown as readonly Readonly<Record<string, unknown>>[],
      });
    });
  },
  metadata: (data) => ({ title: `Report Card — ${data.studentName}` }),
});

export const CertificateTemplate = defineTemplate<CertificateData, TemplateOptions>({
  id: 'certificate',
  name: 'Certificate',
  description: 'Achievement certificate with signature block.',
  category: 'education',
  fields: [{ path: 'recipientName', required: true, type: 'string' }, { path: 'achievement', required: true, type: 'string' }],
  defaultOptions: { showHeader: false },
  build(ctx) {
    ctx.builder.title('Certificate of Achievement');
    ctx.builder.paragraph(`This certifies that`);
    ctx.builder.title(ctx.data.recipientName);
    ctx.builder.paragraph(`has successfully completed ${ctx.data.achievement}.`);
    ctx.builder.paragraph(`Awarded on ${ctx.data.date}`);
    signatureSection({
      ...ctx,
      data: { signatory: ctx.data.issuer ?? ctx.branding.companyName, date: ctx.data.date },
    });
  },
  metadata: (data) => ({ title: `Certificate — ${data.recipientName}` }),
});
