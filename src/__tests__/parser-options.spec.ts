import path from 'path';
import stylelint, { Configuration } from 'stylelint';

const fixturesRoot = path.join(__dirname, '..', '..', 'examples', 'jsx');

const createConfig = (isEnabled = true): Partial<Configuration> => ({
  plugins: [path.join(__dirname, '..', '..', 'dist', 'index.js')],
  rules: {
    'plugin/no-unused-selectors': [
      isEnabled,
      {
        plugins: [
          {
            test: '\\.jsx?$',
            plugin: 'stylelint-no-unused-selectors-plugin-jsx',
            options: {
              sourceType: 'module',
              plugins: [],
            },
          },
        ],
      },
    ],
  },
});

test('Throws a parse error when plugins in the @babel/parser options are left empty and a jsx file is tried to be linted', async (): Promise<
  void
> => {
  const options = {
    config: createConfig(),
    files: path.join(fixturesRoot, '*.css'),
  };

  let err: unknown;

  try {
    await stylelint.lint(options);
  } catch (ex) {
    err = ex;
  } finally {
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toMatch('Unexpected token');
  }
});

test('Does nothing if rule is disabled', async (): Promise<void> => {
  const options = {
    config: createConfig(false),
    files: path.join(fixturesRoot, '*.css'),
  };

  const result = await stylelint.lint(options);

  expect(result.errored).toBe(false);
});
