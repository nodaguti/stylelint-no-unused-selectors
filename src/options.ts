import { Undefinable } from 'option-t/lib/Undefinable';
import stylelint from 'stylelint';
import { Result } from 'postcss';

import { DeepPartial } from './types/deep-partial';

export interface PluginSetting {
  test: string;
  plugin: string;
  options?: unknown;
}

export interface Options {
  resolve: {
    documents: string[];
  };
  plugins: PluginSetting[];
}

const isResolveObject = (
  o: unknown,
): o is {
  documents: unknown;
} => {
  return Object.prototype.hasOwnProperty.call(o, 'documents');
};

const optionsSchema = {
  resolve: (r: unknown): boolean =>
    isResolveObject(r) &&
    Array.isArray(r.documents) &&
    r.documents.every((item): boolean => typeof item === 'string'),
  plugins: [
    (p: unknown): boolean =>
      typeof p === 'object' && p !== null && 'test' in p && 'plugin' in p,
  ],
};

const defaultOptions: Options = {
  resolve: {
    documents: [
      '{cssDir}/{cssName}.tsx',
      '{cssDir}/{cssName}.jsx',
      '{cssDir}/{cssName}.html',
      '{cssDir}/{cssName}.htm',
      '{cssDir}/{cssDirName}.tsx',
      '{cssDir}/{cssDirName}.jsx',
      '{cssDir}/{cssDirName}.html',
      '{cssDir}/{cssDirName}.htm',
      '{cssDir}/index.tsx',
      '{cssDir}/index.jsx',
      '{cssDir}/index.html',
      '{cssDir}/index.htm',
    ],
  },
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
  result: Result,
  ruleName: string,
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
