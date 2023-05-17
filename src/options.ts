import { Undefinable } from 'option-t/lib/Undefinable';
import stylelint, { PostcssResult } from 'stylelint';

import { DeepPartial } from './types/deep-partial';

export interface PluginSetting {
  test: string;
  plugin: string;
  options?: unknown;
}

export interface Options {
  suffixesToStrip: string[];
  documents: string[];
  plugins: PluginSetting[];
}

const defaultOptions: Options = {
  suffixesToStrip: ['.module'],
  documents: [
    '{cssDir}/{cssName}.tsx',
    '{cssDir}/{cssName}.jsx',
    '{cssDir}/{cssName}.html',
    '{cssDir}/{cssName}.htm',
    '{cssDir}/index.tsx',
    '{cssDir}/index.jsx',
    '{cssDir}/index.html',
    '{cssDir}/index.htm',
    '{cssDir}/{cssDirName}.tsx',
    '{cssDir}/{cssDirName}.jsx',
    '{cssDir}/{cssDirName}.html',
    '{cssDir}/{cssDirName}.htm',
  ],
  plugins: [
    {
      test: '\\.html?$',
      plugin: 'stylelint-no-unused-selectors-plugin-html',
    },
    {
      test: '\\.jsx?$',
      plugin: 'stylelint-no-unused-selectors-plugin-jsx',
      options: {
        sourceType: 'module',
        plugins: ['jsx', 'flow'],
      },
    },
    {
      test: '\\.tsx$',
      plugin: 'stylelint-no-unused-selectors-plugin-tsx',
    },
  ],
};

export function normaliseOptions(
  result: PostcssResult,
  ruleName: string,
  options: Undefinable<DeepPartial<Options>>,
): Undefinable<Options> {
  const areOptionsValid = stylelint.utils.validateOptions(result, ruleName, {
    actual: options,
    possible: {
      suffixesToStrip: [(s: unknown): boolean => typeof s === 'string'],
      documents: [(d: unknown): boolean => typeof d === 'string'],
      plugins: [
        (p: unknown): boolean =>
          typeof p === 'object' &&
          p !== null &&
          'test' in p &&
          typeof p.test === 'string' &&
          'plugin' in p &&
          typeof p.plugin === 'string',
      ],
    },
    optional: true,
  });

  if (!areOptionsValid) {
    return;
  }

  const mergedOpts = Object.assign(defaultOptions, options);
  return mergedOpts;
}
