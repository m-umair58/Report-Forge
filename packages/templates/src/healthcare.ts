import { defineTemplate, type BrandingConfig, type TemplateOptions } from '@reportforge/templates-core';

export interface HealthcareBranding extends Partial<BrandingConfig> {
  readonly facilityName?: string;
}

export interface PatientReportData {
  readonly patientName: string;
  readonly patientId: string;
  readonly date: string;
  readonly diagnosis: string;
  readonly notes: string;
  readonly vitals?: readonly { readonly name: string; readonly value: string }[];
  readonly branding?: HealthcareBranding;
}

export interface LabResultData {
  readonly patientName: string;
  readonly testDate: string;
  readonly tests: readonly { readonly test: string; readonly result: string; readonly reference: string; readonly flag?: string }[];
  readonly branding?: HealthcareBranding;
}

export interface PrescriptionData {
  readonly patientName: string;
  readonly date: string;
  readonly medications: readonly { readonly name: string; readonly dosage: string; readonly instructions: string }[];
  readonly physician: string;
  readonly branding?: HealthcareBranding;
}

export const PatientReportTemplate = defineTemplate<PatientReportData, TemplateOptions>({
  id: 'patient-report',
  name: 'Patient Report',
  description: 'Clinical patient summary report.',
  category: 'healthcare',
  fields: [
    { path: 'patientName', required: true, type: 'string' },
    { path: 'diagnosis', required: true, type: 'string' },
  ],
  defaultBranding: { companyName: 'Healthcare Facility' },
  build(ctx) {
    ctx.builder.title('Patient Report');
    ctx.builder.paragraph(`Patient: ${ctx.data.patientName} · ID: ${ctx.data.patientId}`);
    ctx.builder.paragraph(`Date: ${ctx.data.date}`);
    ctx.section('Diagnosis', (s) => s.paragraph(ctx.data.diagnosis));
    ctx.section('Clinical Notes', (s) => s.paragraph(ctx.data.notes));
    ctx.section('Vitals', (s) => {
      s.table({
        columns: [{ key: 'name', title: 'Vital' }, { key: 'value', title: 'Value' }],
        rows: (ctx.data.vitals ?? []) as unknown as readonly Readonly<Record<string, unknown>>[],
      });
    }, (ctx.data.vitals?.length ?? 0) > 0);
  },
  metadata: (data) => ({ title: `Patient Report — ${data.patientName}` }),
});

export const LabResultTemplate = defineTemplate<LabResultData, TemplateOptions>({
  id: 'lab-result',
  name: 'Lab Result',
  description: 'Laboratory test results report.',
  category: 'healthcare',
  fields: [{ path: 'patientName', required: true, type: 'string' }, { path: 'tests', required: true, type: 'array' }],
  build(ctx) {
    ctx.builder.title('Laboratory Results');
    ctx.builder.paragraph(`Patient: ${ctx.data.patientName}`);
    ctx.builder.paragraph(`Test Date: ${ctx.data.testDate}`);
    ctx.section('Results', (s) => {
      s.table({
        columns: [
          { key: 'test', title: 'Test' },
          { key: 'result', title: 'Result' },
          { key: 'reference', title: 'Reference Range' },
          { key: 'flag', title: 'Flag' },
        ],
        rows: ctx.data.tests as unknown as readonly Readonly<Record<string, unknown>>[],
      });
    });
  },
  metadata: (data) => ({ title: `Lab Results — ${data.patientName}` }),
});

export const PrescriptionTemplate = defineTemplate<PrescriptionData, TemplateOptions>({
  id: 'prescription',
  name: 'Prescription',
  description: 'Prescription layout (document structure only).',
  category: 'healthcare',
  fields: [
    { path: 'patientName', required: true, type: 'string' },
    { path: 'medications', required: true, type: 'array' },
    { path: 'physician', required: true, type: 'string' },
  ],
  build(ctx) {
    ctx.builder.title('Prescription');
    ctx.builder.paragraph(`Patient: ${ctx.data.patientName}`);
    ctx.builder.paragraph(`Date: ${ctx.data.date}`);
    ctx.section('Medications', (s) => {
      for (const med of ctx.data.medications) {
        s.paragraph(`${med.name} — ${med.dosage}`);
        s.paragraph(med.instructions);
        s.divider();
      }
    });
    ctx.builder.paragraph(`Prescribing Physician: ${ctx.data.physician}`);
  },
  metadata: (data) => ({ title: `Prescription — ${data.patientName}` }),
});
