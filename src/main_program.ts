
import { metric_manager } from './metric_manager';
import { URLHandler } from './urlHandler';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, 'URL_FILE.txt'); // Path to your URL file

// Read URLs from the file
fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading URL file:', err);
        return;
    }

    // Split the file content into individual URLs (assuming each URL is on a new line)
    const urls = data.split('\n').filter(Boolean); // Filter to remove any empty lines

    for (const url of urls) {
        try {
            // Call the urlHandler to process each URL
            console.log(`Processing URL: ${url}`);
            const handler = new URLHandler(url); // Initialize handler with individual URL
            await handler.handle(); // Call handler to process the URL

            // Once the URL is processed, create and compute the metric
            const test_metric = new metric_manager();
            const metric_array = await test_metric.parallel_metric_and_net_score_calc();

            // Log the results for this URL
            console.log(
                `Bus Factor Score: ${metric_array[0]}\n` +
                `Bus Factor Latency: ${test_metric.bus_factor_latency}\n` +
                `Correctness Score: ${metric_array[1]}\n` +
                `Correctness Latency: ${test_metric.correctness_latency}\n` +
                `Ramp Up Score: ${metric_array[2]}\n` +
                `Ramp Up Latency: ${test_metric.ramp_up_latency}\n` +
                `Maintainer Score: ${metric_array[3]}\n` +
                `Maintainer Latency: ${test_metric.maintainer_latency}\n` +
                `License Score: ${metric_array[4]}\n` +
                `License Latency: ${test_metric.license_latency}\n` +
                `Net Score: ${metric_array.reduce((a, b) => a + b, 0)}\n` +
                `Net Score Latency: ${test_metric.net_score_latency}\n`
            );
        } catch (error) {
            console.error(`Error processing URL ${url}:`, error);
        }
    }
});




/*


import {metric_manager} from './metric_manager';

const test_metric: metric_manager = new metric_manager();
test_metric.parallel_metric_and_net_score_calc()
    .then(metric_array => {
        console.log(
            `Bus Factor Score: ${metric_array[0]}\n` +
            `Bus Factor Latency: ${test_metric.bus_factor_latency}\n` +
            `Correctness Score: ${metric_array[1]}\n` +
            `Correctness Latency: ${test_metric.correctness_latency}\n` +
            `Ramp Up Score: ${metric_array[2]}\n` +
            `Ramp Up Latency: ${test_metric.ramp_up_latency}\n` +
            `Maintainer Score: ${metric_array[3]}\n` +
            `Maintainer Latency: ${test_metric.maintainer_latency}\n` +
            `License Score: ${metric_array[4]}\n` +
            `License Latency: ${test_metric.license_latency}\n` +
            `Net Score: ${metric_array.reduce((a,b) => a + b, 0)}\n` +
            `Net Score Latency: ${test_metric.net_score_latency}\n`
        );
    })
    .catch(error => {
        console.error('Error computing metrics for given package:', error);
    });

    */

