
export class urlhandler{
    protected url: URL;
    private GITHUB_URL_PATTERN;
    private NPM_URL_PATTERN;
    

    constructor(url: string){
        try{
        this.url = new URL(url);
        this.GITHUB_URL_PATTERN = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
        this.NPM_URL_PATTERN = /^https:\/\/www\.npmjs\.com\/package\/([^\/]+)/;
        

        } catch(error){
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
