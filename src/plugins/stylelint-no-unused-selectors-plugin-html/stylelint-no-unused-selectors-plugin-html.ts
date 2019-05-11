import { JSDOM } from 'jsdom';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

let dom: Undefinable<JSDOM> = undefined;

export function parse(html: string): void {
  dom = new JSDOM(html);
}

export function match(selectorAst: PostcssSelectorParser.Root): boolean {
  if (dom === undefined) {
    throw new Error('Call parse() before match().');
  }

  const selector = selectorAst.toString();
  const matched = dom.window.document.querySelector(selector);
  return matched !== null;
}
