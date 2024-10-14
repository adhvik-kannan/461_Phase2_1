//import { GitAPIHandler } from './gitAPIHandler';
import { npmHandler } from '../src/npmHandler.js';
import { promises as fs } from 'fs';  // To read files
import { gitAPIHandler } from './gitAPIHandler.js';
import logger from './logging.js'


/**
 * The `urlhandler` class is responsible for handling and processing URLs, specifically GitHub and NPM URLs.
 * It identifies the type of URL and delegates the processing to the appropriate handler.
 * 
 * @class urlhandler
 * 
 * @property {URL} url - The URL to be processed.
 * @property {RegExp} GITHUB_URL_PATTERN - Regular expression pattern to identify GitHub URLs.
 * @property {RegExp} NPM_URL_PATTERN - Regular expression pattern to identify NPM URLs.
 * @property {any} issues - Stores issues data fetched from the URL.
 * @property {any} pullRequests - Stores pull requests data fetched from the URL.
 * @property {any} commits - Stores commits data fetched from the URL.
 * @property {any} contributors - Stores contributors data fetched from the URL.
 * 
 * @constructor
 * @param {string} url - The URL to be processed.
 * 
 * @method identify
 * @param {URL} url_pattern - The URL pattern to be identified.
 * @returns {string} - Returns "GitHub" if the URL matches the GitHub pattern, "NPM" if it matches the NPM pattern, and "Not Found" otherwise.
 * 
 * @method handle
 * @async
 * @returns {Promise<any>} - Processes the URL and returns the data fetched from the appropriate handler.
 * 
 * @method processUrlsFromFile
 * @static
 * @async
 * @param {string} filePath - The file path containing URLs to be processed.
 * @returns {Promise<void>} - Reads URLs from the file and processes each URL.
 */
export class urlhandler {
    public url: URL;
    private GITHUB_URL_PATTERN: RegExp;
    private NPM_URL_PATTERN: RegExp;
    public issues: any;
    public pullRequests: any;
    public commits: any;
    public contributors: any;

    constructor(url: string) {
        try{
            this.url = new URL(url);
            this.GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
            this.NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;
        }catch(error){
            console.error("Invalid URL")
        }

    }

    /**
     * Identifies the type of URL based on predefined patterns.
     *
     * @param url_pattern - The URL to be identified.
     * @returns A string indicating the type of URL. Possible values are:
     * - "GitHub" if the URL matches the GitHub pattern.
     * - "NPM" if the URL matches the NPM pattern.
     * - "Not Found" if the URL does not match any known patterns.
     */
    public identify(url_pattern: URL): string{
        if(this.GITHUB_URL_PATTERN.test(url_pattern.toString())){
            return "GitHub";
        }
        else if(this.NPM_URL_PATTERN.test(url_pattern.toString())){
            return "NPM";
        }
        return "Not Found";

    }

    /**
     * Processes URLs from a file.
     * 
     * This method reads a file containing URLs, one per line, and processes each URL.
     * It logs the processing of each URL and handles any errors that occur during processing.
     * 
     * @param filePath - The path to the file containing the URLs.
     * 
     * @throws Will throw an error if the file cannot be read.
     * @throws Will log an error if a URL cannot be processed.
     */
    static async processUrlsFromFile(filePath: string) {
        try {
            const fileData = await fs.readFile(filePath, 'utf-8');
            const urls = fileData.split('\n').map(url => url.trim()).filter(url => url.length > 0); // Filter out empty lines

            for (const url of urls) {
                try {
                    logger.info(`Processing URL: ${url}`);
                    const handler = new urlhandler(url);
                    await handler.handle();
                } catch (error) {
                    console.error(`Error processing URL ${url}:`);
                }
            }
        } catch (error) {
            console.error('Error reading the file:');
        }
    }


    /**
     * Handles the URL based on its type (GitHub or NPM) and delegates the processing
     * to the appropriate handler (GitAPIHandler or npmHandler).
     * 
     * @returns {Promise<any>} The data retrieved from the respective handler.
     * 
     * @throws {Error} If the URL type is unsupported or if the NPM URL format is invalid.
     * 
     * @remarks
     * - If the URL matches the GitHub pattern, it delegates to `GitAPIHandler` to fetch repository details,
     *   contributors, commit history, issues, and pull requests.
     * - If the URL matches the NPM pattern, it extracts the package name, processes the package using `npmHandler`,
     *   and then delegates to `GitAPIHandler` to fetch additional details from the associated GitHub repository.
     * - If the URL does not match any supported patterns, it logs an error indicating an unsupported URL type.
     */
    public async handle() {
        // if (this.GITHUB_URL_PATTERN.test(this.url.toString())) {
            // Delegate to GitAPIHandler
        if (this.identify(this.url) == "GitHub"){
                const gitHandler = new gitAPIHandler(this.url.toString());
                const data = await gitHandler.getRepoDetails();;
                this.contributors = await gitHandler.getContributors();
                this.commits = await gitHandler.getCommitHistory();
                this.issues = await gitHandler.getIssues();
                this.pullRequests = await gitHandler.getPullRequests();
                
                return data;
                // const decoded_readme = await gitHandler.get_readme();
                // const return_val = await license_verifier(decoded_readme);
                // if (return_val) {
                //     // set license verifier metric value to 1
                //     console.log(return_val);
                //     return return_val;
                // }
                // else {
                //     // get all files of the repo and find a file with the name 'License' of some sort
                //     const repo_files = await gitHandler.fetchAllFiles(this.url.toString());
                //     // console.log(repo_files);
                //     const license_regex: RegExp = /license/i;
                //     let license_found: boolean = false;
                //     for (let i=0; i<repo_files.length; i++) {
                //         if (license_regex.test(repo_files[i])) {
                //             const license_content: string = await gitHandler.fetchFileContent(repo_files[i]);
                //             license_found = await license_verifier(license_content);
                //             console.log(license_found);
                //             return license_found;
                //         }
                //     }
                //     console.log(license_found);
                //     return license_found;
                //} 
        }
        else if (this.NPM_URL_PATTERN.test(this.url.toString())) {
            // Delegate to npmHandler
            const match = this.NPM_URL_PATTERN.exec(this.url.toString());
            const packageName = match ? match[1] : null;

            if (packageName) {
                const data = await npmHandler.processPackage(packageName);
                // this.contributors = data.contributers;
                // this.issues = data.issues;
                // this.pullRequests = data.pullRequests;
                this.url = new URL(data.gitUrl);
                const gitHandler = new gitAPIHandler(this.url.toString());
                this.contributors = await gitHandler.getContributors();
                this.commits = await gitHandler.getCommitHistory();
                this.issues = await gitHandler.getIssues();    
                this.pullRequests = await gitHandler.getPullRequests();
        
                return data;
            } else {
                console.error('Invalid NPM URL format.');
            }
        } else {
            console.error('Unsupported URL type.');
        }

    }



    

}
