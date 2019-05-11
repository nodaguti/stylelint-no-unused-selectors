import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';

export interface Plugin {
  parse(document: string): void | Promise<void>;
  match(selectorAst: PostcssSelectorParser.Root): boolean | Promise<boolean>;
}

async function importPlugin(pluginName: string): Promise<Undefinable<Plugin>> {
  try {
    const plugin = await import(pluginName);
    return plugin.default;
  } catch {
    try {
      const plugin = await import(path.join(__dirname, 'plugins', pluginName));
      return plugin.default;
    } catch {
      return undefined;
    }
  }
}

export async function getPlugin(docPath: string): Promise<Undefinable<Plugin>> {
  const ext = path.extname(docPath);
  let Plugin: Undefinable<Plugin> = undefined;

  switch (ext) {
    case '.html':
    case '.htm': {
      const pluginName = 'stylelint-no-unused-selectors-plugin-html';
      Plugin = await importPlugin(pluginName);

      break;
    }

    case '.jsx':
    case '.js': {
      const pluginName = 'stylelint-no-unused-selectors-plugin-jsx';
      Plugin = await importPlugin(pluginName);

      break;
    }

    case '.tsx': {
      const pluginName = 'stylelint-no-unused-selectors-plugin-tsx';
      Plugin = await importPlugin(pluginName);

      break;
    }
  }

  if (Plugin !== undefined) {
    // @ts-ignore
    return new Plugin();
  }

  return undefined;
}
