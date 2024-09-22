// import {temp_bus_factor_calc} from '../src/new_bus_factor_calc.js';
// import { expect, test } from 'vitest';
// import path from 'path';
// import fs from 'fs/promises';




// async function loadCommitData(fileName) {
// try {
//     const filePath = path.join(process.cwd(), fileName);
//     const data = await fs.readFile(filePath, 'utf8');
//     return JSON.parse(data);
// } catch (error) {
//     console.error(`Error loading commit data: ${error}`);
//     throw error;
// }
// }

// test('Test1 for bus factor ', async () => {
//     const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/hasansultancommits.json');
//     //expect((Array.isArray(commitData)) ).toBe(true)
//     expect(await temp_bus_factor_calc("",commitData)).toBeLessThan(0.5);
// });

// test('Test2 for bus factor ', async () => {
//     const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/mrdoobcommits.json');
//     expect(await temp_bus_factor_calc("",commitData)).toBeGreaterThan(0.5);
// });

// test('Test3 for bus factor ', async () => {
//     const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/lodashcommits.json');
//     expect(await temp_bus_factor_calc("",commitData)).toBeGreaterThan(0.5);
// }
// );

// test('Test4 for bus factor ', async () => {
//     const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/prathameshnetakecommts.json');
//     expect(await temp_bus_factor_calc("",commitData)).toBeLessThan(0.5);
// });

// test('Test5 for bus factor ', async () => {
//     const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/socketiocomitdata.json');
//     let factor = await temp_bus_factor_calc("",commitData);
//     expect(factor).toBeLessThan(0.78);
//     expect(factor).toBeGreaterThan(0.2);
// });

import { temp_bus_factor_calc } from '../src/new_bus_factor_calc.js';
import { expect, test, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';

let totalTests = 0;
let passedTests = 0;

async function loadCommitData(fileName) {
    try {
        const filePath = path.join(process.cwd(), fileName);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading commit data: ${error}`);
        throw error;
    }
}

async function runTest(testName, commitDataPath, expectedMin, expectedMax) {
    totalTests++;
    try {
        const commitData = await loadCommitData(commitDataPath);
        const factor = await temp_bus_factor_calc("", commitData);

        if (expectedMin !== undefined) {
            expect(factor).toBeGreaterThan(expectedMin);
        }
        if (expectedMax !== undefined) {
            expect(factor).toBeLessThan(expectedMax);
        }

        passedTests++;
        console.log(`${testName} - Passed`);
    } catch (error) {
        console.log(`${testName} - Failed: ${error.message}`);
    }
}

test('Test1 for bus factor', async () => {
    await runTest(
        'Test1 for bus factor',
        '/test/testing_data/commit_data_for_testing/hasansultancommits.json',
        undefined,
        0.5
    );
});

test('Test2 for bus factor', async () => {
    await runTest(
        'Test2 for bus factor',
        '/test/testing_data/commit_data_for_testing/mrdoobcommits.json',
        0.5
    );
});



test('Test3 for bus factor ', async () => {
    const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/prathameshnetakecommts.json');
    expect(await temp_bus_factor_calc("",commitData)).toBeLessThan(0.5);
});

test('Test4 for bus factor ', async () => {
    const commitData = await loadCommitData('/test/testing_data/commit_data_for_testing/socketiocomitdata.json');
    let factor = await temp_bus_factor_calc("",commitData);
    expect(factor).toBeLessThan(0.78);
    expect(factor).toBeGreaterThan(0.2);
});


