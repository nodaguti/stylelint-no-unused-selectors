import { Parser as AcornParser, Node } from 'acorn';
// @ts-ignore
import acornJSX from 'acorn-jsx';
// @ts-ignore
import { simple as walkSimple } from 'acorn-walk';
import { JSXAttribute } from '@babel/types';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

import { Parser } from '../parser';
import { jsxWalker } from '../utils/acorn-jsx-walker';

const acornOptions = {
  sourceType: 'module' as const,
};

const JSXAcornParser = AcornParser.extend(acornJSX());

function isSimpleSelector(rootNode: PostcssSelectorParser.Root): boolean {
  const selectorNode = rootNode.nodes[0] as PostcssSelectorParser.Selector;

  if (selectorNode.nodes.length !== 1) {
    return false;
  }

  const type = selectorNode.nodes[0].type;

  return (
    type === PostcssSelectorParser.ID || type === PostcssSelectorParser.CLASS
  );
}

function extractAttributeValue(node: JSXAttribute): Undefinable<string> {
  const valueNode = node.value;

  // @ts-ignore
  if (valueNode.type !== 'Literal') {
    return;
  }

  // @ts-ignore
  return valueNode.value;
}

export class JSXParser implements Parser {
  private _ast: Undefinable<Node>;
  private _classes: string[];
  private _ids: string[];

  public constructor() {
    this._ast = undefined;
    this._classes = [];
    this._ids = [];
  }

  public parse(jsx: string): void {
    this._ast = JSXAcornParser.parse(jsx, acornOptions);

    let classes: string[] = [];
    let ids: string[] = [];

    walkSimple(
      this._ast,
      {
        JSXAttribute(node: JSXAttribute): void {
          if (node.name.name === 'className') {
            const classNames = extractAttributeValue(node);

            if (classNames) {
              classes = classes.concat(
                classNames
                  .split(' ')
                  .filter((c): boolean => !!c)
                  .map((c): string => `.${c}`),
              );
            }
          }

          if (node.name.name === 'id') {
            const idNames = extractAttributeValue(node);

            if (idNames) {
              ids = ids.concat(
                idNames
                  .split(' ')
                  .filter((i): boolean => !!i)
                  .map((i): string => `#${i}`),
              );
            }
          }
        },
      },
      jsxWalker,
    );

    this._classes = classes;
    this._ids = ids;
  }

  public match(selectorAst: PostcssSelectorParser.Root): boolean {
    if (this._ast === undefined) {
      throw new Error('Call parse() before match().');
    }

    // Skip if the given selector is not composed of only one class or id.
    if (!isSimpleSelector(selectorAst)) {
      return true;
    }

    const selector = selectorAst.toString();

    if (this._classes.includes(selector)) {
      return true;
    }

    if (this._ids.includes(selector)) {
      return true;
    }

    return false;
  }
}
