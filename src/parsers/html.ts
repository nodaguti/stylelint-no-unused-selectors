import { JSDOM } from 'jsdom';
import { Undefinable } from 'option-t/lib/Undefinable';

import { Parser } from '../parser';

export class HTMLParser implements Parser {
  private _dom: Undefinable<JSDOM>;

  public constructor() {
    this._dom = undefined;
  }

  public parse(html: string): void {
    this._dom = new JSDOM(html);
  }

  public match(selector: string): boolean {
    if (this._dom === undefined) {
      throw new Error('Call parse() before match().');
    }

    const matched = this._dom.window.document.querySelector(selector);
    return matched !== null;
  }
}
