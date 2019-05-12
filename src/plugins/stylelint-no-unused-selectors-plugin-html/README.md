# stylelint-no-unused-selectors-plugin-html

This is a built-in plugin of `stylelint-no-unused-selector`.

It parses HTML files using [jsdom](https://github.com/jsdom/jsdom) and employs `document.querySelector` to check if a selector is used or not.

## Limitations

- [Pseudo elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements) are not supported.
- The support for [pseudo classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) is limited.
  - [Only few of them that don't depend on user interactions](https://github.com/nodaguti/stylelint-no-unused-selectors/blob/master/src/utils/remove-unassertive-selector.ts) are supported.
- Unsupported pseudo elements and classes are removed before being passed to `querySelector`.
  - For example, the plugin remains `.foo:nth-child(2n)` untouched whereas selectors like `.foo::before`, `.foo:hover` and `.foo:target` will be converted into `.foo` and considered as used if `.foo` is matched to any elements in a template.
