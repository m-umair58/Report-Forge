import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { PDFDocument } from 'pdf-lib';
import { afterEach, describe, expect, it } from 'vitest';

import { Report } from './report.js';

const tempFiles: string[] = [];

function tempPdfPath(name: string): string {
  const path = join(tmpdir(), `reportforge-slice-${name}-${Date.now().toString()}.pdf`);
  tempFiles.push(path);
  return path;
}

afterEach(() => {
  for (const path of tempFiles) {
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }
  tempFiles.length = 0;
});

describe('vertical slice — report.toPDF()', () => {
  it('generates a valid PDF file from title, paragraph, and divider', async () => {
    const outputPath = tempPdfPath('hello');

    const report = Report.create({ metadata: { title: 'Hello ReportForge', author: 'Test' } })
      .title('Hello ReportForge')
      .paragraph('This is our first PDF.')
      .divider();

    await report.toPDF(outputPath);

    expect(existsSync(outputPath)).toBe(true);

    const bytes = readFileSync(outputPath);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
    expect(bytes.length).toBeGreaterThan(500);
  });

  it('produces a PDF with exactly one page', async () => {
    const outputPath = tempPdfPath('pages');

    const report = Report.create()
      .title('Page Count Test')
      .paragraph('Single page content.')
      .divider();

    await report.toPDF(outputPath);

    const bytes = readFileSync(outputPath);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it('embeds document metadata from report metadata', async () => {
    const outputPath = tempPdfPath('metadata');

    const report = Report.create({
      metadata: { title: 'Hello ReportForge', author: 'ReportForge Tests' },
    })
      .title('Hello ReportForge')
      .paragraph('Metadata test.')
      .divider();

    await report.toPDF(outputPath);

    const bytes = readFileSync(outputPath);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getTitle()).toBe('Hello ReportForge');
    expect(doc.getAuthor()).toBe('ReportForge Tests');
  });

  it('render() returns PDF bytes without writing a file', async () => {
    const report = Report.create().title('Render API').paragraph('Bytes test.').divider();

    const bytes = await report.render({ format: 'pdf' });
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('%PDF');
  });

  it('render() writes file when output path is provided', async () => {
    const outputPath = tempPdfPath('render-output');

    const report = Report.create().title('Render Output').paragraph('File write test.').divider();

    await report.render({ format: 'pdf', output: outputPath });
    expect(existsSync(outputPath)).toBe(true);
  });
});

describe('vertical slice — PDF snapshot', () => {
  it('matches expected PDF structure snapshot', async () => {
    const report = Report.create({ metadata: { title: 'Snapshot Test' } })
      .title('Hello ReportForge')
      .paragraph('This is our first PDF.')
      .divider();

    const bytes = await report.render({ format: 'pdf' });
    const doc = await PDFDocument.load(bytes);

    const snapshot = {
      header: String.fromCharCode(...bytes.slice(0, 4)),
      pageCount: doc.getPageCount(),
      title: doc.getTitle(),
      byteLength: bytes.length,
    };

    expect(snapshot.header).toBe('%PDF');
    expect(snapshot.pageCount).toBe(1);
    expect(snapshot.title).toBe('Snapshot Test');
    expect(snapshot.byteLength).toBeGreaterThan(500);
    expect(snapshot).toMatchSnapshot();
  });
});
