import { Undefinable } from 'option-t/lib/Undefinable';
import stylelint from 'stylelint';
import { Result } from 'postcss';

import { DeepPartial } from './types/deep-partial';

export interface Options {
  resolve: {
    documents: string[];
  };
}

const optionsSchema = {
  resolve: {
    documents: [(a: unknown): boolean => typeof a === 'string'],
  },
};

const defaultOptions: Options = {
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
