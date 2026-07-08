import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

import type { DisplayList, DisplayPage } from '@reportforge/display-list';
import type {
  DrawImageCommand,
  DrawLineCommand,
  DrawRectangleCommand,
  DrawTextCommand,
} from '@reportforge/display-list';

import { PdfRenderer } from './renderer.js';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/** 1×1 red PNG */
const TINY_PNG_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function makeTextCmd(overrides: Partial<DrawTextCommand> = {}): DrawTextCommand {
  return {
    kind: 'draw-text',
    sourceNodeId: 'n1',
    text: 'Hello, World!',
    font: 'Helvetica',
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.2,
    color: '#000000',
    x: 72,
    y: 72,
    width: 400,
    height: 20,
    rotation: 0,
    opacity: 1,
    textAlign: 'left',
    ...overrides,
  };
}

function makeRectCmd(overrides: Partial<DrawRectangleCommand> = {}): DrawRectangleCommand {
  return {
    kind: 'draw-rectangle',
    sourceNodeId: 'r1',
    x: 72,
    y: 100,
    width: 200,
    height: 50,
    fillColor: '#e0e0e0',
    borderColor: '#888888',
    borderWidth: 1,
    cornerRadius: 0,
    opacity: 1,
    ...overrides,
  };
}

function makeLineCmd(overrides: Partial<DrawLineCommand> = {}): DrawLineCommand {
  return {
    kind: 'draw-line',
    sourceNodeId: 'l1',
    x1: 72,
    y1: 200,
    x2: 523,
    y2: 200,
    color: '#cccccc',
    width: 0.5,
    opacity: 1,
    ...overrides,
  };
}

function makeImageCmd(overrides: Partial<DrawImageCommand> = {}): DrawImageCommand {
  return {
    kind: 'draw-image',
    sourceNodeId: 'img1',
    src: TINY_PNG_DATA_URI,
    alt: 'pixel',
    x: 72,
    y: 250,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    ...overrides,
  };
}

function makeDisplayList(
  commands: DisplayList['pages'][0]['commands'] = [],
  pages: DisplayPage[] | number = 1,
  metadata: Record<string, unknown> = {},
): DisplayList {
  const pageList: DisplayPage[] =
    typeof pages === 'number'
      ? Array.from({ length: pages }, (_, i) => ({
          pageNumber: i + 1,
          width: A4_WIDTH,
          height: A4_HEIGHT,
          commands: i === 0 ? commands : [makeTextCmd({ text: `Page ${(i + 1).toString()}` })],
        }))
      : pages;

  const commandCount = pageList.reduce((sum, p) => sum + p.commands.length, 0);

  return {
    pages: pageList,
    metadata,
    commandCount,
  };
}

async function pdfSnapshot(bytes: Uint8Array) {
  const doc = await PDFDocument.load(bytes);
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle(),
    author: doc.getAuthor(),
    subject: doc.getSubject(),
    creator: doc.getCreator(),
    producer: doc.getProducer(),
    sizeBucket: Math.floor(bytes.length / 500) * 500,
  };
}

describe('PDF renderer snapshots', () => {
  const renderer = new PdfRenderer();

  it('single page with text', async () => {
    const dl = makeDisplayList([makeTextCmd({ text: 'Snapshot Text' })], 1, {
      title: 'Single Page',
    });
    const bytes = await renderer.render(dl, { title: 'Single Page', author: 'Snapshot Tests' });
    await expect(pdfSnapshot(bytes)).resolves.toMatchSnapshot();
  });

  it('multi-page document', async () => {
    const dl = makeDisplayList([], 3, { title: 'Multi Page' });
    const bytes = await renderer.render(dl, { title: 'Multi Page' });
    await expect(pdfSnapshot(bytes)).resolves.toMatchSnapshot();
  });

  it('shapes — rectangles and lines', async () => {
    const dl = makeDisplayList(
      [
        makeRectCmd({ fillColor: '#ddeeff', borderColor: '#336699' }),
        makeRectCmd({ y: 160, fillColor: null, borderColor: '#ff0000', borderWidth: 2 }),
        makeLineCmd(),
        makeRectCmd({ y: 220, cornerRadius: 8, fillColor: '#f0f0f0', borderColor: '#999999' }),
      ],
      1,
    );
    const bytes = await renderer.render(dl);
    await expect(pdfSnapshot(bytes)).resolves.toMatchSnapshot();
  });

  it('embedded PNG image', async () => {
    const dl = makeDisplayList([makeImageCmd()], 1);
    const result = await renderer.renderWithDiagnostics(dl);
    expect(result.warnings.some((w) => w.includes('placeholder'))).toBe(false);
    await expect(pdfSnapshot(result.bytes)).resolves.toMatchSnapshot();
  });

  it('metadata fields', async () => {
    const dl = makeDisplayList([makeTextCmd()], 1, {
      title: 'Metadata Report',
      author: 'Jane Doe',
      subject: 'Snapshot metadata',
      keywords: ['test', 'snapshot'],
    });
    const bytes = await renderer.render(dl, {
      title: 'Metadata Report',
      author: 'Jane Doe',
      subject: 'Snapshot metadata',
      keywords: ['test', 'snapshot'],
      creator: 'ReportForge Snapshot Suite',
    });
    await expect(pdfSnapshot(bytes)).resolves.toMatchSnapshot();
  });

  it('multiple fonts', async () => {
    const dl = makeDisplayList([
      makeTextCmd({ text: 'Helvetica', font: 'Helvetica', fontWeight: 'normal' }),
      makeTextCmd({ text: 'Helvetica Bold', font: 'Helvetica', fontWeight: 'bold', y: 100 }),
      makeTextCmd({ text: 'Times Roman', font: 'Times-Roman', fontWeight: 'normal', y: 130 }),
      makeTextCmd({ text: 'Courier', font: 'Courier', fontWeight: 'normal', y: 160 }),
    ]);
    const bytes = await renderer.render(dl);
    await expect(pdfSnapshot(bytes)).resolves.toMatchSnapshot();
  });
});
