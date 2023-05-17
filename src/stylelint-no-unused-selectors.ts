import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import { unwrapUndefinable } from 'option-t/lib/Undefinable/unwrap';
import { andThenForUndefinable } from 'option-t/lib/Undefinable/andThen';

import flatMap from 'array.prototype.flatmap';

import stylelint, { PostcssResult } from 'stylelint';
import { Root } from 'postcss';
import resolveNestedSelector from 'postcss-resolve-nested-selector';
import createSelectorProcessor from 'postcss-selector-parser';

import { Options, normaliseOptions } from './options';
import { getPlugin } from './plugin';

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

function rule(
  options: DeepPartial<Options> | boolean,
): (root: Root, result: PostcssResult) => Promise<void> | void {
  return async (root, result): Promise<void> => {
    if (options === false) {
      return;
    }

    const cssSrc = getCSSSource(root);
    if (!cssSrc) {
      return;
    }

    const opts = normaliseOptions(
      result,
      ruleName,
      typeof options === 'object' ? options : {},
    );
    if (!opts) {
      return;
    }

    const documentPaths = resolveDocuments(
      cssSrc,
      opts.suffixesToStrip,
      opts.documents,
    );
    const resolution = await resolveDocument(documentPaths);
    if (!resolution) {
      return;
    }

    const { path: documentPath, document } = resolution;

    const pluginSet = await getPlugin(documentPath, opts.plugins);
    if (!pluginSet) {
      return;
    }

    const { plugin, options: pluginOptions } = pluginSet;

    plugin.parse(document, pluginOptions);

    root.walkRules((rule) => {
      if (!rule.selectors) {
        return;
      }

      const resolvedSelectors = flatMap(rule.selectors, (selector) =>
        resolveNestedSelector(selector, rule),
      );

      resolvedSelectors.forEach((selector: string) => {
        const selectorAst = selectorProcessor.astSync(selector);
        const filteredAst = removeUnassertiveSelector(selectorAst);
        const matched = unwrapUndefinable(plugin).match(
          filteredAst,
          pluginOptions,
        );

        if (!matched) {
          stylelint.utils.report({
            result,
            ruleName,
            node: rule,
            message: messages.rejected(selector, path.basename(documentPath)),
          });
        }
      });
    });
  };
}

rule.ruleName = ruleName;
rule.messages = messages;

export default stylelint.createPlugin(ruleName, rule);
