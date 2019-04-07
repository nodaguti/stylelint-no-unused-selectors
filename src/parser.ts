import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';

import { HTMLParser } from './parsers/html';

export interface Parser {
  parse(document: string): void | Promise<void>;
  match(selector: string): boolean;
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
