import path from 'path';
import stylelint from 'stylelint';
import { parseResult } from './__helpers__/parse-result';

const fixturesRoot = path.join(
  __dirname,
  '..',
  '..',
  'examples',
  'jsx-with-css-modules',
);
const configFilePath = path.join(fixturesRoot, '.stylelintrc.js');

test('Disabllow selectors that are not used in a JSX file using CSS Modules', async (): Promise<
  void
> => {
  const options = {
    configFile: configFilePath,
    files: path.join(fixturesRoot, '*.css'),
  };

  const result = await stylelint.lint(options);

  expect(result.errored).toBe(true);
  expect(parseResult(result)).toMatchSnapshot();
});
