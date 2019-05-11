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
    return plugin;
  } catch {
    try {
      const plugin = await import(path.join(__dirname, 'plugins', pluginName));
      return plugin;
    } catch {
      return undefined;
    }
  }
}

export async function getPlugin(docPath: string): Promise<Undefinable<Plugin>> {
  const ext = path.extname(docPath);
  let pluginName: Undefinable<string> = undefined;

  switch (ext) {
    case '.html':
    case '.htm': {
      pluginName = 'stylelint-no-unused-selectors-plugin-html';
      break;
    }

    case '.jsx':
    case '.js': {
      pluginName = 'stylelint-no-unused-selectors-plugin-jsx';
      break;
    }

    case '.tsx': {
      pluginName = 'stylelint-no-unused-selectors-plugin-tsx';
      break;
    }
  }

  if (pluginName === undefined) {
    return undefined;
  }

  const plugin = await importPlugin(pluginName);
  return plugin;
}
