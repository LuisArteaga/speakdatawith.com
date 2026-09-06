/**
 * Markdown/MDX parsing, translatable-segment extraction, and translation
 * grafting for the article translation workflow.
 *
 * The document structure is controlled by deterministic scripts (ADR-0001):
 * both `.md` and `.mdx` sources are parsed with the same MDX-aware remark
 * pipeline, every AST node type outside the explicitly supported set aborts
 * extraction with a controlled error, and translatable text is captured per
 * structural unit (heading, paragraph, list item, table cell, component
 * attribute, frontmatter title/description) while code, inline code, URLs,
 * and component-internal values are harvested as protected content.
 *
 * Reconstruction never rewrites the English source: the translated document
 * is a fresh AST built from the source tree with only translated spans and
 * the derived frontmatter replaced, then serialized by remark-stringify.
 * See docs/translation/workflow.md for the workflow contract.
 */

import { createHash } from 'node:crypto';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkStringify from 'remark-stringify';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { mdxToMarkdown } from 'mdast-util-mdx';
import { frontmatterToMarkdown } from 'mdast-util-frontmatter';
import { parseFrontmatter } from './frontmatter.mjs';

/** Version of the segments/translated-segments JSON format. */
export const SCHEMA_VERSION = '1.0';

/** Translation target languages supported by this workflow (ADR-0001). */
export const TARGET_LANGUAGES = ['de', 'es'];

/**
 * Component allowlist with the attribute roles per component. `translatable`
 * attribute values become segments; `protected` values are never extracted;
 * `derived` values are rewritten by the apply step (never translated).
 */
export const ALLOWLISTED_COMPONENTS = {
  Figure: { translatable: ['alt', 'caption'], protected: ['src'], derived: [] },
  YouTubeFacade: {
    translatable: ['title'],
    protected: ['videoId', 'poster'],
    derived: ['locale'],
  },
  RepositoryCTA: {
    translatable: ['label'],
    protected: ['url'],
    derived: ['locale'],
  },
};

const KNOWN_BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'list',
  'listItem',
  'blockquote',
  'table',
  'tableRow',
  'tableCell',
  'code',
  'thematicBreak',
  'yaml',
  'mdxjsEsm',
  'mdxJsxFlowElement',
]);

const KNOWN_INLINE_TYPES = new Set([
  'text',
  'emphasis',
  'strong',
  'inlineCode',
  'link',
  'image',
  'break',
  'delete',
]);

const parser = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkFrontmatter, ['yaml']);

const compiler = unified()
  .use(remarkGfm)
  .use(remarkMdx)
  .use(remarkStringify, {
    emphasis: '*',
    strong: '*',
    bullet: '-',
    fence: '`',
    rule: '-',
  })
  .data('toMarkdownExtensions', [
    gfmToMarkdown(),
    mdxToMarkdown(),
    frontmatterToMarkdown(['yaml']),
  ]);

/** Serializes inline-only children the way they appear inside a unit. */
function unitText(children) {
  return compiler.stringify({ type: 'paragraph', children }).replace(/\n+$/, '');
}

/** Parses an article source string into an mdast tree. */
export function parseDocument(source) {
  return parser.parse(source);
}

/** Serializes a full document tree (including the frontmatter yaml node). */
export function serializeDocument(tree) {
  return compiler.stringify(tree);
}

/**
 * Parses a translated segment text back into inline AST children. A
 * translated segment must remain a single paragraph; block-level syntax
 * (headings, lists, multiple blocks) is a controlled error.
 */
export function parseInlineSegmentText(text, segmentId) {
  const root = parser.parse(text);
  const children = root.children;
  if (children.length !== 1 || children[0].type !== 'paragraph') {
    throw new Error(
      `translated segment ${segmentId} must be a single paragraph of inline content, got ${children.length} block(s)`,
    );
  }
  return children[0].children;
}

function assertKnownInline(node) {
  if (!KNOWN_INLINE_TYPES.has(node.type)) {
    throw new Error(
      `unsupported inline node "${node.type}" — the translation workflow aborts on unknown constructs instead of silently altering content`,
    );
  }
}

/**
 * Validates one allowlisted JSX element (flow or text position) against the
 * attribute contract and returns the instance descriptor. Throws on unknown
 * components, children, spread attributes, expression values for
 * translatable/derived attributes, and unknown attribute names.
 */
