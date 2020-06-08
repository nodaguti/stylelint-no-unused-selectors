import ts from 'typescript';
import { Undefinable } from 'option-t/lib/Undefinable';
import { unwrapUndefinable } from 'option-t/lib/Undefinable/unwrap';
import { andThenForUndefinable } from 'option-t/lib/Undefinable/andThen';
import PostcssSelectorParser from 'postcss-selector-parser';

import { isSimpleSelector } from '../../utils/is-simple-selector';

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
    return clauseNode.namedBindings.elements.map((specifier): string =>
      extractTextFromIdentifier(specifier.name),
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

  node.arguments.forEach((arg): void => {
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
  });

  return classes;
}

function extractClassesAndIds(
  sourceFile: ts.SourceFile,
): { classes: string[]; ids: string[] } {
  const cssModuleSpecifiers: string[] = [];
  const classNamesSpecifiers: string[] = [];
  const classes: string[] = [];
  const ids: string[] = [];

  function handleClassNameAndIdAttributes(node: ts.Node): void {
    switch (node.kind) {
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
  }

  function handleCSSModules(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const declNode = node as ts.ImportDeclaration;
        const specifiers = extractSpecifiersFromImport(
          declNode,
          (node): boolean => {
            return (node.moduleSpecifier as ts.StringLiteral).text.endsWith(
              '.css',
            );
          },
        );

        cssModuleSpecifiers.push(...specifiers);

        break;
      }

      case ts.SyntaxKind.VariableDeclaration: {
        const declNode = node as ts.VariableDeclaration;

        if (!isRequireCall(declNode)) {
          break;
        }

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

        break;
      }

      case ts.SyntaxKind.PropertyAccessExpression: {
        const exprNode = node as ts.PropertyAccessExpression;
        const objName = extractTextFromIdentifier(
          exprNode.expression as ts.Identifier,
        );

        if (!cssModuleSpecifiers.includes(objName)) {
          break;
        }

        const className = extractTextFromIdentifier(exprNode.name);
        classes.push(`.${className}`);

        break;
      }

      case ts.SyntaxKind.ElementAccessExpression: {
        const exprNode = node as ts.ElementAccessExpression;
        const objName = extractTextFromIdentifier(
          exprNode.expression as ts.Identifier,
        );

        if (!cssModuleSpecifiers.includes(objName)) {
          break;
        }

        const className = (exprNode.argumentExpression as ts.StringLiteral)
          .text;
        classes.push(`.${className}`);

        break;
      }
    }
  }

  function handleClassNames(node: ts.Node): void {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        const declNode = node as ts.ImportDeclaration;

        const specifiers = extractSpecifiersFromImport(
          declNode,
          (node): boolean => {
            return (
              (node.moduleSpecifier as ts.StringLiteral).text === 'classnames'
            );
          },
        );

        classNamesSpecifiers.push(...specifiers);

        break;
      }

      case ts.SyntaxKind.VariableDeclaration: {
        const declNode = node as ts.VariableDeclaration;

        if (!isRequireCall(declNode)) {
          break;
        }

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

        break;
      }

      case ts.SyntaxKind.CallExpression: {
        const callNode = node as ts.CallExpression;
        if (!ts.isIdentifier(callNode.expression)) {
          break;
        }

        const funcName = extractTextFromIdentifier(callNode.expression);

        if (!classNamesSpecifiers.includes(funcName)) {
          break;
        }

        const args = extractArgumentsFromClassnamesCall(callNode);
        const classNames = args.map((className): string => `.${className}`);

        classes.push(...classNames);

        break;
      }
    }
  }

  function visitor(node: ts.Node): void {
    handleClassNameAndIdAttributes(node);
    handleCSSModules(node);
    handleClassNames(node);

    ts.forEachChild(node, visitor);
  }

  visitor(sourceFile);

  return { classes, ids };
}

let cache: {
  ast: Undefinable<ts.SourceFile>;
  classes: string[];
  ids: string[];
} = {
  ast: undefined,
  classes: [],
  ids: [],
};

export function parse(tsx: string): void {
  const ast = ts.createSourceFile('foo.tsx', tsx, ts.ScriptTarget.Latest);

  const { classes, ids } = extractClassesAndIds(ast);

  cache.ast = ast;
  cache.classes = classes;
  cache.ids = ids;
}

export function match(selectorAst: PostcssSelectorParser.Root): boolean {
  if (cache.ast === undefined) {
    throw new Error('Call parse() before match().');
  }

  // Skip if the given selector is not composed of only one class or id.
  if (!isSimpleSelector(selectorAst)) {
    return true;
  }

  const selector = selectorAst.toString();
  const camelcaseSelector = selector.replace(/-./g, x=>x.toUpperCase()[1])

  if (cache.classes.includes(selector) || cache.classes.includes(camelcaseSelector)) {
    return true;
  }

  if (cache.ids.includes(selector)) {
    return true;
  }

  return false;
}
