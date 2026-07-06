import { describe, expect, it } from 'vitest';

import type { IComponent, IRenderer, ITheme } from './index.js';
import { getPackageName, PACKAGE_NAME } from './index.js';

describe('@reportforge/shared', () => {
  it('exports the package identifier', () => {
    expect(PACKAGE_NAME).toBe('@reportforge/shared');
    expect(getPackageName()).toBe('@reportforge/shared');
  });

  it('exports contract interfaces as types', () => {
    const component: IComponent = {
      type: 'title',
      id: 'test-id',
      props: { text: 'Test' },
      children: [],
    };

    const theme: ITheme = {
      name: 'default',
      tokens: {
        colors: {
          primary: '#000000',
          secondary: '#666666',
          text: '#000000',
          textMuted: '#999999',
          background: '#ffffff',
          border: '#cccccc',
          accent: '#0066cc',
          error: '#cc0000',
          success: '#00cc00',
        },
        typography: {
          fontFamily: 'Inter',
          fontFamilyMono: 'monospace',
          fontSize: 12,
          fontSizeSmall: 10,
          fontSizeLarge: 14,
          fontSizeTitle: 24,
          fontSizeSubtitle: 18,
          lineHeight: 1.5,
          fontWeightNormal: 400,
          fontWeightBold: 700,
        },
        spacing: {
          unit: 4,
          section: 24,
          paragraph: 12,
          title: 16,
          table: 16,
          component: 8,
          pageMarginTop: 40,
          pageMarginBottom: 40,
          pageMarginLeft: 40,
          pageMarginRight: 40,
        },
        borders: {
          width: 1,
          color: '#cccccc',
          radius: 4,
          style: 'solid',
        },
        components: {
          title: {},
          subtitle: {},
          paragraph: {},
          table: {},
          header: {},
          footer: {},
          summaryCard: {},
          divider: {},
        },
        page: {
          size: 'A4',
          orientation: 'portrait',
          marginTop: 40,
          marginBottom: 40,
          marginLeft: 40,
          marginRight: 40,
        },
      },
    };

    const renderer: IRenderer = {
      name: 'test',
      mimeTypes: ['application/test'],
      render: () => Promise.resolve(new Uint8Array()),
    };

    expect(component.type).toBe('title');
    expect(theme.name).toBe('default');
    expect(renderer.name).toBe('test');
  });
});