function validateComponentElement(elementNode, harvested) {
  const config = ALLOWLISTED_COMPONENTS[elementNode.name];
  if (!config) {
    throw new Error(
      `unsupported MDX component "${elementNode.name}" — only ${Object.keys(ALLOWLISTED_COMPONENTS).join(', ')} are allowed in articles`,
    );
  }
  if (elementNode.children.length > 0) {
    throw new Error(
      `unsupported MDX component children on <${elementNode.name}> — components must be self-closing`,
    );
  }
  const instance = {
    name: elementNode.name,
    node: elementNode,
    translatableAttrs: [],
    protectedAttrs: {},
    localeAttr: null,
  };
  for (const attribute of elementNode.attributes) {
    if (attribute.type === 'mdxJsxSpreadAttribute') {
      throw new Error(
        `unsupported spread attribute on <${elementNode.name}> — attributes must be static`,
      );
    }
    if (attribute.type !== 'mdxJsxAttribute') {
      throw new Error(
        `unsupported attribute node "${attribute.type}" on <${elementNode.name}>`,
      );
    }
    const { name } = attribute;
    if (config.translatable.includes(name)) {
      if (attribute.value.type === 'mdxJsxAttributeValueExpression') {
        throw new Error(
          `unsupported expression value for translatable attribute "${name}" on <${elementNode.name}> — values must be static strings`,
        );
      }
      instance.translatableAttrs.push({ name, attributeNode: attribute });
    } else if (config.protected.includes(name)) {
      instance.protectedAttrs[name] =
        attribute.value.type === 'mdxJsxAttributeValueExpression'
          ? `{${attribute.value.value}}`
          : attribute.value;
      if (['url', 'src', 'poster'].includes(name) && typeof instance.protectedAttrs[name] === 'string') {
        harvested.urls.push(instance.protectedAttrs[name]);
      }
    } else if (config.derived.includes(name)) {
      if (typeof attribute.value !== 'string') {
        throw new Error(
          `unsupported expression value for derived attribute "${name}" on <${elementNode.name}> — values must be static strings`,
        );
      }
      instance.localeAttr = attribute;
    } else {
      throw new Error(
        `unsupported attribute "${name}" on <${elementNode.name}> — allowed: ${[...config.translatable, ...config.protected, ...config.derived].join(', ')}`,
      );
    }
  }
  return instance;
}

/**
 * Rewrites the `locale` attribute of inline allowlisted component instances
 * (block-level instances are rewritten during the walk). Inline attributes
 * are part of translated segment texts, so the apply step fixes them
 * deterministically instead of relying on the translation.
 */
export function rewriteInlineComponentLocales(tree, targetLanguage) {
  const visit = (node) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== 'object') {
      return;
    }
    if (node.type === 'mdxJsxTextElement' && ALLOWLISTED_COMPONENTS[node.name]) {
      for (const attribute of node.attributes) {
        if (attribute.type === 'mdxJsxAttribute' && attribute.name === 'locale') {
          attribute.value = targetLanguage;
        }
      }
    }
    if (node.children) {
      visit(node.children);
    }
  };
  visit(tree);
}

/** Validates a unit's inline children and harvests inline code values and URLs. */
function collectInline(children, harvested) {
  for (const node of children) {
    if (node.type === 'mdxJsxTextElement') {
      // Allowlisted components are also allowed inline inside prose (e.g. a
      // RepositoryCTA at the end of a paragraph). Their translatable
      // attributes stay inside the surrounding segment text; the protected
      // values are still harvested so the invariants can compare them.
      const instance = validateComponentElement(node, harvested);
      harvested.componentNames.push(instance.name);
      harvested.componentInstances.push({
        name: instance.name,
        protectedAttrs: instance.protectedAttrs,
        locale: instance.localeAttr ? instance.localeAttr.value : null,
      });
      continue;
    }
    assertKnownInline(node);
    if (node.type === 'inlineCode') {
      harvested.inlineCodeValues.push(node.value);
    } else if (node.type === 'link') {
      harvested.urls.push(node.url);
    } else if (node.type === 'image') {
      harvested.urls.push(node.url);
    }
    if (node.children) {
      collectInline(node.children, harvested);
    }
  }
}

