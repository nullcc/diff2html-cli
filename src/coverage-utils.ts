import * as fs from 'fs';
const transformer = require('istanbul-lib-source-maps/lib/transformer');
import { createCoverageMap } from 'istanbul-lib-coverage';
import { SourceMapConsumer } from 'source-map';

export const getCoverage = (file: string): any => {
  const coverage = fs.readFileSync(file);
  return getSourceCodeCoverage(JSON.parse(coverage.toString()));
};

export const getSourceCodeCoverage = async (compiledJsCoverage: any) => {
  const result = {};
  for (const key in compiledJsCoverage) {
    const coverage = compiledJsCoverage[key];
    const coverageMap = createCoverageMap({});
    coverageMap.addFileCoverage(coverage);
    const finder = await new SourceMapConsumer(coverage.inputSourceMap);
    const mapped = transformer.create(() => finder).transform(coverageMap);
    Object.assign(result, mapped.data);
  }
  return result;
};
