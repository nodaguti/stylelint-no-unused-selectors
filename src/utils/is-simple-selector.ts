import PostcssSelectorParser from 'postcss-selector-parser';

export function isSimpleSelector(
  rootNode: PostcssSelectorParser.Root,
): boolean {
  const selectorNode = rootNode.nodes[0] as PostcssSelectorParser.Selector;

  if (selectorNode.nodes.length !== 1) {
    return false;
  }

  const type = selectorNode.nodes[0].type;

  return (
    type === PostcssSelectorParser.ID || type === PostcssSelectorParser.CLASS
  );
}
