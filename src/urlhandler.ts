import { Octokit } from "octokit";

class urlhandler{
    private url: URL;
    private GITHUB_URL_PATTERN;
    private NPM_URL_PATTERN;
    private octokit; 

    constructor(url: string){
        try{
        this.url = new URL(url);
        this.GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        this.NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;
        this.octokit = new Octokit({ 
            auth: 'YOUR-TOKEN',
          });

        } catch(error){
            throw new Error('Invalid URL');
        }
    }

    indentify(url_pattern: string){
        if(this.GITHUB_URL_PATTERN.test(url_pattern)){
            this.handleGit(url_pattern);
        }
        else if(this.NPM_URL_PATTERN.test(url_pattern)){
            this.handleNPM(url_pattern);
        }

    }

    handleGit(url_pattern: string){
        
    }

    handleNPM(url_pattern: string){

    }

}
