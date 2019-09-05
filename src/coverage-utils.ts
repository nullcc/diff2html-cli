import * as fs from 'fs';
const transformer = require('istanbul-lib-source-maps/lib/transformer');
import { createCoverageMap } from 'istanbul-lib-coverage';
import { SourceMapConsumer } from 'source-map';

export const getCoverage = (file: string): any => {
  const coverage = fs.readFileSync(file);
  return getSourceCodeCoverage(JSON.parse(coverage.toString()));
};

export const getSourceCodeCoverage = async (coverageData: any) => {
  const result = {};
  const randomFileCov = randomProperty(coverageData);
  if (!randomFileCov.inputSourceMap) { // already source code coverage data, just return
    return coverageData
  }
  for (const key in coverageData) {
    const fileCov = coverageData[key];
    const coverageMap = createCoverageMap({});
    coverageMap.addFileCoverage(fileCov);
    const finder = await new SourceMapConsumer(fileCov.inputSourceMap);
    const mapped = transformer.create(() => finder).transform(coverageMap);
    Object.assign(result, mapped.data);
  }
  return result;
};

const randomProperty = (obj: any) => {
  const keys = Object.keys(obj);
  return obj[keys[ keys.length * Math.random() << 0]];
};
