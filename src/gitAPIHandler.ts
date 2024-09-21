import { Octokit } from "@octokit/rest";
import logger from './logging.js'

// import { urlhandler } from "./urlhandler.js";
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class gitAPIHandler{
    private octokit: any;  
    private owner: string;
    private repo: string;
    private url: URL
    public metadata: any;
    public validtoken: Promise<boolean>;
    

    constructor(url: string){
        this.url = new URL(url)
        const tempURL = this.url.toString();
        [this.owner, this.repo] = tempURL.replace("https://github.com/", "").split("/");
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN
          });
        this.validtoken =  this.isGithubTokenValid(process.env.GITHUB_TOKEN);

        
    }

    public async getRepoDetails() {
        
            if(!this.validtoken){
                console.error("Invalid Github Token");
                return;
            }

            try {
                const response = await this.octokit.repos.get({
                    owner: this.owner,
                    repo: this.repo,
                });

                logger.info(`Successfully fetched repository details for ${this.owner}/${this.repo}`);
                return response.data;
            } catch (error) {
                console.error("Error fetching repository details:", error);
            }
        
        
        
    }
    
    //get all commits in repository
    public async getCommitHistory() {
      if(!this.validtoken){
          console.error("Invalid Github Token");
          return;
      }
      let commits = [];
      let page = 1;
      const perPage = 100; // Fetch the maximum number of commits per page
    
      try {
        while (page < 21) {
          const response = await this.octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: this.owner,
            repo: this.repo,
            headers: {
              'X-GitHub-Api-Version': '2022-11-28'
            },
            per_page: perPage, // Number of commits per page
            page: page         // Current page number
          });
    
          // Add the current page's commits to the result array
          commits = commits.concat(response.data);
    
          // If the response has fewer commits than the requested number per page, we are done
          if (response.data.length < perPage) {
            break;
          }
    
          // Move to the next page
          page += 1;
        }
    
        //console.log(`Total commits fetched: ${commits.length}`);
        return commits;
      } catch (error) {
        console.error(`Error fetching commits: ${error}`);
      }
    }
    

            // try {
            //         const response = await this.octokit.rest.repos.listCommits({
            //         owner: this.owner,
            //         repo: this.repo,
            //     });
            //     logger.info(`Successfully fetched commit history for ${this.owner}/${this.repo}`);
            //     console.log("commits", response.data.length);
            //     return response.data;
            // } catch (error) {
            //     console.error("Error fetching repository details:", error);
            // }
    
        
    

    public async get_readme(){
        if(!this.validtoken){
            console.error("Invalid Github Token");
            return;
        }
      
        try{
            const response = await this.octokit.rest.repos.getReadme ({
                owner:this.owner,
                repo:this.repo
            });

            // decoding the content since it is base64 encoded
            const readme_content = response.data.content;
            const decoded_readme_content = Buffer.from(readme_content, 'base64').toString('utf-8');
            logger.info(`Successfully fetched README for ${this.owner}/${this.repo}`);
            return decoded_readme_content;
        }
        catch(error){
            console.error("error fetching readme: ", error)
        }
        }
        
    public async getIssues() {
        if(!this.validtoken){
            console.error("Invalid Github Token");
            return;
        }
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
            const issues = await this.octokit.issues.listForRepo({
                owner: this.owner,
                repo: this.repo,
                since: sixMonthsAgo.toISOString(),
                state: 'all', // to get both open and closed issues
            });
            return issues.data;
        }
        
        // Fetch pull requests from the last 6 months
    public async getPullRequests() {
        if(!this.validtoken){
            console.error("Invalid Github Token");
            return;
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const pullRequests = await this.octokit.pulls.list({
              owner: this.owner,
              repo: this.repo,
              state: 'all', 
              per_page: 100,
          });
        //console.log("Pull Requests",pullRequests.data);
      return pullRequests.data;
      }
        
        // Fetch active maintainers from the last 6 months
      public async getContributors() {
        if(!this.validtoken){
            console.error("Invalid Github Token");
            return;   
        }

          //get commits from the last 90 days
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          const commits = await this.octokit.repos.listCommits({
              owner: this.owner,
              repo: this.repo,
              since: ninetyDaysAgo.toISOString(),
            
            });

        //console.log("Contributors: ", contributors.data);
        //write contributers data to a file
          fs.writeFileSync('contributors.json', JSON.stringify(commits.data));
          return commits.data;
        }




public async fetchAllFiles(path:string){
  if(!this.validtoken){   
      console.error("Invalid Github Token");
      return;
  }
    
  try {
    // Fetch content of the repository at the specified path
    const response = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      
      path: ''
    });

    let files: string[] = [];

    if (Array.isArray(response.data)) {
      for (const item of response.data) {
        if (item.type === 'file') {
          files.push(item.path);
        }
      }
    }
    else {
      files.push(response.data.path);
    }
  
    console.info('Successfully fetched files');
    return files
  
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
}

public async fetchFileContent(path: string) {
    if(!this.validtoken){
        console.error("Invalid Github Token");
        return;
    }
    try {
      const response = await this.octokit.repos.getContent({
        owner:this.owner,
        repo: this.repo,
        path: path,
      });

      // The file content is base64 encoded, so we need to decode it
      if (response.data.type === 'file' && response.data.encoding === 'base64') {
        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return content;
      } 
      else {
        console.error('Unable to read file content');
        throw new Error('Unable to read file content');
      }
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  public async getRepositoryFiles(): Promise<string[]> {
    if(!this.validtoken){
        console.error("Invalid Github Token");
        return;
    }

    try {
      const allFiles = await this.fetchAllFiles('');
      const fileContents: string[] = [];

      for (const file of allFiles) {
        const content = await this.fetchFileContent(file);
        fileContents.push(content);
      }

      return fileContents;
    } catch (error) {
      console.error('Error fetching repository files for ramp-up analysis:', error);
      return [];
    }
  }


  public async cloneRepository(path: string): Promise<void> {
    if(!this.validtoken){
        console.error("Invalid Github Token");
        return;
    }
    try {
        const cloneCmd = `git clone https://github.com/${this.owner}/${this.repo}.git "${path}"`;
        await execPromise(cloneCmd); // Clone the repository using git
        //console.log("Repository cloned to", path);
    } catch (error) {
        console.error("Error cloning repository:", error);
        throw error;
    }
}

public async isGithubTokenValid(token: string): Promise<boolean> {
  try {
      const octokit = new Octokit({
          auth: token, // Provide the GitHub access token
      });

      // Test the token by making an authenticated request
      const { status } = await octokit.request('GET /user');

      // If we get a 200 status, the token is valid
      return status === 200;
  } catch (error: any) {
      // If we get a 401 status, the token is invalid
      if (error.status === 401) {
          console.error('Invalid GitHub token:', error.message);
          return false;
      }
      ; // Handle other types of errors (network, etc.)
  }
}
}
    



