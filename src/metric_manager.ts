// all 'return 1;' statements are placeholders for actual calculations
import { Octokit } from "@octokit/rest";
import { gitAPIHandler } from "./gitAPIHandler.js";
import { maintainer_net } from "./maintainer_calculator.js";
import { temp_license } from "./template_for_license.js";
import { cloneRepository } from "./github_utils.js";
import { temp_bus_factor_calc } from "./new_bus_factor_calc.js";
import logger from './logging.js'
import fs from 'fs';
import path from "path";
import os from "os";

//import { temp_bus_factor_calc } from "./bus_factor_calc.js";
import { calculateRampUpScore } from './rampUp.js'; // Assuming rampUp contains ESLint logic

function roundToNumDecimalPlaces(val: number, num_decimal_places: number) {
    return Math.round(val * Math.pow(10, num_decimal_places)) / Math.pow(10, num_decimal_places);
}

export class metric_manager {
    // will need a lot of attributes, including the input arguments from API handlers
    public bus_factor_latency: number;
    public correctness_latency: number;
    public ramp_up_latency: number;
    public maintainer_latency: number;
    public license_latency: number;
    public net_score_latency: number;
    public metadata: any;
    public contributors: any;
    public issues: any;
    public pullRequests: any;
    public commits: any;
    public url:string;
    public data:any;
    public tempDir: string;

    constructor(data, contributors, issues, pullRequests, commits, url, tempDir /*a lot of arguments*/) {
        this.bus_factor_latency = 0;
        this.correctness_latency = 0;
        this.ramp_up_latency = 0;
        this.maintainer_latency = 0;
        this.license_latency = 0;
        this.net_score_latency = 0;
        this.metadata = data;
        this.contributors = contributors;
        this.issues = issues;
        this.pullRequests = pullRequests;
        this.commits = commits;
        this.url = url;
        this.data = data;
        this.tempDir = tempDir;
        //this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temp-repo-'));
        // this.tempDir= path.resolve(process.cwd(), 'repo');
        // cloneRepository(this.url, this.tempDir);

    }
    
    // functions for calculating each metric
    //public bus_factor_calc(): Promise<number> {
    public bus_factor_calc(){        
        const startTime = performance.now();
        // calculations for bus factor
        logger.debug("Calculating bus factor for github repo: ", this.url)
        let busfactor = temp_bus_factor_calc(this.url, this.commits);
        const endTime = performance.now();
        this.bus_factor_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return busfactor
     
    
        
    }
    public correctness_calc(): number {
        const startTime = performance.now();
        logger.debug("Calculating correctness ")
        // calculations for correctness factor

        const endTime = performance.now();
        this.correctness_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return 1;
    }

    public async calculateRampUpMetric(): Promise<number> {
        const startTime = Date.now();
        // Call the ramp-up score function, assuming repoData contains the necessary files
        //const rampUpScore = await calculateRampUpScore(this.data.files || []);
        const rampUpScore = await calculateRampUpScore(this.url,this.tempDir);
        const endTime = Date.now();
        this.ramp_up_latency = endTime - startTime;

        return rampUpScore; 
    }

    
    public maintainer_calc(): number {
        const startTime = performance.now();
        logger.debug("Calculating maintainer factor")
        let maintainer_score = maintainer_net(this.contributors, this.issues, this.pullRequests, this.commits);
        const endTime = performance.now();
        this.maintainer_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return maintainer_score;
    }
    public async licence_verify(/* accept API call (most likely string of file paths)*/): Promise<number> {
        // if file name is some combination of lowercase and capital letters to make the word 'license'
        // regex statement to do so: r'^(?i)license(\.)?[a-zA-z]*$'
            // make API call to retrieve contents of 'license' file
            // check to see if there is a regex match of GNU LGPL v2.1 compatible licenses
                // if so, return 1 (function end)
                // else, return to outer control
        // else, make API call to retrieve contents of 'readME' file
            // check to see if there is a regex match of GNU LGPL v2.1 compatible licenses (should be under markdown heading
                    // called 'license', need to check if there is a more efficient way to skip to this heading)
                // if so, return 1 (function end)
                // else, return 0, as license will appear nowhere else in the package (function end)
        const startTime = performance.now();
       
        // calculations for license verification
        logger.debug("Calculating license verification")
        let license_score = await temp_license(this.url, this.tempDir);
        const endTime = performance.now();
        this.license_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        if (license_score === true) {
            return 1;
        }
        else {
            return 0;
        }
    }

    // run all the metrics in parallel and calculate the net score
    public async parallel_metric_and_net_score_calc() {
        //fs.rmSync(await this.tempDir, { recursive: true, force: true });
        //logger.info("Temporary repository directory removed:", this.tempDir);
        const startTime = performance.now();
        const metric_array = await Promise.all([
            Promise.resolve(this.bus_factor_calc()),
            Promise.resolve(this.correctness_calc()),
            Promise.resolve(this.calculateRampUpMetric()),
            Promise.resolve(this.maintainer_calc()),
            Promise.resolve(this.licence_verify())
        ]);
        const endTime = performance.now();
        this.net_score_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return metric_array;
    }
}