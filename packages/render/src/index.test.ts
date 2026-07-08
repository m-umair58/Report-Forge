import { describe, expect, it } from 'vitest';

import type { DisplayList } from '@reportforge/display-list';

import {
  displayCommandToOperations,
  displayListToRenderDocument,
  escapeHtml,
} from './convert.js';

describe('displayCommandToOperations', () => {
  it('converts draw-text to text operation', () => {
    const ops = displayCommandToOperations({
      kind: 'draw-text',
      sourceNodeId: 'n1',
      text: 'Hello',
      font: 'Helvetica',
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 1.2,
      color: '#000000',
      x: 10,
      y: 20,
      width: 100,
      height: 14,
      rotation: 0,
      opacity: 1,
      textAlign: 'left',
    });

    expect(ops).toHaveLength(1);
    expect(ops[0]?.type).toBe('text');
  });

  it('converts draw-rectangle to rectangle operation', () => {
    const ops = displayCommandToOperations({
      kind: 'draw-rectangle',
      sourceNodeId: 'n2',
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      fillColor: '#ffffff',
      borderColor: '#cccccc',
      borderWidth: 1,
      cornerRadius: 4,
      opacity: 1,
    });

    expect(ops[0]?.type).toBe('rectangle');
  });
});

describe('displayListToRenderDocument', () => {
  it('maps display list pages to render pages', () => {
    const displayList: DisplayList = {
      pages: [{
        pageNumber: 1,
        width: 595,
        height: 842,
        commands: [{
          kind: 'draw-text',
          sourceNodeId: 'title',
          text: 'Report',
          font: 'Helvetica',
          fontSize: 24,
          fontWeight: 'bold',
          lineHeight: 1.2,
          color: '#111111',
          x: 72,
          y: 72,
          width: 451,
          height: 30,
          rotation: 0,
          opacity: 1,
          textAlign: 'left',
        }],
      }],
      metadata: { title: 'Test' },
      commandCount: 1,
    };

    const doc = displayListToRenderDocument(displayList);
    expect(doc.pages).toHaveLength(1);
    expect(doc.pages[0]?.operations[0]?.type).toBe('text');
    expect(doc.metadata.title).toBe('Test');
  });
});

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('<script>"\'&</script>')).toBe('&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;');
  });
});
