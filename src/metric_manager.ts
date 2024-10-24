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

import { calculateCorrectnessScore } from "./correctness_calc.js";

/**
 * Rounding function
 * @param val Value to be rounded
 * @param num_decimal_places How many decimal places to round to
 * @returns Rounded number to specified decimal points
 */
function roundToNumDecimalPlaces(val: number, num_decimal_places: number) {
    return Math.round(val * Math.pow(10, num_decimal_places)) / Math.pow(10, num_decimal_places);
}

/**
 * Metric manager class
 */
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
    public net_score: number;
    public closedIssues: any;
    public gitUrl: any;

    /**
     * Creates metric_manager class
     * @param data URL data
     * @param contributors Array of contributors
     * @param issues Array of issues
     * @param pullRequests Array of PRs
     * @param commits Array of commits
     * @param url - Specific URL
     * @param tempDir - Temporary directory where URL Repo is cloned
     * @param closedIssues - Array of closed issues
     */
    constructor(data: any, contributors: any, issues: any, pullRequests: any, commits: any, gitUrl: any, tempDir: any, closedIssues: any) {
        this.bus_factor_latency = 0;
        this.correctness_latency = 0;
        this.ramp_up_latency = 0;
        this.maintainer_latency = 0;
        this.license_latency = 0;
        this.net_score_latency = 0;
        this.metadata = data;
        this.contributors = contributors;
        this.issues = issues;
        this.closedIssues = closedIssues;
        this.pullRequests = pullRequests;
        this.commits = commits;
        this.url = gitUrl;
        this.data = data;
        this.tempDir = tempDir;
        this.gitUrl = gitUrl;
    }
    
    // functions for calculating each metric
    //public bus_factor_calc(): Promise<number> {
    /**
     * Calculates busfactor score
     * @returns Busfactor score
     */
    public bus_factor_calc(){        
        const startTime = performance.now();
        // calculations for bus factor
        logger.debug("Calculating bus factor for github repo: ", this.url)
        let busfactor = temp_bus_factor_calc(this.url, this.commits);
        const endTime = performance.now();
        this.bus_factor_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return busfactor
     
    
        
    }
    /**
     * Calculates correctness score - NOT IMPLEMENTED
     * @returns Correctness score
     */
    public correctness_calc(){
        const startTime = performance.now();
        logger.debug("Calculating correctness")
        // calculations for correctness factor

        let correctness = calculateCorrectnessScore(this.issues, this.closedIssues);
        const endTime = performance.now();
        this.correctness_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return correctness;
    }

    /**
     * Calculates ramp up score
     * @returns Ramp Up Score
     */
    public async calculateRampUpMetric(): Promise<number> {
        const startTime = Date.now();
        // Call the ramp-up score function, assuming repoData contains the necessary files
        //const rampUpScore = await calculateRampUpScore(this.data.files || []);
        const rampUpScore = await calculateRampUpScore(this.url,this.tempDir);
        const endTime = Date.now();
        this.ramp_up_latency = endTime - startTime;

        return rampUpScore; 
    }

    /**
     * Calculates maintainer score
     * @returns Maintainer score
     */
    public maintainer_calc(): number {
        const startTime = performance.now();
        logger.debug("Calculating maintainer factor")
        let maintainer_score = maintainer_net(this.contributors, this.issues, this.pullRequests, this.commits);
        const endTime = performance.now();
        this.maintainer_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return maintainer_score;
    }
    /**
     * Calculates license score
     * @returns 1 for valid license, 0 else
     */
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

    /**
     * Calculates netscore and runs the metric calculations in parallel
     * @returns Array of metric scores
     */
    // run all the metrics in parallel and calculate the net score
    public async parallel_metric_and_net_score_calc(): Promise<number[]> {
        //fs.rmSync(await this.tempDir, { recursive: true, force: true });
        //logger.info("Temporary repository directory removed:", this.tempDir);
        const startTime = performance.now();
        const metric_array = await Promise.all([
            Promise.resolve(this.bus_factor_calc()),
            Promise.resolve(this.correctness_calc()),
            Promise.resolve(this.calculateRampUpMetric()),
            Promise.resolve(this.maintainer_calc()),
            Promise.resolve(this.licence_verify()),
            Promise.resolve(this.calculatePullRequestCodeMetric())
        ]);
        
        console.log(metric_array);

        this.net_score = metric_array[4] * (.4*metric_array[3] + .3*metric_array[1] + .1*metric_array[0] + .1*metric_array[2] + .1*metric_array[5]);
        const endTime = performance.now();
        this.net_score_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        
        // Calculate pull_request_code metric
        const pullRequestCodeMetric = this.calculatePullRequestCodeMetric();
        metric_array.push(pullRequestCodeMetric);

        return metric_array;
    }

    calculatePullRequestCodeMetric(): number {
        const reviewedPullRequests = this.pullRequests.filter((pr: any) => pr.reviewed);
        const totalPullRequests = this.pullRequests.length;

        if (totalPullRequests === 0) {
            return 0;
        }

        return reviewedPullRequests.length / totalPullRequests;
    }
}

import { expect, test, vi, beforeEach } from 'vitest';

// Mocking the dependencies
vi.mock('../src/maintainer_calculator.js', () => ({
    maintainer_net: vi.fn(() => 1),
}));

vi.mock('../src/template_for_license.js', () => ({
    temp_license: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('../src/new_bus_factor_calc.js', () => ({
    temp_bus_factor_calc: vi.fn(() => 1),
}));

vi.mock('../src/rampUp.js', () => ({
    calculateRampUpScore: vi.fn(() => Promise.resolve(1)),
}));

let manager: metric_manager;

beforeEach(() => {
    const mockData: any = {}; // Add your mock data here
    const mockContributors: any[] = [];
    const mockIssues: any[] = [];
    const mockPullRequests: any[] = [
        { reviewed: true },
        { reviewed: false },
        { reviewed: true },
    ]; // Example pull requests data
    const mockCommits: any[] = [];
    const mockUrl: string = 'https://github.com/example/repo';
    const tempDir: string = '/tmp/example';

    manager = new metric_manager(mockData, mockContributors, mockIssues, mockPullRequests, mockCommits, mockUrl, tempDir, []);
});

test('Calculates metrics in parallel', async () => {
    const result = await manager.parallel_metric_and_net_score_calc();

    // Check if the metrics were calculated
    expect(temp_bus_factor_calc).toHaveBeenCalledWith(manager.url, manager.commits);
    expect(calculateRampUpScore).toHaveBeenCalledWith(manager.url, manager.tempDir);
    expect(maintainer_net).toHaveBeenCalledWith(manager.contributors, manager.issues, manager.pullRequests, manager.commits);
    expect(temp_license).toHaveBeenCalledWith(manager.url, manager.tempDir);
    
    // Check that the net score is calculated as expected
    console.log(manager.net_score);
    expect(manager.net_score).toBeGreaterThan(0); // Adjust based on expected logic

    // Check the pull_request_code metric
    const pullRequestCodeMetric = manager.calculatePullRequestCodeMetric();
    expect(pullRequestCodeMetric).toBe(2 / 3); // 2 out of 3 pull requests were reviewed
});

test('Calculates bus factor', () => {
    const result = manager.bus_factor_calc();
    expect(temp_bus_factor_calc).toHaveBeenCalledWith(manager.url, manager.commits);
    expect(result).toBe(1); // Check if the expected return value matches
});