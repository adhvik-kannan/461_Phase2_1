import { Octokit } from '@octokit/rest';
import logger from './logging.js'
import git from 'isomorphic-git';
import os from 'os';
import fs from 'fs';
import http from 'isomorphic-git/http/node/index.cjs';
import path from 'path';

export async function isGithubTokenValid(token: string): Promise<boolean> {
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
            console.error('Invalid GitHub token');
            return false;
        }
        ; // Handle other types of errors (network, etc.)
    }
  }
;
export  async function cloneRepository(repoUrl: string, tempDir: string) {
    try {
        
        await git.clone({
            fs,
            http,
            dir: tempDir,
            url: repoUrl,
            singleBranch: true,
            depth: 1,
           
          })
        logger.info("Repository cloned successfully", repoUrl);
        //console.log("Repository cloned successfully", tempDir);
        //const myfiles = fs.readdirSync(tempDir);
        //console.log("Contents of cloned repository:", myfiles);
        //console.log("Repository cloned successfully", repoUrl);
        // const head = await git.resolveRef({
        //     fs,
        //     dir: tempDir,
        //     ref: 'HEAD',
        //   });
          //console.log('HEAD is at:', head);
          let files = await git.listFiles({ fs, dir: tempDir, ref: 'HEAD' }) 
          //console.log("Files fetched from root: ", files.length);
        } 
        
     catch (error) {
        logger.error("Error cloning repository:", error);
        throw error;
    }
}
   

  
      