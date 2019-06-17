import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import format from 'string-template';
import { Undefinable } from 'option-t/lib/Undefinable';

const readFile = promisify(fs.readFile);

export function resolveDocuments(
  cssPath: string,
  documents: string[],
): string[] {
  const parsed = path.parse(cssPath);
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
