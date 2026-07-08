import type { InitOptions, ScaffoldTemplateId } from '../types.js';

function themeImport(theme: string): { importName: string; importPath: string } {
  const map: Record<string, { importName: string; importPath: string }> = {
    default: { importName: 'DefaultTheme', importPath: '@reportforge/themes' },
    corporate: { importName: 'CorporateTheme', importPath: '@reportforge/themes' },
    minimal: { importName: 'MinimalTheme', importPath: '@reportforge/themes' },
    dark: { importName: 'DarkTheme', importPath: '@reportforge/themes' },
    healthcare: { importName: 'HealthcareTheme', importPath: '@reportforge/themes' },
    financial: { importName: 'FinancialTheme', importPath: '@reportforge/themes' },
  };
  return map[theme] ?? map.default!;
}

function reportFile(template: ScaffoldTemplateId, theme: string): string {
  const { importName, importPath } = themeImport(theme);

  switch (template) {
    case 'invoice':
      return `import { Templates } from '@reportforge/templates';
import { ${importName} } from '${importPath}';

export function createReport() {
  return Templates.Invoice.create(
    {
      invoiceNumber: 'INV-001',
      billTo: 'Acme Corp · billing@acme.example',
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString(),
      items: [
        { description: 'Professional services', quantity: 1, unitPrice: 1000, total: 1000 },
      ],
      subtotal: 1000,
      tax: 80,
      total: 1080,
      currency: 'USD',
      terms: ['Payment due within 30 days.'],
      branding: {
        companyName: 'Your Company',
        address: '123 Main Street',
        footerText: 'Thank you for your business.',
      },
    },
    { theme: ${importName} },
  );
}
`;
    case 'sales-report':
      return `import { Templates } from '@reportforge/templates';
import { ${importName} } from '${importPath}';

export function createReport() {
  return Templates.SalesReport.create(
    {
      period: 'Q1 2026',
      summary: 'Revenue grew 12% quarter-over-quarter.',
      highlights: [
        { label: 'Total Revenue', value: '$125,000', trend: '+12%' },
        { label: 'New Accounts', value: '38', trend: '+5' },
      ],
      rows: [
        { region: 'North America', revenue: '$75,000', growth: '+14%' },
        { region: 'Europe', revenue: '$35,000', growth: '+9%' },
        { region: 'Asia Pacific', revenue: '$15,000', growth: '+11%' },
      ],
      branding: { companyName: 'Your Company' },
    },
    { theme: ${importName} },
  );
}
`;
    case 'dashboard':
      return `import { Report } from '@reportforge/core';
import { ${importName} } from '${importPath}';

export function createReport() {
  return Report.create({ metadata: { title: 'Dashboard' }, theme: ${importName} })
    .title('Executive Dashboard')
    .section((s) =>
      s
        .heading('Key Metrics')
        .paragraph('Revenue: $125,000 · Orders: 420 · Avg. order: $297.62')
        .heading('Highlights')
        .paragraph('North America leads growth at 12% month over month.'),
    );
}
`;
    case 'certificate':
      return `import { Templates } from '@reportforge/templates';
import { ${importName} } from '${importPath}';

export function createReport() {
  return Templates.Certificate.create(
    {
      recipientName: 'Jane Doe',
      achievement: 'Advanced Report Design',
      date: new Date().toLocaleDateString(),
      issuer: 'ReportForge Academy',
      branding: { companyName: 'ReportForge Academy' },
    },
    { theme: ${importName} },
  );
}
`;
    case 'financial-report':
      return `import { Templates } from '@reportforge/templates';
import { ${importName} } from '${importPath}';

export function createReport() {
  return Templates.FinancialReport.create(
    {
      period: 'Q1 2026',
      summary: 'Operating margin improved while maintaining steady cash flow.',
      rows: [
        { category: 'Revenue', amount: '$250,000' },
        { category: 'COGS', amount: '$90,000' },
        { category: 'Operating Expenses', amount: '$90,000' },
      ],
      totals: [
        { label: 'Net Income', value: '$70,000' },
        { label: 'Cash on Hand', value: '$420,000' },
      ],
      branding: { companyName: 'Your Company' },
    },
    { theme: ${importName} },
  );
}
`;
    case 'blank':
    default:
      return `import { Report } from '@reportforge/core';
import { ${importName} } from '${importPath}';

export function createReport() {
  return Report.create({ metadata: { title: 'Untitled Report' }, theme: ${importName} })
    .title('Untitled Report')
    .section((s) => s.paragraph('Start building your report here.'));
}
`;
  }
}

function packageJson(options: InitOptions): string {
  const ext = options.language === 'typescript' ? 'ts' : 'js';
  return JSON.stringify(
    {
      name: options.name,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        build: 'reportforge build',
        render: `reportforge render src/reports/main.${ext}`,
        preview: `reportforge preview src/reports/main.${ext}`,
        validate: 'reportforge validate',
      },
      dependencies: {
        '@reportforge/cli': 'latest',
        '@reportforge/core': 'latest',
        '@reportforge/templates': 'latest',
        '@reportforge/themes': 'latest',
      },
      ...(options.language === 'typescript'
        ? { devDependencies: { typescript: '^5.8.0' } }
        : {}),
    },
    null,
    2,
  );
}

function tsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        skipLibCheck: true,
        esModuleInterop: true,
      },
      include: ['src', 'reportforge.config.ts'],
    },
    null,
    2,
  );
}

function readme(options: InitOptions): string {
  return `# ${options.name}

ReportForge project scaffolded with the **${options.template}** template.

## Quick start

\`\`\`bash
${options.packageManager} install
${options.packageManager} run render
${options.packageManager} run preview
${options.packageManager} run validate
\`\`\`

## Commands

- \`reportforge render src/reports/main.ts\` — generate output
- \`reportforge preview src/reports/main.ts\` — open in browser or default app
- \`reportforge validate\` — check configuration and assets
- \`reportforge doctor\` — diagnose environment issues
`;
}

export function getScaffoldFiles(options: InitOptions): Record<string, string> {
  const ext = options.language === 'typescript' ? 'ts' : 'js';
  const configExt = options.language === 'typescript' ? 'ts' : 'js';
  const reportPath = `src/reports/main.${ext}`;

  const files: Record<string, string> = {
    'package.json': packageJson(options),
    [`reportforge.config.${configExt}`]: `export default {
  renderer: '${options.renderer}',
  theme: '${options.theme}',
  output: './dist',
  plugins: [],
  reports: ['./src/reports'],
};
`,
    [reportPath]: reportFile(options.template, options.theme),
    '.gitignore': 'node_modules/\ndist/\n*.pdf\n*.html\n*.svg\n',
    'README.md': readme(options),
  };

  if (options.language === 'typescript') {
    files['tsconfig.json'] = tsconfig();
  }

  return files;
}

export function getCreateReportFile(
  template: ScaffoldTemplateId,
  theme: string,
  fileName: string,
): Record<string, string> {
  return { [fileName]: reportFile(template, theme) };
}
