/**
 * @reportforge/templates
 *
 * Production-ready document templates for ReportForge.
 */

export {
  InvoiceTemplate,
  PurchaseOrderTemplate,
  QuotationTemplate,
  ReceiptTemplate,
  SalesReportTemplate,
  FinancialReportTemplate,
  InventoryReportTemplate,
} from './business.js';
export type {
  InvoiceData,
  PurchaseOrderData,
  QuotationData,
  ReceiptData,
  SalesReportData,
  FinancialReportData,
  InventoryReportData,
  LineItem,
  BusinessBranding,
} from './business.js';

export {
  StudentTranscriptTemplate,
  ReportCardTemplate,
  CertificateTemplate,
} from './education.js';
export type { StudentTranscriptData, ReportCardData, CertificateData, EducationBranding } from './education.js';

export {
  PatientReportTemplate,
  LabResultTemplate,
  PrescriptionTemplate,
} from './healthcare.js';
export type { PatientReportData, LabResultData, PrescriptionData, HealthcareBranding } from './healthcare.js';

export { PayslipTemplate, EmployeeSummaryTemplate } from './hr.js';
export type { PayslipData, EmployeeSummaryData, HRBranding } from './hr.js';

export { LetterTemplate, ResumeTemplate, CompanyProfileTemplate } from './general.js';
export type { LetterData, ResumeData, CompanyProfileData, GeneralBranding } from './general.js';

export { builtInTemplates, defaultTemplateRegistry } from './registry.js';

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

/** Official template API — one call to generate a professional document. */
export const Templates = {
  Invoice: InvoiceTemplate,
  PurchaseOrder: PurchaseOrderTemplate,
  Quotation: QuotationTemplate,
  Receipt: ReceiptTemplate,
  SalesReport: SalesReportTemplate,
  FinancialReport: FinancialReportTemplate,
  InventoryReport: InventoryReportTemplate,
  StudentTranscript: StudentTranscriptTemplate,
  ReportCard: ReportCardTemplate,
  Certificate: CertificateTemplate,
  PatientReport: PatientReportTemplate,
  LabResult: LabResultTemplate,
  Prescription: PrescriptionTemplate,
  Payslip: PayslipTemplate,
  EmployeeSummary: EmployeeSummaryTemplate,
  Letter: LetterTemplate,
  Resume: ResumeTemplate,
  CompanyProfile: CompanyProfileTemplate,
} as const;

export const PACKAGE_NAME = '@reportforge/templates' as const;

export function getPackageName(): typeof PACKAGE_NAME {
  return PACKAGE_NAME;
}

export type {
  TemplateBuilder,
  TemplateOptions,
  TemplateRegistry,
  TemplateResolver,
  BrandingConfig,
} from '@reportforge/templates-core';
