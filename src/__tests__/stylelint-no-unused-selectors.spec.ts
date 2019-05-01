import path from 'path';
import stylelint from 'stylelint';

const fixturesRoot = path.join(__dirname, '..', '..', 'examples');
const configFilePath = path.join(fixturesRoot, '.stylelintrc.js');

function parseResult(result: stylelint.LinterResult): unknown {
  const parsedOutputs = JSON.parse(result.output);

  if (parsedOutputs.length > 1) {
    throw Error('More than one result received');
  }

  const output = parsedOutputs[0];
  const { source: _, ...filteredOutput } = output;

  return filteredOutput;
}

test('Disabllow selectors that are not used in a HTML file', async (): Promise<
  void
> => {
  const options = {
    configFile: configFilePath,
    files: path.join(fixturesRoot, 'html', '*.css'),
  };

  const result = await stylelint.lint(options);

  expect(result.errored).toBe(true);
  expect(parseResult(result)).toMatchSnapshot();
});

test('Disabllow selectors that are not used in a JSX file', async (): Promise<
  void
> => {
  const options = {
    configFile: configFilePath,
    files: path.join(fixturesRoot, 'jsx', '*.css'),
  };

  const result = await stylelint.lint(options);

  expect(result.errored).toBe(true);
  expect(parseResult(result)).toMatchSnapshot();
});

test('Disabllow selectors that are not used in a JSX file using CSS Modules', async (): Promise<
  void
> => {
  const options = {
    configFile: configFilePath,
    files: path.join(fixturesRoot, 'jsx-with-css-modules', '*.css'),
  };

  const result = await stylelint.lint(options);

  expect(result.errored).toBe(true);
  expect(parseResult(result)).toMatchSnapshot();
});
