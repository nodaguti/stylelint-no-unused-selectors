import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import { unwrapUndefinable } from 'option-t/lib/Undefinable/unwrap';
import { andThenForUndefinable } from 'option-t/lib/Undefinable/andThen';

import flatMap from 'array.prototype.flatmap';

import stylelint from 'stylelint';
import { Root, Result } from 'postcss';
// @ts-ignore
import resolveNestedSelector from 'postcss-resolve-nested-selector';
import createSelectorProcessor from 'postcss-selector-parser';

import { createParser } from './parser';

import { DeepPartial } from './types/deep-partial';
import { resolveDocuments, resolveDocument } from './utils/document-resolver';
import { removeUnassertiveSelector } from './utils/remove-unassertive-selector';

export const ruleName = 'plugin/no-unused-selectors';
export const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (selector: string, documentName: string): string =>
    `${selector} is defined but doesn't match any elements in ${documentName}.`,
});

const selectorProcessor = createSelectorProcessor();

function getCSSSource(root: Root): Undefinable<string> {
  return andThenForUndefinable(
    root.source,
    (s): Undefinable<string> => s.input.file,
  );
}

interface Options {
  resolve: {
    documents: string[];
  };
}

const optionsSchema = {
  resolve: {
    documents: [(a: unknown): boolean => typeof a === 'string'],
  },
};

const defaultOptions = {
  resolve: {
    documents: [
      '{cssDir}/{cssName}.tsx',
      '{cssDir}/{cssName}.jsx',
      '{cssDir}/{cssName}.html',
      '{cssDir}/{cssName}.htm',
      '{cssDir}/index.tsx',
      '{cssDir}/index.jsx',
      '{cssDir}/index.html',
      '{cssDir}/index.htm',
    ],
  },
};

function normaliseOptions(
  result: Result,
  options: Undefinable<DeepPartial<Options>>,
): Undefinable<Options> {
  const areOptionsValid = stylelint.utils.validateOptions(result, ruleName, {
    actual: options,
    possible: optionsSchema,
    optional: true,
  });

  if (!areOptionsValid) {
    return;
  }

  const mergedOpts = Object.assign(defaultOptions, options);
  return mergedOpts;
}

function rule(
  _enabled: boolean,
  options?: DeepPartial<Options>,
): (root: Root, result: Result) => Promise<void> {
  return async (root, result): Promise<void> => {
    const cssSrc = getCSSSource(root);

    if (!cssSrc) {
      return;
    }

    const opts = normaliseOptions(result, options);

    if (!opts) {
      return;
    }

    const documentPaths = resolveDocuments(cssSrc, opts.resolve.documents);
    const resolution = await resolveDocument(documentPaths);

    if (!resolution) {
      return;
    }

    const { path: documentPath, document } = resolution;
    const parser = createParser(documentPath);

    if (!parser) {
      return;
    }

    await parser.parse(document);

    root.walkRules(
      async (rule): Promise<void> => {
        if (!rule.selectors) {
          return;
        }

        const resolvedSelectors = flatMap(
          rule.selectors,
          (selectors): string[] => resolveNestedSelector(selectors, rule),
        );

        async function processSelector(selector: string): Promise<void> {
          const selectorAst = await selectorProcessor.ast(selector);
          const filteredAst = removeUnassertiveSelector(selectorAst);
          const matched = await unwrapUndefinable(parser).match(filteredAst);

          if (!matched) {
            stylelint.utils.report({
              result,
              ruleName,
              node: rule,
              message: messages.rejected(selector, path.basename(documentPath)),
            });
          }
        }

        await Promise.all(resolvedSelectors.map(processSelector));
      },
    );
  };
}

rule.primaryOptionArray = true;

export default stylelint.createPlugin(ruleName, rule);
