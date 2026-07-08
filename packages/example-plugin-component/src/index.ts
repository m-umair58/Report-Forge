import { definePlugin } from '@reportforge/plugin-sdk';

export interface HighlightBoxConfig {
  readonly defaultColor?: string;
}

export const HighlightBoxPlugin = definePlugin<HighlightBoxConfig>({
  id: 'example-plugin-component',
  name: 'Highlight Box Component',
  version: '1.0.0',
  description: 'Registers a custom highlight-box component type.',
  author: 'ReportForge',
  license: 'MIT',
  keywords: ['component'],
  register(app) {
    app.components.register({
      type: 'highlight-box',
      allowedParents: ['report', 'section'],
      allowedChildren: [],
      requiredProps: ['text'],
      serialize: (component) => ({
        id: component.id,
        type: 'highlight-box',
        props: component.props,
        children: [],
      }),
    });
  },
});

export default HighlightBoxPlugin;
