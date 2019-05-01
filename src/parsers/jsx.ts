import { Parser as AcornParser, Node } from 'acorn';
// @ts-ignore
import acornJSX from 'acorn-jsx';
// @ts-ignore
import { simple as walkSimple } from 'acorn-walk';
import {
  JSXAttribute,
  ImportDeclaration,
  MemberExpression,
  VariableDeclarator,
  CallExpression,
} from '@babel/types';
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

    const cssModuleSpecifiers: string[] = [];
    let classes: string[] = [];
    let ids: string[] = [];

    walkSimple(
      this._ast,
      {
        ImportDeclaration(node: ImportDeclaration): void {
          if (!node.source.value.endsWith('.css')) {
            return;
          }

          node.specifiers.forEach(
            (specifier): void => {
              cssModuleSpecifiers.push(specifier.local.name);
            },
          );
        },

        VariableDeclarator(node: VariableDeclarator): void {
          if (!node.init || node.init.type !== 'CallExpression') {
            return;
          }

          const callExpr = node.init as CallExpression;

          // @ts-ignore
          if (callExpr.callee.name !== 'require') {
            return;
          }

          // @ts-ignore
          const source: string = callExpr.arguments[0].value;

          if (source && source.endsWith('.css')) {
            // @ts-ignore
            cssModuleSpecifiers.push(node.id.name);
          }
        },

        MemberExpression(node: MemberExpression): void {
          // @ts-ignore
          if (cssModuleSpecifiers.includes(node.object.name)) {
            classes.push(`.${node.property.value || node.property.name}`);
          }
        },

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
