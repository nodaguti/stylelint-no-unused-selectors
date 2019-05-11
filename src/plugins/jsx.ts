import { Parser as AcornParser, Node } from 'acorn';
// @ts-ignore
import acornJSX from 'acorn-jsx';
// @ts-ignore
import { full as walkFull } from 'acorn-walk';
// FIXME: There are lots of @ts-ignore's in this file due to the differences between
// AST of babylon (@babel/types) and that of acorn.
import {
  JSXAttribute,
  ImportDeclaration,
  MemberExpression,
  VariableDeclarator,
  CallExpression,
  Identifier,
  StringLiteral,
} from '@babel/types';
import { Undefinable } from 'option-t/lib/Undefinable';
import { andThenForUndefinable } from 'option-t/lib/Undefinable/andThen';
import PostcssSelectorParser from 'postcss-selector-parser';
// @ts-ignore
import removeFlowTypes from 'flow-remove-types';

import { Plugin } from '../plugin';
import { jsxWalker } from '../utils/acorn-jsx-walker';
import { isSimpleSelector } from '../utils/is-simple-selector';

const acornOptions = {
  sourceType: 'module' as const,
};

const JSXAcornParser = AcornParser.extend(acornJSX());

function extractAttributeValue(node: JSXAttribute): Undefinable<string> {
  const valueNode = node.value;

  // @ts-ignore
  if (valueNode.type !== 'Literal') {
    return;
  }

  // @ts-ignore
  return valueNode.value;
}

function extractSpecifiersFromImport(
  node: ImportDeclaration,
  predicate: (node: ImportDeclaration) => boolean,
): string[] {
  if (!predicate(node)) {
    return [];
  }

  return node.specifiers.map((specifier): string => specifier.local.name);
}

function isRequireCall(node: VariableDeclarator): boolean {
  if (!node.init || node.init.type !== 'CallExpression') {
    return false;
  }

  const callExpr = node.init as CallExpression;

  // @ts-ignore
  const funcName: string = callExpr.callee.name;
  return funcName === 'require';
}

function extractSpecifierFromRequire(
  node: VariableDeclarator,
  predicate: (node: VariableDeclarator) => boolean,
): Undefinable<string> {
  if (!predicate(node)) {
    return undefined;
  }

  // @ts-ignore
  return node.id.name;
}

function extractArgumentsFromClassnamesCall(node: CallExpression): string[] {
  const classes: string[] = [];

  node.arguments.forEach(
    (arg): void => {
      switch (arg.type) {
        // @ts-ignore
        case 'Literal': {
          const className = (arg as StringLiteral).value;
          if (className) {
            classes.push(className);
          }
          break;
        }

        case 'ObjectExpression': {
          const keys = arg.properties
            // @ts-ignore
            .map((prop): string => prop.key.value)
            .filter((key): boolean => !!key);

          classes.push(...keys);
          break;
        }
      }
    },
  );

  return classes;
}

function extractClassesAndIds(ast: Node): { classes: string[]; ids: string[] } {
  const cssModuleSpecifiers: string[] = [];
  const classNamesSpecifiers: string[] = [];
  const classes: string[] = [];
  const ids: string[] = [];

  function handleClassNameAndIdAttributes(node: Node): void {
    switch (node.type) {
      case 'JSXAttribute': {
        // @ts-ignore
        const attrNode = node as JSXAttribute;

        if (attrNode.name.name === 'className') {
          const classNames = extractAttributeValue(attrNode);

          if (classNames) {
            const normalisedClassNames = classNames
              .split(' ')
              .filter((c): boolean => !!c)
              .map((c): string => `.${c}`);

            classes.push(...normalisedClassNames);
          }
        }

        if (attrNode.name.name === 'id') {
          const idNames = extractAttributeValue(attrNode);

          if (idNames) {
            const normalisedIdNames = idNames
              .split(' ')
              .filter((i): boolean => !!i)
              .map((i): string => `#${i}`);

            ids.push(...normalisedIdNames);
          }
        }

        break;
      }
    }
  }

  function handleCSSModules(node: Node): void {
    switch (node.type) {
      case 'ImportDeclaration': {
        // @ts-ignore
        const declNode = node as ImportDeclaration;
        const specifiers = extractSpecifiersFromImport(
          declNode,
          (node): boolean => {
            return node.source.value.endsWith('.css');
          },
        );

        cssModuleSpecifiers.push(...specifiers);

        break;
      }

      case 'VariableDeclarator': {
        // @ts-ignore
        const declNode = node as VariableDeclarator;

        if (!isRequireCall(declNode)) {
          return;
        }

        const specifier = extractSpecifierFromRequire(
          declNode,
          (node): boolean => {
            // @ts-ignore
            const source: string = node.init.arguments[0].value;
            return !!source && source.endsWith('.css');
          },
        );

        andThenForUndefinable(
          specifier,
          (s): void => void cssModuleSpecifiers.push(s),
        );

        break;
      }

      case 'MemberExpression': {
        // @ts-ignore
        const exprNode = node as MemberExpression;
        // @ts-ignore
        const objName: string = exprNode.object.name;

        if (!cssModuleSpecifiers.includes(objName)) {
          break;
        }

        const className = exprNode.property.value || exprNode.property.name;
        classes.push(`.${className}`);

        break;
      }
    }
  }

  function handleClassNames(node: Node): void {
    switch (node.type) {
      case 'ImportDeclaration': {
        // @ts-ignore
        const declNode = node as ImportDeclaration;
        const specifiers = extractSpecifiersFromImport(
          declNode,
          (node): boolean => {
            return node.source.value === 'classnames';
          },
        );

        classNamesSpecifiers.push(...specifiers);

        break;
      }

      case 'VariableDeclarator': {
        // @ts-ignore
        const declNode = node as VariableDeclarator;

        if (!isRequireCall(declNode)) {
          return;
        }

        const specifier = extractSpecifierFromRequire(
          declNode,
          (node): boolean => {
            // @ts-ignore
            const source: string = node.init.arguments[0].value;
            return !!source && source === 'classnames';
          },
        );

        andThenForUndefinable(
          specifier,
          (s): void => void classNamesSpecifiers.push(s),
        );

        break;
      }

      case 'CallExpression': {
        // @ts-ignore
        const callNode = node as CallExpression;
        const funcName = (callNode.callee as Identifier).name;

        if (!classNamesSpecifiers.includes(funcName)) {
          break;
        }

        const args = extractArgumentsFromClassnamesCall(callNode);
        const classNames = args.map((className): string => `.${className}`);

        classes.push(...classNames);
      }
    }
  }

  function visitor(node: Node): void {
    handleClassNameAndIdAttributes(node);
    handleCSSModules(node);
    handleClassNames(node);
  }

  walkFull(ast, visitor, jsxWalker);

  return { classes, ids };
}

export class JSXPlugin implements Plugin {
  private _ast: Undefinable<Node>;
  private _classes: string[];
  private _ids: string[];

  public constructor() {
    this._ast = undefined;
    this._classes = [];
    this._ids = [];
  }

  public parse(jsx: string): void {
    const jsxWithoutFlow = removeFlowTypes(jsx);
    const ast = JSXAcornParser.parse(jsxWithoutFlow, acornOptions);
    const { classes, ids } = extractClassesAndIds(ast);

    this._ast = ast;
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
