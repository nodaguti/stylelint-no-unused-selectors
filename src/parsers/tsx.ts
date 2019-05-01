import ts from 'typescript';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

import { Parser } from '../parser';
import { isSimpleSelector } from '../utils/is-simple-selector';

function extractAttributeValue(node: ts.JsxAttribute): Undefinable<string> {
  if (
    !node.initializer ||
    node.initializer.kind !== ts.SyntaxKind.StringLiteral
  ) {
    return;
  }

  return (node.initializer as ts.StringLiteral).text;
}

function extractClassesAndIds(
  sourceFile: ts.SourceFile,
): { classes: string[]; ids: string[] } {
  let classes: string[] = [];
  let ids: string[] = [];

  function visitor(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.JsxAttribute: {
        const attrNode = node as ts.JsxAttribute;

        if (attrNode.name.text === 'className') {
          const classNames = extractAttributeValue(attrNode);

          if (classNames) {
            classes = classes.concat(
              classNames
                .split(' ')
                .filter((c): boolean => !!c)
                .map((c): string => `.${c}`),
            );
          }
        }

        if (attrNode.name.text === 'id') {
          const idNames = extractAttributeValue(attrNode);

          if (idNames) {
            ids = ids.concat(
              idNames
                .split(' ')
                .filter((i): boolean => !!i)
                .map((i): string => `#${i}`),
            );
          }
        }
      }
    }

    ts.forEachChild(node, visitor);
  }

  visitor(sourceFile);

  return { classes, ids };
}

export class TSXParser implements Parser {
  private _ast: Undefinable<ts.SourceFile>;
  private _classes: string[];
  private _ids: string[];

  public constructor() {
    this._ast = undefined;
    this._classes = [];
    this._ids = [];
  }

  public parse(tsx: string): void {
    this._ast = ts.createSourceFile('foo.tsx', tsx, ts.ScriptTarget.Latest);

    const { classes, ids } = extractClassesAndIds(this._ast);

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
