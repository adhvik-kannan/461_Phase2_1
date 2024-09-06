//import { GitAPIHandler } from './gitAPIHandler';
import { npmHandler } from './npmHandler';

export class URLHandler {
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

    // handleGit(url_pattern: string){
    //     const author = "x";
    //     const repo = "x";
    //     this.getCommitHistory = (owner, repo)

    // }

    handleNPM(url_pattern: string){

    }



    

}
