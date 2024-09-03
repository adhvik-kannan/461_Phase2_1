import { Octokit } from "@octokit/rest";
import { urlhandler } from "./urlhandler";

class gitAPIHandler extends urlhandler{
    private octokit: any;
    private repo: string;
    private author: string;
    

    constructor(url: string){
        super(url)
        this.octokit = new Octokit({ 
            auth: 'YOUR-TOKEN',
          });
    }

    public async getRepoDetails() {
        if (this.identify(this.url) === "GitHub") {
            const tempURL = this.url.toString();
            const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");

            try {
                const response = await this.octokit.repos.get({
                    owner: owner,
                    repo: repo,
                });

                console.log(response.data); // Log the repository details
                return response.data;
            } catch (error) {
                console.error("Error fetching repository details:", error);
            }
        } else {
            console.log("This is not a GitHub URL.");
        
        
    }

    public async getCommitHistory(){
        if(this.identify(this.url) === "GitHub"){
            
        }
    }

}