import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import format from 'string-template';
import { Undefinable } from 'option-t/lib/Undefinable';

const readFile = promisify(fs.readFile);

export function resolveDocuments(
  cssPath: string,
  suffixesToStrip: string[],
  documents: string[],
): string[] {
  let parsed = path.parse(cssPath);

  const applicableSuffix = suffixesToStrip.find((suffix): boolean =>
    parsed.name.toLowerCase().endsWith(suffix.toLowerCase()),
  );
  if (applicableSuffix) {
    parsed = {
      ...parsed,
      name: parsed.name.substring(
        0,
        parsed.name.length - applicableSuffix.length,
      ),
    };
  }

  const resolved = documents.map((doc): string =>
    format(doc, {
      cssDir: parsed.dir,
      cssDirName: path.basename(parsed.dir),
      cssName: parsed.name,
    }),
  );

  return resolved;
}

export async function resolveDocument(
  paths: string[],
): Promise<
  Undefinable<{
    path: string;
    document: string;
  }>
> {
  for (const path of paths) {
    try {
      const content = await readFile(path, { encoding: 'utf-8' });
      return {
        path,
        document: content.toString(),
      };
    } catch {} // eslint-disable-line no-empty
  }

  return undefined;
}
