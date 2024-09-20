
import { metric_manager } from './metric_manager.js';
import {isGithubTokenValid} from './github_checker.js';
import { urlhandler } from './urlhandler.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import logger from './logging.js';
import {output_formatter} from './output_formatter.js';




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
//get the file path from the command line in run file
const filePath = process.argv[2];

if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
}

console.log(`The file path is: ${filePath}`);

// const filePath = path.join(__dirname, 'URL_FILE.txt'); // Path to your URL file

// Read URLs from the file
fs.readFile(filePath, 'utf8', async (err, data) => {
    if (err) {
        console.error('Error reading URL file:', err);
        process.exit(1);
    }
    if( await isGithubTokenValid(process.env.GITHUB_TOKEN) === false){
        process.exit(1);}

    
    // Split the file content into individual URLs (assuming each URL is on a new line)
    const urls = data.split('\n').filter(Boolean); // Filter to remove any empty lines

    for (const url of urls) {
        try {
            // Call the urlHandler to process each URL
            console.log(`Processing URL: ${url}`);
            logger.info(`Processing URL: ${url}`);
            logger.debug(`Processing URL: ${url}`);
            
            const handler = new urlhandler(url); // Initialize handler with individual URL
          
            
            const data = await handler.handle(); // Call handler to process the URL
            const gitUrl = await handler.url;
            const contributors = await handler.contributors;
            const issues = await handler.issues;
            const pullRequests = await handler.pullRequests;
            const commits = await handler.commits;
            

            // Once the URL is processed, create and compute the metric
            const test_metric = new metric_manager(data, contributors, issues, pullRequests, commits, gitUrl);
            const metric_array = await test_metric.parallel_metric_and_net_score_calc();
            
             //console.log(
                 //`Bus Factor Score: ${metric_array[0]}\n` +
                 //`Bus Factor Latency: ${test_metric.bus_factor_latency}\n` +
                 //`Correctness Score: ${metric_array[1]}\n` +
                 //`Correctness Latency: ${test_metric.correctness_latency}\n` +
                 //`Ramp Up Score: ${metric_array[2]}\n` +
                 //`Ramp Up Latency: ${test_metric.ramp_up_latency}\n` +
                 //`Maintainer Score: ${metric_array[3]}\n` +
                 //`Maintainer Latency: ${test_metric.maintainer_latency}\n` +
                 //`License Score: ${metric_array[4]}\n` +
                 //`License Latency: ${test_metric.license_latency}\n` +
                 //`Net Score: ${metric_array.reduce((a, b) => a + b, 0)}\n` +
                 //`Net Score Latency: ${test_metric.net_score_latency}\n`
             //)//;
            logger.info("Net Score, Net Latency: ", metric_array.reduce((a, b) => a + b, 0), test_metric.net_score_latency);
            output_formatter(url, metric_array, test_metric);

        } catch (error) {
            console.error(`Error processing URL ${url}:`, error);
        }
    }
});

