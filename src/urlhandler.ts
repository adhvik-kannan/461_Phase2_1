//import { GitAPIHandler } from './gitAPIHandler';
import { npmHandler } from '../src/npmHandler';
import { promises as fs } from 'fs';  // To read files


export class urlhandler {
    private url: string;
    private GITHUB_URL_PATTERN: RegExp;
    private NPM_URL_PATTERN: RegExp;

    constructor(url: string) {
        this.url = url;
        this.GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        this.NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;

        if (!this.isValidUrl()) {
            throw new Error('Invalid URL');
        }
    }

    public identify(url_pattern: URL): string{
        if(this.GITHUB_URL_PATTERN.test(url_pattern)){
            return "GitHub";
        }
        else if(this.NPM_URL_PATTERN.test(url_pattern)){
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
        if (this.GITHUB_URL_PATTERN.test(this.url)) {
            // Delegate to GitAPIHandler
            const match = this.GITHUB_URL_PATTERN.exec(this.url);
            const owner = match ? match[1] : null;
            const repo = match ? match[2] : null;

            if (owner && repo) {
                //const gitHandler = new GitAPIHandler(owner, repo);
                //await gitHandler.processRepo();
            } else {
                console.error('Invalid GitHub URL format.');
            }
        } else if (this.NPM_URL_PATTERN.test(this.url)) {
            // Delegate to npmHandler
            const match = this.NPM_URL_PATTERN.exec(this.url);
            const packageName = match ? match[1] : null;

            if (packageName) {
                await npmHandler.processPackage(packageName);
            } else {
                console.error('Invalid NPM URL format.');
            }
        } else {
            console.error('Unsupported URL type.');
        }

    }



    

}
