import * as fs from 'fs';

export const getCoverage = (file: string): any => {
  const coverage = fs.readFileSync(file);
  return JSON.parse(coverage.toString());
};
