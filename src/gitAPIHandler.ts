import { Octokit } from "@octokit/rest";
// import { urlhandler } from "./urlhandler.js";

export class gitAPIHandler{
    private octokit: any;  
    private owner: string;
    private repo: string;
    private url: URL

    constructor(url: string){
        this.url = new URL(url)
        const tempURL = this.url.toString();
        [this.owner, this.repo] = tempURL.replace("https://github.com/", "").split("/");
        this.octokit = new Octokit({ 
            auth: process.env.GITHUB_TOKEN
          });
        
    }

    public async getRepoDetails() {
        
            // const tempURL = this.url.toString();
            // const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");
            // console.log(owner, repo)

            try {
                const response = await this.octokit.repos.get({
                    owner: this.owner,
                    repo: this.repo,
                });

                //console.log(response.data); // Log the repository details
                return response.data;
            } catch (error) {
                console.error("Error fetching repository details:", error);
            }
        
        
        
    }
    

    public async getCommitHistory() {
        // if (this.identify(this.url) === "GitHub") {
        //     const tempURL = this.url.toString();
        //     const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");
            

            try {
                    const response = await this.octokit.rest.repos.listCommits({
                    owner: this.owner,
                    repo: this.repo,
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
    } 
        
    

    public async get_readme(){
        // if (this.identify(this.url) === "GitHub") {
        //     const tempURL = this.url.toString();
        //     const [owner, repo] = tempURL.replace("https://github.com/", "").split("/");

        try{
            const response = await this.octokit.rest.repos.getReadme ({
                owner:this.owner,
                repo:this.repo
            });

            // decoding the content since it is base64 encoded
            const readme_content = response.data.content;
            const decoded_readme_content = Buffer.from(readme_content, 'base64').toString('utf-8');

            // console.log(decoded_readme_content);
            return decoded_readme_content;

            // console.log(response.data);
            // return response.data;
        }
        catch(error){
            console.log("error fetching readme: ", error)
        }
    }

    public async fetchAllFiles(path:string){
        
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
            //         return license
            //     }
            //   }

              return files
            // console.log(response);
            


                path,
              });
          
              let files: Array<any> = [];
          
              if (Array.isArray(response.data)) {
                for (const item of response.data) {
                  if (item.type === 'file' && item.name.toLowerCase() == "license") {
                    const license = this.fetchFileContent(item.path);
                    return license
                }
              }
              return files
        
            }

            } catch (error) {
              console.error('Error fetching files:', error);
              throw error;
            }
    }

    public async fetchFileContent(path: string) {
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
          } else {
            throw new Error('Unable to read file content');
          }
        } catch (error) {
          console.error('Error fetching file content:', error);
          throw error;
        }
      }

        

    
          
    }
        
    


