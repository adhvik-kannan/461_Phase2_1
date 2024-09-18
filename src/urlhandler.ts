//import { GitAPIHandler } from './gitAPIHandler';
import { npmHandler } from '../src/npmHandler.js';
import { promises as fs } from 'fs';  // To read files
import { gitAPIHandler } from './gitAPIHandler.js';
import { license_verifier } from './license_verifier.js';
import logger from './logging.js'


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

    public identify(url_pattern: URL): string{
        if(this.GITHUB_URL_PATTERN.test(url_pattern.toString())){
            return "GitHub";
        }
        else if(this.NPM_URL_PATTERN.test(url_pattern.toString())){
            return "NPM";
        }
        return "Not Found";

    }

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
                this.url = data.gitUrl
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
