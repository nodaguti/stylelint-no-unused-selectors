import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

import { HTMLPlugin } from './plugins/html';
import { JSXPlugin } from './plugins/jsx';
import { TSXPlugin } from './plugins/tsx';

export interface Plugin {
  parse(document: string): void | Promise<void>;
  match(selectorAst: PostcssSelectorParser.Root): boolean | Promise<boolean>;
}

export function getPlugin(docPath: string): Undefinable<Plugin> {
  const ext = path.extname(docPath);

  switch (ext) {
    case '.html':
    case '.htm':
      return new HTMLPlugin();

    case '.jsx':
    case '.js':
      return new JSXPlugin();

    case '.tsx':
      return new TSXPlugin();

    default:
      return undefined;
  }
}
