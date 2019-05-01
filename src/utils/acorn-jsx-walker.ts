// @ts-ignore
import { make as makeWalker } from 'acorn-walk';
import {
  JSXAttribute,
  JSXElement,
  JSXExpressionContainer,
  JSXOpeningElement,
  JSXNamespacedName,
  JSXMemberExpression,
  JSXSpreadAttribute,
  JSXClosingElement,
  JSXFragment,
} from '@babel/types';

export const jsxWalker = makeWalker({
  JSXElement(node: JSXElement, state: unknown, callback: Function): void {
    callback(node.openingElement, state);

    node.children.forEach(
      (child): void => {
        callback(child, state);
      },
    );

    if (node.closingElement !== null) {
      callback(node.closingElement, state);
    }
  },

  JSXOpeningElement(
    node: JSXOpeningElement,
    state: unknown,
    callback: Function,
  ): void {
    callback(node.name, state);

    node.attributes.forEach(
      (attribute): void => {
        callback(attribute, state);
      },
    );
  },

  JSXClosingElement(
    node: JSXClosingElement,
    state: unknown,
    callback: Function,
  ): void {
    callback(node.name, state);
  },

  JSXFragment(node: JSXFragment, state: unknown, callback: Function): void {
    callback(node.openingFragment, state);

    node.children.forEach(
      (child): void => {
        callback(child, state);
      },
    );

    callback(node.closingFragment, state);
  },

  JSXOpeningFragment(): void {},
  JSXClosingFragment(): void {},

  JSXAttribute(node: JSXAttribute, state: unknown, callback: Function): void {
    callback(node.name);
    callback(node.value);
  },

  JSXExpressionContainer(
    node: JSXExpressionContainer,
    state: unknown,
    callback: Function,
  ): void {
    callback(node.expression, state);
  },

  JSXNamespacedName(
    node: JSXNamespacedName,
    state: unknown,
    callback: Function,
  ): void {
    callback(node.namespace, state);
    callback(node.name, state);
  },

  JSXMemberExpression(
    node: JSXMemberExpression,
    state: unknown,
    callback: Function,
  ): void {
    callback(node.object, state);
    callback(node.property, state);
  },

  JSXSpreadAttribute(
    node: JSXSpreadAttribute,
    state: unknown,
    callback: Function,
  ): void {
    callback(node.argument, state);
  },

  JSXText(): void {},
  JSXIdentifier(): void {},
  JSXEmptyExpression(): void {},
});