function blockSignature(node) {
  switch (node.type) {
    case 'paragraph':
      return 'paragraph';
    case 'heading':
      return `heading-${node.depth}`;
    case 'code':
      return 'code';
    case 'thematicBreak':
      return 'thematicBreak';
    case 'mdxjsEsm':
      return 'mdxjsEsm';
    case 'mdxJsxFlowElement':
      return `component:${node.name}`;
    case 'list':
      return `list(${node.children
        .map((item) => item.children.map(blockSignature).join(','))
        .join('|')})`;
    case 'blockquote':
      return `blockquote(${node.children.map(blockSignature).join('|')})`;
    case 'table':
      return `table(${node.children.length}x${node.children[0]?.children.length ?? 0})`;
    default:
      return `unknown:${node.type}`;
  }
}

/**
 * Walks the document and invokes the visitor for every structural element.
 * Abort on any node type outside the supported sets. The visitor hooks:
 *
 * - `frontmatter(node)` — the yaml node (raw value in `node.value`).
 * - `unit(unit)` — a translatable unit `{ id, type, text, node, component?, attribute? }`
 *   (body units carry their mdast node; component-attribute units carry the
 *   attribute node; frontmatter units carry `node: null`).
 * - `codeBlock(node)` — a fenced/indented code block (protected).
 * - `component(instance)` — an allowlisted component instance
 *   `{ name, node, translatableAttrs, protectedAttrs, localeAttr }`.
 */
export function walkDocument(tree, visitor) {
  const ordinals = new Map();
  const harvested = { inlineCodeValues: [], urls: [], componentNames: [], componentInstances: [] };
  let componentOrdinal = 0;

  const nextId = (type) => {
    const count = (ordinals.get(type) ?? 0) + 1;
    ordinals.set(type, count);
    return `${type}-${String(count).padStart(3, '0')}`;
  };

  const makeBodyUnit = (type, children, node, extra) => {
    collectInline(children, harvested);
    const text = unitText(children);
    if (text.trim() === '') {
      return null;
    }
    return { id: nextId(type), type, text, node, ...extra };
  };

  const handleAttributes = (elementNode) => {
    const instance = validateComponentElement(elementNode, harvested);
    visitor.component?.(instance);
    for (const { name, attributeNode } of instance.translatableAttrs) {
      const text = attributeNode.value;
      if (text.trim() === '') {
        continue;
      }
      visitor.unit({
        id: nextId('component-attribute'),
        type: 'component-attribute',
        text,
        node: attributeNode,
        component: instance.name,
        attribute: name,
      });
    }
  };

  const walkBlock = (node, parentType) => {
    if (!KNOWN_BLOCK_TYPES.has(node.type)) {
      throw new Error(
        `unsupported block node "${node.type}" — the translation workflow aborts on unknown constructs instead of silently altering content`,
      );
    }
    switch (node.type) {
      case 'yaml':
        visitor.frontmatter?.(node);
        return;
      case 'heading': {
        const unit = makeBodyUnit('heading', node.children, node);
        if (unit) visitor.unit(unit);
        return;
      }
      case 'paragraph': {
        const type = parentType === 'listItem' ? 'list-item' : 'paragraph';
        const unit = makeBodyUnit(type, node.children, node);
        if (unit) visitor.unit(unit);
        return;
      }
      case 'list':
        for (const item of node.children) {
          for (const child of item.children) {
            walkBlock(child, 'listItem');
          }
        }
        return;
      case 'blockquote':
        for (const child of node.children) {
          walkBlock(child, 'blockquote');
        }
        return;
      case 'table':
        for (const row of node.children) {
          for (const cell of row.children) {
            const unit = makeBodyUnit('table-cell', cell.children, cell);
            if (unit) visitor.unit(unit);
          }
        }
        return;
      case 'code':
        visitor.codeBlock?.(node);
        return;
      case 'thematicBreak':
      case 'mdxjsEsm':
        return;
      case 'mdxJsxFlowElement':
        handleAttributes(node);
        return;
      default:
        return;
    }
  };

  for (const node of tree.children) {
    if (!KNOWN_BLOCK_TYPES.has(node.type)) {
      throw new Error(
        `unsupported block node "${node.type}" — the translation workflow aborts on unknown constructs instead of silently altering content`,
      );
    }
    walkBlock(node, 'root');
  }

  return {
    inlineCodeValues: harvested.inlineCodeValues,
    urls: harvested.urls,
    componentNames: harvested.componentNames,
    componentInstances: harvested.componentInstances,
  };
}

