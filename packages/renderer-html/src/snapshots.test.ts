import { describe, expect, it } from 'vitest';

import type { DisplayList } from '@reportforge/display-list';

import { HtmlRenderer } from './renderer.js';

const sampleDisplayList: DisplayList = {
  pages: [{
    pageNumber: 1,
    width: 595,
    height: 842,
    commands: [
      {
        kind: 'draw-text',
        sourceNodeId: 'title',
        text: 'Monthly Sales Report',
        font: 'Helvetica',
        fontSize: 24,
        fontWeight: 'bold',
        lineHeight: 1.2,
        color: '#111827',
        x: 72,
        y: 72,
        width: 451,
        height: 30,
        rotation: 0,
        opacity: 1,
        textAlign: 'left',
      },
      {
        kind: 'draw-rectangle',
        sourceNodeId: 'card',
        x: 72,
        y: 120,
        width: 200,
        height: 80,
        fillColor: '#f3f4f6',
        borderColor: '#d1d5db',
        borderWidth: 1,
        cornerRadius: 8,
        opacity: 1,
      },
      {
        kind: 'draw-line',
        sourceNodeId: 'divider',
        x1: 72,
        y1: 220,
        x2: 523,
        y2: 220,
        color: '#d1d5db',
        width: 1,
        opacity: 1,
      },
    ],
  }],
  metadata: { title: 'Monthly Sales Report', author: 'ReportForge' },
  commandCount: 3,
};

describe('HtmlRenderer', () => {
  it('generates standalone HTML document', async () => {
    const renderer = new HtmlRenderer();
    const html = new TextDecoder().decode(await renderer.render(sampleDisplayList, { title: 'Monthly Sales Report' }));
    expect(html).toMatchSnapshot();
  });

  it('includes semantic structure', async () => {
    const renderer = new HtmlRenderer();
    const html = new TextDecoder().decode(await renderer.render(sampleDisplayList));
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<main class="rf-document"');
    expect(html).toContain('Monthly Sales Report');
    expect(html).toContain('class="rf-page"');
  });
});
