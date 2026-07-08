import { describe, expect, it } from 'vitest';

import { builtInTemplates, Templates } from './index.js';
import {
  sampleCertificateData,
  sampleCompanyProfileData,
  sampleEmployeeSummaryData,
  sampleFinancialReportData,
  sampleInventoryReportData,
  sampleInvoiceData,
  sampleLabResultData,
  sampleLetterData,
  samplePatientReportData,
  samplePayslipData,
  samplePrescriptionData,
  samplePurchaseOrderData,
  sampleQuotationData,
  sampleReceiptData,
  sampleReportCardData,
  sampleResumeData,
  sampleSalesReportData,
  sampleStudentTranscriptData,
} from './fixtures.js';

const stableOptions = {
  showHeader: false,
  showFooter: false,
  showPageNumbers: false,
} as const;

/** Strip timestamp segments from node IDs so snapshots stay deterministic. */
function stableSchema(report: { toJSON(): unknown }): unknown {
  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value.map(walk);
    }
    if (value !== null && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const normalized: Record<string, unknown> = {};
      for (const [key, entry] of Object.entries(record)) {
        if (key === 'id' && typeof entry === 'string') {
          normalized[key] = entry.replace(/^([a-z-]+)-[a-z0-9]+-([a-z0-9]+)$/i, '$1-snapshot-$2');
        } else {
          normalized[key] = walk(entry);
        }
      }
      return normalized;
    }
    return value;
  };

  return walk(report.toJSON());
}

describe('Templates namespace', () => {
  it('exposes all built-in templates', () => {
    expect(Object.keys(Templates)).toHaveLength(18);
    expect(builtInTemplates).toHaveLength(18);
  });

  it('Invoice.create generates a report schema', () => {
    const report = Templates.Invoice.create(sampleInvoiceData, stableOptions);
    expect(report.toJSON().metadata.title).toBe('Invoice INV-2026-0042');
  });
});

describe('template layout snapshots', () => {
  it('Invoice', () => {
    expect(stableSchema(Templates.Invoice.create(sampleInvoiceData, stableOptions))).toMatchSnapshot();
  });

  it('PurchaseOrder', () => {
    expect(stableSchema(Templates.PurchaseOrder.create(samplePurchaseOrderData, stableOptions))).toMatchSnapshot();
  });

  it('Quotation', () => {
    expect(stableSchema(Templates.Quotation.create(sampleQuotationData, stableOptions))).toMatchSnapshot();
  });

  it('Receipt', () => {
    expect(stableSchema(Templates.Receipt.create(sampleReceiptData, stableOptions))).toMatchSnapshot();
  });

  it('SalesReport', () => {
    expect(stableSchema(Templates.SalesReport.create(sampleSalesReportData, stableOptions))).toMatchSnapshot();
  });

  it('FinancialReport', () => {
    expect(stableSchema(Templates.FinancialReport.create(sampleFinancialReportData, stableOptions))).toMatchSnapshot();
  });

  it('InventoryReport', () => {
    expect(stableSchema(Templates.InventoryReport.create(sampleInventoryReportData, stableOptions))).toMatchSnapshot();
  });

  it('StudentTranscript', () => {
    expect(stableSchema(Templates.StudentTranscript.create(sampleStudentTranscriptData, stableOptions))).toMatchSnapshot();
  });

  it('ReportCard', () => {
    expect(stableSchema(Templates.ReportCard.create(sampleReportCardData, stableOptions))).toMatchSnapshot();
  });

  it('Certificate', () => {
    expect(stableSchema(Templates.Certificate.create(sampleCertificateData, stableOptions))).toMatchSnapshot();
  });

  it('PatientReport', () => {
    expect(stableSchema(Templates.PatientReport.create(samplePatientReportData, stableOptions))).toMatchSnapshot();
  });

  it('LabResult', () => {
    expect(stableSchema(Templates.LabResult.create(sampleLabResultData, stableOptions))).toMatchSnapshot();
  });

  it('Prescription', () => {
    expect(stableSchema(Templates.Prescription.create(samplePrescriptionData, stableOptions))).toMatchSnapshot();
  });

  it('Payslip', () => {
    expect(stableSchema(Templates.Payslip.create(samplePayslipData, stableOptions))).toMatchSnapshot();
  });

  it('EmployeeSummary', () => {
    expect(stableSchema(Templates.EmployeeSummary.create(sampleEmployeeSummaryData, stableOptions))).toMatchSnapshot();
  });

  it('Letter', () => {
    expect(stableSchema(Templates.Letter.create(sampleLetterData, stableOptions))).toMatchSnapshot();
  });

  it('Resume', () => {
    expect(stableSchema(Templates.Resume.create(sampleResumeData, stableOptions))).toMatchSnapshot();
  });

  it('CompanyProfile', () => {
    expect(stableSchema(Templates.CompanyProfile.create(sampleCompanyProfileData, stableOptions))).toMatchSnapshot();
  });
});

describe('template validation', () => {
  it('rejects missing required invoice fields', () => {
    expect(() => Templates.Invoice.create({} as typeof sampleInvoiceData)).toThrow(/validation failed/i);
  });

  it('validates template options', () => {
    const result = Templates.Invoice.validate(sampleInvoiceData, { unknownOption: true } as never);
    expect(result.valid).toBe(false);
  });
});
