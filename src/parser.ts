import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

import { HTMLParser } from './parsers/html';

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

    default:
      return undefined;
  }
}
