import { JSDOM } from 'jsdom';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

import { Plugin } from '../plugin';

export class HTMLPlugin implements Plugin {
  private _dom: Undefinable<JSDOM>;

  public constructor() {
    this._dom = undefined;
  }

  public parse(html: string): void {
    this._dom = new JSDOM(html);
  }

  public match(selectorAst: PostcssSelectorParser.Root): boolean {
    if (this._dom === undefined) {
      throw new Error('Call parse() before match().');
    }

    const selector = selectorAst.toString();
    const matched = this._dom.window.document.querySelector(selector);
    return matched !== null;
  }
}
