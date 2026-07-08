import type {
  FinancialReportData,
  InventoryReportData,
  InvoiceData,
  LineItem,
  PurchaseOrderData,
  QuotationData,
  ReceiptData,
  SalesReportData,
} from './business.js';
import type { CertificateData, ReportCardData, StudentTranscriptData } from './education.js';
import type { CompanyProfileData, LetterData, ResumeData } from './general.js';
import type { LabResultData, PatientReportData, PrescriptionData } from './healthcare.js';
import type { EmployeeSummaryData, PayslipData } from './hr.js';

const sampleBranding = {
  companyName: 'Acme Corp',
  address: '123 Business Street, San Francisco, CA',
  email: 'hello@acme.example',
  phone: '+1 555 0100',
  website: 'https://acme.example',
  footerText: 'Thank you for your business.',
} as const;

const sampleItems: readonly LineItem[] = [
  { description: 'Consulting — Q2 migration', quantity: 40, unitPrice: 150, total: 6000 },
  { description: 'Platform support', quantity: 1, unitPrice: 6400, total: 6400 },
];

export const sampleInvoiceData: InvoiceData = {
  invoiceNumber: 'INV-2026-0042',
  billTo: 'Northwind Traders · accounts@northwind.example',
  invoiceDate: 'July 1, 2026',
  dueDate: 'July 31, 2026',
  items: sampleItems,
  subtotal: 12400,
  tax: 1054,
  total: 13454,
  currency: 'USD',
  terms: ['Payment due within 30 days.', 'Late payments subject to 1.5% monthly interest.'],
  branding: sampleBranding,
};

export const samplePurchaseOrderData: PurchaseOrderData = {
  poNumber: 'PO-8842',
  vendor: 'Global Supplies Inc.',
  orderDate: 'June 15, 2026',
  items: sampleItems,
  total: 12400,
  branding: sampleBranding,
};

export const sampleQuotationData: QuotationData = {
  quoteNumber: 'QT-2026-118',
  client: 'Contoso Ltd.',
  validUntil: 'August 15, 2026',
  items: sampleItems,
  total: 12400,
  branding: sampleBranding,
};

export const sampleReceiptData: ReceiptData = {
  receiptNumber: 'RC-9912',
  customer: 'Jane Cooper',
  date: 'July 2, 2026',
  amount: 13454,
  paymentMethod: 'Wire Transfer',
  branding: sampleBranding,
};

export const sampleSalesReportData: SalesReportData = {
  period: 'Q2 2026',
  summary: 'Revenue grew 12% quarter-over-quarter driven by enterprise expansion.',
  highlights: [
    { label: 'Total Revenue', value: '$4.2M', trend: '+12%' },
    { label: 'New Accounts', value: '38', trend: '+5' },
  ],
  rows: [
    { region: 'North America', revenue: '$2.1M', growth: '+14%' },
    { region: 'EMEA', revenue: '$1.4M', growth: '+9%' },
    { region: 'APAC', revenue: '$700K', growth: '+11%' },
  ],
  branding: sampleBranding,
};

export const sampleFinancialReportData: FinancialReportData = {
  period: 'FY 2026 H1',
  summary: 'Operating margin improved to 18.4% while maintaining steady cash flow.',
  rows: [
    { category: 'Revenue', amount: '$8.4M' },
    { category: 'COGS', amount: '$3.1M' },
    { category: 'Operating Expenses', amount: '$2.8M' },
  ],
  totals: [
    { label: 'Net Income', value: '$1.54M' },
    { label: 'EBITDA', value: '$2.1M' },
  ],
  branding: sampleBranding,
};

export const sampleInventoryReportData: InventoryReportData = {
  asOfDate: 'July 1, 2026',
  rows: [
    { sku: 'SKU-001', name: 'Widget A', quantity: 420, location: 'Warehouse A' },
    { sku: 'SKU-002', name: 'Widget B', quantity: 88, location: 'Warehouse B' },
  ],
  branding: sampleBranding,
};

export const sampleStudentTranscriptData: StudentTranscriptData = {
  studentName: 'Alex Rivera',
  studentId: 'STU-4421',
  program: 'Computer Science',
  courses: [
    { code: 'CS101', name: 'Intro to Programming', grade: 'A', credits: 3 },
    { code: 'CS220', name: 'Data Structures', grade: 'A-', credits: 4 },
  ],
  gpa: 3.85,
  branding: { companyName: 'ReportForge University' },
};

