import fs from 'fs/promises';
import path from 'path';
//import {testPassed, testCount} from './testcount.js';
import extractTestResults from './extractresults.js';

try {
  const filePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  const filePath2 = path.join(process.cwd(), 'test-results.txt');
  const data = await fs.readFile(filePath, 'utf8');
  const coverageSummary = JSON.parse(data);
  const lineCoveragePct = coverageSummary.total.lines.pct;

  const { passed, total } = extractTestResults(filePath2);
  console.log(`${passed}/${total} test cases passed. ${lineCoveragePct.toFixed(0)}% line coverage achieved.`);

  //console.log(`Line coverage percentage: ${lineCoveragePct}%\n`);
} catch (error) {
  console.error('Error reading coverage file:', error);
}

