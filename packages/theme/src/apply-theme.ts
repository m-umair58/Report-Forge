import type { IReportNode, LayoutElement, LayoutOutput, LayoutPage } from '@reportforge/shared';

import { StyleResolver, resolvedStyleToRecord } from './resolver.js';
import type { Theme } from './types.js';

const resolver = new StyleResolver();

function sectionThemeFromProps(props: Readonly<Record<string, unknown>>, globalTheme: Theme, themes: Map<string, Theme>): Theme | undefined {
  const themeName = props['theme'];
  if (typeof themeName !== 'string') return undefined;
  return themes.get(themeName) ?? (themeName === globalTheme.name ? globalTheme : undefined);
}

function collectSectionThemes(node: IReportNode, globalTheme: Theme, themes: Map<string, Theme>): Map<string, Theme | undefined> {
  const map = new Map<string, Theme | undefined>();

  function walk(current: IReportNode, activeSectionTheme?: Theme): void {
    let sectionTheme = activeSectionTheme;
    if (current.type === 'section') {
      sectionTheme = sectionThemeFromProps(current.props, globalTheme, themes) ?? activeSectionTheme;
    }

    if (current.type !== 'report') {
      map.set(current.id, sectionTheme);
    }

    for (const child of current.children) {
      walk(child, sectionTheme);
    }
  }

  walk(node);
  return map;
}

function resolveElementStyle(
  element: LayoutElement,
  globalTheme: Theme,
  sectionThemes: Map<string, Theme | undefined>,
  nodeProps: Readonly<Record<string, unknown>> | undefined,
): LayoutElement {
  const sectionTheme = sectionThemes.get(element.nodeId);
  const resolved = resolver.resolve({
    componentType: element.type,
    globalTheme,
    ...(sectionTheme !== undefined ? { sectionTheme } : {}),
    ...(element.style !== undefined ? { localStyle: element.style } : {}),
    ...(nodeProps !== undefined ? { propOverrides: nodeProps } : {}),
  });

  return {
    ...element,
    style: {
      ...element.style,
      ...resolvedStyleToRecord(resolved),
    },
  };
}

function indexNodes(root: IReportNode): Map<string, IReportNode> {
  const map = new Map<string, IReportNode>();
  function walk(node: IReportNode): void {
    map.set(node.id, node);
    for (const child of node.children) {
      walk(child);
    }
  }
  walk(root);
  return map;
}

/** Applies resolved theme styles to all layout elements. */
export function applyThemeToLayout(
  layout: LayoutOutput,
  globalTheme: Theme,
  root: IReportNode,
  namedThemes: Map<string, Theme> = new Map([[globalTheme.name, globalTheme]]),
): LayoutOutput {
  const sectionThemes = collectSectionThemes(root, globalTheme, namedThemes);
  const nodes = indexNodes(root);

  const pages: LayoutPage[] = layout.pages.map((page) => ({
    ...page,
    elements: page.elements.map((element) => {
      const node = nodes.get(element.nodeId) ?? nodes.get(element.nodeId.replace(/-frag-\d+$/, ''));
      return resolveElementStyle(element, globalTheme, sectionThemes, node?.props);
    }),
  }));

  return {
    ...layout,
    pages,
    metadata: {
      ...layout.metadata,
      theme: globalTheme.name,
    },
  };
}

/** Resolves styles on schema nodes before layout (stores on node.style). */
export function applyThemeToSchema(root: IReportNode, globalTheme: Theme, namedThemes: Map<string, Theme> = new Map()): IReportNode {
  namedThemes.set(globalTheme.name, globalTheme);

  function walk(node: IReportNode, sectionTheme?: Theme): IReportNode {
    let activeSection = sectionTheme;
    if (node.type === 'section') {
      activeSection = sectionThemeFromProps(node.props, globalTheme, namedThemes) ?? sectionTheme;
    }

    const resolved = resolver.resolve({
      componentType: node.type,
      globalTheme,
      ...(activeSection !== undefined ? { sectionTheme: activeSection } : {}),
      ...(node.style !== undefined ? { localStyle: node.style } : {}),
      ...(node.props !== undefined ? { propOverrides: node.props } : {}),
    });

    return {
      ...node,
      style: {
        ...node.style,
        ...resolvedStyleToRecord(resolved),
      },
      children: node.children.map((child) => walk(child, activeSection)),
    };
  }

  return walk(root);
}

export { StyleResolver, resolver as defaultStyleResolver };
