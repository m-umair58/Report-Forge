import { describe, expect, it } from 'vitest';

import type { DisplayList } from '@reportforge/display-list';

import { SvgRenderer } from './renderer.js';

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
        kind: 'draw-circle',
        sourceNodeId: 'dot',
        cx: 500,
        cy: 100,
        radius: 20,
        fillColor: '#2563eb',
        strokeColor: null,
        strokeWidth: 0,
        opacity: 1,
      },
      {
        kind: 'draw-path',
        sourceNodeId: 'chart',
        pathData: 'M 72 300 L 200 250 L 350 280 L 523 220',
        fillColor: null,
        strokeColor: '#2563eb',
        strokeWidth: 2,
        opacity: 1,
      },
    ],
  }],
  metadata: { title: 'Monthly Sales Report' },
  commandCount: 3,
};

describe('SvgRenderer', () => {
  it('generates valid SVG document', async () => {
    const renderer = new SvgRenderer();
    const svg = new TextDecoder().decode(await renderer.render(sampleDisplayList));
    expect(svg).toMatchSnapshot();
  });

  it('includes SVG primitives', async () => {
    const renderer = new SvgRenderer();
    const svg = new TextDecoder().decode(await renderer.render(sampleDisplayList));
    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('<text');
    expect(svg).toContain('<circle');
    expect(svg).toContain('<path');
  });
});
