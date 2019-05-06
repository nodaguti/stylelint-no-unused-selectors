import ts from 'typescript';
import { Undefinable } from 'option-t/lib/Undefinable';
import { unwrapUndefinable } from 'option-t/lib/Undefinable/unwrap';
import { andThenForUndefinable } from 'option-t/lib/Undefinable/andThen';
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

function extractSpecifiersFromImport(
  node: ts.ImportDeclaration,
  predicate: (node: ts.ImportDeclaration) => boolean,
): string[] {
  if (!predicate(node)) {
    return [];
  }

  const clauseNode = node.importClause;

  if (!clauseNode) {
    return [];
  }

  if (clauseNode.name !== undefined) {
    return [extractTextFromIdentifier(clauseNode.name)];
  }

  if (!clauseNode.namedBindings) {
    return [];
  }

  if (ts.isNamedImports(clauseNode.namedBindings)) {
    return clauseNode.namedBindings.elements.map(
      (specifier): string => extractTextFromIdentifier(specifier.name),
    );
  }

  if (ts.isNamespaceImport(clauseNode.namedBindings)) {
    return [extractTextFromIdentifier(clauseNode.namedBindings.name)];
  }

  return [];
}

function isRequireCall(node: ts.VariableDeclaration): boolean {
  if (!node.initializer || !ts.isCallExpression(node.initializer)) {
    return false;
  }

  const callNode = node.initializer;

  if (!ts.isIdentifier(callNode.expression)) {
    return false;
  }

  const funcName = extractTextFromIdentifier(callNode.expression);
  return funcName === 'require';
}

function extractSpecifierFromRequire(
  node: ts.VariableDeclaration,
  predicate: (node: ts.VariableDeclaration) => boolean,
): Undefinable<string> {
  if (!predicate(node)) {
    return undefined;
  }

  const specifier = extractTextFromIdentifier(node.name as ts.Identifier);
  return specifier;
}

function extractArgumentsFromClassnamesCall(node: ts.CallExpression): string[] {
  const classes: string[] = [];

  node.arguments.forEach(
    (arg): void => {
      switch (arg.kind) {
        case ts.SyntaxKind.StringLiteral: {
          const className = (arg as ts.StringLiteral).text;
          if (className) {
            classes.push(className);
          }
          break;
        }

        case ts.SyntaxKind.ObjectLiteralExpression: {
          const stringProps = (arg as ts.ObjectLiteralExpression).properties.filter(
            (prop): boolean =>
              ts.isPropertyAssignment(prop) && ts.isStringLiteral(prop.name),
          );
          const keys = stringProps
            .map(
              (prop): string =>
                ((prop as ts.PropertyAssignment).name as ts.StringLiteral).text,
            )
            .filter((key): boolean => !!key);

          classes.push(...keys);
          break;
        }
      }
    },
  );

  return classes;
}

function extractClassesAndIds(
  sourceFile: ts.SourceFile,
): { classes: string[]; ids: string[] } {
  const cssModuleSpecifiers: string[] = [];
  const classNamesSpecifiers: string[] = [];
  const classes: string[] = [];
  const ids: string[] = [];

  function visitor(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const declNode = node as ts.ImportDeclaration;

        {
          const specifiers = extractSpecifiersFromImport(
            declNode,
            (node): boolean => {
              return (node.moduleSpecifier as ts.StringLiteral).text.endsWith(
                '.css',
              );
            },
          );

          cssModuleSpecifiers.push(...specifiers);
        }

        {
          const specifiers = extractSpecifiersFromImport(
            declNode,
            (node): boolean => {
              return (
                (node.moduleSpecifier as ts.StringLiteral).text === 'classnames'
              );
            },
          );

          classNamesSpecifiers.push(...specifiers);
        }

        break;
      }

      case ts.SyntaxKind.VariableDeclaration: {
        const declNode = node as ts.VariableDeclaration;

        if (!isRequireCall(declNode)) {
          break;
        }

        {
          const specifier = extractSpecifierFromRequire(
            declNode,
            (node): boolean => {
              const callNode = unwrapUndefinable(
                node.initializer,
              ) as ts.CallExpression;
              const arg = callNode.arguments[0];
              return ts.isStringLiteral(arg) && arg.text.endsWith('.css');
            },
          );

          andThenForUndefinable(
            specifier,
            (s): void => void cssModuleSpecifiers.push(s),
          );
        }

        {
          const specifier = extractSpecifierFromRequire(
            declNode,
            (node): boolean => {
              const callNode = unwrapUndefinable(
                node.initializer,
              ) as ts.CallExpression;
              const arg = callNode.arguments[0];
              return ts.isStringLiteral(arg) && arg.text === 'classnames';
            },
          );

          andThenForUndefinable(
            specifier,
            (s): void => void classNamesSpecifiers.push(s),
          );
        }

        break;
      }

      case ts.SyntaxKind.CallExpression: {
        const callNode = node as ts.CallExpression;
        if (!ts.isIdentifier(callNode.expression)) {
          break;
        }

        const funcName = extractTextFromIdentifier(callNode.expression);

        if (classNamesSpecifiers.includes(funcName)) {
          const args = extractArgumentsFromClassnamesCall(callNode);
          const classNames = args.map((className): string => `.${className}`);

          classes.push(...classNames);
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
              const normalisedClassNames = classNames
                .split(' ')
                .filter((c): boolean => !!c)
                .map((c): string => `.${c}`);

              classes.push(...normalisedClassNames);
            }
          }

          if (attrNode.name.text === 'id') {
            const idNames = extractAttributeValue(attrNode);

            if (idNames) {
              const normalisedIdNames = idNames
                .split(' ')
                .filter((i): boolean => !!i)
                .map((i): string => `#${i}`);

              ids.push(...normalisedIdNames);
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
