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

function extractTextFromIdentifier(node: ts.Identifier): string {
  return node.text || (node.escapedText as string);
}

function extractClassesAndIds(
  sourceFile: ts.SourceFile,
): { classes: string[]; ids: string[] } {
  const cssModuleSpecifiers: string[] = [];
  let classes: string[] = [];
  let ids: string[] = [];

  function visitor(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const declNode = node as ts.ImportDeclaration;

        if (
          !(declNode.moduleSpecifier as ts.StringLiteral).text.endsWith('.css')
        ) {
          break;
        }

        const clauseNode = declNode.importClause;

        if (!clauseNode) {
          break;
        }

        if (clauseNode.name !== undefined) {
          cssModuleSpecifiers.push(extractTextFromIdentifier(clauseNode.name));
          break;
        }

        if (!clauseNode.namedBindings) {
          break;
        }

        if (ts.isNamedImports(clauseNode.namedBindings)) {
          clauseNode.namedBindings.elements.forEach(
            (specifier): void => {
              cssModuleSpecifiers.push(
                extractTextFromIdentifier(specifier.name),
              );
            },
          );
          break;
        }

        if (ts.isNamespaceImport(clauseNode.namedBindings)) {
          cssModuleSpecifiers.push(
            extractTextFromIdentifier(clauseNode.namedBindings.name),
          );
          break;
        }

        break;
      }

      case ts.SyntaxKind.VariableDeclaration: {
        const declNode = node as ts.VariableDeclaration;

        if (
          !declNode.initializer ||
          !ts.isCallExpression(declNode.initializer)
        ) {
          break;
        }

        const callNode = declNode.initializer;

        if (!ts.isIdentifier(callNode.expression)) {
          break;
        }

        if (extractTextFromIdentifier(callNode.expression) !== 'require') {
          break;
        }

        const arg = callNode.arguments[0];

        if (ts.isStringLiteral(arg) && arg.text.endsWith('.css')) {
          cssModuleSpecifiers.push(
            extractTextFromIdentifier(declNode.name as ts.Identifier),
          );
          break;
        }

        break;
      }

      case ts.SyntaxKind.PropertyAccessExpression: {
        const exprNode = node as ts.PropertyAccessExpression;

        if (
          cssModuleSpecifiers.includes(
            extractTextFromIdentifier(exprNode.expression as ts.Identifier),
          )
        ) {
          const className = extractTextFromIdentifier(exprNode.name);
          classes.push(`.${className}`);
        }

        break;
      }

      case ts.SyntaxKind.ElementAccessExpression: {
        const exprNode = node as ts.ElementAccessExpression;

        if (
          cssModuleSpecifiers.includes(
            extractTextFromIdentifier(exprNode.expression as ts.Identifier),
          )
        ) {
          const className = (exprNode.argumentExpression as ts.StringLiteral)
            .text;
          classes.push(`.${className}`);
        }

        break;
      }

      case ts.SyntaxKind.JsxAttribute:
        {
          const attrNode = node as ts.JsxAttribute;

          if (extractTextFromIdentifier(attrNode.name) === 'className') {
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

        break;
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
