import { Octokit } from "@octokit/rest";
import { urlhandler } from "./urlHandler";

export class gitAPIHandler extends urlhandler{
    private octokit: any;
    // private repo: string;
    // private author: s tring;
    

    constructor(url: string){
        super(url)
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN
          });
    }

    public async getRepoDetails() {
        if (this.identify(this.url) === "GitHub") {
            const tempURL = this.url.toString();
            const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");
            console.log(owner, repo)

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
    }

    public async getCommitHistory() {
        if (this.identify(this.url) === "GitHub") {
            const tempURL = this.url.toString();
            const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");
            

            try {
                const response = await this.octokit.rest.repos.listCommits({
                    owner: owner,
                    repo: repo,
                });
                //to get commit details
                // response.data.forEach(commit => {
                //     console.log(`SHA: ${commit.sha}`);
                //     console.log(`Commit Message: ${commit.commit.message}`);
                //     console.log(`Author: ${commit.commit.author?.name} <${commit.commit.author?.email}>`);
                //     console.log(`Date: ${commit.commit.author?.date}`);
                //     console.log(`Committer: ${commit.commit.committer?.name} <${commit.commit.committer?.email}>`);
                //     console.log(`Committer Date: ${commit.commit.committer?.date}`);
                //     console.log('---');
                //   }); // Log the repository details
                console.log(response.data)
                return response;
            } catch (error) {
                console.error("Error fetching repository details:", error);
            }
        } else {
            console.log("This is not a GitHub URL.");
        
        
        }
    }

    public async get_readme(){
        if (this.identify(this.url) === "GitHub") {
            const tempURL = this.url.toString();
            const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");

        try{
            const response = await this.octokit.rest.repos.getReadme ({
                owner:owner,
                repo:repo
            });
            console.log(response.data);
            return response.data;
        }
        catch(error){
            console.log("error fetching readme: ", error)
        }
        }
        else{
            console.log("Invalid GitHub")
        }
    }

}
