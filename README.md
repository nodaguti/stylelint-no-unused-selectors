# stylelint-no-unused-selectors

[![CircleCI](https://circleci.com/gh/nodaguti/stylelint-no-unused-selectors.svg?style=svg)](https://circleci.com/gh/nodaguti/stylelint-no-unused-selectors) [![Dependabot](https://flat.badgen.net/dependabot/nodaguti/stylelint-no-unused-selectors?icon=dependabot)](https://dependabot.com/) [![MIT License](https://img.shields.io/npm/l/stylelint-no-unused-selectors.svg)](https://github.com/nodaguti/stylelint-no-unused-selectors/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/stylelint-no-unused-selectors.svg)](https://www.npmjs.com/package/stylelint-no-unused-selectors)

## Concepts

`stylelint-no-unused-selectors` is a [stylelint](https://github.com/stylelint/stylelint) rule to disallow unused CSS selectors.

It works best with component-oriented applications where views are built on top of a lot of small components, each of which contains a template file (e.g., jsx or tsx) and its corresponding scoped CSS file (e.g., CSS Modules or PostCSS with BEM).

Assuming your component consists of following files:

```
FooComponent
├── index.js
├── FooComponent.jsx
└── FooComponent.css
```

when `stylelint-no-unused-selectors` runs on FooComponent.css, it extracts `class`es and `id`s from FooComponent.jsx and detects unused CSS rules.

## Features

If you'd like to jump into code, you can find [our examples in the repository](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/examples) that are close to real-world situations.

With the built-in plugins, it supports

- HTML via [stylelint-no-unused-selectors-plugin-html](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/src/plugins/stylelint-no-unused-selectors-plugin-html)
- React components written in pure JavaScript, JSX, flow-typed JSX, JSX + future syntaxes in TC39 proposals via [stylelint-no-unused-selectors-plugin-jsx](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/src/plugins/stylelint-no-unused-selectors-plugin-jsx)
- React components written in TypeScript via [stylelint-no-unused-selectors-plugin-tsx](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/src/plugins/stylelint-no-unused-selectors-plugin-tsx)
- [CSS Modules](https://github.com/css-modules/css-modules)
- Basic usages of [`classnames`](https://github.com/JedWatson/classnames) package

See [the documentations of built-in plugins](#built-in-plugins) for more details.

## Installation

```
yarn add stylelint stylelint-no-unused-selectors
```

## Usage

It works as a [stylelint](https://github.com/stylelint/stylelint) rule, and its plugin name is `plugin/no-unused-selectors`. An example configuration of stylelint would look like:

```
{
  "plugins": [
    "stylelint-no-unused-selectors"
  ],
  "rules": {
    "plugin/no-unused-selectors": true
  }
}
```

See [stylelint's documentation](https://github.com/stylelint/stylelint#getting-started) for more details.

## Configuration

By passing a configuration object described below as the rule's setting value, you can customise the rule's behaviours.

The default configuration is:

```json
{
  "rules": {
    "plugin/no-unused-selectors": {
      "resolve": {
        "documents": [
          "{cssDir}/{cssName}.tsx",
          "{cssDir}/{cssName}.jsx",
          "{cssDir}/{cssName}.html",
          "{cssDir}/{cssName}.htm",
          "{cssDir}/{cssDirName}.tsx",
          "{cssDir}/{cssDirName}.jsx",
          "{cssDir}/{cssDirName}.html",
          "{cssDir}/{cssDirName}.htm",
          "{cssDir}/index.tsx",
          "{cssDir}/index.jsx",
          "{cssDir}/index.html",
          "{cssDir}/index.htm"
        ]
      },
      "plugins": [
        {
          "test": "\\.html?$",
          "plugin": "stylelint-no-unused-selectors-plugin-html"
        },
        {
          "test": "\\.jsx?$",
          "plugin": "stylelint-no-unused-selectors-plugin-jsx",
          "options": {
            "sourceType": "module",
            "plugins": ["jsx", "flow"]
          }
        },
        {
          "test": "\\.tsx$",
          "plugin": "stylelint-no-unused-selectors-plugin-tsx"
        }
      ]
    }
  }
}
```

### resolve.documents

Type: `Array<string>`

This field tells the rule how to find a template file from a CSS file. The paths are evaluated from the top to the bottom and the first path that exists will be used.

Available variables are as follows:

| Name           | Description                                       | Example (/project_root/components/Foo/Bar.css) |
| -------------- | ------------------------------------------------- | ---------------------------------------------- |
| `{cssDir}`     | The path to a directory that contains a CSS file  | /project_root/components/Foo                   |
| `{cssDirName}` | The name of a directory that contains a CSS file  | Foo                                            |
| `{cssName}`    | The file name of a CSS file without its extension | Bar                                            |

### plugins

Type: `Array<Plugin>`

`stylelint-no-unused-selectors` relies on plugins to extract `className`s/`id`s and/or determine if a selector is used in a template file.

#### Plugin.test

Type: `string` (the value will be directly compiled with `new RegExp()`)

`Plugin.test` represents what kind of template files should be processed with a plugin.

#### Plugin.plugin

Type: `string`

A name of a plugin that is applied to template files, which is identical to its package name.

#### Plugin.options

Type: `any` (optional)

An optional object that will be passed to a plugin, which can be used as parser's configurations or to change the plugin's behaviour. See each plugin's document to know what kind of options are available.

## Plugins

### Built-in Plugins

- [stylelint-no-unused-selectors-plugin-html](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/src/plugins/stylelint-no-unused-selectors-plugin-html)
- [stylelint-no-unused-selectors-plugin-jsx](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/src/plugins/stylelint-no-unused-selectors-plugin-jsx)
- [stylelint-no-unused-selectors-plugin-tsx](https://github.com/nodaguti/stylelint-no-unused-selectors/tree/master/src/plugins/stylelint-no-unused-selectors-plugin-tsx)

### Writing a new plugin

(To be written)

## License

[The MIT License](https://raw.githubusercontent.com/nodaguti/stylelint-no-unused-selectors/master/LICENSE).

## Existing Tools

Please note that all the following tools are to remove unused rules, not to lint CSS files.

- [UnCSS](https://github.com/uncss/uncss) uses a similar postcss and jsdom approach, but it can only run on pure HTML code.
- [DropCSS](https://github.com/leeoniya/dropcss) has its own HTML and CSS parsers, which contributes to fast and thorough cleanup outputs. It can only run on pure HTML code though.
- [PurifyCSS](https://github.com/purifycss/purifycss) accepts various types of document including HTML, JS and PHP. It has an unique feature that simplifies JS via UglifyJS to extract classNames even if they are constructed dynamically. It detects classNames based on regular expressions, which unfortunately might account for its relatively high false negative rate.
- [PurgeCSS](https://github.com/FullHuman/purgecss) is a highly customisable tool thanks to its flexible plugin system. It can run on any kinds of contents as long as there is a plugin.
