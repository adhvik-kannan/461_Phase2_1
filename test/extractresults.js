

import fs from 'fs';
import path from 'path';

// Function to extract test results
export default function extractTestResults(filePath) {
    // Read the file
    const data = fs.readFileSync(filePath, 'utf8');

    // Regular expression to find the line containing test results
    const regex = /Tests\s+(\d+)\s+passed\s+\((\d+)\)/;

    // Match the regex against the data
    const match = data.match(regex);

    if (match) {
        const passed = match[1]; // Number of passed tests
        const total = match[2];   // Total number of tests
        //console.log(`${passed}/${total} test cases passed`);
        return { passed, total };
    } else {
        console.log('Test results not found');
    }
}

// Specify the path to your text file
//const filePath = path.join(__dirname, 'path/to/your/test_results.txt');

// Call the function

