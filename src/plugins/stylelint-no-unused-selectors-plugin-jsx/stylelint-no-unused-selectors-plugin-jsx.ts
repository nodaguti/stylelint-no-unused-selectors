import * as BabelParser from '@babel/parser';
import traverse from '@babel/traverse';
import {
  File,
  Node,
  JSXAttribute,
  ImportDeclaration,
  VariableDeclarator,
  CallExpression,
  Identifier,
  ObjectProperty,
  StringLiteral,
} from '@babel/types';
import { Undefinable } from 'option-t/lib/Undefinable';
import { andThenForUndefinable } from 'option-t/lib/Undefinable/andThen';
import PostcssSelectorParser from 'postcss-selector-parser';

import { isSimpleSelector } from '../../utils/is-simple-selector';

function extractAttributeValue(node: JSXAttribute): Undefinable<string> {
  const valueNode = node.value;

  if (!valueNode || valueNode.type !== 'StringLiteral') {
    return;
  }

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

  const funcName = (node.init.callee as Identifier).name;
  return funcName === 'require';
}

function extractSpecifierFromRequire(
  node: VariableDeclarator,
  predicate: (node: VariableDeclarator) => boolean,
): Undefinable<string> {
  if (!predicate(node)) {
    return undefined;
  }

  return (node.id as Identifier).name;
}

function extractArgumentsFromClassnamesCall(node: CallExpression): string[] {
  const classes: string[] = [];

  node.arguments.forEach((arg): void => {
    switch (arg.type) {
      case 'StringLiteral': {
        const className = arg.value;
        if (className) {
          classes.push(className);
        }
        break;
      }

      case 'ObjectExpression': {
        const keys = arg.properties
          .filter((prop): boolean => prop.type === 'ObjectProperty')
          .map((prop): string => (prop as ObjectProperty).key.value)
          .filter((key): boolean => !!key);

        classes.push(...keys);
        break;
      }
    }
  });

  return classes;
}

function extractClassesAndIds(ast: File): { classes: string[]; ids: string[] } {
  const cssModuleSpecifiers: string[] = [];
  const classNamesSpecifiers: string[] = [];
  const classes: string[] = [];
  const ids: string[] = [];

  function handleClassNameAndIdAttributes(node: Node): void {
    switch (node.type) {
      case 'JSXAttribute': {
        if (node.name.name === 'className') {
          const classNames = extractAttributeValue(node);

          if (classNames) {
            const normalisedClassNames = classNames
              .split(' ')
              .filter((c): boolean => !!c)
              .map((c): string => `.${c}`);

            classes.push(...normalisedClassNames);
          }
        }

        if (node.name.name === 'id') {
          const idNames = extractAttributeValue(node);

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
        const specifiers = extractSpecifiersFromImport(
          node,
          (node): boolean => {
            return node.source.value.endsWith('.css');
          },
        );

        cssModuleSpecifiers.push(...specifiers);

        break;
      }

      case 'VariableDeclarator': {
        if (!isRequireCall(node)) {
          return;
        }

        const specifier = extractSpecifierFromRequire(node, (n): boolean => {
          const source = ((n.init as CallExpression)
            .arguments[0] as StringLiteral).value;
          return !!source && source.endsWith('.css');
        });

        andThenForUndefinable(
          specifier,
          (s): void => void cssModuleSpecifiers.push(s),
        );

        break;
      }

      case 'MemberExpression': {
        const objName = (node.object as Identifier).name;

        if (!cssModuleSpecifiers.includes(objName)) {
          break;
        }

        const className = node.property.value || node.property.name;
        classes.push(`.${className}`);

        break;
      }
    }
  }

  function handleClassNames(node: Node): void {
    switch (node.type) {
      case 'ImportDeclaration': {
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
        if (!isRequireCall(node)) {
          return;
        }

        const specifier = extractSpecifierFromRequire(node, (n): boolean => {
          const source = ((n.init as CallExpression)
            .arguments[0] as StringLiteral).value;
          return !!source && source === 'classnames';
        });

        andThenForUndefinable(
          specifier,
          (s): void => void classNamesSpecifiers.push(s),
        );

        break;
      }

      case 'CallExpression': {
        const funcName = (node.callee as Identifier).name;

        if (!classNamesSpecifiers.includes(funcName)) {
          break;
        }

        const args = extractArgumentsFromClassnamesCall(node);
        const classNames = args.map((className): string => `.${className}`);

        classes.push(...classNames);
      }
    }
  }

  traverse(ast, {
    enter(path): void {
      const { node } = path;
      handleClassNameAndIdAttributes(node);
      handleCSSModules(node);
      handleClassNames(node);
    },
  });

  return { classes, ids };
}

let cache: {
  ast: Undefinable<File>;
  classes: string[];
  ids: string[];
} = {
  ast: undefined,
  classes: [],
  ids: [],
};

export function parse(jsx: string, parserOptions: unknown): void {
  const ast = BabelParser.parse(
    jsx,
    parserOptions as BabelParser.ParserOptions,
  );
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
