import { defaultTemplateRegistry, type TemplateDefinition, type TemplateOptions } from '@reportforge/templates-core';

import {
  FinancialReportTemplate,
  InventoryReportTemplate,
  InvoiceTemplate,
  PurchaseOrderTemplate,
  QuotationTemplate,
  ReceiptTemplate,
  SalesReportTemplate,
} from './business.js';
import { CertificateTemplate, ReportCardTemplate, StudentTranscriptTemplate } from './education.js';
import { CompanyProfileTemplate, LetterTemplate, ResumeTemplate } from './general.js';
import { LabResultTemplate, PatientReportTemplate, PrescriptionTemplate } from './healthcare.js';
import { EmployeeSummaryTemplate, PayslipTemplate } from './hr.js';

export const builtInTemplates = [
  InvoiceTemplate,
  PurchaseOrderTemplate,
  QuotationTemplate,
  ReceiptTemplate,
  SalesReportTemplate,
  FinancialReportTemplate,
  InventoryReportTemplate,
  StudentTranscriptTemplate,
  ReportCardTemplate,
  CertificateTemplate,
  PatientReportTemplate,
  LabResultTemplate,
  PrescriptionTemplate,
  PayslipTemplate,
  EmployeeSummaryTemplate,
  LetterTemplate,
  ResumeTemplate,
  CompanyProfileTemplate,
] as const;

for (const template of builtInTemplates) {
  defaultTemplateRegistry.register(template.definition as TemplateDefinition<unknown, TemplateOptions>);
}

export { defaultTemplateRegistry };
