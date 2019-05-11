import stylelint from 'stylelint';

export function parseResult(result: stylelint.LinterResult): unknown {
  const parsedOutputs = JSON.parse(result.output);

  if (parsedOutputs.length > 1) {
    throw Error('More than one result received');
  }

  const output = parsedOutputs[0];
  const { source: _, ...filteredOutput } = output;

  return filteredOutput;
}
