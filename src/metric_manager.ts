// all 'return 1;' statements are placeholders for actual calculations
import { Octokit } from "@octokit/rest";
import { gitAPIHandler } from "./gitAPIHandler.js";
import { maintainer_net } from "./maintainer_calculator.js";

import { temp_bus_factor_calc } from "./bus_factor_calc.js";
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

    constructor(url:string, data, contributors, issues, pullRequests, commits /*a lot of arguments*/) {
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

    }
    
    // functions for calculating each metric
    public bus_factor_calc(): Promise<number> {
        const startTime = performance.now();
        // calculations for bus factor
        
        if(this.url.includes("github.com")){
            let busfactor = temp_bus_factor_calc(this.url)
            const endTime = performance.now();
            this.bus_factor_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
            return busfactor
        }
        else{
            try{
                console.log(this.data.gitUrl)
                let busfactor =  temp_bus_factor_calc(this.data.gitUrl);
                const endTime = performance.now();
                this.bus_factor_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
                return busfactor
            }
            catch(error){
                console.error("Git repo not found");
                
            }
        }
        
    }
    public correctness_calc(): number {
        const startTime = performance.now();
        // calculations for correctness factor

        const endTime = performance.now();
        this.correctness_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return 1;
    }
    public ramp_up_calc(): number {
        const startTime = performance.now();
        // calculations for ramp up factor
        const endTime = performance.now();
        this.ramp_up_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return 1;
    }
    
    public maintainer_calc(): number {
        const startTime = performance.now();
        // calculations for maintainer factor
        // console.log(this.contributors);
        // console.log(this.issues);
        // console.log(this.pullRequests);
        // console.log(this.commits);
        
        let maintainer_score = maintainer_net(this.contributors, this.issues, this.pullRequests, this.commits);
        const endTime = performance.now();
        this.maintainer_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return 1;
    }
    public licence_verify(/* accept API call (most likely string of file paths)*/): number {
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
        const endTime = performance.now();
        this.license_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return 1;
    }

    // run all the metrics in parallel and calculate the net score
    public async parallel_metric_and_net_score_calc() {
        const startTime = performance.now();
        const metric_array = await Promise.all([
            Promise.resolve(this.bus_factor_calc()),
            Promise.resolve(this.correctness_calc()),
            Promise.resolve(this.ramp_up_calc()),
            Promise.resolve(this.maintainer_calc()),
            Promise.resolve(this.licence_verify())
        ]);
        const endTime = performance.now();
        this.net_score_latency = roundToNumDecimalPlaces(endTime - startTime, 3);
        return metric_array;
    }
}