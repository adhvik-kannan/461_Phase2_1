// all 'return 1;' statements are placeholders for actual calculations

export class metric_manager {
    // will need attributes for each metric
        // some attributes
    
    // functions for calculating each metric
    public bus_factor_calc(): number {
        return 1;
    }
    public correctness_calc(): number {
        return 1;
    }
    public ramp_up_calc(): number {
        return 1;
    }
    public maintainer_calc(): number {
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
        return 1;
    }

    // run all the metrics in parallel and calculate the net score
    public async parallel_metric_and_net_score_calc() {
        const metric_array = await Promise.all([
            Promise.resolve(this.bus_factor_calc()),
            Promise.resolve(this.correctness_calc()),
            Promise.resolve(this.ramp_up_calc()),
            Promise.resolve(this.maintainer_calc()),
            Promise.resolve(this.licence_verify())
        ]);
        return metric_array;
    }
}