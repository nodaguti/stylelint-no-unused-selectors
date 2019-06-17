import PostcssSelectorParser from 'postcss-selector-parser';

// https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes
const ASSERTIVE_PSEUDO_CLASSES = [
  ':any-link',
  ':empty',
  ':first-child',
  ':first-of-type',
  ':has',
  ':is',
  ':last-child',
  ':last-of-type',
  ':link',
  ':not',
  ':nth-child',
  ':nth-last-child',
  ':nth-last-of-type',
  ':nth-of-type',
  ':only-child',
  ':only-of-type',
  ':where',
];

export function removeUnassertiveSelector(
  selector: PostcssSelectorParser.Root,
): PostcssSelectorParser.Root {
  selector.walkPseudos((pseudoNode: PostcssSelectorParser.Node): void => {
    const pseudoSelector = pseudoNode.value;

    if (!pseudoSelector) {
      return;
    }

    if (ASSERTIVE_PSEUDO_CLASSES.includes(pseudoSelector)) {
      return;
    }

    // Remove unassertive pseudo classes and all pseudo elements.
    pseudoNode.remove();
  });

  return selector;
}