export const sampleReportCardData: ReportCardData = {
  studentName: 'Alex Rivera',
  gradeLevel: '10th Grade',
  term: 'Spring 2026',
  subjects: [
    { subject: 'Mathematics', grade: 'A', comments: 'Excellent problem solving.' },
    { subject: 'English', grade: 'B+', comments: 'Strong analytical writing.' },
  ],
  branding: { companyName: 'ReportForge High School' },
};

export const sampleCertificateData: CertificateData = {
  recipientName: 'Alex Rivera',
  achievement: 'Advanced Web Development',
  date: 'June 30, 2026',
  issuer: 'Dr. Sarah Chen, Dean',
  branding: { companyName: 'ReportForge Institute' },
};

export const samplePatientReportData: PatientReportData = {
  patientName: 'Jordan Lee',
  patientId: 'PAT-7782',
  date: 'July 3, 2026',
  diagnosis: 'Seasonal allergic rhinitis',
  notes: 'Patient responding well to prescribed antihistamine regimen.',
  vitals: [
    { name: 'Blood Pressure', value: '118/76 mmHg' },
    { name: 'Heart Rate', value: '72 bpm' },
  ],
  branding: { companyName: 'ReportForge Medical Center' },
};

export const sampleLabResultData: LabResultData = {
  patientName: 'Jordan Lee',
  testDate: 'July 3, 2026',
  tests: [
    { test: 'Glucose', result: '92 mg/dL', reference: '70–99 mg/dL' },
    { test: 'Cholesterol', result: '185 mg/dL', reference: '<200 mg/dL', flag: 'Normal' },
  ],
  branding: { companyName: 'ReportForge Labs' },
};

export const samplePrescriptionData: PrescriptionData = {
  patientName: 'Jordan Lee',
  date: 'July 3, 2026',
  medications: [
    { name: 'Loratadine', dosage: '10mg', instructions: 'Take once daily with water.' },
  ],
  physician: 'Dr. Emily Park',
  branding: { companyName: 'ReportForge Clinic' },
};

export const samplePayslipData: PayslipData = {
  employeeName: 'Sam Taylor',
  employeeId: 'EMP-2044',
  payPeriod: 'June 1–30, 2026',
  grossPay: 8500,
  deductions: [
    { name: 'Federal Tax', amount: 1200 },
    { name: 'Health Insurance', amount: 320 },
  ],
  netPay: 6980,
  branding: sampleBranding,
};

export const sampleEmployeeSummaryData: EmployeeSummaryData = {
  employeeName: 'Sam Taylor',
  employeeId: 'EMP-2044',
  department: 'Engineering',
  role: 'Senior Software Engineer',
  startDate: 'March 2022',
  summary: 'Leads platform reliability initiatives and mentors junior engineers.',
  metrics: [
    { label: 'Projects Delivered', value: '6' },
    { label: 'Team Satisfaction', value: '4.8/5' },
  ],
  branding: sampleBranding,
};

export const sampleLetterData: LetterData = {
  recipient: 'Ms. Dana Brooks\nDirector of Operations\nContoso Ltd.',
  subject: 'Partnership Proposal',
  body: [
    'Thank you for the productive meeting last week.',
    'We would like to propose a strategic partnership to expand our shared market reach.',
  ],
  sender: 'Jordan Kim, VP Sales',
  date: 'July 8, 2026',
  branding: sampleBranding,
};

export const sampleResumeData: ResumeData = {
  name: 'Jordan Kim',
  title: 'Senior Product Manager',
  summary: 'Product leader with 10+ years building B2B SaaS platforms.',
  experience: [
    {
      company: 'Acme Corp',
      role: 'Senior Product Manager',
      period: '2021–Present',
      description: 'Owns roadmap for analytics suite serving 2,000+ enterprise customers.',
    },
  ],
  skills: ['Product Strategy', 'Roadmapping', 'SQL', 'User Research'],
  branding: sampleBranding,
};

export const sampleCompanyProfileData: CompanyProfileData = {
  about: 'Acme Corp builds document automation tools for modern businesses.',
  founded: '2018',
  employees: '250+',
  headquarters: 'San Francisco, CA',
  branding: sampleBranding,
};
