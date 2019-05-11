import path from 'path';
import { Undefinable } from 'option-t/lib/Undefinable';
import PostcssSelectorParser from 'postcss-selector-parser';
import { PluginSetting } from './options';

export interface Plugin {
  parse(document: string, pluginOptions?: unknown): void | Promise<void>;
  match(
    selectorAst: PostcssSelectorParser.Root,
    pluginOptions?: unknown,
  ): boolean | Promise<boolean>;
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

export async function getPlugin(
  docPath: string,
  pluginSettings: PluginSetting[],
): Promise<
  Undefinable<{
    plugin: Plugin;
    options: unknown;
  }>
> {
  for (const pluginSetting of pluginSettings) {
    if (!new RegExp(pluginSetting.test).test(docPath)) {
      continue;
    }

    const plugin = await importPlugin(pluginSetting.plugin);

    if (plugin === undefined) {
      continue;
    }

    return { plugin, options: pluginSetting.options };
  }

  return undefined;
}
