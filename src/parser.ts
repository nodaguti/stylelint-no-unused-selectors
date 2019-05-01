import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

import { HTMLParser } from './parsers/html';
import { JSXParser } from './parsers/jsx';

export interface Parser {
  parse(document: string): void | Promise<void>;
  match(selectorAst: PostcssSelectorParser.Root): boolean | Promise<boolean>;
}

export function createParser(docPath: string): Undefinable<Parser> {
  const ext = path.extname(docPath);

  switch (ext) {
    case '.html':
    case '.htm':
      return new HTMLParser();

    case '.jsx':
    case '.js':
      return new JSXParser();

    default:
      return undefined;
  }
}