/**
 * Builds the translation model of a document: frontmatter, translatable
 * units (including the frontmatter title/description), protected content,
 * component instances, and the structural signature.
 *
 * `expectedLanguage: 'en'` asserts the full English-source contract
 * (language, translationStatus "source", identity fields); pass `null` for
 * generated documents, where only structural extraction runs.
 */
export function extractTranslationModel(source, { expectedLanguage = 'en' } = {}) {
  const tree = parseDocument(source);
  const model = {
    frontmatter: null,
    units: [],
    protectedContent: { codeBlockHashes: [], inlineCodeValues: [], urls: [], componentNames: [] },
    componentInstances: [],
    structure: { blocks: [] },
  };

  let frontmatterNode = null;
  const bodyVisitor = {
    frontmatter(node) {
      frontmatterNode = node;
    },
    unit(unit) {
      model.units.push(unit);
    },
    codeBlock(node) {
      model.protectedContent.codeBlockHashes.push(
        createHash('sha256').update(node.value, 'utf8').digest('hex'),
      );
    },
    component(instance) {
      model.protectedContent.componentNames.push(instance.name);
      model.componentInstances.push({
        name: instance.name,
        protectedAttrs: instance.protectedAttrs,
        locale: instance.localeAttr ? instance.localeAttr.value : null,
      });
    },
  };

  const { inlineCodeValues, urls, componentNames, componentInstances } = walkDocument(tree, bodyVisitor);
  model.protectedContent.inlineCodeValues = inlineCodeValues;
  model.protectedContent.urls = urls;
  model.protectedContent.componentNames.push(...componentNames);
  model.componentInstances.push(...componentInstances);
  model.structure.blocks = tree.children
    .filter((node) => node.type !== 'yaml')
    .map(blockSignature);

  if (!frontmatterNode) {
    throw new Error('article has no YAML frontmatter — a frontmatter block is required');
  }
  model.frontmatter = parseFrontmatter(frontmatterNode.value);
  assertFrontmatterContract(model.frontmatter, expectedLanguage);

  const frontmatterUnits = frontmatterUnitsFrom(model.frontmatter);
  model.units.unshift(...frontmatterUnits);

  return model;
}

/** Frontmatter-derived units, shared by extraction and validation. */
export function frontmatterUnitsFrom(frontmatter) {
  const units = [];
  if (typeof frontmatter.title === 'string' && frontmatter.title.trim() !== '') {
    units.push({ id: 'frontmatter-title-001', type: 'frontmatter-title', text: frontmatter.title, node: null });
  }
  if (typeof frontmatter.description === 'string' && frontmatter.description.trim() !== '') {
    units.push({
      id: 'frontmatter-description-001',
      type: 'frontmatter-description',
      text: frontmatter.description,
      node: null,
    });
  }
  return units;
}

function assertFrontmatterContract(frontmatter, expectedLanguage) {
  if (expectedLanguage === null) {
    return;
  }
  if (frontmatter.language !== expectedLanguage) {
    throw new Error(
      `article language must be "${expectedLanguage}" for the translation workflow, got "${frontmatter.language}"`,
    );
  }
  if (frontmatter.translationStatus !== 'source') {
    throw new Error(
      `only English source articles (translationStatus "source") can be translated, got "${frontmatter.translationStatus}"`,
    );
  }
  if (typeof frontmatter.translationKey !== 'string' || !/^SDW-\d{3,}$/.test(frontmatter.translationKey)) {
    throw new Error('frontmatter translationKey must match SDW-<digits> (e.g. SDW-001)');
  }
  if (frontmatter.contentId !== `${frontmatter.translationKey}-EN`) {
    throw new Error(
      `frontmatter contentId must be "<translationKey>-EN" (${frontmatter.translationKey}-EN), got "${frontmatter.contentId}"`,
    );
  }
  if (!Number.isInteger(frontmatter.sourceRevision) || frontmatter.sourceRevision < 1) {
    throw new Error('frontmatter sourceRevision must be a positive integer');
  }
  if (typeof frontmatter.title !== 'string' || frontmatter.title.trim() === '') {
    throw new Error('frontmatter title must be a non-empty string');
  }
  if (typeof frontmatter.description !== 'string' || frontmatter.description.trim() === '') {
    throw new Error('frontmatter description must be a non-empty string');
  }
}
