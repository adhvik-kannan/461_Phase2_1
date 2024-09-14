//import { GitAPIHandler } from './gitAPIHandler';
import { npmHandler } from '../src/npmHandler.js';
import { promises as fs } from 'fs';  // To read files
import { gitAPIHandler } from './gitAPIHandler.js';


export class urlhandler {
    public url: URL;
    private GITHUB_URL_PATTERN: RegExp;
    private NPM_URL_PATTERN: RegExp;

    constructor(url: string) {
        try{
            this.url = new URL(url);
            this.GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
            this.NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;
        }catch(error){
            console.log("Invalid URL")
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
                    console.log(`Processing URL: ${url}`);
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
                const data  = await gitHandler.fetchAllFiles("")
                return data
        } 
         else if (this.NPM_URL_PATTERN.test(this.url.toString())) {
            // Delegate to npmHandler
            const match = this.NPM_URL_PATTERN.exec(this.url.toString());
            const packageName = match ? match[1] : null;

            if (packageName) {
                const data = await npmHandler.processPackage(packageName);
                return data;
            } else {
                console.error('Invalid NPM URL format.');
            }
        } else {
            console.error('Unsupported URL type.');
        }

    }



    

}
